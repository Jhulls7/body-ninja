import "./styles.css";
import { Game } from "./game/Game.js";
import { PoseTracker } from "./tracking/PoseTracker.js";
import { getLanguage, setLanguage, t, translateDocument } from "./i18n.js";

const canvas = document.querySelector("#game-canvas");
const video = document.querySelector("#camera-view");
const menuScreen = document.querySelector("#menu-screen");
const helpScreen = document.querySelector("#help-screen");
const lostScreen = document.querySelector("#lost-screen");
const pauseScreen = document.querySelector("#pause-screen");
const gameoverScreen = document.querySelector("#gameover-screen");
const hud = document.querySelector("#hud");
const calibrationLabel = document.querySelector("#calibration-label");
const calibrationTitle = document.querySelector("#calibration-title");
const calibrationHint = document.querySelector("#calibration-hint");
const countdownLabel = document.querySelector("#countdown-label");
const toast = document.querySelector("#toast");
const menuStatus = document.querySelector("#menu-status");
const runtimeBadge = document.querySelector("#runtime-badge");
const runtimeLabel = document.querySelector("#runtime-label");
const orientationAlert = document.querySelector("#orientation-alert");
const proximityAlert = document.querySelector("#proximity-alert");
const roundScreen = document.querySelector("#round-screen");
const roundTitle = document.querySelector("#round-title");
const roundBoard = document.querySelector("#round-board");
const turnScreen = document.querySelector("#turn-screen");
const turnTitle = document.querySelector("#turn-title");
const turnBoard = document.querySelector("#turn-board");
const finalBoard = document.querySelector("#final-board");
const playersHud = document.querySelector("#players-hud");
const playerCountInput = document.querySelector("#player-count");
const roundCountInput = document.querySelector("#round-count");
const languageSelect = document.querySelector("#language-select");
const muteAudioButton = document.querySelector("#mute-audio");
const muteAudioLabel = document.querySelector("#mute-audio-label");

