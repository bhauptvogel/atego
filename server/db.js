const allGames = [];

function pushNewMockPiecesToDB(gameId) {
  if (allGames.find((element) => element.gameId === gameId) !== undefined) {
    console.error(`Mock pieces already exist for game ${gameId}.`);
    return;
  }
  const mockStartingGames = {
    gameId: gameId,
    playerIdYellow: undefined,
    playerIdRed: undefined,
    pieces: [
      { id: "runner", position: { x: 0, y: 0 }, team: "red" },
      { id: "spy", position: { x: 1, y: 0 }, team: "red" },
      { id: "runner", position: { x: 0, y: 4 }, team: "yellow" },
    ],
  };
  allGames.push(mockStartingGames);
}

function getMockPiecesOfGame(gameId) {
  return allGames.find((element) => element.gameId === gameId).pieces;
}

function pushMockPiecesOfGame(gameId, pieces) {
  allGames.find((element) => element.gameId === gameId).pieces = pieces;
}

function assignTeamToPlayer(gameId, userId) {
  const game = allGames.find((element) => element.gameId === gameId);
  if (game.playerIdYellow === undefined) {
    allGames.find((element) => element.gameId === gameId).playerIdYellow = userId;
    return "yellow";
  } else if (game.playerIdRed === undefined) {
    allGames.find((element) => element.gameId === gameId).playerIdRed = userId;
    return "red";
  } else {
    return ""; // both teams are already assigned!
  }
}

module.exports = {
  pushNewMockPiecesToDB,
  getMockPiecesOfGame,
  assignTeamToPlayer,
  pushMockPiecesOfGame,
};
