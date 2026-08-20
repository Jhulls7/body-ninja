import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { clamp, distance, lerpPoint } from "../core/math.js";
import { t } from "../i18n.js";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const TRACKING_FRAME_WIDTH = 640;
const TRACKING_FRAME_HEIGHT = 360;
const MAX_PLAYERS = 4;

const POSE_INDEX = {
  left: { shoulder: 11, elbow: 13, wrist: 15 },
  right: { shoulder: 12, elbow: 14, wrist: 16 },
};

function normalizedToPixels(point, width, height, video) {
  const sourceWidth = video?.videoWidth || 16;
  const sourceHeight = video?.videoHeight || 9;
  const coverScale = Math.max(width / sourceWidth, height / sourceHeight);
  const renderedWidth = sourceWidth * coverScale;
  const renderedHeight = sourceHeight * coverScale;
  const offsetX = (width - renderedWidth) / 2;
  const offsetY = (height - renderedHeight) / 2;
  return {
    x: clamp((1 - point.x) * renderedWidth + offsetX, 0, width),
    y: clamp(point.y * renderedHeight + offsetY, 0, height),
  };
}

function validLandmark(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) && (point.visibility === undefined || point.visibility > 0.28);
}

export class PoseTracker {
  constructor({ onStatus } = {}) {
    this.onStatus = onStatus || (() => {});
    this.video = null;
    this.pose = null;
    this.stream = null;
    this.lastVideoTime = -1;
    this.lastInference = 0;
    this.worker = null;
    this.workerMode = false;
    this.lightMode = false;
    this.workerBusy = false;
    this.workerFrameWidth = 0;
    this.workerFrameHeight = 0;
    this.workerFrameDt = 0.016;
    this.playerLimit = 1;
    this.inferenceStartedAt = 0;
    this.lastResultAt = 0;
    this.lastResultTimestamp = 0;
    this.metrics = { source: "IDLE", inferenceMs: 0, trackingHz: 0, resultAgeMs: 0 };
    this.simulation = false;
    this.pointer = { x: 0.5, y: 0.5 };
    this.smoothed = {};
    this.state = this.blankState();
  }

  blankState() {
    return {
      valid: false,
      confidence: 0,
      arms: { left: null, right: null },
      body: { head: null, shoulders: [], torso: null, tooClose: false, recommendedDistance: "1.5–2 m" },
      players: [],
      playerCount: 0,
      isSimulation: this.simulation,
    };
  }

