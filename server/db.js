const allGames = [];

function pushNewMockPiecesToDB(gameId) {
  if (allGames.find((element) => element.gameId === gameId) !== undefined) {
    console.error(`Mock pieces already exist for game ${gameId}.`);
    return;
  }
  const mockGameInformation = {
    gameId: gameId,
    playerIdYellow: undefined,
    playerIdRed: undefined,
    nPlayersReady: 0,
    turn: "yellow",
    pieces: [],
  };
  allGames.push(mockGameInformation);
}

function getStartingPieces(gameId) {
    const placedPiecesInGame = allGames.find((element) => element.gameId === gameId).pieces;
    if (placedPiecesInGame.length === 16) return placedPiecesInGame;
  
    const startingGamePieces = ["bomb", "spy", "runner", "runner", "miner", "assassin", "killer", "mr_x"];
    const yellowStartingPieces = startingGamePieces.map((piece) => ({ id: piece, position: {}, team: "yellow" }));
    const redStartingPieces = startingGamePieces.map((piece) => ({ id: piece, position: {}, team: "red" }));
    if (placedPiecesInGame.length === 0) return yellowStartingPieces.concat(redStartingPieces);
    else if (placedPiecesInGame.length === 8 && placedPiecesInGame.filter((piece) => (piece.team === "yellow")).length === 8) return placedPiecesInGame.concat(redStartingPieces);
    else if (placedPiecesInGame.length === 8 && placedPiecesInGame.filter((piece) => (piece.team === "red")).length === 8) return placedPiecesInGame.concat(yellowStartingPieces);
    else throw new Error("db: getStartingPieces");
}

function getGamePieces(gameId) {
  return allGames.find((element) => element.gameId === gameId).pieces;
}

function pushGamePieces(gameId, pieces) {
  allGames.find((element) => element.gameId === gameId).pieces = pieces;
}

function addReadyPlayer(gameId) {
  allGames.find((element) => element.gameId === gameId).nPlayersReady += 1;
}

function getReadyPlayers(gameId) {
  return allGames.find((element) => element.gameId === gameId).nPlayersReady;
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
  addReadyPlayer,
  getReadyPlayers,
  getStartingPieces,
  getGamePieces,
  assignTeamToPlayer,
  pushGamePieces,
  getPlayerTurn,
  switchPlayerTurn,
};
