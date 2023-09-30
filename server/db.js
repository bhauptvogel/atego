const allPieces = [];

function pushNewMockPiecesToDB(gameId) {
  if (allPieces.find((element) => element.gameId === gameId) !== undefined) {
    console.error(`Mock pieces already exist for game ${gameId}.`);
    return;
  }
  const mockStartingPieces = {
    gameId: gameId,
    pieces: [
      { id: "runner", position: { x: 0, y: 0 }, team: "red" },
      { id: "runner", position: { x: 0, y: 4 }, team: "yellow" },
    ],
  };
  allPieces.push(mockStartingPieces);
}

function getMockPiecesOfGame(gameId) {
  return allPieces.find((element) => element.gameId === gameId).pieces;
}

function pushMockPiecesOfGame(gameId, pieces) {
  allPieces.find((element) => element.gameId === gameId).pieces = pieces;
}

module.exports = {
  pushNewMockPiecesToDB,
  getMockPiecesOfGame,
  pushMockPiecesOfGame
};
