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
    turn: "yellow",
    pieces: [],
  };
  allGames.push(mockStartingGames);
}

function getStartingPieces() {
  return [
    { id: "bomb", position: {}, team: "red" },
    { id: "bomb", position: {}, team: "yellow" },
    { id: "spy", position: {}, team: "red" },
    { id: "spy", position: {}, team: "yellow" },
    { id: "runner", position: {}, team: "red" },
    { id: "runner", position: {}, team: "yellow" },
    { id: "runner", position: {}, team: "red" },
    { id: "runner", position: {}, team: "yellow" },
    { id: "miner", position: {}, team: "red" },
    { id: "miner", position: {}, team: "yellow" },
    { id: "assassin", position: {}, team: "red" },
    { id: "assassin", position: {}, team: "yellow" },
    { id: "killer", position: {}, team: "red" },
    { id: "killer", position: {}, team: "yellow" },
    { id: "mr_x", position: {}, team: "red" },
    { id: "mr_x", position: {}, team: "yellow" },
  ];
}

function getGamePieces(gameId) {
  return allGames.find((element) => element.gameId === gameId).pieces;
}

function pushGamePieces(gameId, pieces) {
  allGames.find((element) => element.gameId === gameId).pieces = pieces;
}

function switchPlayerTurn(gameId) {
  const oldTurn = allGames.find((element) => element.gameId === gameId).turn;
  allGames.find((element) => element.gameId === gameId).turn =
    oldTurn === "yellow" ? "red" : "yellow";
}

function getPlayerTurn(gameId) {
  return allGames.find((element) => element.gameId === gameId).turn;
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
  getStartingPieces,
  getGamePieces,
  assignTeamToPlayer,
  pushGamePieces,
  getPlayerTurn,
  switchPlayerTurn,
};
