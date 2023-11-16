<script lang="ts">
  import axios from "axios";
  import { goto } from "$app/navigation";
  async function handleNewGame() {
    try {
      const res = await axios.get("http://localhost:8000/game/new");
      const gameId: string = res.data;
      console.log(`New game created! Id: ${gameId}`);
      goto(`/${gameId}`);
    } catch (e) {
      console.log(e);
    }
  }
</script>

<button on:click={handleNewGame}>Create new Game!</button>

