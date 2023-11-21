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
  games.createNewGame(gameId);
  res.send(gameId);
});

app.get("/:gameId", (req, res) => {
  const gameId = req.params.gameId;
  if (games.gameIdExists(gameId) == true) {
    const playerUUID: string = nanoid();
    // TODO: use User Account ID as player UUID
    res.send(playerUUID);
  } else {
    throw new Error(`Game (${gameId}) does not exist!`);
  }
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
  let pieces: Piece[];
  let team: string;
  if (games.gameIdExists(gameId) == false) {
    // games does not exist
    // TODO: look if game exists in db
    // TODO: See if player is in game
    console.error("The game does not exist!");
    return;
  } else if (games.isPlayerInGame(gameId, playerId)) {
    // rejoin game
    games.updateSocketOfPlayer(gameId, socket.id, playerId);
    console.log(`Player (${playerId}) rejoined game (${gameId})`);
    team = games.getTeamOfSocket(gameId, socket.id);
    pieces = games.getPieces(gameId);
  } else if (games.isGameFull(gameId)) {
    // game is full
    // TODO: Show pieces for players without team (add spectator)
    console.error("The room is already full!");
    return;
  } else if (games.isGameEmpty(gameId)) {
    // join game first
    games.assignPlayerUUIDToYellow(gameId, playerId);
    games.assignSocketToYellow(gameId, socket.id);
    team = "yellow";
    pieces = getStartingPieces();
    games.pushPieces(gameId, pieces);
    console.log(`Socket (${socket.id}) joined game (${gameId})`);
  } else {
    // join game second
    games.assignPlayerUUIDToRed(gameId, playerId);
    games.assignSocketToRed(gameId, socket.id);
    team = "red";
    pieces = games.getPieces(gameId);
    console.log(`Socket (${socket.id}) joined game (${gameId})`);
  }

  socket.join(gameId);
  if (games.hasGameStarted(gameId)) {
    io.to(gameId).emit("startGame");
    io.to(gameId).emit("updatePlayerTurn", games.getPlayerTurn(gameId));
  }
  socket.emit("assignTeam", team);
  io.to(gameId).emit("updatePieces", pieces);
}

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Express and Socket.IO are running on port ${port}`);
});
