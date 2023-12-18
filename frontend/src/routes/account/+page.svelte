<script lang="ts">
  import { onMount } from "svelte";
  import axios from "axios";
  import Cookies from "js-cookie";

  let username = "";

  function getUserTokenCookie(): string {
    const token = Cookies.get("user");
    if (token === undefined) return "";
    else return token;
  }

  onMount(async function getAccount() {
    const token: string = getUserTokenCookie();
    await axios
      .get(`${import.meta.env.VITE_SOCKET_ADRESS}/account`, {
        headers: {
          token: token,
        },
      })
      .then((res) => {
        username = res.data;
      });
  });
</script>

{#if username !== ""}
  Account of {username}
{:else}
  No account logged in
{/if}
