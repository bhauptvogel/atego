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
  const piecesInGame = allGames.find((element) => element.gameId === gameId).pieces;
  const pieceOrder = ["bomb", "spy", "runner", "runner", "miner", "assassin", "killer", "mr_x"];
  const yellowPieces = pieceOrder.map((piece) => ({ id: piece, position: {}, team: "yellow" }));
  const redPieces = pieceOrder.map((piece) => ({ id: piece, position: {}, team: "red" }));
  if (piecesInGame.length === 0) return yellowPieces.concat(redPieces);
  else if (piecesInGame.length === 16) return piecesInGame;
  else if (piecesInGame.length === 8 && piecesInGame[0].team === "yellow") return piecesInGame.concat(redPieces);
  else if (piecesInGame.length === 8 && piecesInGame[0].team === "red") return piecesInGame.concat(yellowPieces);
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
