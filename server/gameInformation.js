const allGames = [];

function newGame(gameId) {
  if (allGames.find((element) => element.gameId === gameId) !== undefined) {
    throw new Error(`newGame: Game with gameid ${gameId} already exists!`);
  }
  const newGameObject = {
    gameId: gameId,
    yellowPlayerId: null,
    redPlayerId: null,
    yellowPlayerReady: false,
    redPlayerReady: false,
    yellowPlayerTime: 60,
    redPlayerTime: 60,
    turn: "yellow",
    pieces: [],
    gameOver: false,
    // Idea: history
  };
  allGames.push(newGameObject);
}
function gameIdExists(gameId) {
  return allGames.find((element) => element.gameId === gameId) !== undefined;
}

function getGameById(gameId) {
  const game = allGames.find((element) => element.gameId === gameId);
  if (game === undefined) throw new Error(`Game with GameId ${gameId} does not exist!`);
  return game;
}

function pushPieces(gameId, pieces) {
  return (getGameById(gameId).pieces = pieces);
}

function getPieces(gameId) {
  return getGameById(gameId).pieces;
}

function playerReady(gameId, playerId) {
  const game = getGameById(gameId);
  if (playerId === game.yellowPlayerId) game.yellowPlayerReady = true;
  else if (playerId === game.redPlayerId) game.redPlayerReady = true;
  else throw new Error(`Player ${player} is not assigned to a team!`);
}

function getNPlayersReady(gameId) {
  let count = 0;
  const game = getGameById(gameId);
  if (game.yellowPlayerReady) count++;
  if (game.redPlayerReady) count++;
  return count;
}

function isGameFull(gameId) {
  const game = getGameById(gameId);
  if (game.yellowPlayerId === null || game.redPlayerId === null) return false;
  return true;
}

function switchPlayerTurn(gameId) {
  const game = getGameById(gameId);
  game.turn = game.turn === "yellow" ? "red" : "yellow";
}

function getPlayerTurn(gameId) {
  return getGameById(gameId).turn;
}

function assignPlayerToTeam(gameId, userId) {
  const game = getGameById(gameId);
  if (game.yellowPlayerId === null) {
    game.yellowPlayerId = userId;
    return "yellow";
  } else if (game.redPlayerId === null) {
    game.redPlayerId = userId;
    return "red";
  } else {
    return "";
  }
}

function getPlayerTeam(gameId, playerId) {
  const game = getGameById(gameId);
  if (playerId === game.yellowPlayerId) return "yellow";
  else if (playerId === game.redPlayerId) return "red";
  else throw new Error(`Player ${playerId} is not assigned to team!`);
}

function playerIsInGame(playerId) {
  return (
    allGames.find(
      (element) => element.yellowPlayerId === playerId || element.yellowPlayerId === playerId
    ) !== undefined
  );
}

function getGameIdByPlayerId(playerId) {
  const game = allGames.find(
    (element) => element.yellowPlayerId === playerId || element.redPlayerId === playerId
  );
  if (game === undefined) throw new Error(`No game found with playerId ${playerId}`);
  return game.gameId;
}

function gameOver(gameId) {
  getGameById(gameId).gameOver = true;
  // TODO: put into database
  deleteGameById(gameId);
}

function deleteGameById(gameId) {
  const index = allGames.findIndex((element) => element.gameId === gameId);
  if (index !== -1) allGames.splice(index, 1);
  else throw new Error(`Game ${gameId} does not exist!`);
}

module.exports = {
  newGame,
  gameIdExists,
  pushPieces,
  getPieces,
  getPlayerTeam,
  playerIsInGame,
  getGameIdByPlayerId,
  playerReady,
  isGameFull,
  getNPlayersReady,
  switchPlayerTurn,
  getPlayerTurn,
  assignPlayerToTeam,
  gameOver,
};
