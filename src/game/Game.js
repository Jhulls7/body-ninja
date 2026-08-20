import { clamp, distance, distanceToSegment, formatScore, lerp, normalize, randomBetween, randomItem, scale, sub } from "../core/math.js";
import { AudioEngine } from "./AudioEngine.js";
import { t } from "../i18n.js";

const FRUIT_STYLES = {
  apple: { color: "#f04d6e", dark: "#b32654", light: "#ff96a8", points: 10 },
  orange: { color: "#ff9f43", dark: "#d56824", light: "#ffd08b", points: 12 },
  kiwi: { color: "#91d64f", dark: "#4b9639", light: "#d7f89c", points: 14 },
  strawberry: { color: "#ff4f7b", dark: "#b51e50", light: "#ffb2c3", points: 16 },
  golden: { color: "#ffd166", dark: "#c37c23", light: "#fff3af", points: 100 },
  time: { color: "#6be6ff", dark: "#2374c8", light: "#e1fbff", points: 40 },
  heart: { color: "#ff6689", dark: "#c52e5b", light: "#ffd0dc", points: 0 },
};

const PLAYER_COLORS = ["#6be6ff", "#ffd166", "#c792ff", "#7dff9b"];
const STARTING_LIVES = 3;
const MAX_LIVES = 4;

