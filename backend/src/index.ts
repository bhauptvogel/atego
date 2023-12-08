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
const origins = process.env.ORIGIN === undefined ? [] : process.env.ORIGIN.split(" ");

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

app.get("/game/new", (req, res) => {
  const gameId: string = nanoid();
  // TODO: create new game in database

  const unlimitedTime: boolean = req.query.time == "Unlimited";
  const time: number = Number(req.query.time);
  const team: string = String(req.query.team);
  games.createNewGame(gameId, time, team, unlimitedTime);
  res.send(gameId);
});

const io = new Server(server, {
  cors: {
    origin: origins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`New connection: Socket ${socket.id}`);

  socket.on("joinGame", (gameId: string, playerId: string | null) => {
    // TODO: look if game exists in *db*
    // TODO: See if player is in game
    if (games.gameIdExists(gameId) == false) {
      socket.emit("gameDoesNotExist");
      throw new Error(`Cannot join game ${gameId} because it does not exist!`);
    }

    if (playerId === null) {
      playerId = `guest_${nanoid()}`;
      socket.emit("newPlayerId", playerId);
    }

    const amountOfPlayers = games.getAmountOfPlayersInGame(gameId);
    const playerIdInGame = games.isPlayerInGame(gameId, playerId);

    if (amountOfPlayers < 2) socket.emit("waitingForOpponent");
    else if (amountOfPlayers >= 2 && !playerIdInGame) socket.emit("gameIsFull");

    if (playerIdInGame) rejoinGame(socket, playerId, gameId);
    else joinNewGame(socket, playerId, gameId);
  });

  socket.on("socketReady", (gameId) => sendGameData(gameId, socket));

  socket.on("pieceMoved", (move: Move) => handlePieceMoved(move, socket.id));

  socket.on("allPiecesPlaced", (pieces: Piece[]) => handleAllPiecesPlaced(pieces, socket.id));

  socket.on("disconnect", () => handleDisconnect(socket.id));

  socket.on("getPlayerTime", (gameId) => {
    if (!games.hasGameUnlimitedTime(gameId))
      socket.emit("clockUpdate", {
        yellow: games.getRemainingPlayerTime(gameId, "yellow"),
        red: games.getRemainingPlayerTime(gameId, "yellow"),
      });
    else socket.emit("deactivateClock");
  });
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

function joinNewGame(socket: Socket, playerId: string, gameId: string): void {
  if (games.isGameFull(gameId)) throw new Error(`Cannot join game ${gameId} because it is full!`);
  socket.join(gameId);
  const firstTeam = games.getFirstTeamToJoin(gameId);
  if (games.isGameEmpty(gameId)) {
    // join game first
    if (firstTeam == "yellow") joinYellow(socket, playerId, gameId);
    else joinRed(socket, playerId, gameId);
    // push starting pieces to game
    games.pushPieces(gameId, getStartingPieces());
  } else {
    // join game second
    if (firstTeam == "yellow") joinRed(socket, playerId, gameId);
    else joinYellow(socket, playerId, gameId);
    // game is now Full
    io.to(gameId).emit("buildGame");
  }
}

function joinYellow(socket: Socket, playerId: string, gameId: string): void {
  games.assignPlayerUUIDToYellow(gameId, playerId);
  games.assignSocketToYellow(gameId, socket.id);
}

function joinRed(socket: Socket, playerId: string, gameId: string): void {
  games.assignPlayerUUIDToRed(gameId, playerId);
  games.assignSocketToRed(gameId, socket.id);
}

function rejoinGame(socket: Socket, playerId: string, gameId: string): void {
  if (!games.isGameFull(gameId)) throw new Error(`Cannot rejoin game ${gameId} which is not full!`);
  socket.join(gameId);
  games.updateSocketOfPlayer(gameId, socket.id, playerId);
  socket.emit("buildGame");
}

function updateClock() {
  for (const gameId of games.getAllGameIds()) {
    if (games.allPlayersReady(gameId) && !games.hasGameUnlimitedTime(gameId)) {
      games.updateActivePlayerTime(gameId, -1);
      const remainingPlayerTimeYellow = games.getRemainingPlayerTime(gameId, "yellow");
      const remainingPlayerTimeRed = games.getRemainingPlayerTime(gameId, "red");
      io.to(gameId).emit("clockUpdate", {
        yellow: remainingPlayerTimeYellow,
        red: remainingPlayerTimeRed,
      });
      let gameOver: string | null = null;
      if (remainingPlayerTimeRed <= 0 && remainingPlayerTimeYellow <= 0) gameOver = "tie";
      else if (remainingPlayerTimeYellow <= 0) gameOver = "red";
      else if (remainingPlayerTimeRed <= 0) gameOver = "yellow";
      if (gameOver != null) {
        io.to(gameId).emit("gameOver", gameOver);
        games.gameOver(gameId);
      }
    }
  }
}

setInterval(updateClock, 1000);

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Express and Socket.IO are running on port ${port}`);
});
