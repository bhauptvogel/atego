<script lang="ts">
  import "$lib/scss/global.scss";
  import "@fortawesome/fontawesome-free/css/all.min.css";
</script>

<div class="application">
  <header>
    <a class="home" href="/">Atego</a>
    <!-- <a class="account" href="/login"><i class="fas fa-fw fa-user"></i></a> -->
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
    a {
      color: var(--color--unselected);
      text-decoration: none;
      font-size: 20px;
      &:hover {
        color: var(--color--primary);
      }
    }
    .home {
      align-self: flex-start;
    }
    .account {
      align-self: flex-end;
    }
  }

  main {
    height: 100%;
  }
</style>
