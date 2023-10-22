const mongoose = require("mongoose");
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const atlasURI = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.ght2591.mongodb.net/?retryWrites=true&w=majority`;

mongoose
  .connect(atlasURI, { useNewUrlParser: true, useUnifiedTopology: true })
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
    nPlayersReady: 0, // potential refactor: without nPlayersReady, only with pieces
    turn: "yellow",
    pieces: [],
    gameOver: false,
  });
  return await Game.create(newGame);
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
  const newTurn = game.turn === "yellow" ? "red" : "yellow";
  await Game.updateOne({ gameId: gameId }, { turn: newTurn });
  return newTurn;
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

async function findGame(gameId) {
  return await Game.findOne({ gameId: gameId });
}

module.exports = {
  createNewGame,
  addReadyPlayer,
  getReadyPlayers,
  getGamePieces,
  assignTeamToPlayer,
  pushGamePieces,
  deleteGame,
  switchPlayerTurn,
  getPlayerTeam,
  findGameWithPlayer,
  findGame,
};
