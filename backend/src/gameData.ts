import { Game, Piece } from "./models";

export class GameService {
  allGames: Game[];

  constructor() {
    this.allGames = [];
  }

  createNewGame(gameId: string, time: number, firstTeam: string, unlimitedTime: boolean): void {
    if (this.allGames.find((element) => element.gameId === gameId) !== undefined) {
      throw new Error(`newGame: Game with gameid ${gameId} already exists!`);
    }
    const newGame: Game = {
      gameId: gameId,
      teamFirstToJoin: firstTeam,
      socketIdYellow: null,
      socketIdRed: null,
      playerUUIDYellow: null,
      playerUUIDRed: null,
      yellowPlayerReady: false,
      redPlayerReady: false,
      unlimitedTime: unlimitedTime,
      yellowPlayerTime: time,
      redPlayerTime: time,
      turn: "yellow",
      pieces: [],
      started: false,
      gameOver: false,
    };
    this.allGames.push(newGame);
  }

  gameIdExists(gameId: string): boolean {
    return this.allGames.find((element) => element.gameId === gameId) !== undefined;
  }

  getGameById(gameId: string): Game {
    const game: Game | undefined = this.allGames.find((element) => element.gameId === gameId);
    if (game === undefined) throw new Error(`Game with GameId ${gameId} does not exist!`);
    return game;
  }

  pushPieces(gameId: string, pieces: Piece[]): void {
    this.getGameById(gameId).pieces = pieces;
  }

  getPieces(gameId: string): Piece[] {
    return this.getGameById(gameId).pieces;
  }

  playerReady(gameId: string, socketId: string): void {
    const game: Game = this.getGameById(gameId);
    if (socketId === game.socketIdYellow) game.yellowPlayerReady = true;
    else if (socketId === game.socketIdRed) game.redPlayerReady = true;
    else throw new Error(`Player ${socketId} is not assigned to a team!`);
  }

  allPlayersReady(gameId: string): boolean {
    const game: Game = this.getGameById(gameId);
    return game.yellowPlayerReady && game.redPlayerReady;
  }

  getAmountOfPlayersInGame(gameId: string): number {
    let output = 0;
    if (this.getGameById(gameId).socketIdYellow !== null) output++;
    if (this.getGameById(gameId).socketIdRed !== null) output++;
    return output;
  }

  isGameFull(gameId: string): boolean {
    const game: Game = this.getGameById(gameId);
    return game.socketIdYellow !== null && game.socketIdRed !== null;
  }

  isGameEmpty(gameId: string): boolean {
    const game: Game = this.getGameById(gameId);
    return game.socketIdYellow === null && game.socketIdRed === null;
  }

  switchPlayerTurn(gameId: string): void {
    const game: Game = this.getGameById(gameId);
    game.turn = game.turn === "yellow" ? "red" : "yellow";
  }

  getPlayerTurn(gameId: string): string {
    return this.getGameById(gameId).turn;
  }

  hasGameStarted(gameId: string): boolean {
    return this.getGameById(gameId).started;
  }

  startGame(gameId: string): void {
    this.getGameById(gameId).started = true;
  }

  updateActivePlayerTime(gameId: string, time: number) {
    const game: Game = this.getGameById(gameId);
    if (game.turn === "yellow") game.yellowPlayerTime += time;
    else if (game.turn === "red") game.redPlayerTime += time;
    else throw new Error("Player turn not specified in changePlayerTime");
  }

  updateSocketOfPlayer(gameId: string, socketId: string, playerUUID: string) {
    const game: Game = this.getGameById(gameId);
    if (game.playerUUIDYellow === playerUUID) game.socketIdYellow = socketId;
    else if (game.playerUUIDRed === playerUUID) game.socketIdRed = socketId;
    else throw new Error(`Player ${playerUUID} is not assigned to a team!`);
  }

  assignSocketToYellow(gameId: string, socketId: string): void {
    this.getGameById(gameId).socketIdYellow = socketId;
  }

  assignSocketToRed(gameId: string, socketId: string): void {
    this.getGameById(gameId).socketIdRed = socketId;
  }

  assignPlayerUUIDToYellow(gameId: string, playerUUID: string): void {
    this.getGameById(gameId).playerUUIDYellow = playerUUID;
  }
  assignPlayerUUIDToRed(gameId: string, playerUUID: string): void {
    this.getGameById(gameId).playerUUIDRed = playerUUID;
  }

  isPlayerInGame(gameId: string, playerUUID: string): boolean {
    const game: Game = this.getGameById(gameId);
    return game.playerUUIDRed === playerUUID || game.playerUUIDYellow === playerUUID;
  }

  getTeamOfSocket(gameId: string, socketId: string): string {
    const game: Game = this.getGameById(gameId);
    if (socketId === game.socketIdYellow) return "yellow";
    else if (socketId === game.socketIdRed) return "red";
    else throw new Error(`Player ${socketId} is not assigned to team!`);
  }

  getFirstTeamToJoin(gameId: string): string {
    return this.getGameById(gameId).teamFirstToJoin;
  }

  hasGameUnlimitedTime(gameId: string): boolean {
    return this.getGameById(gameId).unlimitedTime;
  }

  socketInGame(socketId: string): boolean {
    return (
      this.allGames.find(
        (element) => element.socketIdYellow === socketId || element.socketIdYellow === socketId
      ) !== undefined
    );
  }

  getGameIdBySocketId(socketId: string): string {
    const game: Game | undefined = this.allGames.find(
      (element) => element.socketIdYellow === socketId || element.socketIdRed === socketId
    );
    if (game === undefined) throw new Error(`No game found with socketId ${socketId}`);
    return game.gameId;
  }

  getAllGameIds(): string[] {
    return this.allGames.map((element) => element.gameId);
  }

  updatePlayerTurns(gameId: string, difference: number): void {
    const game: Game = this.getGameById(gameId);
    if (game.turn === "yellow") game.yellowPlayerTime += difference;
    else if (game.turn === "red") game.redPlayerTime += difference;
  }

  getRemainingPlayerTime(gameId: string, team: string): number {
    const game: Game = this.getGameById(gameId);
    if (team === "yellow") return game.yellowPlayerTime;
    else if (team === "red") return game.redPlayerTime;
    else throw new Error("Team not specified in getRemainingPlayerTime");
  }

  gameOver(gameId: string): void {
    this.getGameById(gameId).gameOver = true;
    // TODO: put into database
    this.deleteGameById(gameId);
  }

  deleteGameById(gameId: string): void {
    const index: number = this.allGames.findIndex((element) => element.gameId === gameId);
    if (index !== -1) this.allGames.splice(index, 1);
    else throw new Error(`Game ${gameId} does not exist!`);
  }
}
