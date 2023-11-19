import express, { Request, Response, Application } from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import { GameService } from "./gameData";
import { Piece, Move } from "./models";
import { movePiece, getStartingPieces, isGameOver, getWinner } from "./gameLogic";

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
  res.send(gameId);
});

const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`New connection: Socket ${socket.id}`);

  socket.on("joinGame", (gameId) => {
    // TODO: look if game exists in db
    if (games.gameIdExists(gameId) == false) {
      games.createNewGame(gameId);
      joinGame(socket, gameId);
    } else if (games.isGameFull(gameId)) {
      // TODO: Show pieces for players without team
      console.error("The room is already full!");
    } else {
      joinGame(socket, gameId);
    }
  });

  socket.on("pieceMoved", (move: Move) => handlePieceMoved(move, socket.id));

  socket.on("allPiecesPlaced", (pieces: Piece[]) => handleAllPiecesPlaced(pieces, socket.id));

  socket.on("disconnect", () => handleDisconnect(socket.id));
});

function handlePieceMoved(move: Move, socketId: string): void {
  const gameId: string = games.getGameIdByPlayerId(socketId);
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
    io.to(gameId).emit("clockUpdate", [remainingPlayerTimeYellow, remainingPlayerTimeRed]);
  }
}

function handleAllPiecesPlaced(pieces: Piece[], socketId: string): void {
  const gameId: string = games.getGameIdByPlayerId(socketId);
  const gamePieces: Piece[] = games.getPieces(gameId);
  const updatedGamePieces: Piece[] = pieces.concat(gamePieces);
  games.playerReady(gameId, socketId);
  if (games.allPlayersReady(gameId)) {
    io.to(gameId).emit("startGame");
    io.to(gameId).emit("updatePlayerTurn", "yellow");
  }
  games.pushPieces(gameId, updatedGamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
}

function handleDisconnect(socketId: string): void {
  if (games.playerInGame(socketId)) {
    const gameId: string = games.getGameIdByPlayerId(socketId);
    console.log(`User (${socketId}) disconnected from game (${gameId})`);
  } else {
    console.log(`User (${socketId}) disconnected!`);
  }
}

function joinGame(socket: Socket, gameId: string): void {
  console.log(`User (${socket.id}) joined game (${gameId})`);
  socket.join(gameId);
  games.assignPlayerToTeam(gameId, socket.id);
  const playerTeam: string = games.getPlayerTeam(gameId, socket.id);
  socket.emit("assignTeam", playerTeam);
  const gamePieces: Piece[] = games.getPieces(gameId);
  const updatedGamePieces: Piece[] = getStartingPieces(gamePieces);
  io.to(gameId).emit("updatePieces", updatedGamePieces);
}

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Express and Socket.IO are running on port ${port}`);
});
