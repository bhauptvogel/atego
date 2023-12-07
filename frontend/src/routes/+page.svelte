<script lang="ts">
  import axios from "axios";
  import { goto } from "$app/navigation";
  import GameConfiguation from "$lib/components/GameConfiguation.svelte";
  import { onMount } from "svelte";

  let showGameConfiguation: boolean = false;

  async function handleNewGame(event: CustomEvent<{ team: string; time: number }>) {
    try {
      if (import.meta.env.VITE_SOCKET_ADRESS == undefined)
        throw new Error("VITE_SOCKET_ADRESS not defined");
      const res = await axios.get(`${import.meta.env.VITE_SOCKET_ADRESS}/game/new`, {
        params: event.detail,
      });
      goto(`/${res.data}`);
    } catch (e) {
      console.log(e);
    }
  }
</script>

{#if showGameConfiguation}
  <GameConfiguation on:startGame={handleNewGame} on:close={() => (showGameConfiguation = false)} />
{/if}

<div class="container">
  <button on:click={() => (showGameConfiguation = true)}>New Game</button>
</div>

<style lang="scss">
  button {
    padding: 0.7rem 6rem 0.7rem 6rem;
  }
  .container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
