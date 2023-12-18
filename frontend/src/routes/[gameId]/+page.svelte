<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { buildGame } from "$lib/game/main";
  import Cookies from "js-cookie";
  import io, { Socket } from "socket.io-client";
  import { tick } from "svelte";
  import Clock from "$lib/components/Clock.svelte";

  enum GameStatus {
    gameDoesNotExist,
    gameHasNoOpponent,
    gameIsAlreadyFull,
    gameHasStarted,
    loading,
  }
  let status: GameStatus = GameStatus.loading;
  let socket: Socket;

  function setUserTokenCookie(playerId: string): void {
    Cookies.set("user", playerId, { expires: 7 });
  }

  function getUserTokenCookie(): string | undefined {
    return Cookies.get("user");
  }

  async function renderGame(pageId: string) {
    status = GameStatus.gameHasStarted;
    const playerId = getUserTokenCookie();
    if (playerId != undefined) await tick().then(() => buildGame(pageId, playerId, socket));
    else throw new Error("PlayerId is undefined");
  }

  function main() {
    const gameId: string = $page.params.gameId;

    if (import.meta.env.VITE_SOCKET_ADRESS == undefined)
      throw new Error("VITE_SOCKET_ADRESS not defined");
    socket = io(import.meta.env.VITE_SOCKET_ADRESS);
    // socket.on("connect", () => console.log(`Successfully connected to the server!`));

    socket.emit("joinGame", gameId, getUserTokenCookie());

    socket.on("guestPlayerId", (playerId) => setUserTokenCookie(playerId));
    socket.on("gameDoesNotExist", () => (status = GameStatus.gameDoesNotExist));
    socket.on("gameIsFull", () => (status = GameStatus.gameIsAlreadyFull));
    socket.on("waitingForOpponent", () => (status = GameStatus.gameHasNoOpponent));
    socket.on("buildGame", () => renderGame(gameId));
  }

  let iconCopy = "fa-link";
  function copyLinkToClipBoard() {
    navigator.clipboard.writeText($page.url.href);
    iconCopy = "fa-check";
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
        <button on:click={() => copyLinkToClipBoard()}><i class="fas {iconCopy}"></i></button>
      </div>
      The first person to come to this URL will play with you.
    </div>
  </div>
{:else if status == GameStatus.gameHasStarted}
  <div class="game-content">
    <Clock {socket} gameId={$page.params.gameId} />

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
    background-color: var(--color--component-brighter);
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
    background-color: var(--color--component);
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

  .game-content {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .fas {
    width: 24px;
  }

  //   .game {
  //     display: flex;
  //     justify-content: center;
  //     align-items: center;
  //   }
</style>
