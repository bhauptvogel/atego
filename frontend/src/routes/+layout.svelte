<script lang="ts">
  import "$lib/scss/global.scss";
  import "@fortawesome/fontawesome-free/css/all.min.css";
  import type { LayoutData } from "./$types";

  export let data: LayoutData;

  $: username =
    "username" in data && data.username != null ? data.username : "";
  $: accountRef =
    "username" in data && data.username != null ? "/account" : "/login";
  $: icon = "username" in data && data.username != null ? "solid" : "regular";
</script>

<div class="application">
  <header>
    <a class="logo" href="/">ATEGO</a>
    <a class="account icon" href={accountRef}>
      <i class="fa-{icon} fa-fw fa-user"></i>
      <div class="username">{username}</div>
    </a>
  </header>

  <main>
    <slot />
  </main>
</div>

<style global lang="scss">
  .application {
    display: flex;
    flex-direction: column;
    justify-content: start;
    height: 100%;
  }
  header {
    justify-content: space-between;
    display: flex;
    padding: 1.5rem;
    .icon {
      color: var(--color--unselected);
      text-decoration: none;
      font-size: 20px;
      &:hover {
        color: var(--color--primary);
      }
    }
    .logo {
      align-self: flex-start;
      text-decoration: none;
      font-family: "Forma";
      letter-spacing: 0.1rem;
      color: var(--color--atego-black);
      font-size: 1.6rem;

      &:hover {
        text-shadow: 0 0 0.4rem var(--color--primary);
      }
    }
    .account {
      display: flex;
      align-self: flex-end;
      font-size: 1.2rem;
    }
  }

  .username {
    padding-left: 5px;
  }

  main {
    height: 100%;
  }
</style>
