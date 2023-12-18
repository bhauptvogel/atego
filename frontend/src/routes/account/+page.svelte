<script lang="ts">
  import { onMount } from "svelte";
  import type { PageData } from "./$types";
  export let data: PageData;

  let username = "";

  onMount(() => {
    if ("data" in data) username = String(data.data);
  });
</script>

{#if username !== ""}
  Account of {username}
{:else}
  No account logged in
{/if}
