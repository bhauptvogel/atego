const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { v4: uuidv4 } = require("uuid");
const path = require("path");

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
    console.log("a user joined a room");
    let room = io.sockets.adapter.rooms.get(gameId);

    if (!room) {
      socket.join(gameId);
      joinGame(socket.id, gameId);
    } else if (room.size == 1) {
      socket.join(gameId);
      joinGame(socket.id, gameId);
      io.to(gameId).emit("startGame");
    } else if (room.size >= 2) {
      socket.emit("err", "Room full");
      console.error("Server: The room is full!");
    } else {
      throw new Error("Server: The room does exist but has size == 1");
    }
  });
  socket.on("figureMoved", (move) => {
    const gameId = findPlayerGame(socket.id);
    console.log("figureMoved " + JSON.stringify(move));
    socket.to(gameId).emit("moveFigure", move);
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

let playersInGames = {};

function joinGame(socketId, gameId) {
  playersInGames[socketId] = gameId;
  console.log(`User (${socketId}) joined game (${gameId})`);
}

function findPlayerGame(socketId) {
  return playersInGames[socketId];
}

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
