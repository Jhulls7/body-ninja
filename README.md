# BODY NINJA

## Español

Body Ninja es un juego arcade de cortes controlado con el cuerpo. Cada brazo se convierte en una espada visual desde el codo hasta la punta del dedo.

### Funciones

1. Modo cámara en tiempo real con uno a cuatro jugadores por turnos.
2. Seguimiento corporal optimizado de hombros, codos y muñecas.
3. Espadas independientes para ambos brazos.
4. Espadas estimadas desde el antebrazo hasta la punta para mantener una respuesta fluida.
5. Rondas configurables sin temporizador.
6. Tres corazones por turno. Un corazón raro puede aparecer como fruta y se obtiene al cortarlo. La puntuación no entrega corazones.
7. Menú de pausa con ESC, continuar, silenciar y volver al menú.
8. Demo sin cámara, frutas, bombas, combos, Flow Mode, sonido y métricas de rendimiento.

### Requisitos

Node.js 20 o superior, un navegador actualizado y una cámara web para el modo cámara. La primera carga necesita conexión a internet para descargar los modelos de visión.

### Ejecutar en local

#### Instalación rápida en Windows

1. Descarga o clona el repositorio.
2. Haz doble clic en `instalar.bat`. El script instala Node.js mediante `winget` si hace falta y prepara las dependencias.
3. Haz doble clic en `iniciar.bat` para abrir el servidor local.

