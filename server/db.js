const allFigures = [];

function pushMockFiguresToDB(gameId) {
  const mockFigures = {
    gameId: gameId,
    figures: [
      { id: "runner", position: { x: 0, y: 0 }, team: "red" },
      { id: "runner", position: { x: 0, y: 4 }, team: "yellow" },
    ],
  };
  allFigures.push(mockFigures);
  console.log(`Mock figures successfully pushed to database for game ${gameId}.`);
}

function getMockFiguresOfGame(gameId) {
  for (const gameFigures of allFigures) {
    if (gameId === gameFigures.gameId) {
      console.log(
        `Mock figures successfully retrieved for game ${gameId}: ${JSON.stringify(gameFigures.figures)}`
      );
      return gameFigures.figures;
    }
  }
  console.error(`No mock figures available for game ${gameId}!`);
  return [];
}

module.exports = {
  pushMockFiguresToDB,
  getMockFiguresOfGame,
};
