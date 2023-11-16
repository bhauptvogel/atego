<script lang="ts">
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { startGame } from "$lib/game";
  
  onMount(() => startGame($page.params.gameId))
</script>

<div id="gameContainer">
  <canvas id="villainCharacterCanvas" width="768" height="96" />
  <canvas id="gameCanvas" width="512" height="640" />
  <canvas id="heroCharacterCanvas" width="768" height="96" />
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
</style>