let viewport = { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
let debugMode = false;
let lastTime = performance.now();
let toastTimer = 0;
const perf = { startedAt: performance.now(), frames: 0, fps: 0, lastUiAt: 0 };
let lastUiData = { state: "MENU" };
let lastUiPaintAt = 0;
let lastHudPaintAt = 0;
let lastHudLives = null;
let lastHudPlayer = null;

translateDocument();
languageSelect.value = getLanguage();

function resetPerformance() {
  perf.startedAt = performance.now();
  perf.frames = 0;
  perf.fps = 0;
  perf.lastUiAt = 0;
  document.querySelector("#fps-counter-value").textContent = "--";
}

const tracker = new PoseTracker({ onStatus: (message) => { menuStatus.textContent = message; runtimeLabel.textContent = message; } });
const game = new Game(canvas, {
  onHud: updateHud,
  onUi: updateUi,
});
window.__bodyNinja = { game, tracker };

function resize() {
  viewport = { width: window.innerWidth, height: window.innerHeight, dpr: 1 };
  canvas.width = Math.floor(viewport.width * viewport.dpr);
  canvas.height = Math.floor(viewport.height * viewport.dpr);
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  game.ctx.setTransform(viewport.dpr, 0, 0, viewport.dpr, 0, 0);
  game.resize(viewport.width, viewport.height);
  game.setMobileLayout(isMobileDevice());
  updateOrientationHint();
}

function isMobileDevice() {
  const userAgent = navigator.userAgent || "";
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(userAgent);
  const mobileHint = Boolean(navigator.userAgentData?.mobile);
  const touchLayout = window.matchMedia("(pointer: coarse)").matches
    && Math.max(window.innerWidth, window.innerHeight) <= 1024;
  return mobileUserAgent || mobileHint || touchLayout;
}

function updateOrientationHint() {
  if (!orientationAlert) return;
  const shouldShow = isMobileDevice() && window.innerHeight > window.innerWidth;
  const screenState = game && ["MENU", "HELP", "PAUSED", "GAME_OVER", "ROUND_BREAK", "TURN_BREAK"].includes(game.state);
  orientationAlert.classList.toggle("active", shouldShow);
  orientationAlert.classList.toggle("attention", shouldShow && screenState);
}

function renderLives(lives) {
  const value = Number(lives);
  const safeLives = Number.isFinite(value) ? Math.max(0, Math.min(4, Math.round(value))) : 3;
  const livesValue = document.querySelector("#lives-value");
  if (livesValue.dataset.lives === String(safeLives) && livesValue.dataset.language === getLanguage()) return;
  livesValue.innerHTML = Array.from({ length: safeLives }, () => '<span class="heart-icon active" aria-hidden="true">♥</span>').join("");
  livesValue.setAttribute("aria-label", `${safeLives}/4 ${t(safeLives === 1 ? "common.heart" : "common.hearts")}`);
  livesValue.dataset.lives = String(safeLives);
  livesValue.dataset.language = getLanguage();
}

function updateHud(data) {
  const now = performance.now();
  const livesChanged = data.lives !== lastHudLives;
  const playerChanged = data.activePlayerIndex !== lastHudPlayer;
  if (!livesChanged && !playerChanged && now - lastHudPaintAt < 100) return;
  lastHudPaintAt = now;
  lastHudLives = data.lives;
  lastHudPlayer = data.activePlayerIndex;
  document.querySelector("#score-value").textContent = data.score;
  document.querySelector("#combo-value").textContent = `x${data.combo}`;
  renderLives(data.lives);
  document.querySelector("#active-player").textContent = t("hud.player", { number: (data.activePlayerIndex || 0) + 1 });
  document.querySelector("#level-name").textContent = data.levelName;
  document.querySelector("#level-value").textContent = t("hud.roundLevel", { round: data.round || 1, rounds: data.rounds || 1, level: data.level });
  document.querySelector("#flow-value").textContent = data.flowMode ? "ACTIVE" : `${Math.round(data.flow)}%`;
  document.querySelector("#flow-fill").style.width = `${data.flow}%`;
  document.querySelector("#flow-fill").classList.toggle("active", data.flowMode);
  renderPlayerBoard(playersHud, data.players || [], true);
}

function updateUi(data) {
  const { toast: toastMessage, ...uiData } = data;
  const state = data.state;
  const previousUiData = lastUiData;
  const now = performance.now();
  const urgent = state !== previousUiData.state
    || toastMessage
    || data.countdown !== previousUiData.countdown
    || data.resumed;
  lastUiData = uiData;
  if (!urgent && now - lastUiPaintAt < 100) return;
  lastUiPaintAt = now;
  menuScreen.classList.toggle("active", state === "MENU");
  helpScreen.classList.toggle("active", state === "HELP");
  lostScreen.classList.toggle("active", state === "TRACKING_LOST");
  pauseScreen.classList.toggle("active", state === "PAUSED");
  gameoverScreen.classList.toggle("active", state === "GAME_OVER");
  roundScreen.classList.toggle("active", state === "ROUND_BREAK");
  turnScreen.classList.toggle("active", state === "TURN_BREAK");
  updateOrientationHint();
  hud.classList.toggle("hidden", ["MENU", "HELP", "GAME_OVER", "ROUND_BREAK", "TURN_BREAK"].includes(state));
  runtimeBadge.classList.toggle("hidden", state === "MENU" || state === "HELP" || state === "GAME_OVER" || state === "ROUND_BREAK" || state === "TURN_BREAK");
  playersHud.classList.toggle("hidden", state === "MENU" || state === "HELP" || state === "GAME_OVER" || state === "ROUND_BREAK" || state === "TURN_BREAK" || state === "PAUSED");
  setProximityWarning(Boolean(data.tooClose));
  calibrationLabel.classList.toggle("hidden", state !== "CALIBRATION");
  countdownLabel.classList.toggle("hidden", state !== "COUNTDOWN");
  if (state === "CALIBRATION") {
    const activeLabel = t("hud.player", { number: (data.activePlayerIndex || 0) + 1 });
    calibrationTitle.textContent = data.trackingValid ? `${activeLabel} · ${t("calibration.ready")}` : `${t("calibration.title")} · ${activeLabel}`;
    calibrationHint.textContent = data.trackingValid ? t("calibration.readyHint") : t("calibration.hint");
    calibrationLabel.style.setProperty("--progress", `${(data.calibration || 0) * 100}%`);
  }
  if (state === "COUNTDOWN") countdownLabel.textContent = data.countdown === "GO" ? "GO" : data.countdown;
  if (state === "GAME_OVER") {
    document.querySelector("#final-score").textContent = data.score?.toLocaleString("en-US") || "0";
    document.querySelector("#final-combo").textContent = `x${data.bestCombo || 0}`;
    renderPlayerBoard(finalBoard, data.players || [], false);
  }
  if (state === "ROUND_BREAK") {
    roundTitle.textContent = t("round.complete", { round: data.round || 1 });
    renderPlayerBoard(roundBoard, data.previousRound?.players || data.players || [], false);
  }
  if (state === "TURN_BREAK") {
    turnTitle.textContent = t("turn.complete", { player: t("hud.player", { number: (data.finishedPlayer?.index || 0) + 1 }) });
    renderPlayerBoard(turnBoard, data.players || [], false);
  }
  if (state === "PAUSED") updateMuteButton(data.muted ?? !game.audio.enabled);
  if (toastMessage && state === "PLAYING") showToast(toastMessage);
  else if (state !== "PLAYING") hideToast();
}

function renderPlayerBoard(container, players, compact = false) {
  if (!container) return;
  container.innerHTML = players.map((player) => {
    const lives = Math.max(0, Math.min(4, Math.round(Number(player.lives) || 0)));
    const hearts = Array.from({ length: 4 }, (_, index) => `<span class="mini-heart${index < lives ? " active" : " empty"}" aria-hidden="true">♥</span>`).join("");
    const heartLabel = `${lives}/4 ${t(lives === 1 ? "common.heart" : "common.hearts")}`;
    return `<div class="score-row${lives <= 0 ? " is-out" : ""}" style="--player-color:${player.color || "#6be6ff"}"><i></i><span>${t("hud.player", { number: (player.index || 0) + 1 })}</span><small class="player-lives" aria-label="${heartLabel}">${hearts}<b>${lives}/4</b><span> · x${player.combo || 0}</span></small><b>${Math.round(player.score || 0).toLocaleString("en-US")}</b></div>`;
  }).join("");
  container.classList.toggle("compact", compact);
}

function updateMuteButton(muted = !game.audio.enabled) {
  muteAudioLabel.textContent = muted ? t("pause.unmute") : t("pause.mute");
  muteAudioButton.classList.toggle("is-muted", muted);
}

function setProximityWarning(tooClose) {
  const shouldShow = tooClose && !tracker.simulation && game.state !== "MENU" && game.state !== "GAME_OVER";
  proximityAlert.classList.toggle("active", shouldShow);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.remove("toast-in");
  requestAnimationFrame(() => toast.classList.add("toast-in"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 1600);
}

function hideToast() {
  clearTimeout(toastTimer);
  toast.classList.add("hidden");
  toast.classList.remove("toast-in");
}

function updatePerformance(now) {
  perf.frames += 1;
  const elapsed = now - perf.startedAt;
  if (elapsed < 250 || now - perf.lastUiAt < 180) return;
  perf.fps = (perf.frames / elapsed) * 1000;
  perf.startedAt = now;
  perf.frames = 0;
  perf.lastUiAt = now;
  document.querySelector("#fps-counter-value").textContent = Math.round(perf.fps);
}

function getGameSettings() {
  const playerCount = Math.max(1, Math.min(4, Number.parseInt(playerCountInput.value, 10) || 1));
  const rounds = Math.max(1, Math.min(99, Number.parseInt(roundCountInput.value, 10) || 1));
  playerCountInput.value = playerCount;
  roundCountInput.value = rounds;
  return { playerCount, rounds };
}

function beginCameraGame() {
  const settings = getGameSettings();
  // Players take turns, so only the active person needs to be tracked.
  // Detecting four bodies here unnecessarily multiplies model inference cost.
  tracker.setPlayerLimit(1);
  game.setCameraMode(true);
  game.start({ simulation: false, ...settings });
  resetPerformance();
}

async function startCamera() {
  const button = document.querySelector("#start-camera");
  button.disabled = true;
  menuStatus.textContent = t("status.loadingTracking");
  try {
    await tracker.startCamera(video, { maxPlayers: 1 });
    video.classList.add("visible", "camera-background");
    tracker.setSimulation(false);
    game.setCameraMode(true);
    beginCameraGame();
  } catch (error) {
    console.error(error);
    tracker.stop();
    menuStatus.textContent = error?.name === "NotAllowedError" ? t("status.cameraPermission") : t("status.cameraUnavailable");
    showToast(t("status.demoReady"));
  } finally {
    button.disabled = false;
  }
}

function startDemo() {
  const settings = getGameSettings();
  tracker.stop();
  tracker.setPlayerLimit(settings.playerCount);
  tracker.setSimulation(true);
  video.classList.remove("visible", "camera-background");
  game.setCameraMode(false);
  game.start({ simulation: true, ...settings });
  resetPerformance();
  runtimeLabel.textContent = t("runtime.demo");
}

function loop(now) {
  // Keep game clocks close to real time after a slow inference frame. Game
  // physics applies its own safety cap, while countdowns no longer crawl.
  const dt = Math.min(0.25, Math.max(0, (now - lastTime) / 1000) || 0.016);
  lastTime = now;
  tracker.update(now, viewport.width, viewport.height, dt);
  const tracking = tracker.getState();
  game.lastTrackingBody = tracking.body;
  game.update(dt, tracking);
  updatePerformance(now);
  setProximityWarning(Boolean(tracking.body?.tooClose));
  game.render(now);
  if (game.state === "CALIBRATION") game.drawCalibration(game.ctx, tracking, game.calibrationTime / 1.1);
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  tracker.setPointer(x, y);
  game.setPointer(x, y);
});
canvas.addEventListener("pointerdown", () => tracker.setPointer(tracker.pointer.x, tracker.pointer.y));
document.querySelector("#start-camera").addEventListener("click", () => {
  if (tracker.stream && video.srcObject) beginCameraGame();
  else startCamera();
});
document.querySelector("#start-demo").addEventListener("click", startDemo);
languageSelect.addEventListener("change", (event) => setLanguage(event.target.value));
document.querySelector("#how-to-play").addEventListener("click", () => { helpScreen.classList.add("active"); menuScreen.classList.remove("active"); });
document.querySelector("#close-help").addEventListener("click", () => { helpScreen.classList.remove("active"); menuScreen.classList.add("active"); });
document.querySelector("#help-ready").addEventListener("click", () => { helpScreen.classList.remove("active"); menuScreen.classList.add("active"); });
document.querySelector("#next-turn").addEventListener("click", () => game.continueTurn());
document.querySelector("#next-round").addEventListener("click", () => game.continueRound());
document.querySelector("#resume-game").addEventListener("click", () => game.resume());
muteAudioButton.addEventListener("click", () => game.toggleMute());
document.querySelector("#play-again").addEventListener("click", () => {
  const settings = getGameSettings();
  if (!tracker.simulation && tracker.stream && video.srcObject) beginCameraGame();
  else {
    tracker.setPlayerLimit(settings.playerCount);
    game.start({ simulation: true, ...settings });
    resetPerformance();
  }
});
function returnToMainMenu() {
  tracker.stop();
  video.classList.remove("visible", "camera-background");
  game.setCameraMode(false);
  game.setMainMenu();
}
document.querySelector("#main-menu").addEventListener("click", returnToMainMenu);
document.querySelector("#pause-main-menu").addEventListener("click", returnToMainMenu);
window.addEventListener("body-ninja-language-change", () => {
  languageSelect.value = getLanguage();
  updateMuteButton();
  if (tracker.simulation) runtimeLabel.textContent = t("runtime.demo");
  else if (tracker.stream) runtimeLabel.textContent = t("runtime.cameraOnline");
  updateUi(lastUiData);
});
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", updateOrientationHint);
document.addEventListener("visibilitychange", () => {
  lastTime = performance.now();
  if (document.hidden && ["CALIBRATION", "COUNTDOWN", "PLAYING", "TRACKING_LOST"].includes(game.state)) game.pause();
});
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "d") {
    debugMode = !debugMode;
    document.body.classList.toggle("debug-mode", debugMode);
    showToast(debugMode ? t("toast.debugOn") : t("toast.debugOff"));
  }
  if (event.key !== "Escape" || event.repeat) return;
  if (game.state === "PAUSED") game.resume();
  else if (["CALIBRATION", "COUNTDOWN", "PLAYING", "TRACKING_LOST"].includes(game.state)) game.pause();
});

resize();
requestAnimationFrame(loop);
