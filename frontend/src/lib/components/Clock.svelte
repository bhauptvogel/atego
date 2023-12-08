<script lang="ts">
  import type { Socket } from "socket.io-client";
  import { onMount } from "svelte";

  export let socket: Socket;
  export let gameId: string;

  let heroPlayerTime: number = 0; // in seconds
  let enemyPlayerTime: number = 0; // in seconds
  let heroTeam: string = "";
  let clockActive: boolean;

  let turn: string = "";

  socket.on("assignTeam", (assignedTeam: string) => (heroTeam = assignedTeam));
  socket.on("updatePlayerTurn", (updatedTurn: string) => (turn = updatedTurn));
  socket.on("clockUpdate", (playerTime) => {
    clockActive = true;
    heroPlayerTime = heroTeam === "yellow" ? playerTime.yellow : playerTime.red;
    enemyPlayerTime = heroTeam === "yellow" ? playerTime.red : playerTime.yellow;
  });
  socket.on("deactivateClock", () => (clockActive = false));

  $: heroPlayerMinutes = Math.floor(heroPlayerTime / 60);
  $: heroPlayerSeconds = Math.floor(heroPlayerTime % 60)
    .toString()
    .padStart(2, "0");
  $: enemyPlayerMinutes = Math.floor(enemyPlayerTime / 60);
  $: enemyPlayerSeconds = Math.floor(enemyPlayerTime % 60)
    .toString()
    .padStart(2, "0");
  $: heroTeamLabel = heroTeam.charAt(0).toUpperCase() + heroTeam.slice(1);
  $: enemyTeamLabel = heroTeam === "" ? "" : heroTeam == "yellow" ? "Red" : "Yellow";

  $: activeHero = heroTeam == turn ? `active-${turn}` : "";
  $: activeEnemy = heroTeam != turn ? `active-${turn}` : "";

  onMount(() => socket.emit("getPlayerTime", gameId));
</script>

<div class="game-clock">
  <div class="time player-enemy">
    <!-- TODO: Refactor html, css and make invisible until loaded -->
    <span class="timer {activeEnemy} clock-active-{clockActive}">
      {#if clockActive}
        {enemyPlayerMinutes}:{enemyPlayerSeconds}
      {:else}
        Waiting...
      {/if}
    </span>
    <span class="label">{enemyTeamLabel}</span>
  </div>
  <div class="time player-hero">
    <span class="timer {activeHero} clock-active-{clockActive}">
      {#if clockActive}
        {heroPlayerMinutes}:{heroPlayerSeconds}
      {:else}
        Your Turn
      {/if}
    </span>
    <span class="label">{heroTeamLabel}</span>
  </div>
</div>

<style lang="scss">
  .game-clock {
    position: absolute;
    left: calc(50% - 768px / 2 - 160px);
    font-family: Arial, Helvetica, sans-serif;
    padding: 15px;
    border: 0 none;
    border-radius: 0.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color--component);
    // box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  }

  .time {
    padding: 10px 20px;
    margin: 10px 0;
    width: 100%;
    display: flex;
    border: 0 none;
    border-radius: 0.25rem;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color--component-darker);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  }

  .timer {
    color: var(--color--component-darker);
    font-size: 1.4rem;
  }
  .clock-active-true {
    color: var(--color--primary);
    font-size: 1.8rem;
  }

  .label {
    font-size: 0.9rem;
    color: var(--color--unselected);
  }

  .active-yellow {
    color: var(--color--team-yellow);
  }

  .active-red {
    color: var(--color--team-red);
  }
</style>
