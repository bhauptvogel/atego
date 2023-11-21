<script lang="ts">
  import { page } from "$app/stores";
  import axios from "axios";
  import { onMount } from "svelte";
  import { newGame } from "$lib/game/main";
  import Cookies from "js-cookie";

  function setPlayerIdCookie(playerId: string) {
    Cookies.set("playerId", playerId, { expires: 7 });
  }

  function getPlayerIdFromCookie(): string | undefined {
    return Cookies.get("playerId");
  }

  async function joinGame() {
    const gameId: string = $page.params.gameId;
    const playerUUIDFromCookie: string | undefined = getPlayerIdFromCookie();
    if (playerUUIDFromCookie == undefined) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SOCKET_ADRESS}/${gameId}`);
        const newPlayerUUID: string = response.data;
        setPlayerIdCookie(newPlayerUUID);
        newGame(gameId, newPlayerUUID);
      } catch (e) {
        console.log(e);
      }
    } else {
      newGame(gameId, playerUUIDFromCookie);
    }
  }
  onMount(() => joinGame());
</script>

<div class="game">
  <!-- <div class="game-clock">
    <div class="time player-enemy">
      <span class="timer" />
      <span class="label">{enemyTeam}</span>
    </div>
    <div class="time player-hero">
      <span class="timer" />
      <span class="label">{heroTeam}</span>
    </div>
  </div> -->
  <div id="gameContainer">
    <canvas id="villainCharacterCanvas" width="768" height="96" />
    <canvas id="gameCanvas" width="512" height="640" />
    <canvas id="heroCharacterCanvas" width="768" height="96" />
  </div>
</div>

<style>
  canvas {
    margin-bottom: 40px;
  }

  #gameContainer {
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
  /* .game-clock {
    position: absolute;
    left: calc(50% - 768px / 2 - 150px);
    font-family: Arial, Helvetica, sans-serif;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: rgb(23, 25, 28);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .time {
    padding: 10px 20px;
    margin: 10px 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgb(11, 11, 12);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .timer {
    font-size: 2em;
    color: #fff;
  }

  .label {
    font-size: 1em;
    color: #888;
  } */
</style>
