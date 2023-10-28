function updateClock(remainingPlayerTime, heroTeam, currentTurn, gameStarted) {
  if (gameStarted === true) {
    const heroTime =
      heroTeam === "yellow"
        ? remainingPlayerTime.yellowPlayerTime
        : remainingPlayerTime.redPlayerTime;
    const playerHero = document.querySelector(".player-hero");
    const minutesHero = Math.floor(heroTime / 60)
      .toString()
      .padStart(2, "0");
    const secondsHero = (heroTime % 60).toString().padStart(2, "0");
    playerHero.querySelector("span:first-child").textContent = `${minutesHero}:${secondsHero}`;
    const enemyTime =
      heroTeam === "yellow"
        ? remainingPlayerTime.redPlayerTime
        : remainingPlayerTime.yellowPlayerTime;
    const playerEnemy = document.querySelector(".player-enemy");
    const minuesEnemy = Math.floor(enemyTime / 60)
      .toString()
      .padStart(2, "0");
    const secondsEnemy = (enemyTime % 60).toString().padStart(2, "0");
    playerEnemy.querySelector("span:first-child").textContent = `${minuesEnemy}:${secondsEnemy}`;

    if (currentTurn === heroTeam) {
      playerHero.querySelector("span:first-child").style.color = heroTeam;
      playerEnemy.querySelector("span:first-child").style.color = "white";
    } else {
      playerHero.querySelector("span:first-child").style.color = "white";
      playerEnemy.querySelector("span:first-child").style.color = currentTurn;
    }
  }
}