  async startCamera(video, { maxPlayers = 1 } = {}) {
    this.video = video;
    this.playerLimit = clamp(Math.round(maxPlayers), 1, MAX_PLAYERS);
    this.smoothed = {};
    this.lastVideoTime = -1;
    this.lastInference = 0;
    this.lastResultAt = 0;
    this.metrics = { source: "IDLE", inferenceMs: 0, trackingHz: 0, resultAgeMs: 0 };
    this.state = this.blankState();
    this.onStatus(t("status.requestingCamera"));
    const streamPromise = navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 960, max: 960 }, height: { ideal: 540, max: 540 }, frameRate: { ideal: 30, max: 30 } },
      audio: false,
    });
    let timeoutHandle;
    try {
      this.stream = await Promise.race([
        streamPromise,
        new Promise((_, reject) => { timeoutHandle = setTimeout(() => reject(new DOMException("Camera permission timeout", "NotAllowedError")), 10000); }),
      ]);
    } catch (error) {
      streamPromise.then((lateStream) => lateStream.getTracks().forEach((track) => track.stop())).catch(() => {});
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
    video.srcObject = this.stream;
    await video.play();
    this.onStatus(t("status.loadingTracking"));
    this.workerMode = false;
    this.lightMode = false;
    try {
      await this.startWorker();
      this.workerMode = true;
    } catch (workerError) {
      this.worker?.terminate();
      this.worker = null;
      this.lightMode = true;
      this.onStatus(t("status.workerUnavailable"));
      await this.startMainThreadTrackers();
    }
    this.simulation = false;
    this.state.isSimulation = false;
    this.onStatus(t("status.cameraOnline"));
  }

  async startWorker() {
    this.worker = new Worker(new URL("./vision.worker.js", import.meta.url), { type: "module" });
    const worker = this.worker;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Tracking worker timeout")), 30000);
      worker.onmessage = (event) => {
        if (event.data?.type === "ready") {
          clearTimeout(timeout);
          resolve();
        } else if (event.data?.type === "error") {
          clearTimeout(timeout);
          reject(new Error(event.data.message));
        }
      };
      worker.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
      worker.postMessage({ type: "init", playerLimit: this.playerLimit });
    });
    worker.onmessage = (event) => this.handleWorkerMessage(event.data);
    worker.onerror = () => {
      this.workerMode = false;
      this.workerBusy = false;
      this.onStatus(t("status.workerInterrupted"));
    };
  }

  async startMainThreadTrackers() {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    const makePose = (delegate) => PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate },
      runningMode: "VIDEO",
      numPoses: this.playerLimit,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.4,
      minTrackingConfidence: 0.4,
    });
    try {
      this.pose = await makePose("GPU");
    } catch (gpuError) {
      this.pose = await makePose("CPU");
    }
  }

  handleWorkerMessage(data) {
    if (data?.type === "result") {
      this.workerBusy = false;
      this.state = this.buildState(data.poseLandmarks, this.workerFrameWidth, this.workerFrameHeight, this.workerFrameDt);
      this.recordMetrics(data.timestamp, performance.now(), this.state, performance.now() - this.inferenceStartedAt);
    } else if (data?.type === "error") {
      this.workerBusy = false;
      this.onStatus(t("status.workerInterrupted"));
    }
  }

  setSimulation(enabled) {
    this.simulation = enabled;
    this.state = this.blankState();
    this.state.isSimulation = enabled;
  }

  setPlayerLimit(count) {
    this.playerLimit = clamp(Math.round(count), 1, MAX_PLAYERS);
    this.smoothed = {};
    this.state = this.blankState();
  }

  setPointer(x, y) {
    this.pointer.x = clamp(x, 0, 1);
    this.pointer.y = clamp(y, 0, 1);
  }

  updateSimulation(width, height, dt) {
    const players = [];
    const slots = this.playerLimit === 1 ? [0.5] : [0.14, 0.38, 0.62, 0.86].slice(0, this.playerLimit);
    slots.forEach((centerX, index) => {
      const pointer = this.playerLimit === 1
        ? { x: this.pointer.x * width, y: this.pointer.y * height }
        : { x: width * (centerX + Math.sin(performance.now() * 0.0012 + index) * 0.08), y: height * (0.38 + Math.cos(performance.now() * 0.001 + index) * 0.12) };
      const leftTip = { x: width * Math.max(0.02, centerX - 0.1) + (pointer.x - width * centerX) * 0.35, y: pointer.y };
      const rightTip = { x: width * Math.min(0.98, centerX + 0.1) + (pointer.x - width * centerX) * 0.35, y: pointer.y - height * 0.02 };
      const shoulderY = height * (0.42 + (index % 2) * 0.03);
      const left = this.simArm(index, "left", { x: width * (centerX - 0.035), y: shoulderY }, leftTip, dt);
      const right = this.simArm(index, "right", { x: width * (centerX + 0.035), y: shoulderY }, rightTip, dt);
      players.push({ index, valid: true, confidence: 1, arms: { left, right }, body: this.simBody(width, height, centerX) });
    });
    const primary = players[0] || { arms: { left: null, right: null }, body: this.simBody(width, height, 0.5) };
    this.state = { ...primary, valid: true, confidence: 1, isSimulation: true, players, playerCount: players.length };
    this.metrics = { source: "SIM", inferenceMs: 0, trackingHz: 60, resultAgeMs: 0, lastResultAt: performance.now() };
  }

  simArm(playerIndex, side, shoulder, tip, dt) {
    const previous = this.state.players?.[playerIndex]?.arms?.[side] || this.state.arms[side];
    const elbow = { x: (shoulder.x + tip.x) * 0.53, y: (shoulder.y + tip.y) * 0.47 };
    const speed = previous ? distance(previous.tip, tip) / Math.max(dt, 0.001) : 0;
    return { side, shoulder, elbow, wrist: tip, tip, speed, fingerLength: 22, bladeLength: distance(elbow, tip), forearmLength: distance(shoulder, elbow), tracked: true };
  }

  simBody(width, height, centerX = 0.5) {
    return { head: { x: width * centerX, y: height * 0.25 }, shoulders: [{ x: width * (centerX - 0.035), y: height * 0.4 }, { x: width * (centerX + 0.035), y: height * 0.4 }], torso: { x: width * centerX, y: height * 0.55, width: width * 0.08, height: height * 0.3 }, tooClose: false, recommendedDistance: "1.5–2 m" };
  }

  update(timestamp, width, height, dt) {
    if (this.simulation) {
      this.updateSimulation(width, height, dt);
      return;
    }
    if (!this.video || (!this.workerMode && !this.pose) || this.video.readyState < 2 || this.video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.video.currentTime;
    const inferenceInterval = this.workerMode ? 33 : this.lightMode ? 66 : 33;
    if (timestamp - this.lastInference < inferenceInterval) return;
    this.lastInference = timestamp;
    if (this.workerMode) {
      if (this.workerBusy || !this.worker) return;
      this.workerBusy = true;
      this.inferenceStartedAt = performance.now();
      this.workerFrameWidth = width;
      this.workerFrameHeight = height;
      this.workerFrameDt = dt;
      (async () => {
        try {
          let bitmap;
          try {
            bitmap = await createImageBitmap(this.video, { resizeWidth: TRACKING_FRAME_WIDTH, resizeHeight: TRACKING_FRAME_HEIGHT, resizeQuality: "medium" });
          } catch {
            bitmap = await createImageBitmap(this.video);
          }
          this.worker?.postMessage({ type: "frame", bitmap, timestamp }, [bitmap]);
        } catch {
          this.workerBusy = false;
        }
      })();
      return;
    }
    this.inferenceStartedAt = performance.now();
    const poseResult = this.pose.detectForVideo(this.video, timestamp);
    this.state = this.buildState(poseResult?.landmarks || [], width, height, dt);
    this.recordMetrics(timestamp, performance.now(), this.state, performance.now() - this.inferenceStartedAt);
  }

  smooth(key, raw, dt, base = 0.72) {
    if (!raw) return this.smoothed[key] || null;
    const previous = this.smoothed[key];
    if (!previous) {
      this.smoothed[key] = { ...raw };
      return this.smoothed[key];
    }
    const rawDelta = distance(previous, raw);
    const screenDiagonal = 1500;
    const alpha = clamp(base + (rawDelta / screenDiagonal) * 4.2, base, 0.96);
    this.smoothed[key] = lerpPoint(previous, raw, alpha);
    return this.smoothed[key];
  }

  buildState(poseLandmarks, width, height, dt) {
    const poseList = Array.isArray(poseLandmarks?.[0]) ? poseLandmarks : poseLandmarks?.length ? [poseLandmarks] : [];
    if (!poseList.length) return { ...this.blankState(), isSimulation: false };
    const players = poseList.slice(0, this.playerLimit).map((pose, playerIndex) => this.buildPlayerState(pose, width, height, dt, playerIndex));
    const primary = players[0] || { arms: { left: null, right: null }, body: null, valid: false, confidence: 0 };
    return { ...primary, valid: players.length >= this.playerLimit && players.every((player) => player.valid), body: primary.body ? { ...primary.body, tooClose: players.some((player) => player.body?.tooClose) } : null, players, playerCount: players.length, isSimulation: false };
  }

  buildPlayerState(poseLandmarks, width, height, dt, playerIndex) {
    const arms = {};
    let visibleArms = 0;
    for (const side of ["left", "right"]) {
      const ids = POSE_INDEX[side];
      const rawShoulder = validLandmark(poseLandmarks[ids.shoulder]) ? normalizedToPixels(poseLandmarks[ids.shoulder], width, height, this.video) : null;
      const rawElbow = validLandmark(poseLandmarks[ids.elbow]) ? normalizedToPixels(poseLandmarks[ids.elbow], width, height, this.video) : null;
      const rawWrist = validLandmark(poseLandmarks[ids.wrist]) ? normalizedToPixels(poseLandmarks[ids.wrist], width, height, this.video) : null;
      const fingerLength = rawElbow && rawWrist ? clamp(distance(rawElbow, rawWrist) * 0.38, 18, 52) : 24;
      const forearmDirection = rawElbow && rawWrist ? {
        x: (rawWrist.x - rawElbow.x) / (distance(rawElbow, rawWrist) || 1),
        y: (rawWrist.y - rawElbow.y) / (distance(rawElbow, rawWrist) || 1),
      } : { x: 0, y: 1 };
      const fallbackTip = rawWrist ? {
        x: rawWrist.x + forearmDirection.x * fingerLength,
        y: rawWrist.y + forearmDirection.y * fingerLength,
      } : rawWrist;
      const rawTip = fallbackTip;
      if (!rawShoulder || !rawElbow || !rawWrist || !rawTip) {
        arms[side] = null;
        continue;
      }
      const prefix = `p${playerIndex}-${side}`;
      const shoulder = this.smooth(`${prefix}-shoulder`, rawShoulder, dt, 0.68);
      const elbow = this.smooth(`${prefix}-elbow`, rawElbow, dt, 0.64);
      const wrist = this.smooth(`${prefix}-wrist`, rawWrist, dt, 0.62);
      const tip = this.smooth(`${prefix}-tip`, rawTip, dt, 0.58);
      const previous = this.state.players?.[playerIndex]?.arms?.[side] || (playerIndex === 0 ? this.state.arms[side] : null);
      const speed = previous ? distance(previous.tip, tip) / Math.max(dt, 0.001) : 0;
      arms[side] = { side, shoulder, elbow, wrist, tip, speed, fingerLength, bladeLength: distance(elbow, tip), forearmLength: distance(elbow, wrist), tracked: true };
      visibleArms += 1;
    }
    const headRaw = poseLandmarks[0] && validLandmark(poseLandmarks[0]) ? normalizedToPixels(poseLandmarks[0], width, height, this.video) : null;
    const shoulderLeft = validLandmark(poseLandmarks[11]) ? normalizedToPixels(poseLandmarks[11], width, height, this.video) : null;
    const shoulderRight = validLandmark(poseLandmarks[12]) ? normalizedToPixels(poseLandmarks[12], width, height, this.video) : null;
    const bodyLandmarks = [0, 11, 12, 23, 24].map((index) => poseLandmarks[index]).filter(validLandmark);
    const bodyXs = bodyLandmarks.map((point) => point.x);
    const bodyYs = bodyLandmarks.map((point) => point.y);
    const shoulderSpan = validLandmark(poseLandmarks[11]) && validLandmark(poseLandmarks[12]) ? Math.abs(poseLandmarks[11].x - poseLandmarks[12].x) : 0;
    const bodyHeight = bodyYs.length ? Math.max(...bodyYs) - Math.min(...bodyYs) : 0;
    const tooClose = shoulderSpan > 0.48 || bodyHeight > 0.92 || (bodyXs.length && Math.min(...bodyXs) < 0.025 && Math.max(...bodyXs) > 0.975);
    const torso = shoulderLeft && shoulderRight ? {
      x: (shoulderLeft.x + shoulderRight.x) / 2,
      y: (shoulderLeft.y + shoulderRight.y) / 2 + distance(shoulderLeft, shoulderRight) * 0.55,
      width: distance(shoulderLeft, shoulderRight) * 1.1,
      height: distance(shoulderLeft, shoulderRight) * 1.7,
    } : null;
    return {
      valid: visibleArms > 0,
      confidence: visibleArms / 2,
      arms,
      body: { head: headRaw ? this.smooth(`p${playerIndex}-head`, headRaw, dt, 0.7) : null, shoulders: [shoulderLeft, shoulderRight].filter(Boolean), torso, tooClose: Boolean(tooClose), recommendedDistance: "1.5–2 m", shoulderSpan, bodyHeight },
      isSimulation: false,
    };
  }

  recordMetrics(timestamp, finishedAt, state, inferenceMs) {
    const interval = this.lastResultAt ? finishedAt - this.lastResultAt : 0;
    this.lastResultAt = finishedAt;
    this.lastResultTimestamp = timestamp;
    this.metrics = {
      source: this.workerMode ? "WORKER" : this.lightMode ? "POSE LITE" : "MAIN",
      inferenceMs: Number.isFinite(inferenceMs) ? inferenceMs : 0,
      trackingHz: interval > 0 ? 1000 / interval : 0,
      resultAgeMs: Math.max(0, finishedAt - timestamp),
      pipelineAgeMs: Math.max(0, finishedAt - timestamp),
    };
  }

  getMetrics() {
    const liveAge = this.lastResultAt ? Math.max(0, performance.now() - this.lastResultAt) : 0;
    return { ...this.metrics, lastResultAt: this.lastResultAt, resultAgeMs: Math.max(this.metrics.pipelineAgeMs || 0, liveAge) };
  }

  getState() { return this.state; }

  stop() {
    this.worker?.terminate();
    this.worker = null;
    this.workerMode = false;
    this.lightMode = false;
    this.workerBusy = false;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
  }
}
