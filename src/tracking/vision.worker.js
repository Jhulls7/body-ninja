import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const POSE_MODEL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarker;

async function createTracker(playerLimit = 1) {
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  const numPoses = Math.max(1, Math.min(4, playerLimit));
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: POSE_MODEL, delegate },
    runningMode: "VIDEO",
    numPoses,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });
  try {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, options("GPU"));
  } catch {
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, options("CPU"));
  }
}

self.onmessage = async (event) => {
  const { type, bitmap, timestamp, playerLimit } = event.data;
  try {
    if (type === "init") {
      await createTracker(playerLimit);
      self.postMessage({ type: "ready" });
      return;
    }
    if (type !== "frame" || !poseLandmarker) return;
    const poseResult = poseLandmarker.detectForVideo(bitmap, timestamp);
    bitmap.close();
    self.postMessage({ type: "result", timestamp, poseLandmarks: poseResult?.landmarks || [] });
  } catch (error) {
    bitmap?.close?.();
    self.postMessage({ type: "error", message: error?.message || "Tracking worker error" });
  }
};
