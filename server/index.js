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

    if (!room) db.createNewGame(gameId).then(() => joinGame(socket, gameId));
    else if (room.size < 2) joinGame(socket, gameId);
    else console.error(`The room is already full!`);
    // TODO: Show pieces for players without team
  });

  socket.on("pieceMoved", (move) => {
    db.findGameWithPlayer(socket.id).then((game) => {
      const gameId = game.gameId;
      const updatedGamePieces = gameLogic.movePiece(game.pieces, move);
      const gameOver = gameLogic.isGameOver(updatedGamePieces);
      db.pushGamePieces(gameId, updatedGamePieces);
      io.to(gameId).emit("updatePieces", updatedGamePieces);
      if (gameOver) {
        io.to(gameId).emit("gameOver", gameOver);
        db.deleteGame(gameId);
      } else {
        db.switchPlayerTurn(gameId).then((turn) => io.to(gameId).emit("updatePlayerTurn", turn));
      }
    });
  });

  socket.on("allPiecesPlaced", (pieces) => {
    db.findGameWithPlayer(socket.id).then((game) => {
      const gameId = game.gameId;
      const updatedGamePieces = game.pieces.concat(pieces);
      db.pushGamePieces(gameId, updatedGamePieces).then(() => {
        io.to(gameId).emit("updatePieces", updatedGamePieces);
        db.addReadyPlayer(gameId).then(() =>
          db.getReadyPlayers(gameId).then((nPlayersReady) => {
            if (nPlayersReady === 2) {
              io.to(gameId).emit("startGame");
              io.to(gameId).emit("updatePlayerTurn", "yellow");
            }
          })
        );
      });
    });
  });

  socket.on("disconnect", () => {
    db.findGameWithPlayer(socket.id)
      .then((game) => {
        console.log(`User (${socket.id}) disconnected from game (${game.gameId})`);
      })
      .catch((error) => console.log(`User (${socket.id}) disconnected!`));
    // maybe free the team spot in the database
  });
});

async function joinGame(socket, gameId) {
  console.log(`User (${socket.id}) joined game (${gameId})`);
  socket.join(gameId);
  db.assignTeamToPlayer(gameId, socket.id).then(() =>
    db.getPlayerTeam(gameId, socket.id).then((team) => {
      socket.emit("assignTeam", team);
      db.getGamePieces(gameId).then((gamePieces) => {
        const updatedGamePieces = gameLogic.getStartingPieces(gamePieces);
        io.to(gameId).emit("updatePieces", updatedGamePieces);
      });
    })
  );
}

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