export class Game {
  constructor(canvas, { onHud, onUi } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true });
    this.onHud = onHud || (() => {});
    this.onUi = onUi || (() => {});
    this.audio = new AudioEngine();
    this.width = 1280;
    this.height = 720;
    this.state = "MENU";
    this.simulation = false;
    this.cameraMode = false;
    this.mobileLayout = false;
    this.elapsed = 0;
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.flow = 0;
    this.flowMode = false;
    this.flowTimer = 0;
    this.spawnTimer = 0;
    this.dangerTimer = 0;
    this.fruits = [];
    this.fragments = [];
    this.particles = [];
    this.textBursts = [];
    this.trails = {};
    this.arms = { left: null, right: null };
    this.previousTracking = null;
    this.calibrationTime = 0;
    this.countdown = 0;
    this.resumeCountdown = 0;
    this.lostTime = 0;
    this.playerCount = 1;
    this.rounds = 1;
    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.pausedState = null;
    this.roundScores = [];
    this.players = [];
    this.shake = 0;
    this.flash = 0;
    this.pointer = { x: 0.5, y: 0.5 };
    this.backgroundCanvas = document.createElement("canvas");
    this.backgroundContext = this.backgroundCanvas.getContext("2d");
    this.backgroundDirty = true;
    this.stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), size: randomBetween(0.5, 2.5), speed: randomBetween(0.4, 1.8), phase: Math.random() * Math.PI * 2 }));
  }

  resize(width, height) { this.width = width; this.height = height; this.backgroundDirty = true; }
  setMobileLayout(enabled) { this.mobileLayout = Boolean(enabled); }
  setPointer(x, y) { this.pointer = { x, y }; }
  setCameraMode(enabled) { this.cameraMode = enabled; }

  start({ simulation = false, playerCount = 1, rounds = 1 } = {}) {
    this.audio.unlock();
    this.simulation = simulation;
    this.playerCount = clamp(Math.round(playerCount), 1, 4);
    this.rounds = clamp(Math.round(rounds), 1, 99);
    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.pausedState = null;
    this.roundScores = [];
    this.players = Array.from({ length: this.playerCount }, (_, index) => this.createPlayer(index));
    this.elapsed = 0;
    this.score = 0;
    this.displayScore = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.comboTimer = 0;
    this.lives = STARTING_LIVES;
    this.level = 1;
    this.flow = 0;
    this.flowMode = false;
    this.flowTimer = 0;
    this.spawnTimer = 0.2;
    this.dangerTimer = 0;
    this.fruits.length = 0;
    this.fragments.length = 0;
    this.particles.length = 0;
    this.textBursts.length = 0;
    this.trails = {};
    this.arms = { left: null, right: null };
    this.previousTracking = null;
    this.calibrationTime = 0;
    this.countdown = 0;
    this.lostTime = 0;
    this.syncPrimaryStats();
    this.state = "CALIBRATION";
    this.onUi({ state: this.state, simulation, playerCount: this.playerCount, rounds: this.rounds, round: this.currentRound, activePlayerIndex: this.currentPlayerIndex, activePlayer: this.getActivePlayer(), players: this.getPlayerBoard(), playersReady: simulation ? 1 : 0 });
    this.publishHud();
  }

  createPlayer(index) {
    return { index, label: `P${index + 1}`, color: PLAYER_COLORS[index], score: 0, displayScore: 0, combo: 0, bestCombo: 0, comboTimer: 0, lives: STARTING_LIVES, arms: { left: null, right: null } };
  }

  syncPrimaryStats() {
    const primary = this.players[0] || this.createPlayer(0);
    this.score = primary.score;
    this.displayScore = primary.displayScore;
    this.combo = primary.combo;
    this.bestCombo = primary.bestCombo;
    this.lives = primary.lives;
  }

  getPlayerBoard() {
    return this.players.map((player) => ({ index: player.index, label: player.label, color: player.color, score: Math.round(player.score), combo: player.combo, bestCombo: player.bestCombo, lives: player.lives }));
  }

  getActivePlayer() {
    return this.players[this.currentPlayerIndex] || this.players[0] || null;
  }

  isTrackingReady(tracking) {
    if (this.simulation) return true;
    const detectedPlayers = tracking?.playerCount || (tracking?.valid ? 1 : 0);
    return Boolean(tracking?.valid) && detectedPlayers >= 1;
  }

  setMainMenu() {
    this.state = "MENU";
    this.pausedState = null;
    this.fruits.length = 0;
    this.fragments.length = 0;
    this.players = [];
    this.trails = {};
    this.onUi({ state: this.state });
  }

  pause() {
    if (!["CALIBRATION", "COUNTDOWN", "PLAYING", "TRACKING_LOST"].includes(this.state)) return false;
    this.pausedState = this.state;
    this.state = "PAUSED";
    this.onUi({ state: this.state, muted: !this.audio.enabled });
    return true;
  }

  resume() {
    if (this.state !== "PAUSED") return false;
    this.state = this.pausedState || "PLAYING";
    this.pausedState = null;
    this.onUi({ state: this.state });
    return true;
  }

  toggleMute() {
    const muted = this.audio.toggleMute();
    this.onUi({ state: this.state, muted });
    return muted;
  }

  getDifficulty() {
    const curve = clamp(this.elapsed / 150, 0, 1);
    const mobileSpeed = this.mobileLayout ? 0.68 : 1;
    return { curve, spawnEvery: lerp(0.66, 0.28, curve) * (this.flowMode ? 0.68 : 1), fruitSpeed: lerp(1.0, 1.5, curve) * mobileSpeed, bombChance: 0.055 + curve * 0.08 };
  }

  update(dt, tracking) {
    // Render stalls can happen while a fallback vision model is initializing.
    // Preserve real-time countdowns and fruit motion without accepting a huge
    // jump after a hidden/background tab.
    const safeDt = clamp(Number.isFinite(dt) ? dt : 0.016, 0, 0.25);
    if (this.state === "PAUSED") {
      this.publishHud();
      return;
    }
    this.flash = Math.max(0, this.flash - safeDt * 2.8);
    this.shake = Math.max(0, this.shake - safeDt * 24);
    this.updateAmbient(safeDt);
    if (this.state === "CALIBRATION") {
      this.updateCalibration(safeDt, tracking);
    } else if (this.state === "COUNTDOWN") {
      this.updateCountdown(safeDt, tracking);
    } else if (this.state === "PLAYING") {
      this.updatePlaying(safeDt, tracking);
    } else if (this.state === "TRACKING_LOST") {
      this.updateTrackingLost(safeDt, tracking);
    }
    this.updateEffects(safeDt);
    this.publishHud();
  }

  updateCalibration(dt, tracking) {
    const ready = this.isTrackingReady(tracking);
    if (ready) this.calibrationTime += dt;
    else this.calibrationTime = Math.max(0, this.calibrationTime - dt * 0.5);
    this.onUi({ state: this.state, calibration: clamp(this.calibrationTime / 1.1, 0, 1), trackingValid: ready, tooClose: Boolean(tracking?.body?.tooClose), playersReady: ready ? 1 : 0, playerCount: this.playerCount, activePlayerIndex: this.currentPlayerIndex, activePlayer: this.getActivePlayer() });
    if (this.calibrationTime >= 1.1) {
      this.state = "COUNTDOWN";
      this.countdown = 3.25;
      this.audio.countdown();
      this.onUi({ state: this.state, countdown: 3 });
    }
  }

  updateCountdown(dt, tracking) {
    if (!this.isTrackingReady(tracking)) return;
    const previous = Math.ceil(this.countdown);
    this.countdown -= dt;
    const current = Math.ceil(this.countdown);
    if (current !== previous && current > 0) this.audio.countdown();
    this.onUi({ state: this.state, countdown: current > 0 ? current : "GO" });
    if (this.countdown <= 0) {
      this.state = "PLAYING";
      this.onUi({ state: this.state });
    }
  }

  updateTrackingLost(dt, tracking) {
    if (this.isTrackingReady(tracking)) {
      this.lostTime += dt;
      if (this.lostTime > 0.28) {
        this.state = "COUNTDOWN";
        this.countdown = 3.2;
        this.lostTime = 0;
        this.onUi({ state: this.state, countdown: 3, resumed: true });
      }
    } else {
      this.lostTime = 0;
    }
  }

  updatePlaying(dt, tracking) {
    if (!this.isTrackingReady(tracking)) {
      this.state = "TRACKING_LOST";
      this.onUi({ state: this.state });
      return;
    }
    this.elapsed += dt;
    this.level = Math.min(9, 1 + Math.floor(this.elapsed / 22));
    const trackedPlayers = tracking?.players?.length ? tracking.players : [{ arms: tracking?.arms || {} }];
    this.updateArms(trackedPlayers, dt);
    this.detectSlashes(dt);
    const difficulty = this.getDifficulty();
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave(difficulty);
      this.spawnTimer = difficulty.spawnEvery * randomBetween(0.72, 1.12);
    }
    this.updateFruits(dt, difficulty);
    this.updateCombo(dt);
    if (this.flowMode) {
      this.flowTimer -= dt;
      if (this.flowTimer <= 0) { this.flowMode = false; this.onUi({ toast: t("toast.flowComplete") }); }
    }
  }

  updateArms(nextPlayers, dt) {
    const playerIndex = this.currentPlayerIndex;
    const player = this.getActivePlayer();
    if (!player) return;
    const nextArms = nextPlayers[playerIndex]?.arms || nextPlayers[0]?.arms || {};
    for (const side of ["left", "right"]) {
      const arm = nextArms[side];
      if (!arm) { player.arms[side] = null; continue; }
      const previous = player.arms[side];
      player.arms[side] = { ...arm, previousTip: previous?.tip || arm.tip, previousElbow: previous?.elbow || arm.elbow, speed: previous ? distance(previous.tip, arm.tip) / Math.max(dt, 0.001) : arm.speed || 0 };
      const trailKey = `${playerIndex}-${side}`;
      const trail = this.trails[trailKey] || (this.trails[trailKey] = []);
      trail.unshift({ x: arm.tip.x, y: arm.tip.y, life: 1 });
      if (trail.length > 16) trail.pop();
    }
    this.arms = player.arms || { left: null, right: null };
  }

  detectSlashes() {
    const player = this.getActivePlayer();
    if (!player || player.lives <= 0) return;
    for (const arm of Object.values(player.arms)) {
        if (!arm) continue;
        const hasMotion = arm.speed >= 420 && distance(arm.previousTip, arm.tip) >= 6;
        const cutDirection = normalize(sub(arm.tip, arm.previousTip));
        for (const fruit of this.fruits) {
          if (fruit.cut || fruit.dead) continue;
          if (!hasMotion && !fruit.isBomb) continue;
          const bladeRadius = fruit.radius + (fruit.isBomb ? 14 : 10);
          const currentDistance = distanceToSegment(fruit.position, arm.elbow, arm.tip);
          const previousDistance = distanceToSegment(fruit.position, arm.previousElbow || arm.elbow, arm.previousTip);
          const elbowSweep = distanceToSegment(fruit.position, arm.previousElbow || arm.elbow, arm.elbow);
          const tipSweep = distanceToSegment(fruit.position, arm.previousTip, arm.tip);
          if (Math.min(currentDistance, previousDistance, elbowSweep, tipSweep) <= bladeRadius) {
            if (fruit.isBomb) {
              this.hitBomb(fruit, this.currentPlayerIndex);
              if (this.state !== "PLAYING") return;
            }
            else this.sliceFruit(fruit, cutDirection, this.currentPlayerIndex);
          }
        }
    }
  }

  spawnWave(difficulty) {
    const count = Math.random() < Math.min(0.35, difficulty.curve * 0.4) ? 2 : 1;
    for (let i = 0; i < count; i++) this.spawnFruit(difficulty);
  }

  spawnFruit(difficulty) {
    const isBomb = this.elapsed > 5 && Math.random() < difficulty.bombChance;
    const specialRoll = Math.random();
    const activePlayer = this.getActivePlayer();
    const rareHeart = !isBomb && activePlayer && activePlayer.lives < MAX_LIVES && specialRoll < 0.008;
    const type = isBomb ? "bomb" : rareHeart ? "heart" : specialRoll < 0.022 ? "golden" : specialRoll < 0.05 ? "time" : randomItem(["apple", "orange", "kiwi", "strawberry"]);
    const mobileFruitScale = this.mobileLayout ? clamp(this.height / 1100, 0.42, 0.60) * 1.1 : 1;
    const mobileMotionScale = this.mobileLayout ? 0.68 : 1;
    const radius = randomBetween(34, 50) * mobileFruitScale;
    const x = randomBetween(radius + 20, this.width - radius - 20);
    const targetX = randomBetween(this.width * 0.18, this.width * 0.82);
    const verticalLaunch = randomBetween(900, 1160) * difficulty.fruitSpeed;
    const horizontalLaunch = ((targetX - x) * 0.55 + randomBetween(-230, 230)) * difficulty.fruitSpeed;
    this.fruits.push({ id: `${Date.now()}-${Math.random()}`, type, isBomb, radius, position: { x, y: this.height + radius * 0.3 }, velocity: { x: horizontalLaunch, y: -verticalLaunch }, gravity: randomBetween(760, 930) * mobileMotionScale, rotation: randomBetween(-Math.PI, Math.PI), spin: randomBetween(-3.8, 3.8), cut: false, dead: false, life: 1, wobble: Math.random() * 10, wobbleSpeed: randomBetween(4, 8), drift: randomBetween(-150, 150) * mobileMotionScale });
  }

  updateFruits(dt, difficulty) {
    for (const fruit of this.fruits) {
      if (fruit.cut) { fruit.cutTimer -= dt; continue; }
      fruit.velocity.y += fruit.gravity * dt;
      fruit.position.x += (fruit.velocity.x + Math.sin(fruit.wobble) * fruit.drift) * dt;
      fruit.position.y += fruit.velocity.y * dt;
      fruit.rotation += fruit.spin * dt;
      fruit.wobble += dt * fruit.wobbleSpeed;
      if (fruit.position.x < fruit.radius) { fruit.position.x = fruit.radius; fruit.velocity.x = Math.abs(fruit.velocity.x); }
      if (fruit.position.x > this.width - fruit.radius) { fruit.position.x = this.width - fruit.radius; fruit.velocity.x = -Math.abs(fruit.velocity.x); }
      if (fruit.position.y > this.height + fruit.radius * 2.5) {
        fruit.dead = true;
        if (!fruit.isBomb) this.flow = Math.max(0, this.flow - 4);
      }
    }
    this.fruits = this.fruits.filter((fruit) => !fruit.dead && (!fruit.cut || fruit.cutTimer < 0));
  }

  sliceFruit(fruit, direction, playerIndex = 0) {
    fruit.cut = true;
    fruit.cutTimer = 0.48;
    fruit.cutDirection = direction;
    const style = FRUIT_STYLES[fruit.type];
    const player = this.players[playerIndex] || this.players[0];
    if (!player) return;
    if (fruit.type === "heart") {
      player.lives = Math.min(MAX_LIVES, player.lives + 1);
      this.syncPrimaryStats();
      this.audio.combo(1);
      this.burst(fruit.position, style.color, 18);
      this.textBursts.push({ x: fruit.position.x, y: fruit.position.y, text: t("toast.extraHeartShort"), life: 1, color: style.light });
      this.onUi({ toast: t("toast.extraHeart") });
      return;
    }
    const gain = style.points * (this.flowMode ? 2 : Math.max(1, player.combo));
    player.score += gain;
    player.combo += 1;
    player.bestCombo = Math.max(player.bestCombo, player.combo);
    player.comboTimer = 1.35;
    this.syncPrimaryStats();
    this.flow = clamp(this.flow + (fruit.type === "golden" ? 28 : 10), 0, 100);
    this.shake = Math.min(10, this.shake + (player.combo > 3 ? 4 : 2));
    this.flash = fruit.type === "golden" ? 0.8 : 0.24;
    this.audio.slash(player.combo);
    if (player.combo > 1) this.audio.combo(player.combo);
    this.burst(fruit.position, fruit.type === "golden" ? "#ffd166" : style.color, fruit.type === "golden" ? 26 : 14);
    this.fragments.push({ fruit: { ...fruit, position: { ...fruit.position } }, side: -1, offset: 0, velocity: { x: -direction.y * 100 - 40, y: direction.x * 100 - 30 }, life: 1 });
    this.fragments.push({ fruit: { ...fruit, position: { ...fruit.position } }, side: 1, offset: 0, velocity: { x: direction.y * 100 + 40, y: -direction.x * 100 - 30 }, life: 1 });
    const burstText = this.playerCount > 1 ? t("score.playerBurst", { player: t("hud.player", { number: player.index + 1 }), gain, combo: player.combo }) : player.combo > 1 ? t("score.comboBurst", { gain, combo: player.combo }) : t("score.plainBurst", { gain });
    this.textBursts.push({ x: fruit.position.x, y: fruit.position.y, text: burstText, life: 1, color: player.color });
    if (this.flow >= 100 && !this.flowMode) {
      this.flowMode = true;
      this.flowTimer = 6;
      this.onUi({ toast: t("toast.flowMode") });
      this.burst(fruit.position, "#6be6ff", 38);
    }
  }

  hitBomb(fruit, playerIndex = 0) {
    const player = this.players[playerIndex] || this.players[0];
    if (!player) return;
    fruit.dead = true;
    player.lives = Math.max(0, player.lives - 1);
    player.combo = 0;
    player.comboTimer = 0;
    this.syncPrimaryStats();
    this.flow = Math.max(0, this.flow - 30);
    this.shake = 18;
    this.flash = 1;
    this.audio.bomb();
    this.burst(fruit.position, "#ff496f", 35);
    this.onUi({ toast: t("toast.bombHit", { lives: player.lives, heartWord: t(player.lives === 1 ? "common.heart" : "common.hearts") }) });
    if (player.lives <= 0) this.endTurn();
  }

  updateCombo(dt) {
    this.players.forEach((player) => {
      player.comboTimer -= dt;
      if (player.comboTimer <= 0 && player.combo > 0) player.combo = 0;
    });
    this.syncPrimaryStats();
  }

  burst(position, color, count) {
    const effectCount = this.cameraMode ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < effectCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(80, 360);
      this.particles.push({ x: position.x, y: position.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: randomBetween(2, 7), color, life: 1, decay: randomBetween(1.3, 2.4), gravity: randomBetween(40, 180) });
    }
  }

  updateEffects(dt) {
    for (const particle of this.particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += particle.gravity * dt; particle.life -= particle.decay * dt; }
    this.particles = this.particles.filter((particle) => particle.life > 0);
    for (const fragment of this.fragments) { fragment.fruit.position.x += fragment.velocity.x * dt; fragment.fruit.position.y += fragment.velocity.y * dt; fragment.velocity.y += 420 * dt; fragment.life -= dt * 1.8; fragment.fruit.rotation += fragment.side * dt * 4; }
    this.fragments = this.fragments.filter((fragment) => fragment.life > 0);
    for (const burst of this.textBursts) { burst.y -= dt * 42; burst.life -= dt * 1.2; }
    this.textBursts = this.textBursts.filter((burst) => burst.life > 0);
    Object.keys(this.trails).forEach((key) => { for (const point of this.trails[key]) point.life -= dt * 5.2; this.trails[key] = this.trails[key].filter((point) => point.life > 0); });
    this.players.forEach((player) => { if (player.displayScore < player.score) player.displayScore = Math.min(player.score, player.displayScore + Math.max(1, (player.score - player.displayScore) * dt * 11)); });
    this.syncPrimaryStats();
  }

  endTurn() {
    if (this.state !== "PLAYING") return;
    const finishedPlayer = this.getActivePlayer();
    if (!finishedPlayer) return;
    finishedPlayer.arms = { left: null, right: null };
    finishedPlayer.combo = 0;
    finishedPlayer.comboTimer = 0;
    this.fruits.length = 0;
    this.fragments.length = 0;
    if (this.currentPlayerIndex < this.playerCount - 1) {
      this.state = "TURN_BREAK";
      this.onUi({ state: this.state, finishedPlayer, players: this.getPlayerBoard(), nextPlayerIndex: this.currentPlayerIndex + 1, round: this.currentRound, rounds: this.rounds });
      return;
    }
    this.roundScores.push({ round: this.currentRound, players: this.getPlayerBoard() });
    if (this.currentRound < this.rounds) {
      this.state = "ROUND_BREAK";
      this.onUi({ state: this.state, round: this.currentRound, rounds: this.rounds, previousRound: this.roundScores[this.roundScores.length - 1], players: this.getPlayerBoard() });
      return;
    }
    this.endGame();
  }

  continueTurn() {
    if (this.state !== "TURN_BREAK") return;
    this.currentPlayerIndex += 1;
    this.prepareTurn();
  }

  continueRound() {
    if (this.state !== "ROUND_BREAK") return;
    this.currentRound += 1;
    this.currentPlayerIndex = 0;
    this.players.forEach((player) => {
      player.lives = STARTING_LIVES;
      player.combo = 0;
      player.comboTimer = 0;
      player.arms = { left: null, right: null };
    });
    this.prepareTurn();
  }

  prepareTurn() {
    this.fruits.length = 0;
    this.fragments.length = 0;
    this.flow = 0;
    this.flowMode = false;
    this.flowTimer = 0;
    this.spawnTimer = 0.2;
    this.calibrationTime = 0;
    this.lostTime = 0;
    this.countdown = 0;
    this.state = "CALIBRATION";
    this.onUi({ state: this.state, round: this.currentRound, rounds: this.rounds, playerCount: this.playerCount, activePlayerIndex: this.currentPlayerIndex, activePlayer: this.getActivePlayer(), players: this.getPlayerBoard(), playersReady: this.simulation ? 1 : 0 });
  }

  endGame() {
    if (this.state === "GAME_OVER") return;
    this.state = "GAME_OVER";
    this.audio.gameOver();
    this.syncPrimaryStats();
    this.onUi({ state: this.state, score: this.score, bestCombo: this.bestCombo, players: this.getPlayerBoard(), round: this.currentRound, rounds: this.rounds, activePlayerIndex: this.currentPlayerIndex });
  }

  publishHud() {
    this.syncPrimaryStats();
    const levelKeys = ["levels.calm", "levels.flow", "levels.fury", "levels.chaos", "levels.master"];
    this.onHud({ score: formatScore(this.displayScore), combo: this.combo, lives: this.lives, level: this.level, levelName: t(levelKeys[Math.min(4, Math.floor((this.level - 1) / 2))]), flow: this.flow, flowMode: this.flowMode, round: this.currentRound, rounds: this.rounds, activePlayerIndex: this.currentPlayerIndex, activePlayer: this.getActivePlayer(), players: this.getPlayerBoard() });
  }

  updateAmbient(dt) {
    this.stars.forEach((star) => { star.y += dt * 0.012 * star.speed; if (star.y > 1.1) star.y = -0.05; });
  }

  render(time = 0) {
    const ctx = this.ctx;
    const { width, height } = this;
    ctx.clearRect(0, 0, width, height);
    if (!this.cameraMode) {
      this.drawStaticBackground(ctx);
    }
    ctx.save();
    const shakeX = (Math.random() - 0.5) * this.shake;
    const shakeY = (Math.random() - 0.5) * this.shake;
    ctx.translate(shakeX, shakeY);
    this.drawAmbient(ctx, time);
    if (["PLAYING", "COUNTDOWN", "TRACKING_LOST", "PAUSED", "GAME_OVER"].includes(this.state)) {
      this.drawArena(ctx);
      this.fruits.forEach((fruit) => { if (!fruit.cut) this.drawEntity(ctx, fruit); });
      this.drawFragments(ctx);
      this.drawPlayer(ctx);
      this.drawParticles(ctx);
      this.drawTextBursts(ctx);
    }
    ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(255, 255, 255, ${this.flash * 0.16})`; ctx.fillRect(0, 0, width, height); }
  }

  drawAmbient(ctx, time) {
    const { width, height } = this;
    ctx.save();
    const stars = this.cameraMode ? this.stars.slice(0, 8) : this.stars.slice(0, 42);
    for (const star of stars) { const alpha = (this.cameraMode ? 0.09 : 0.25) + Math.sin(time * 0.001 * star.speed + star.phase) * (this.cameraMode ? 0.04 : 0.16); ctx.fillStyle = `rgba(130, 211, 255, ${alpha})`; ctx.beginPath(); ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  drawStaticBackground(ctx) {
    if (this.backgroundDirty) {
      const background = this.backgroundCanvas;
      background.width = Math.max(1, Math.floor(this.width));
      background.height = Math.max(1, Math.floor(this.height));
      const backgroundContext = this.backgroundContext;
      const gradient = backgroundContext.createRadialGradient(this.width * 0.5, this.height * 0.38, 0, this.width * 0.5, this.height * 0.55, Math.max(this.width, this.height) * 0.75);
      gradient.addColorStop(0, this.flowMode ? "#0b2034" : "#0d1b2b");
      gradient.addColorStop(0.58, "#050b18");
      gradient.addColorStop(1, "#02050d");
      backgroundContext.fillStyle = gradient;
      backgroundContext.fillRect(0, 0, this.width, this.height);
      backgroundContext.strokeStyle = this.flowMode ? "rgba(80, 218, 255, .14)" : "rgba(89, 171, 210, .09)";
      backgroundContext.lineWidth = 1;
      for (let y = this.height * 0.18; y < this.height; y += 80) { backgroundContext.beginPath(); backgroundContext.moveTo(0, y); backgroundContext.lineTo(this.width, y); backgroundContext.stroke(); }
      for (let x = -this.width; x < this.width * 2; x += 120) { backgroundContext.beginPath(); backgroundContext.moveTo(this.width / 2, this.height * 0.38); backgroundContext.lineTo(x, this.height); backgroundContext.stroke(); }
      this.backgroundDirty = false;
    }
    ctx.drawImage(this.backgroundCanvas, 0, 0, this.width, this.height);
  }

  drawArena(ctx) {
    if (this.cameraMode) return;
    const { width, height } = this;
    const center = { x: width / 2, y: height * 0.58 };
    const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, Math.min(width, height) * 0.46);
    glow.addColorStop(0, this.flowMode ? "rgba(60, 202, 255, .1)" : "rgba(38, 119, 163, .06)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
  }

  drawPlayer(ctx) {
    this.players.forEach((player, playerIndex) => {
      if (player.lives <= 0) return;
      for (const side of ["left", "right"]) {
        const arm = player.arms[side]; if (!arm) continue;
        this.drawTrail(ctx, side, playerIndex, player.color);
        const color = player.color || "#74ecff";
        const gradient = this.cameraMode ? color : ctx.createLinearGradient(arm.elbow.x, arm.elbow.y, arm.tip.x, arm.tip.y);
        if (!this.cameraMode) { gradient.addColorStop(0, `${color}88`); gradient.addColorStop(0.62, color); gradient.addColorStop(1, "#ffffff"); }
        ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = color; ctx.shadowBlur = this.cameraMode ? 0 : 22;
        ctx.strokeStyle = `${color}55`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(arm.shoulder.x, arm.shoulder.y); ctx.lineTo(arm.elbow.x, arm.elbow.y); ctx.stroke();
        ctx.strokeStyle = `${color}33`; ctx.lineWidth = this.cameraMode ? 11 : 15; ctx.beginPath(); ctx.moveTo(arm.elbow.x, arm.elbow.y); ctx.lineTo(arm.tip.x, arm.tip.y); ctx.stroke();
        ctx.shadowBlur = this.cameraMode ? 0 : 8; ctx.strokeStyle = gradient; ctx.lineWidth = this.cameraMode ? 4 : 5; ctx.beginPath(); ctx.moveTo(arm.elbow.x, arm.elbow.y); ctx.lineTo(arm.tip.x, arm.tip.y); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(arm.elbow.x, arm.elbow.y); ctx.lineTo(arm.tip.x, arm.tip.y); ctx.stroke();
        ctx.fillStyle = "#d8fbff"; ctx.beginPath(); ctx.arc(arm.tip.x, arm.tip.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(arm.tip.x, arm.tip.y, 11 + Math.sin(Date.now() * 0.008) * 2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = color; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(arm.elbow.x, arm.elbow.y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    });
  }

  drawTrail(ctx, side, playerIndex = 0, color = "#58e7ff") {
    const trail = this.trails[`${playerIndex}-${side}`]; if (!trail?.length) return;
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let i = trail.length - 1; i > 0; i--) { const a = trail[i]; const b = trail[i - 1]; ctx.strokeStyle = `${color}${Math.round(Math.max(0, a.life) * 80).toString(16).padStart(2, "0")}`; ctx.lineWidth = Math.max(1, a.life * 10); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.restore();
  }

  drawEntity(ctx, fruit) {
    ctx.save(); ctx.translate(fruit.position.x, fruit.position.y); ctx.rotate(fruit.rotation); if (fruit.isBomb) this.drawBomb(ctx, fruit.radius); else this.drawFruit(ctx, fruit.type, fruit.radius); ctx.restore();
  }

  drawFruit(ctx, type, radius) {
    const style = FRUIT_STYLES[type] || FRUIT_STYLES.apple;
    ctx.shadowColor = style.color; ctx.shadowBlur = this.cameraMode ? 0 : 16;
    ctx.fillStyle = style.color; ctx.beginPath();
    if (type === "heart") { ctx.moveTo(0, radius * 1.02); ctx.bezierCurveTo(-radius * 1.2, radius * .28, -radius * .86, -radius * .86, -radius * .34, -radius * .56); ctx.bezierCurveTo(-radius * .08, -radius * .72, 0, -radius * .42, 0, -radius * .24); ctx.bezierCurveTo(0, -radius * .42, radius * .08, -radius * .72, radius * .34, -radius * .56); ctx.bezierCurveTo(radius * .86, -radius * .86, radius * 1.2, radius * .28, 0, radius * 1.02); } else if (type === "strawberry") { ctx.moveTo(0, radius * 1.08); ctx.bezierCurveTo(-radius * 1.1, radius * .3, -radius * .72, -radius * .85, 0, -radius * .48); ctx.bezierCurveTo(radius * .72, -radius * .85, radius * 1.1, radius * .3, 0, radius * 1.08); } else if (type === "kiwi") ctx.arc(0, 0, radius * .88, 0, Math.PI * 2); else { ctx.ellipse(0, 0, radius * .94, radius, 0, 0, Math.PI * 2); }
    ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = style.light; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(-radius * .3, -radius * .34, radius * .18, radius * .28, -.55, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    if (type === "heart") { ctx.fillStyle = "#fff2f6"; ctx.globalAlpha = .85; ctx.beginPath(); ctx.arc(-radius * .28, -radius * .28, radius * .1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; return; }
    if (type === "kiwi") { ctx.fillStyle = "#442d29"; for (let i = 0; i < 12; i++) { const a = i * 0.52; ctx.beginPath(); ctx.arc(Math.cos(a) * radius * .54, Math.sin(a) * radius * .54, 1.7, 0, Math.PI * 2); ctx.fill(); } }
    if (type === "strawberry") { ctx.fillStyle = "#65db7b"; ctx.beginPath(); ctx.moveTo(0, -radius * .48); ctx.lineTo(-radius * .46, -radius * .86); ctx.lineTo(-radius * .1, -radius * .7); ctx.lineTo(0, -radius); ctx.lineTo(radius * .1, -radius * .7); ctx.lineTo(radius * .46, -radius * .86); ctx.closePath(); ctx.fill(); }
    if (type === "golden") { ctx.strokeStyle = "#fff4ae"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, radius * 1.12, 0, Math.PI * 2); ctx.stroke(); }
    if (type === "time") { ctx.strokeStyle = "#e1fbff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, radius * .56, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -radius * .32); ctx.moveTo(0, 0); ctx.lineTo(radius * .23, radius * .16); ctx.stroke(); }
    ctx.fillStyle = "#653a29"; ctx.fillRect(-2, -radius * 1.05, 4, radius * .25);
  }

  drawBomb(ctx, radius) {
    const pulse = 1 + Math.sin(Date.now() * .012) * .08;
    ctx.fillStyle = "rgba(255, 73, 111, .12)"; ctx.beginPath(); ctx.arc(0, 0, radius * 1.28 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255, 73, 111, ${.52 + Math.sin(Date.now() * .012) * .16})`; ctx.lineWidth = Math.max(3, radius * .07); ctx.beginPath(); ctx.arc(0, 0, radius * 1.2 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#ffcf77"; ctx.lineWidth = 2; ctx.setLineDash([Math.max(4, radius * .16), Math.max(3, radius * .11)]); ctx.beginPath(); ctx.arc(0, 0, radius * 1.04, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.shadowColor = "#ff416c"; ctx.shadowBlur = this.cameraMode ? 0 : 18; ctx.fillStyle = "#111a25"; ctx.beginPath(); ctx.arc(0, 0, radius * .86, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#ff7185"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#ff496f"; ctx.beginPath(); ctx.arc(-radius * .28, -radius * .28, radius * .16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffe1e7"; ctx.font = `800 ${Math.max(12, radius * .62)}px Oxanium, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", 0, radius * .1);
    ctx.strokeStyle = "#ffbe68"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -radius * .78); ctx.quadraticCurveTo(radius * .18, -radius * 1.12, radius * .38, -radius * .94); ctx.stroke(); ctx.fillStyle = "#ffdf77"; ctx.beginPath(); ctx.arc(radius * .39, -radius * .94, 4 + Math.sin(Date.now() * .015) * 2, 0, Math.PI * 2); ctx.fill();
  }

  drawFragments(ctx) {
    for (const fragment of this.fragments) {
      const { fruit, side, life } = fragment;
      ctx.save();
      ctx.translate(fruit.position.x + side * 2, fruit.position.y);
      ctx.rotate(fruit.rotation);
      ctx.globalAlpha = clamp(life, 0, 1);
      ctx.beginPath();
      if (side < 0) ctx.rect(-fruit.radius * 2, -fruit.radius * 1.4, fruit.radius * 2, fruit.radius * 2.8);
      else ctx.rect(0, -fruit.radius * 1.4, fruit.radius * 2, fruit.radius * 2.8);
      ctx.clip();
      ctx.translate(-side * fruit.radius * .42, 0);
      this.drawFruit(ctx, fruit.type, fruit.radius);
      ctx.restore();
    }
  }

  drawParticles(ctx) { ctx.save(); for (const particle of this.particles) { ctx.globalAlpha = clamp(particle.life, 0, 1); ctx.fillStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = this.cameraMode ? 0 : 8; ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  drawTextBursts(ctx) { ctx.save(); ctx.textAlign = "center"; ctx.font = "800 16px Oxanium, sans-serif"; for (const burst of this.textBursts) { ctx.globalAlpha = clamp(burst.life, 0, 1); ctx.fillStyle = burst.color; ctx.shadowColor = burst.color; ctx.shadowBlur = this.cameraMode ? 0 : 12; ctx.fillText(burst.text, burst.x, burst.y); } ctx.restore(); }

  drawCalibration(ctx, tracking, progress = 0) {
    const { width, height } = this;
    ctx.save(); ctx.strokeStyle = tracking?.valid ? "rgba(109, 239, 255, .72)" : "rgba(130, 180, 200, .25)"; ctx.lineWidth = 2; ctx.setLineDash([8, 12]); ctx.beginPath(); ctx.ellipse(width / 2, height * .52, Math.min(width * .26, 220), height * .42, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = "rgba(109, 239, 255, .18)"; ctx.beginPath(); ctx.moveTo(width / 2, height * .1); ctx.lineTo(width / 2, height * .9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(width * .25, height * .52); ctx.lineTo(width * .75, height * .52); ctx.stroke(); if (progress > 0) { ctx.strokeStyle = "#67e8fa"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(width / 2, height * .52, Math.min(width * .26, 220), -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke(); } ctx.restore();
  }
}
