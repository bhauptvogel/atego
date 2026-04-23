import axios from "axios";
import Cookies from "js-cookie";
import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { register, navigate } from "./router";

enum ServerStatus {
  checking,
  ready,
  error,
}

// --- Utilities ---
function getBackendUrl(): string {
  const url = import.meta.env.VITE_SOCKET_ADRESS;
  if (!url) throw new Error("VITE_SOCKET_ADRESS not defined");
  return url;
}

function setPlayerIdCookie(playerId: string): void {
  Cookies.set("playerId", playerId, { expires: 7 });
}

function getPlayerIdFromCookie(): string | undefined {
  return Cookies.get("playerId");
}

// --- Landing Page ---
function renderLandingPage(container: HTMLElement) {
  let showModal = false;
  let timeSteps = 10;

  function getDisplayTime() {
    if (timeSteps === 20) return "Unlimited";
    const secs =
      timeSteps < 6 ? timeSteps * 10 : timeSteps < 15 ? (timeSteps - 4) * 30 : (timeSteps - 9) * 60;
    return secs < 60 ? `${secs} sec` : `${secs / 60} min`;
  }

  function updateMainButton(status: ServerStatus) {
    if (status === ServerStatus.checking) {
      container.innerHTML = `
        <div class="container loading-container">
          <div class="spinner"></div>
          <p>Waiting on server to boot...</p>
        </div>
      `;
    } else if (status === ServerStatus.error) {
      container.innerHTML = `
        <div class="container error-container">
          <p>Could not connect to server. Please try again later.</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="landing-container">
          <button id="newGameBtn">New Game</button>
        </div>
        <div id="modal-root"></div>
      `;
      document.getElementById("newGameBtn")?.addEventListener("click", () => {
        showModal = true;
        renderModal();
      });
    }
  }

  function toggleLandingContainer(visible: boolean) {
    const landing = document.querySelector(".landing-container") as HTMLElement | null;
    if (landing) landing.style.display = visible ? "flex" : "none";
  }

  function renderModal() {
    const root = document.getElementById("modal-root");
    if (!root) return;
    if (!showModal) {
      root.innerHTML = "";
      toggleLandingContainer(true);
      return;
    }
    toggleLandingContainer(false);

    root.innerHTML = `
      <div class="modal-overlay">
        <div class="modal">
          <div class="content">
            <div class="button-anchor">
              <button class="close-button" id="closeModal">×</button>
            </div>
            <div class="modal-content">
              <h1>Play with a friend</h1>
              <div>
                <label for="minutesSlider">Time per side:</label>
                <span id="timeDisplay">${getDisplayTime()}</span>
              </div>
              <input
                type="range"
                id="minutesSlider"
                class="slider"
                min="1"
                max="20"
                value="10"
              />
              <div class="start-buttons">
                <button id="startYellow"><img src="/pieces/runner-yellow.png" alt="Yellow" /></button>
                <button id="startRed"><img src="/pieces/runner-red.png" alt="Red" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("closeModal")?.addEventListener("click", () => {
      showModal = false;
      renderModal();
    });

    const slider = document.getElementById("minutesSlider") as HTMLInputElement;
    const timeDisplay = document.getElementById("timeDisplay");

    if (slider) slider.value = String(timeSteps);

    slider?.addEventListener("input", (e) => {
      timeSteps = parseInt((e.target as HTMLInputElement).value);
      if (timeDisplay) timeDisplay.textContent = getDisplayTime();
    });

    if (timeDisplay) timeDisplay.textContent = getDisplayTime();

    document.getElementById("startYellow")?.addEventListener("click", () => startGame("yellow"));
    document.getElementById("startRed")?.addEventListener("click", () => startGame("red"));
  }

  async function startGame(team: string) {
    try {
      const timeVal = timeSteps === 20 ? "Unlimited" : String(getSeconds(timeSteps));
      const res = await axios.get(`${getBackendUrl()}/game/new`, {
        params: { team, time: timeVal },
      });
      navigate(`/${res.data}`);
    } catch (e) {
      console.error("Failed to create game:", e);
    }
  }

  function getSeconds(steps: number): number {
    return steps < 6 ? steps * 10 : steps < 15 ? (steps - 4) * 30 : (steps - 9) * 60;
  }

  async function checkServerStatus() {
    try {
      await axios.get(`${getBackendUrl()}/`);
      updateMainButton(ServerStatus.ready);
    } catch (e) {
      setTimeout(() => checkServerStatus(), 2000);
    }
  }

  updateMainButton(ServerStatus.checking);
  checkServerStatus();
}

// --- Game Room Page ---
enum GameStatus {
  gameDoesNotExist,
  gameHasNoOpponent,
  gameIsAlreadyFull,
  gameHasStarted,
  loading,
}

async function renderGameRoom(container: HTMLElement, params?: Record<string, string>) {
  let status: GameStatus = GameStatus.loading;
  let socket: Socket;
  const gameId = params?.gameId || "";

  const show = (st: GameStatus) => {
    status = st;
    let html = "";
    if (st === GameStatus.gameDoesNotExist) {
      html = `
        <div class="challenge-container">
          <h1>404</h1>
          Game not found!
        </div>
      `;
    } else if (st === GameStatus.gameIsAlreadyFull) {
      html = `
        <div class="challenge-container">
          <h1>Too late!</h1>
          Game is already full!
        </div>
      `;
    } else if (st === GameStatus.gameHasNoOpponent) {
      html = `
        <div class="challenge-container">
          <h1>Challenge to a game</h1>
          <div class="invite-container">
            To invite someone to play, give this URL:
            <div class="link-container">
              <input readonly type="url" value="${window.location.href}" />
              <button id="copyLink"><i class="fas fa-link"></i></button>
            </div>
            The first person to come to this URL will play with you.
          </div>
        </div>
      `;
    } else if (st === GameStatus.gameHasStarted) {
      html = `
        <div class="game-content">
          <div class="game-clock" id="gameClock">
            <div class="time player-enemy">
              <span class="timer" id="enemyTimer">Waiting...</span>
              <span class="label" id="enemyLabel">Enemy</span>
            </div>
            <div class="time player-hero">
              <span class="timer" id="heroTimer">Your Turn</span>
              <span class="label" id="heroLabel">You</span>
            </div>
          </div>
          <div class="game-container">
            <canvas id="villainCharacterCanvas" width="768" height="96"></canvas>
            <canvas id="gameCanvas" width="512" height="640"></canvas>
            <canvas id="heroCharacterCanvas" width="768" height="96"></canvas>
          </div>
        </div>
      `;
    }
    container.innerHTML = html;

    if (st === GameStatus.gameHasNoOpponent) {
      document.getElementById("copyLink")?.addEventListener("click", () => {
        navigator.clipboard.writeText(window.location.href);
        const btn = document.getElementById("copyLink")?.querySelector("i");
        if (btn) {
          btn.className = "fas fa-check";
          setTimeout(() => (btn.className = "fas fa-link"), 2000);
        }
      });
    }
  };

  show(GameStatus.loading);

  try {
    const res = await axios.get(`${getBackendUrl()}/${gameId}`, {
      headers: {
        playerId: getPlayerIdFromCookie(),
      },
    });

    if (res.data.gameExists === false) {
      show(GameStatus.gameDoesNotExist);
      return;
    }

    if (getPlayerIdFromCookie() === undefined) setPlayerIdCookie(res.data.playerUUID);

    const playerId = getPlayerIdFromCookie();
    if (!playerId) throw new Error("PlayerId is undefined");

    socket = io(getBackendUrl());
    socket.on("connect", () => console.log("Successfully connected to the server!"));

    let clockActive = true;
    let heroTeam = "";
    let currentTurn = "";
    let heroTime = 0;
    let enemyTime = 0;

    socket.on("assignTeam", (assignedTeam: string) => {
      heroTeam = assignedTeam;
      updateClockLabels();
    });
    socket.on("updatePlayerTurn", (updatedTurn: string) => {
      currentTurn = updatedTurn;
      updateClockLabels();
    });
    socket.on("clockUpdate", (playerTime: { yellow: number; red: number }) => {
      heroTime = heroTeam === "yellow" ? playerTime.yellow : playerTime.red;
      enemyTime = heroTeam === "yellow" ? playerTime.red : playerTime.yellow;
      updateClockLabels();
    });
    socket.on("deactivateClock", () => {
      clockActive = false;
      updateClockLabels();
    });

    function formatTime(seconds: number): string {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function updateClockLabels() {
      const heroTimer = document.getElementById("heroTimer");
      const enemyTimer = document.getElementById("enemyTimer");
      const heroLabel = document.getElementById("heroLabel");
      const enemyLabel = document.getElementById("enemyLabel");
      if (!heroTimer || !enemyTimer) return;

      if (!clockActive) {
        heroTimer.textContent = "Your Turn";
        enemyTimer.textContent = "Waiting...";
        heroTimer.classList.add("clock-false");
        enemyTimer.classList.add("clock-false");
      } else {
        heroTimer.classList.remove("clock-false", "active-yellow", "active-red");
        enemyTimer.classList.remove("clock-false", "active-yellow", "active-red");
        heroTimer.textContent = formatTime(heroTime);
        enemyTimer.textContent = formatTime(enemyTime);
        if (currentTurn === heroTeam) {
          heroTimer.classList.add(`active-${currentTurn}`);
          enemyTimer.classList.remove(`active-${currentTurn}`);
        } else {
          enemyTimer.classList.add(`active-${currentTurn}`);
          heroTimer.classList.remove(`active-${currentTurn}`);
        }
      }

      if (heroLabel) heroLabel.textContent = heroTeam ? heroTeam.charAt(0).toUpperCase() + heroTeam.slice(1) : "You";
      if (enemyLabel) enemyLabel.textContent = heroTeam ? (heroTeam === "yellow" ? "Red" : "Yellow") : "Enemy";
    }

    async function renderGame() {
      show(GameStatus.gameHasStarted);
      socket.emit("getPlayerTime", gameId);
      const { buildGame } = await import("./game/main");
      buildGame(gameId, playerId!, socket);
    }

    if (res.data.playersInGame === 0) {
      show(GameStatus.gameHasNoOpponent);
      socket.emit("joinGame", gameId, res.data.playerUUID);
      socket.on("buildGame", () => renderGame());
    } else if (res.data.playersInGame === 1) {
      socket.emit("joinGame", gameId, res.data.playerUUID);
      renderGame();
    } else if (res.data.playersInGame === 2) {
      if (res.data.playerIdInGame == true) {
        socket.emit("rejoinGame", gameId, res.data.playerUUID);
        renderGame();
      } else {
        show(GameStatus.gameIsAlreadyFull);
      }
    }
  } catch (e) {
    console.error("Game room error:", e);
    show(GameStatus.gameDoesNotExist);
  }
}

// --- Placeholder Pages ---
function renderLogin(container: HTMLElement) {
  container.innerHTML = `
    <div class="container">
      <h1>Login & Account</h1>
      <p>I am working on it :)</p>
    </div>
  `;
}

function renderUserProfile(container: HTMLElement, params?: Record<string, string>) {
  container.innerHTML = `
    <div class="container">
      <h1>User Profile</h1>
      <p>User ID: ${params?.userId || "unknown"}</p>
      <p>Coming soon...</p>
    </div>
  `;
}

// --- Register Routes ---
export function initPages() {
  register("/", async () => {
    const main = document.getElementById("main")!;
    renderLandingPage(main);
  });

  register("game", async (params) => {
    const main = document.getElementById("main")!;
    await renderGameRoom(main, params);
  });

  register("login", async () => {
    const main = document.getElementById("main")!;
    renderLogin(main);
  });

  register("user", async (params) => {
    const main = document.getElementById("main")!;
    renderUserProfile(main, params);
  });
}
