import express, { Express, Request, Response, Application } from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") dotenv.config();

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
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket: Socket) => {
  console.log(`New connection: Socket ${socket.id}`);
  socket.on("joinGame", (gameId) => {
    // TODO: 1. look if game exists, 2. create socket.io room
    console.log(`Player ${socket.id} joined game ${gameId}`)
  });
  socket.on("disconnect", () => {
    console.log(`Disconnected socket ${socket.id}`);
  });
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
  console.log(`Express and Socket.IO are running on port ${port}`);
});
