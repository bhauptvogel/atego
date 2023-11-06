<script lang="ts">
  import Board from "$lib/Board.svelte";
  import { page } from "$app/stores";
  import io from "socket.io-client";

  const socket = io("http://localhost:8000/");
  socket.on("connect", () => {
    console.log(`Successfully connected to the server!`);
  });
</script>

<Board />
