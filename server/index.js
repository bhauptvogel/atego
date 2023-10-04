const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const db = require("./db");
const gameLogic = require("./gameLogic");

app.get("/", (req, res) => {
  res.redirect("/game/new");
});

app.use(express.static("public"));

app.get("/game/new", (req, res) => {
  const gameId = uuidv4();
  res.redirect(`/game/${gameId}`);
});

app.get("/game/:gameId", (req, res) => {
  // Here, serve your game HTML, perhaps passing the gameId to it somehow
  const filePath = path.join(__dirname, "../public", "index.html");
  res.sendFile(filePath);
});

io.on("connection", (socket) => {
  socket.on("joinGame", (gameId) => {
    let room = io.sockets.adapter.rooms.get(gameId);

    if (!room) db.pushNewMockPiecesToDB(gameId);
    else if (room.size >= 2) console.error(`The room is already full!`);

    socket.join(gameId);
    joinGame(socket, gameId);
    io.to(gameId).emit("updatePieces", db.getStartingPieces(gameId));
    io.to(gameId).emit("updatePlayerTurn", db.getPlayerTurn(gameId));
  });

  socket.on("pieceMoved", (move) => {
    const gameId = findPlayerGame(socket.id);
    const updatedGamePieces = gameLogic.movePiece(db.getGamePieces(gameId), move);
    db.pushGamePieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
    db.switchPlayerTurn(gameId);
    io.to(gameId).emit("updatePlayerTurn", db.getPlayerTurn(gameId));
  });

  socket.on("allPiecesPlaced", (pieces) => {
    const gameId = findPlayerGame(socket.id);
    const updatedGamePieces = db.getGamePieces(gameId).concat(pieces);
    db.pushGamePieces(gameId, updatedGamePieces);
    io.to(gameId).emit("updatePieces", updatedGamePieces);
  });

  socket.on("disconnect", () => {
    console.log(`User (${socket.id}) disconnected from game (${findPlayerGame(socket.id)})`);
    // maybe free the team spot in the database
  });
});

let playersInGames = {};

function joinGame(socket, gameId) {
  playersInGames[socket.id] = gameId;
  console.log(`User (${socket.id}) joined game (${gameId})`);
  socket.emit("assignTeam", db.assignTeamToPlayer(gameId, socket.id));
}

function findPlayerGame(socketId) {
  return playersInGames[socketId];
}

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
