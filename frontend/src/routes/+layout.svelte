<script lang="ts">
  import "$lib/scss/global.scss";
  import "@fortawesome/fontawesome-free/css/all.min.css";
</script>

<div class="application">
  <header>
    <a class="logo" href="/">ATEGO</a>
    <!-- <a class="account icon" href="/login"><i class="fas fa-fw fa-user"></i></a> -->
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
      align-self: flex-end;
    }
  }

  main {
    height: 100%;
  }
</style>
