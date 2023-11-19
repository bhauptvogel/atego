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

<button on:click={handleNewGame}>Create new Game!</button>
