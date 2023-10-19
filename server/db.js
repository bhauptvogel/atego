const mongoose = require("mongoose");
// https://chat.openai.com/c/43c1e096-c174-4397-a10c-61da7594385a
// Connection URL
const url = "mongodb://localhost:27017/mygame";

mongoose
  .connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const gameSchema = new mongoose.Schema({
  gameId: String,
  playerIdYellow: String,
  playerIdRed: String,
  nPlayersReady: Number,
  turn: String,
  pieces: Array,
  gameOver: Boolean,
});

const Game = mongoose.model("Game", gameSchema);

async function createNewGame(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  if (game !== null) throw new Error("Game already Exists!");
  const newGame = new Game({
    gameId: gameId,
    playerIdYellow: null,
    playerIdRed: null,
    nPlayersReady: 0,
    turn: "yellow",
    pieces: [],
    gameOver: false,
  });
  //   newGame.save();
  return await Game.create(newGame);
}

// TODO: put into gameLogic.js
async function getStartingPieces(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  if (game === null) throw new Error("Game does not exist!");
  const placedPiecesInGame = game.pieces;
  if (placedPiecesInGame.length === 16) return placedPiecesInGame;

  const startingGamePieces = [
    "bomb",
    "spy",
    "runner",
    "runner",
    "miner",
    "assassin",
    "killer",
    "mr_x",
  ];
  const yellowStartingPieces = startingGamePieces.map((piece) => ({
    id: piece,
    position: {},
    team: "yellow",
    hasFought: false,
  }));
  const redStartingPieces = startingGamePieces.map((piece) => ({
    id: piece,
    position: {},
    team: "red",
    hasFought: false,
  }));
  if (placedPiecesInGame.length === 0) return yellowStartingPieces.concat(redStartingPieces);
  else if (
    placedPiecesInGame.length === 8 &&
    placedPiecesInGame.filter((piece) => piece.team === "yellow").length === 8
  )
    return placedPiecesInGame.concat(redStartingPieces);
  else if (
    placedPiecesInGame.length === 8 &&
    placedPiecesInGame.filter((piece) => piece.team === "red").length === 8
  )
    return placedPiecesInGame.concat(yellowStartingPieces);
  else throw new Error("db: getStartingPieces");
}

async function getGamePieces(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  return game.pieces;
}

async function pushGamePieces(gameId, pieces) {
  // TODO: validate that game is not over
  return await Game.updateOne({ gameId: gameId }, { pieces: pieces });
}

async function addReadyPlayer(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  return await Game.updateOne({ gameId: gameId }, { nPlayersReady: game.nPlayersReady + 1 });
}

async function getReadyPlayers(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  return game.nPlayersReady;
}

async function switchPlayerTurn(gameId) {
  // TODO: validate that game is not over
  const game = await Game.findOne({ gameId: gameId });
  return await Game.updateOne(
    { gameId: gameId },
    { turn: game.turn === "yellow" ? "red" : "yellow" }
  );
}

async function getPlayerTurn(gameId) {
  const game = await Game.findOne({ gameId: gameId });
  return game.turn;
}

async function assignTeamToPlayer(gameId, userId) {
  const game = await Game.findOne({ gameId: gameId });
  if (game.playerIdYellow === null) {
    const res = await Game.updateOne({ gameId: gameId }, { playerIdYellow: userId });
  } else if (game.playerIdRed === null) {
    const res = await Game.updateOne({ gameId: gameId }, { playerIdRed: userId });
  }
}

async function getPlayerTeam(gameId, userId) {
  const game = await Game.findOne({ gameId: gameId });
  if (game === null) throw new Error("Game is null!");
  else if (game.playerIdYellow === userId) return "yellow";
  else if (game.playerIdRed === userId) return "red";
  else return "";
}

function deleteGame(gameId) {
  Game.deleteOne({ gameId: gameId }).then(console.log("Game Deleted!"));
}

async function findGameWithPlayer(playerId) {
  const game = await Game.findOne({ playerIdYellow: playerId });
  if (game !== null) return game;
  return await Game.findOne({ playerIdRed: playerId });
}

module.exports = {
  createNewGame,
  addReadyPlayer,
  getReadyPlayers,
  getStartingPieces,
  getGamePieces,
  assignTeamToPlayer,
  pushGamePieces,
  getPlayerTurn,
  deleteGame,
  switchPlayerTurn,
  getPlayerTeam,
  findGameWithPlayer,
};
