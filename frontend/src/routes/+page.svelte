<script lang="ts">
  export const prerender = true;

  import axios from "axios";
  import { goto } from "$app/navigation";
  import GameConfiguation from "$lib/components/GameConfiguation.svelte";
  import { onMount } from "svelte";

  enum ServerStatus {
    checking,
    ready,
    error,
  }

  let showGameConfiguation: boolean = false;
  let serverStatus: ServerStatus = ServerStatus.checking;

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

  async function checkServerStatus() {
    try {
      if (import.meta.env.VITE_SOCKET_ADRESS == undefined) {
        serverStatus = ServerStatus.error;
        return;
      }
      await axios.get(`${import.meta.env.VITE_SOCKET_ADRESS}/`);
      serverStatus = ServerStatus.ready;
    } catch (e) {
      // Keep checking every 2 seconds until server is available
      setTimeout(() => {
        checkServerStatus();
      }, 2000);
    }
  }

  onMount(() => {
    checkServerStatus();
  });
</script>

{#if showGameConfiguation}
  <GameConfiguation on:startGame={handleNewGame} on:close={() => (showGameConfiguation = false)} />
{/if}

<div class="container">
  {#if serverStatus === ServerStatus.checking}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Waiting on server to boot...</p>
    </div>
  {:else if serverStatus === ServerStatus.error}
    <div class="error-container">
      <p>Could not connect to server. Please try again later.</p>
    </div>
  {:else}
    <button on:click={() => (showGameConfiguation = true)}>New Game</button>
  {/if}
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

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    color: var(--color--primary);

    p {
      font-size: 1.2rem;
      margin: 0;
    }
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--color--component-brighter);
    border-top: 4px solid var(--color--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error-container {
    color: #ff6b6b;
    font-size: 1.2rem;
    text-align: center;
    padding: 1rem;
  }
</style>
