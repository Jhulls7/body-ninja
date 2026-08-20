const STORAGE_KEY = "body-ninja-language";

export const LANGUAGES = ["es", "pt", "en"];

const translations = {
  es: {
    meta: { title: "BODY NINJA | Tu cuerpo es la espada" },
    common: { heart: "corazón", hearts: "corazones" },
    menu: {
      eyebrow: "ARCADE DE SEGUIMIENTO CORPORAL",
      tagline: "TU CUERPO ES LA ESPADA",
      intro: "Mueve tus brazos. El filo nace en el codo y llega hasta la punta de tus dedos.",
      startCamera: "INICIAR CON CÁMARA",
      demo: "PROBAR DEMO DE MOVIMIENTO",
      players: "JUGADORES",
      rounds: "RONDAS",
      language: "IDIOMA",
      settingsHint: "Mueve ambos brazos dentro del encuadre y corta con el antebrazo.",
      howToPlay: "CÓMO JUGAR",
      privacy: "El procesamiento de cámara ocurre en este dispositivo.",
      distance: "DISTANCIA RECOMENDADA · 1.5–2 m · deja brazos y hombros dentro del encuadre",
      move: "MUEVE",
      fast: "RÁPIDO"
    },
    help: {
      eyebrow: "GUÍA RÁPIDA",
      title: "Tu cuerpo es el arma.",
      slashTitle: "CORTE",
      slashBody: "Corta moviendo el brazo con decisión. El filo cubre codo hasta dedo.",
      flowTitle: "FLUJO",
      flowBody: "Encadena frutas sin tocar bombas para subir tu multiplicador.",
      bombTitle: "EVASIÓN",
      bombBody: "Las bombas castigan el contacto. Usa tu cuerpo, no solo las manos.",
      partyTitle: "MODO GRUPO",
      partyBody: "Configura hasta cuatro jugadores por turnos, uno después de otro.",
      roundsTitle: "RONDAS",
      roundsBody: "Elige cuántas rondas jugar. Cada turno termina al perder todos sus corazones.",
      ready: "ESTOY LISTO"
    },
    lost: { eyebrow: "SEGUIMIENTO INTERRUMPIDO", title: "JUGADOR FUERA", body: "Vuelve a colocarte frente a la cámara para continuar." },
    gameover: { eyebrow: "PARTIDA TERMINADA", title: "FIN DE LA PARTIDA", score: "PUNTUACIÓN FINAL", bestCombo: "MEJOR COMBO", playAgain: "JUGAR DE NUEVO", mainMenu: "MENÚ PRINCIPAL" },
    round: { eyebrow: "RONDA TERMINADA", title: "RONDA {{round}}", complete: "RONDA {{round}} TERMINADA", hint: "Pulsa para continuar cuando estén listos.", next: "SIGUIENTE RONDA" },
    turn: { eyebrow: "TURNO TERMINADO", title: "JUGADOR 1", complete: "{{player}} TERMINADO", hint: "Entrega el espacio al siguiente jugador.", next: "SIGUIENTE JUGADOR" },
    pause: { eyebrow: "PARTIDA EN PAUSA", title: "PAUSA", body: "La partida está detenida.", resume: "CONTINUAR", mute: "SILENCIAR", unmute: "ACTIVAR SONIDO", mainMenu: "VOLVER AL MENÚ" },
    hud: { lives: "CORAZONES", score: "PUNTUACIÓN", combo: "COMBO", flow: "FLUJO", roundLevel: "RONDA {{round}}/{{rounds}} · NIVEL {{level}}", initialRoundLevel: "RONDA 1/1 · NIVEL 1", player: "JUGADOR {{number}}", playerOne: "JUGADOR 1" },
    runtime: { cameraOnline: "CÁMARA ACTIVA", demo: "DEMO DE MOVIMIENTO", debug: "DEPURACIÓN" },
    metrics: { heading: "MÉTRICAS EN VIVO", fps: "FPS", frame: "CUADRO", track: "SEGUIMIENTO", infer: "INFERENCIA", age: "ANTIGÜEDAD", players: "JUGADORES", finger: "EXTENSIÓN", bladeLeft: "FILO IZQ.", bladeRight: "FILO DER.", source: { idle: "INACTIVO", simulation: "SIMULACIÓN", worker: "PROCESADOR", poseLite: "POSE LIGERA", main: "PRINCIPAL" } },
    proximity: { title: "ESTÁS DEMASIADO CERCA", body: "Aléjate hasta aproximadamente 1.5–2 m para que tus brazos entren completos en cámara." },
    calibration: { title: "PONTE FRENTE A LA CÁMARA", ready: "LISTO", readyHint: "Mantén hombros y brazos dentro del marco", hint: "Encuadra hombros y brazos para este turno" },
    board: { hearts: "♥ {{lives}} · x{{combo}}", out: "FUERA" },
    levels: { calm: "CALMA", flow: "FLUJO", fury: "FURIA", chaos: "CAOS", master: "MAESTRO" },
    score: { comboBurst: "+{{gain}} · COMBO x{{combo}}", playerBurst: "{{player}} · +{{gain}} · x{{combo}}", plainBurst: "+{{gain}}" },
    toast: { extraHeart: "CORAZÓN EXTRA", extraHeartShort: "+1 CORAZÓN", flowMode: "MODO FLUJO", flowComplete: "MODO FLUJO TERMINADO", bombHit: "BOMBA · QUEDAN {{lives}} {{heartWord}}", debugOn: "DEPURACIÓN ACTIVADA", debugOff: "DEPURACIÓN DESACTIVADA" },
    status: { requestingCamera: "Solicitando acceso a la cámara…", loadingTracking: "Cargando seguimiento corporal…", workerUnavailable: "Seguimiento alternativo activado.", workerInterrupted: "Reintentando seguimiento…", cameraOnline: "CÁMARA ACTIVA · SEGUIMIENTO LISTO", cameraPermission: "Permiso de cámara bloqueado. Puedes probar la demo de movimiento.", cameraUnavailable: "No se pudo iniciar la cámara. Prueba la demo de movimiento.", demoReady: "CÁMARA NO DISPONIBLE · DEMO LISTA" },
    language: { es: "Español", pt: "Português", en: "English" },
    aria: { gameArea: "Área de juego Body Ninja", settings: "Configuración de partida", finalBoard: "Resultados finales", roundBoard: "Resultados de ronda", turnBoard: "Resultados del turno", playersBoard: "Marcadores de jugadores", metrics: "Métricas de rendimiento" }
  },
  pt: {
    meta: { title: "BODY NINJA | Seu corpo é a espada" },
    common: { heart: "coração", hearts: "corações" },
    menu: {
      eyebrow: "ARCADE DE RASTREAMENTO CORPORAL",
      tagline: "SEU CORPO É A ESPADA",
      intro: "Mova os braços. O fio nasce no cotovelo e chega até a ponta dos dedos.",
      startCamera: "INICIAR COM CÂMERA",
      demo: "TESTAR DEMO DE MOVIMENTO",
      players: "JOGADORES",
      rounds: "RODADAS",
      language: "IDIOMA",
      settingsHint: "Mova os dois braços dentro do enquadramento e corte com o antebraço.",
      howToPlay: "COMO JOGAR",
      privacy: "O processamento da câmera acontece neste dispositivo.",
      distance: "DISTÂNCIA RECOMENDADA · 1.5–2 m · mantenha braços e ombros dentro do enquadramento",
      move: "MOVA",
      fast: "RÁPIDO"
    },
    help: {
      eyebrow: "GUIA RÁPIDO",
      title: "Seu corpo é a arma.",
      slashTitle: "CORTE",
      slashBody: "Corte movendo o braço com decisão. O fio cobre do cotovelo ao dedo.",
      flowTitle: "FLUXO",
      flowBody: "Emende frutas sem tocar nas bombas para aumentar seu multiplicador.",
      bombTitle: "EVASÃO",
      bombBody: "As bombas punem o contato. Use o corpo, não apenas as mãos.",
      partyTitle: "MODO GRUPO",
      partyBody: "Configure até quatro jogadores por turnos, um depois do outro.",
      roundsTitle: "RODADAS",
      roundsBody: "Escolha quantas rodadas jogar. Cada turno termina quando todos os corações acabam.",
      ready: "ESTOU PRONTO"
    },
    lost: { eyebrow: "RASTREAMENTO INTERROMPIDO", title: "JOGADOR FORA", body: "Volte para frente da câmera para continuar." },
    gameover: { eyebrow: "PARTIDA ENCERRADA", title: "FIM DA PARTIDA", score: "PONTUAÇÃO FINAL", bestCombo: "MELHOR COMBO", playAgain: "JOGAR NOVAMENTE", mainMenu: "MENU PRINCIPAL" },
    round: { eyebrow: "RODADA ENCERRADA", title: "RODADA {{round}}", complete: "RODADA {{round}} ENCERRADA", hint: "Pressione para continuar quando estiverem prontos.", next: "PRÓXIMA RODADA" },
    turn: { eyebrow: "TURNO ENCERRADO", title: "JOGADOR 1", complete: "{{player}} ENCERRADO", hint: "Entregue o espaço ao próximo jogador.", next: "PRÓXIMO JOGADOR" },
    pause: { eyebrow: "PARTIDA PAUSADA", title: "PAUSA", body: "A partida está parada.", resume: "CONTINUAR", mute: "SILENCIAR", unmute: "ATIVAR SOM", mainMenu: "VOLTAR AO MENU" },
    hud: { lives: "CORAÇÕES", score: "PONTUAÇÃO", combo: "COMBO", flow: "FLUXO", roundLevel: "RODADA {{round}}/{{rounds}} · NÍVEL {{level}}", initialRoundLevel: "RODADA 1/1 · NÍVEL 1", player: "JOGADOR {{number}}", playerOne: "JOGADOR 1" },
    runtime: { cameraOnline: "CÂMERA ATIVA", demo: "DEMO DE MOVIMENTO", debug: "DEPURAÇÃO" },
    metrics: { heading: "MÉTRICAS AO VIVO", fps: "FPS", frame: "QUADRO", track: "RASTREAMENTO", infer: "INFERÊNCIA", age: "IDADE", players: "JOGADORES", finger: "EXTENSÃO", bladeLeft: "FIO ESQ.", bladeRight: "FIO DIR.", source: { idle: "INATIVO", simulation: "SIMULAÇÃO", worker: "PROCESSADOR", poseLite: "POSE LEVE", main: "PRINCIPAL" } },
    proximity: { title: "VOCÊ ESTÁ MUITO PERTO", body: "Afaste-se até aproximadamente 1.5–2 m para que seus braços apareçam completos na câmera." },
    calibration: { title: "FIQUE DE FRENTE PARA A CÂMERA", ready: "PRONTO", readyHint: "Mantenha os ombros e os braços dentro do quadro", hint: "Enquadre os ombros e os braços para este turno" },
    board: { hearts: "♥ {{lives}} · x{{combo}}", out: "FORA" },
    levels: { calm: "CALMA", flow: "FLUXO", fury: "FÚRIA", chaos: "CAOS", master: "MESTRE" },
    score: { comboBurst: "+{{gain}} · COMBO x{{combo}}", playerBurst: "{{player}} · +{{gain}} · x{{combo}}", plainBurst: "+{{gain}}" },
    toast: { extraHeart: "CORAÇÃO EXTRA", extraHeartShort: "+1 CORAÇÃO", flowMode: "MODO FLUXO", flowComplete: "MODO FLUXO ENCERRADO", bombHit: "BOMBA · RESTAM {{lives}} {{heartWord}}", debugOn: "DEPURAÇÃO ATIVADA", debugOff: "DEPURAÇÃO DESATIVADA" },
    status: { requestingCamera: "Solicitando acesso à câmera…", loadingTracking: "Carregando rastreamento corporal…", workerUnavailable: "Rastreamento alternativo ativado.", workerInterrupted: "Tentando o rastreamento novamente…", cameraOnline: "CÂMERA ATIVA · RASTREAMENTO PRONTO", cameraPermission: "A permissão da câmera foi bloqueada. Você pode testar a demo de movimento.", cameraUnavailable: "Não foi possível iniciar a câmera. Teste a demo de movimento.", demoReady: "CÂMERA INDISPONÍVEL · DEMO PRONTA" },
    language: { es: "Español", pt: "Português", en: "English" },
    aria: { gameArea: "Área de jogo Body Ninja", settings: "Configuração da partida", finalBoard: "Resultados finais", roundBoard: "Resultados da rodada", turnBoard: "Resultados do turno", playersBoard: "Placar dos jogadores", metrics: "Métricas de desempenho" }
  },
  en: {
    meta: { title: "BODY NINJA | Your body is the blade" },
    common: { heart: "heart", hearts: "hearts" },
    menu: {
      eyebrow: "BODY TRACKING ARCADE",
      tagline: "YOUR BODY IS THE BLADE",
      intro: "Move your arms. The blade starts at the elbow and reaches the tip of your fingers.",
      startCamera: "START WITH CAMERA",
      demo: "TRY MOVEMENT DEMO",
      players: "PLAYERS",
      rounds: "ROUNDS",
      language: "LANGUAGE",
      settingsHint: "Move both arms inside the frame and slice with your forearm.",
      howToPlay: "HOW TO PLAY",
      privacy: "Camera processing happens on this device.",
      distance: "RECOMMENDED DISTANCE · 1.5–2 m · keep your arms and shoulders inside the frame",
      move: "MOVE",
      fast: "FAST"
    },
    help: {
      eyebrow: "QUICK BRIEFING",
      title: "Your body is the weapon.",
      slashTitle: "SLASH",
      slashBody: "Cut by moving your arm with intent. The blade covers elbow to finger.",
      flowTitle: "FLOW",
      flowBody: "Chain fruit without touching bombs to raise your multiplier.",
      bombTitle: "EVASION",
      bombBody: "Bombs punish contact. Use your body, not just your hands.",
      partyTitle: "PARTY MODE",
      partyBody: "Set up to four players taking turns one after another.",
      roundsTitle: "ROUNDS",
      roundsBody: "Choose how many rounds to play. Each turn ends when all hearts are gone.",
      ready: "I'M READY"
    },
    lost: { eyebrow: "TRACKING INTERRUPTED", title: "PLAYER OUT", body: "Step back into frame to continue." },
    gameover: { eyebrow: "RUN COMPLETE", title: "GAME OVER", score: "FINAL SCORE", bestCombo: "BEST COMBO", playAgain: "PLAY AGAIN", mainMenu: "MAIN MENU" },
    round: { eyebrow: "ROUND COMPLETE", title: "ROUND {{round}}", complete: "ROUND {{round}} COMPLETE", hint: "Press to continue when everyone is ready.", next: "NEXT ROUND" },
    turn: { eyebrow: "TURN COMPLETE", title: "PLAYER 1", complete: "{{player}} COMPLETE", hint: "Hand the space to the next player.", next: "NEXT PLAYER" },
    pause: { eyebrow: "GAME PAUSED", title: "PAUSE", body: "The game is paused.", resume: "RESUME", mute: "MUTE", unmute: "TURN SOUND ON", mainMenu: "BACK TO MENU" },
    hud: { lives: "HEARTS", score: "SCORE", combo: "COMBO", flow: "FLOW", roundLevel: "ROUND {{round}}/{{rounds}} · LEVEL {{level}}", initialRoundLevel: "ROUND 1/1 · LEVEL 1", player: "PLAYER {{number}}", playerOne: "PLAYER 1" },
    runtime: { cameraOnline: "CAMERA ONLINE", demo: "MOVEMENT DEMO", debug: "DEBUG" },
    metrics: { heading: "LIVE METRICS", fps: "FPS", frame: "FRAME", track: "TRACK", infer: "INFER", age: "AGE", players: "PLAYERS", finger: "EXTENSION", bladeLeft: "BLADE L", bladeRight: "BLADE R", source: { idle: "IDLE", simulation: "SIMULATION", worker: "WORKER", poseLite: "POSE LITE", main: "MAIN" } },
    proximity: { title: "YOU ARE TOO CLOSE", body: "Step back to about 1.5–2 m so your arms fit fully in the camera." },
    calibration: { title: "FACE THE CAMERA", ready: "READY", readyHint: "Keep your shoulders and arms inside the frame", hint: "Frame your shoulders and arms for this turn" },
    board: { hearts: "♥ {{lives}} · x{{combo}}", out: "OUT" },
    levels: { calm: "CALM", flow: "FLOW", fury: "FURY", chaos: "CHAOS", master: "MASTER" },
    score: { comboBurst: "+{{gain}} · COMBO x{{combo}}", playerBurst: "{{player}} · +{{gain}} · x{{combo}}", plainBurst: "+{{gain}}" },
    toast: { extraHeart: "EXTRA HEART", extraHeartShort: "+1 HEART", flowMode: "FLOW MODE", flowComplete: "FLOW MODE COMPLETE", bombHit: "BOMB · {{lives}} {{heartWord}} LEFT", debugOn: "DEBUG ENABLED", debugOff: "DEBUG DISABLED" },
    status: { requestingCamera: "Requesting camera access…", loadingTracking: "Loading body tracking…", workerUnavailable: "Fallback tracking enabled.", workerInterrupted: "Retrying body tracking…", cameraOnline: "CAMERA ONLINE · TRACKING READY", cameraPermission: "Camera permission was blocked. You can try the movement demo.", cameraUnavailable: "Camera could not start. Try the movement demo.", demoReady: "CAMERA UNAVAILABLE · DEMO READY" },
    language: { es: "Español", pt: "Português", en: "English" },
    aria: { gameArea: "Body Ninja game area", settings: "Game settings", finalBoard: "Final results", roundBoard: "Round results", turnBoard: "Turn results", playersBoard: "Player scoreboard", metrics: "Performance metrics" }
  }
};

function readLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : "es";
  } catch {
    return "es";
  }
}

let currentLanguage = readLanguage();

function getValue(source, key) {
  return key.split(".").reduce((value, part) => value?.[part], source);
}

function interpolate(value, variables) {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? "");
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key, variables = {}) {
  const value = getValue(translations[currentLanguage], key) ?? getValue(translations.en, key) ?? key;
  return typeof value === "string" ? interpolate(value, variables) : key;
}

export function translateDocument(root = document) {
  document.documentElement.lang = currentLanguage;
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = t(element.dataset.i18n);
    const attribute = element.dataset.i18nAttr;
    if (attribute) element.setAttribute(attribute, value);
    else element.textContent = value;
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder)); });
  const title = root.querySelector("title[data-i18n]");
  if (title) document.title = t(title.dataset.i18n);
}

export function setLanguage(language) {
  if (!LANGUAGES.includes(language)) return currentLanguage;
  currentLanguage = language;
  try { localStorage.setItem(STORAGE_KEY, currentLanguage); } catch {}
  translateDocument();
  window.dispatchEvent(new CustomEvent("body-ninja-language-change", { detail: { language: currentLanguage } }));
  return currentLanguage;
}
