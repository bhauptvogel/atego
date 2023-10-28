const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { v4: uuidv4 } = require("uuid");
const path = require("path");
// const db = require("./db");
const gameLogic = require("./gameLogic");
const games = require("./games");

app.get("/", (req, res) => {
  res.redirect("/game/new");
});

app.use(express.static("public"));

app.get("/game/new", (req, res) => {
  const gameId = uuidv4();
  res.redirect(`/game/${gameId}`);
});

app.get("/game/:gameId", (req, res) => {
  const filePath = path.join(__dirname, "../public", "index.html");
  res.sendFile(filePath);
});

io.on("connection", (socket) => {
  socket.on("joinGame", (gameId) => {
    if (!games.gameIdExists(gameId)) {
      games.newGame(gameId);
      joinGame(socket, gameId);
    } else if (games.isGameFull(gameId)) {
      // TODO: Show pieces for players without team
      console.error("The room is already full!");
    } else {
      joinGame(socket, gameId);
    }
  });

  socket.on("pieceMoved", (move) => {
    const gameId = games.getGameIdByPlayerId(socket.id);
    const gamePieces = games.getPieces(gameId);
    const updatedGamePieces = gameLogic.movePiece(gamePieces, move);
    const remainingPlayerTime = games.getRemainingPlayerTime(gameId);
    const gameOver = gameLogic.isGameOver(updatedGamePieces, remainingPlayerTime);
    games.pushPieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
    if (gameOver) {
      io.to(gameId).emit("gameOver", gameOver);
      games.gameOver(gameId);
    } else {
      games.switchPlayerTurn(gameId);
      const turn = games.getPlayerTurn(gameId);
      io.to(gameId).emit("updatePlayerTurn", turn);
      io.to(gameId).emit("clockUpdate", games.getRemainingPlayerTime(gameId));
    }
  });

  socket.on("allPiecesPlaced", (pieces) => {
    const gameId = games.getGameIdByPlayerId(socket.id);
    const gamePieces = games.getPieces(gameId);
    const updatedGamePieces = gamePieces.concat(pieces);
    games.pushPieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
    games.playerReady(gameId, socket.id);
    const nPlayersReady = games.getNPlayersReady(gameId);
    if (nPlayersReady === 2) {
      io.to(gameId).emit("startGame");
      io.to(gameId).emit("updatePlayerTurn", "yellow");
    }
  });

  socket.on("disconnect", () => {
    if (games.playerIsInGame(socket.id)) {
      const gameId = games.getGameIdByPlayerId(socket.id);
      console.log(`User (${socket.id}) disconnected from game (${gameId})`);
    } else {
      console.log(`User (${socket.id}) disconnected!`);
    }
    // maybe free the team spot in the games
  });
});

function joinGame(socket, gameId) {
  console.log(`User (${socket.id}) joined game (${gameId})`);
  socket.join(gameId);
  games.assignPlayerToTeam(gameId, socket.id);
  const playerTeam = games.getPlayerTeam(gameId, socket.id);
  socket.emit("assignTeam", playerTeam);
  const gamePieces = games.getPieces(gameId);
  const updatedGamePieces = gameLogic.getStartingPieces(gamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
}

function updateClock() {
  for (const gameId of games.getAllGameIds()) {
    if (games.getNPlayersReady(gameId) === 2) {
      games.updatePlayerTime(gameId, -1);
      const remainingPlayerTime = games.getRemainingPlayerTime(gameId);
      io.to(gameId).emit("clockUpdate", remainingPlayerTime);
      const gamePieces = games.getPieces(gameId);
      const gameOver = gameLogic.isGameOver(gamePieces, remainingPlayerTime);
      if (gameOver) {
        io.to(gameId).emit("gameOver", gameOver);
        games.gameOver(gameId);
      }
    }
  }
}

setInterval(updateClock, 1000);
// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
