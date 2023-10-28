socket = io();
socket.on("clockUpdate", (time) => {
  const playerHero = document.querySelector(".player-hero");
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (time % 60).toString().padStart(2, "0");
  playerHero.querySelector("span:first-child").textContent = `${minutes}:${seconds}`;
});
