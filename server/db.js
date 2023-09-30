const allFigures = [];

function pushMockFiguresToDB(gameId) {
  if (allFigures.find((element) => element.gameId === gameId) !== undefined) {
    
      console.log(`Mock figures already exist for game ${gameId}.`);
    return;
  }
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
  if (allFigures.length === 0) return [];
  const figures = allFigures.find((element) => element.gameId === gameId).figures;
  if (figures === undefined) {
    console.error(`No mock figures available for game ${gameId}!`);
  } else {
    console.log(`Mock figures successfully retrieved for game ${gameId}: ${JSON.stringify(figures)}`);
  }
  return figures;
}

function moveMockFigure(gameId, move) {
  const figures = allFigures.find((element) => element.gameId == gameId).figures;

  for (const figure of figures) {
    if (figure.position.x == move.from.x && figure.position.y == move.from.y) {
      // TODO: Move Validation
      figure.position = move.to;
      return;
    }
  }
  throw new Error("No figure was moved!");
}

module.exports = {
  pushMockFiguresToDB,
  getMockFiguresOfGame,
  moveMockFigure,
};
