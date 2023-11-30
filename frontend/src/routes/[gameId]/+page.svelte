<script lang="ts">
  import { page } from "$app/stores";
  import axios from "axios";
  import { onMount } from "svelte";
  import { buildGame } from "$lib/game/main";
  import Cookies from "js-cookie";
  import io, { Socket } from "socket.io-client";
  import { tick } from "svelte";

  enum GameStatus {
    gameDoesNotExist,
    gameHasNoOpponent,
    gameIsAlreadyFull,
    gameHasStarted,
    loading,
  }

  let status: GameStatus = GameStatus.loading;

  function setPlayerIdCookie(playerId: string): void {
    Cookies.set("playerId", playerId, { expires: 7 });
  }

  function getPlayerIdFromCookie(): string | undefined {
    return Cookies.get("playerId");
  }

  async function renderGame(pageId: string, socket: Socket) {
    status = GameStatus.gameHasStarted;
    const playerId = getPlayerIdFromCookie();
    if (playerId != undefined) await tick().then(() => buildGame(pageId, playerId, socket));
    else throw new Error("PlayerId is undefined");
  }

  async function renderGameNewSocket(pageId: string) {}

  async function main() {
    const gameId: string = $page.params.gameId;
    await axios
      .get(`${import.meta.env.VITE_SOCKET_ADRESS}/${gameId}`, {
        headers: {
          playerId: getPlayerIdFromCookie(),
        },
      })
      .then((res) => {
        if (res.data.gameExists === false) {
          status = GameStatus.gameDoesNotExist;
        } else {
          if (getPlayerIdFromCookie() === undefined) setPlayerIdCookie(res.data.playerUUID);
          if (import.meta.env.VITE_SOCKET_ADRESS == undefined)
            throw new Error("VITE_SOCKET_ADRESS not defined");
          const socket: Socket = io(import.meta.env.VITE_SOCKET_ADRESS);
          socket.on("connect", () => console.log(`Successfully connected to the server!`));

          if (res.data.playersInGame === 0) {
            status = GameStatus.gameHasNoOpponent;
            socket.emit("joinGame", gameId, res.data.playerUUID);
            socket.on("buildGame", () => renderGame(gameId, socket));
          } else if (res.data.playersInGame === 1) {
            socket.emit("joinGame", gameId, res.data.playerUUID);
            renderGame(gameId, socket);
          } else if (res.data.playersInGame === 2) {
            if (res.data.playerIdInGame == true) {
              socket.emit("rejoinGame", gameId, res.data.playerUUID);
              renderGame(gameId, socket);
            } else {
              status = GameStatus.gameIsAlreadyFull;
            }
          }
        }
      });
  }

  onMount(() => main());
</script>

{#if status == GameStatus.gameDoesNotExist}
  <div class="challenge-container">
    <h1>404</h1>
    Game not found!
  </div>
{:else if status == GameStatus.gameIsAlreadyFull}
  <div class="challenge-container">
    <h1>Too late!</h1>
    Game is already full!
  </div>
{:else if status == GameStatus.gameHasNoOpponent}
  <div class="challenge-container">
    <h1>Challenge to a game</h1>
    <div class="invite-container">
      To invite someone to play, give this URL:
      <div class="link-container">
        <input readonly type="url" value={$page.url.href} />
        <button on:click={() => navigator.clipboard.writeText($page.url.href)}
          ><i class="fas fa-link"></i></button
        >
      </div>
      The first person to come to this URL will play with you.
    </div>
  </div>
{:else if status == GameStatus.gameHasStarted}
  <div class="game">
    <div class="game-container">
      <canvas id="villainCharacterCanvas" width="768" height="96" />
      <canvas id="gameCanvas" width="512" height="640" />
      <canvas id="heroCharacterCanvas" width="768" height="96" />
    </div>
  </div>
{/if}

<!-- TODO: Render Loading icon (on else) -->

<style lang="scss">
  @import "$lib/scss/_mixins.scss";
  .challenge-container {
    @include container;
    padding: 1rem 4rem 4rem 4rem;
    margin: 0 15%;
    color: var(--color--primary);
    h1 {
      font-weight: 400;
    }
  }

  .invite-container {
    padding: 20px 20px;
    background-color: var(--color--component-background-2);
    border: 0 none;
    border-radius: 0.25rem;
    //   border-color: var(--color--unselected);
  }

  .link-container {
    padding: 1rem 0rem;
    display: flex;
  }

  input {
    font-size: large;
    padding: 0.5rem;
    background-color: var(--color--component-background);
    color: var(--color--primary);
    border: 1px solid;
    border-radius: 0.25rem;
    border-color: var(--color--unselected);
    width: 100%;
    outline: none;
  }

  button {
    padding: 0.8rem;
    border: 1px solid;
    border-radius: 0.25rem;
    border-color: var(--color--unselected);
  }

  canvas {
    margin-bottom: 40px;
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .game {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
