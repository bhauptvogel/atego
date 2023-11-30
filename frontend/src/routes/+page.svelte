<script lang="ts">
  import axios from "axios";
  import { goto } from "$app/navigation";
  async function handleNewGame() {
    try {
      if (import.meta.env.VITE_SOCKET_ADRESS == undefined)
        throw new Error("VITE_SOCKET_ADRESS not defined");
      const res = await axios.get(`${import.meta.env.VITE_SOCKET_ADRESS}/game/new`);
      const gameId: string = res.data;
      console.log(`New game created! Id: ${gameId}`);
      goto(`/${gameId}`);
    } catch (e) {
      console.log(e);
    }
  }
</script>

<div class="container">
  <button on:click={handleNewGame}>New Game</button>
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
