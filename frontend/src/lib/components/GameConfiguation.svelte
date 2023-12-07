<script lang="ts">
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  // steps: 10 sec, 20 sec, 30 sec, 40 sec, 50 sec, 1min, 1.5min, 2min, 2.5min, 3min, 3.5min, 4min, 4.5min, 5min, 6min, 7min, 8min, 9min, 10min
  // TODO: infinity step
  let timeSteps = 10;

  $: timeInSeconds =
    timeSteps < 6 ? timeSteps * 10 : timeSteps < 15 ? (timeSteps - 4) * 30 : (timeSteps - 9) * 60;
  $: displayedTime =
    timeSteps == 20
      ? "Unlimited"
      : timeInSeconds < 60
        ? `${timeInSeconds} sec`
        : `${timeInSeconds / 60} min`;

  function startGame(team: string) {
    dispatch("startGame", {
      team: team,
      time: timeSteps == 20 ? "Unlimited" : timeInSeconds,
    });
  }


</script>

<div>
  <div class="modal">
    <div class="content">
      <div class="button-anchor">
        <button class="close-button" on:click={() => dispatch("close")}>&times;</button>
      </div>
      <div class="modal-content">
        <h1>Play with a friend</h1>
        <div><label for="minutesSlider">Time per side:</label> {displayedTime}</div>
        <input
          type="range"
          id="minutesSlider"
          class="slider"
          bind:value={timeSteps}
          min="1"
          max="20"
        />
        <div class="start-buttons">
          <button on:click={() => startGame("yellow")}>
            <img src="/pieces/runner-yellow.png" alt="" />
          </button>
          <button on:click={() => startGame("red")}>
            <img src="/pieces/runner-red.png" alt="" />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .modal {
    position: fixed;
    z-index: 9999;
    max-height: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0;
    width: clamp(300px, 25%, 500px);
  }

  .content {
    border: 0 none;
    border-radius: 0.5rem;
    color: var(--color--primary);
    background-color: var(--color--component-brighter);
  }

  .modal-content {
    padding: 5px 20px;
    display: flex;
    flex-direction: column;
    // justify-content: center;
  }

  h1 {
    font-size: x-large;
  }

  .button-anchor {
    position: relative;
    width: 100%;
    height: 0;
  }

  .close-button {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 111;
    width: 24px;
    height: 24px;
    color: var(--color--primary);
    background: var(--color--component-darker);
    transform: translate(14px, -14px);
    border-radius: 50%;
    border: 1px solid #404040;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;

    font-size: 24px;
    // text-align: center;
    color: var(--color--primary);
    cursor: pointer;

    &:hover,
    &:focus {
      background: var(--color--primary);
      color: var(--color--component-darker);
    }
  }

  .slider {
    margin-top: 0.5rem;
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 25px;
    background: var(--color--component-darker);
    outline: none;
    opacity: 0.7;
    border: 0 none;
    border-radius: 0.5rem;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 35px;
      height: 25px;
      background: var(--color--primary);
      border: 0 none;
      border-radius: 0.5rem;
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 25px;
      height: 25px;
      background: var(--color--primary);
      cursor: pointer;
    }
  }

  .start-buttons {
    margin: 20px 0px;
    gap: 10px;
    display: flex;
    justify-content: space-evenly;
  }

  button {
    background: var(--color--component-darker);
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
    padding: 5px;
    margin: 0;
    width: 128px;
    &:hover {
      opacity: 1;
    }
  }
</style>
