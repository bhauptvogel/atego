import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { nanoid } from "nanoid";
// import * as nanoid from "nanoid";
//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

app.get("/game/new", (req, res) => {
  const gameId: string = nanoid();
  res.send(gameId);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