Si `winget` no está disponible, instala Node.js 20 o superior desde [nodejs.org](https://nodejs.org/en/download) y vuelve a ejecutar `instalar.bat`.

#### Instalación manual

```bash
npm install
npm run dev
```

Abre la dirección indicada por Vite, normalmente `http://localhost:5173`. La cámara funciona en `localhost` o mediante HTTPS. No abras `index.html` directamente.

Para probar la compilación de producción:

```bash
npm run build
npm run preview
```

### Cómo jugar

1. Elige el idioma, la cantidad de jugadores y las rondas.
2. Pulsa `INICIAR CON CÁMARA` para comenzar.
3. Mantén hombros y brazos dentro del encuadre.
4. Corta frutas moviendo el brazo con decisión y evita las bombas.
5. Cuando se acaben los corazones, el turno termina. Al completar todos los turnos de una ronda puedes continuar con la siguiente.
6. Pulsa ESC durante la partida para abrir la pausa.

### Rendimiento

El seguimiento se ejecuta en un Worker cuando el navegador lo permite. Las métricas muestran FPS, tiempo de cuadro, frecuencia de seguimiento, inferencia, antigüedad del resultado y longitud del filo.

Pulsa `D` durante una partida para alternar la depuración visual.

### Publicar en GitHub Pages

El proyecto incluye un workflow en `.github/workflows/deploy.yml`.

1. Sube el proyecto a un repositorio.
2. Abre `Settings` y después `Pages` en GitHub.
3. Selecciona `GitHub Actions` como fuente.
4. Publica la rama `main`.

La cámara requiere HTTPS y permiso del navegador en la página publicada.

### Privacidad

El video se procesa en el navegador. El proyecto no usa servidor propio ni guarda el video.

### Licencia

Licencia MIT. Consulta [LICENSE](LICENSE).

## Português

Body Ninja é um jogo arcade de cortes controlado pelo corpo. Cada braço se transforma em uma espada visual do cotovelo até a ponta do dedo.

### Recursos

1. Modo câmera em tempo real com um a quatro jogadores por turnos.
2. Rastreamento corporal otimizado de ombros, cotovelos e pulsos.
3. Espadas independentes para os dois braços.
4. Espadas estimadas do antebraço até a ponta para manter uma resposta fluida.
5. Rodadas configuráveis sem cronômetro.
6. Três corações por turno. Um coração raro pode aparecer como fruta e deve ser cortado para ser obtido. A pontuação não entrega corações.
7. Menu de pausa com ESC, continuar, silenciar e voltar ao menu.
8. Demo sem câmera, frutas, bombas, combos, Flow Mode, som e métricas de desempenho.

### Requisitos

Node.js 20 ou superior, um navegador atualizado e uma câmera para o modo câmera. A primeira carga precisa de conexão com a internet para baixar os modelos de visão.

### Executar localmente

#### Instalação rápida no Windows

1. Baixe ou clone o repositório.
2. Clique duas vezes em `instalar.bat`. O script instala o Node.js pelo `winget` se necessário e prepara as dependências.
3. Clique duas vezes em `iniciar.bat` para abrir o servidor local.

Se o `winget` não estiver disponível, instale o Node.js 20 ou superior pelo [nodejs.org](https://nodejs.org/en/download) e execute `instalar.bat` novamente.

#### Instalação manual

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite, normalmente `http://localhost:5173`. A câmera funciona em `localhost` ou com HTTPS. Não abra `index.html` diretamente.

Para testar a compilação de produção:

```bash
npm run build
npm run preview
```

### Como jogar

1. Escolha o idioma, a quantidade de jogadores e as rodadas.
2. Pressione `INICIAR COM CÂMERA` para começar.
3. Mantenha os ombros e os braços dentro do enquadramento.
4. Corte as frutas movendo o braço com decisão e evite as bombas.
5. Quando os corações acabarem, o turno termina. Depois de todos os turnos da rodada, você pode seguir para a próxima.
6. Pressione ESC durante a partida para abrir a pausa.

### Desempenho

O rastreamento usa um Worker quando o navegador permite. As métricas mostram FPS, tempo do quadro, frequência de rastreamento, inferência, idade do resultado e comprimento do fio.

Pressione `D` durante uma partida para alternar a depuração visual.

### Publicar no GitHub Pages

O projeto inclui um workflow em `.github/workflows/deploy.yml`.

1. Envie o projeto para um repositório.
2. Abra `Settings` e depois `Pages` no GitHub.
3. Selecione `GitHub Actions` como fonte.
4. Publique a branch `main`.

A câmera precisa de HTTPS e da permissão do navegador na página publicada.

### Privacidade

O vídeo é processado no navegador. O projeto não usa servidor próprio nem armazena o vídeo.

### Licença

Licença MIT. Consulte [LICENSE](LICENSE).

## English

Body Ninja is a body controlled arcade slicing game. Each arm becomes a visual sword from the elbow to the fingertip.

### Features

1. Real time camera mode with one to four players taking turns.
2. Optimized body tracking for shoulders, elbows and wrists.
3. Independent swords for both arms.
4. Forearm to fingertip sword estimation for a more responsive game.
5. Configurable rounds with no game timer.
6. Three hearts per turn. A rare heart can appear as fruit and must be sliced to collect it. Score never grants hearts.
7. Pause menu with ESC, resume, mute and return to menu.
8. Camera free demo, fruit, bombs, combos, Flow Mode, sound and performance metrics.

### Requirements

Node.js 20 or newer, an updated browser and a webcam for camera mode. The first load needs an internet connection to download the vision models.

### Run locally

#### Quick Windows setup

1. Download or clone the repository.
2. Double-click `instalar.bat`. The script installs Node.js through `winget` if needed and prepares the dependencies.
3. Double-click `iniciar.bat` to start the local server.

If `winget` is not available, install Node.js 20 or newer from [nodejs.org](https://nodejs.org/en/download) and run `instalar.bat` again.

#### Manual setup

```bash
npm install
npm run dev
```

Open the address shown by Vite, usually `http://localhost:5173`. The camera works on `localhost` or HTTPS. Do not open `index.html` directly.

To test a production build:

```bash
npm run build
npm run preview
```

### How to play

1. Choose the language, number of players and rounds.
2. Press `START WITH CAMERA` to begin.
3. Keep your shoulders and arms inside the frame.
4. Slice fruit with a decisive arm movement and avoid bombs.
5. When the hearts are gone, the turn ends. After all turns in a round, you can continue to the next round.
6. Press ESC during a game to open the pause menu.

### Performance

Tracking runs in a Worker when the browser allows it. The metrics show FPS, frame time, tracking frequency, inference, result age and blade length.

Press `D` during a game to toggle visual debugging.

### Publish on GitHub Pages

The project includes a workflow at `.github/workflows/deploy.yml`.

1. Push the project to a repository.
2. Open `Settings` and then `Pages` on GitHub.
3. Select `GitHub Actions` as the source.
4. Publish the `main` branch.

The camera requires HTTPS and browser permission on the published page.

### Privacy

Video is processed in the browser. The project does not use its own server or store video.

### License

MIT License. See [LICENSE](LICENSE).
