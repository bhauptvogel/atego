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
const gameInformation = require("./gameInformation");

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
    if (!gameInformation.gameIdExists(gameId)) {
      gameInformation.newGame(gameId);
      joinGame(socket, gameId);
    } else if (gameInformation.isGameFull(gameId)) {
      // TODO: Show pieces for players without team
      console.error("The room is already full!");
    } else {
      joinGame(socket, gameId);
    }
  });

  socket.on("pieceMoved", (move) => {
    const gameId = gameInformation.getGameIdByPlayerId(socket.id);
    const gamePieces = gameInformation.getPieces(gameId);
    const updatedGamePieces = gameLogic.movePiece(gamePieces, move);
    const remainingPlayerTime = gameInformation.getRemainingPlayerTime(gameId);
    const gameOver = gameLogic.isGameOver(updatedGamePieces, remainingPlayerTime);
    gameInformation.pushPieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
    if (gameOver) {
      io.to(gameId).emit("gameOver", gameOver);
      gameInformation.gameOver(gameId);
    } else {
      gameInformation.switchPlayerTurn(gameId);
      const turn = gameInformation.getPlayerTurn(gameId);
      io.to(gameId).emit("updatePlayerTurn", turn);
      io.to(gameId).emit("clockUpdate", gameInformation.getRemainingPlayerTime(gameId));
    }
  });

  socket.on("allPiecesPlaced", (pieces) => {
    const gameId = gameInformation.getGameIdByPlayerId(socket.id);
    const gamePieces = gameInformation.getPieces(gameId);
    const updatedGamePieces = gamePieces.concat(pieces);
    gameInformation.pushPieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
    gameInformation.playerReady(gameId, socket.id);
    const nPlayersReady = gameInformation.getNPlayersReady(gameId);
    if (nPlayersReady === 2) {
      io.to(gameId).emit("startGame");
      io.to(gameId).emit("updatePlayerTurn", "yellow");
    }
  });

  socket.on("disconnect", () => {
    if (gameInformation.playerIsInGame(socket.id)) {
      const gameId = gameInformation.getGameIdByPlayerId(socket.id);
      console.log(`User (${socket.id}) disconnected from game (${gameId})`);
    } else {
      console.log(`User (${socket.id}) disconnected!`);
    }
    // maybe free the team spot in the gameInformation
  });
});

function joinGame(socket, gameId) {
  console.log(`User (${socket.id}) joined game (${gameId})`);
  socket.join(gameId);
  gameInformation.assignPlayerToTeam(gameId, socket.id);
  const playerTeam = gameInformation.getPlayerTeam(gameId, socket.id);
  socket.emit("assignTeam", playerTeam);
  const gamePieces = gameInformation.getPieces(gameId);
  const updatedGamePieces = gameLogic.getStartingPieces(gamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
}

function updateClock() {
  for (const gameId of gameInformation.getAllGameIds()) {
    if (gameInformation.getNPlayersReady(gameId) === 2) {
      gameInformation.updatePlayerTime(gameId, -1);
      const remainingPlayerTime = gameInformation.getRemainingPlayerTime(gameId);
      io.to(gameId).emit("clockUpdate", remainingPlayerTime);
      const gamePieces = gameInformation.getPieces(gameId);
      const gameOver = gameLogic.isGameOver(gamePieces, remainingPlayerTime);
      if (gameOver) {
        io.to(gameId).emit("gameOver", gameOver);
        gameInformation.gameOver(gameId);
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
