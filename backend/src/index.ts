import express, { Request, Response, Application } from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import { GameService } from "./gameData";
import { Piece, Move } from "./models";
import { movePiece, getStartingPieces, isGameOver, getWinner } from "./gameLogic";
import { join } from "path";

if (process.env.NODE_ENV !== "production") dotenv.config();

const games: GameService = new GameService();
const app: Application = express();
const server = createServer(app);

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

app.get("/game/new", (req, res) => {
  const gameId: string = nanoid();
  // TODO: create new game in database
  games.createNewGame(gameId);
  res.send(gameId);
});

app.get("/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  res.send(games.gameIdExists(gameId));
});

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`New connection: Socket ${socket.id}`);

  socket.on("joinGame", (gameId, playerId) => joinGame(socket, playerId, gameId));

  socket.on("socketReady", (gameId) => sendGameData(gameId, socket));

  socket.on("pieceMoved", (move: Move) => handlePieceMoved(move, socket.id));

  socket.on("allPiecesPlaced", (pieces: Piece[]) => handleAllPiecesPlaced(pieces, socket.id));

  socket.on("disconnect", () => handleDisconnect(socket.id));
});

function handlePieceMoved(move: Move, socketId: string): void {
  const gameId: string = games.getGameIdBySocketId(socketId);
  const gamePieces: Piece[] = games.getPieces(gameId);
  const updatedGamePieces: Piece[] = movePiece(gamePieces, move);
  const remainingPlayerTimeYellow: number = games.getRemainingPlayerTime(gameId, "yellow");
  const remainingPlayerTimeRed: number = games.getRemainingPlayerTime(gameId, "red");
  const gameOver: boolean = isGameOver(
    updatedGamePieces,
    remainingPlayerTimeYellow,
    remainingPlayerTimeRed
  );
  games.pushPieces(gameId, updatedGamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
  if (gameOver == true) {
    const winningTeam: string = getWinner(
      updatedGamePieces,
      remainingPlayerTimeRed,
      remainingPlayerTimeYellow
    );
    io.to(gameId).emit("gameOver", winningTeam);
    games.gameOver(gameId);
  } else {
    games.switchPlayerTurn(gameId);
    const turn: string = games.getPlayerTurn(gameId);
    io.to(gameId).emit("updatePlayerTurn", turn);
  }
}

function sendGameData(gameId: string, socket: Socket): void {
  socket.emit("assignTeam", games.getTeamOfSocket(gameId, socket.id));
  socket.emit("updatePieces", games.getPieces(gameId));
  if (games.hasGameStarted(gameId)) {
    socket.emit("startGame");
    socket.emit("updatePlayerTurn", games.getPlayerTurn(gameId));
  }
}

function handleAllPiecesPlaced(heroPieces: Piece[], socketId: string): void {
  const gameId: string = games.getGameIdBySocketId(socketId);
  const team: string = games.getTeamOfSocket(gameId, socketId);
  const enemyPieces: Piece[] = games.getPieces(gameId).filter((piece) => piece.team !== team);
  const updatedGamePieces: Piece[] = heroPieces.concat(enemyPieces);
  games.playerReady(gameId, socketId);
  if (games.allPlayersReady(gameId)) {
    games.startGame(gameId);
    io.to(gameId).emit("startGame");
    io.to(gameId).emit("updatePlayerTurn", "yellow");
  }
  games.pushPieces(gameId, updatedGamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
}

function handleDisconnect(socketId: string): void {
  if (games.socketInGame(socketId)) {
    const gameId: string = games.getGameIdBySocketId(socketId);
    console.log(`User (${socketId}) disconnected from game (${gameId})`);
  } else {
    console.log(`User (${socketId}) disconnected!`);
  }
}

function joinGame(socket: Socket, playerId: string, gameId: string): void {
  // TODO: look if game exists in *db*
  // TODO: See if player is in game
  if (games.gameIdExists(gameId) != true) {
    // games does not exist
    throw new Error(`Game (${gameId}) does not exist!`);
  }

  if (playerId === null) {
    // player has no id (cookie) yet
    const playerUUID: string = `guest_${nanoid()}`;
    // TODO: use User Account ID as player UUID if player is logged in
    socket.emit("playerId", playerUUID);
    playerId = playerUUID;
  }

  if (games.isPlayerInGame(gameId, playerId)) {
    // rejoin game
    games.updateSocketOfPlayer(gameId, socket.id, playerId);
  } else if (games.isGameFull(gameId)) {
    // game is full
    // TODO: Show pieces for players without team (add spectator)
    socket.emit("gameIsFull");
    return;
  } else if (games.isGameEmpty(gameId)) {
    // join game first
    games.assignPlayerUUIDToYellow(gameId, playerId);
    games.assignSocketToYellow(gameId, socket.id);
    // push starting pieces to game
    games.pushPieces(gameId, getStartingPieces());
  } else {
    // join game second
    games.assignPlayerUUIDToRed(gameId, playerId);
    games.assignSocketToRed(gameId, socket.id);
  }

  socket.join(gameId);
  if (games.isGameFull(gameId)) io.to(gameId).emit("buildGame");
  else socket.emit("noOpponent");
}

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Express and Socket.IO are running on port ${port}`);
});
