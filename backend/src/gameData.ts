import { Game, Piece } from "./models";

export class GameService {
  allGames: Game[];

  constructor() {
    this.allGames = [];
  }

  createNewGame(gameId: string): void {
    if (this.allGames.find((element) => element.gameId === gameId) !== undefined) {
      throw new Error(`newGame: Game with gameid ${gameId} already exists!`);
    }
    const newGame: Game = {
      gameId: gameId,
      yellowPlayerId: null,
      redPlayerId: null,
      yellowPlayerReady: false,
      redPlayerReady: false,
      yellowPlayerTime: 300,
      redPlayerTime: 300,
      turn: "yellow",
      pieces: [],
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

  playerReady(gameId: string, playerId: string): void {
    const game: Game = this.getGameById(gameId);
    if (playerId === game.yellowPlayerId) game.yellowPlayerReady = true;
    else if (playerId === game.redPlayerId) game.redPlayerReady = true;
    else throw new Error(`Player ${playerId} is not assigned to a team!`);
  }

  getNPlayersReady(gameId: string): number {
    let count: number = 0;
    const game: Game = this.getGameById(gameId);
    if (game.yellowPlayerReady) count++;
    if (game.redPlayerReady) count++;
    return count;
  }

  isGameFull(gameId: string): boolean {
    const game: Game = this.getGameById(gameId);
    if (game.yellowPlayerId === null || game.redPlayerId === null) return false;
    return true;
  }

  switchPlayerTurn(gameId: string): void {
    const game: Game = this.getGameById(gameId);
    game.turn = game.turn === "yellow" ? "red" : "yellow";
  }

  getPlayerTurn(gameId: string) {
    return this.getGameById(gameId).turn;
  }

  assignPlayerToTeam(gameId: string, playerId: string): string {
    const game: Game = this.getGameById(gameId);
    if (game.yellowPlayerId === null) {
      game.yellowPlayerId = playerId;
      return "yellow";
    } else if (game.redPlayerId === null) {
      game.redPlayerId = playerId;
      return "red";
    } else {
      return "";
    }
  }

  getPlayerTeam(gameId: string, playerId: string): string {
    const game: Game = this.getGameById(gameId);
    if (playerId === game.yellowPlayerId) return "yellow";
    else if (playerId === game.redPlayerId) return "red";
    else throw new Error(`Player ${playerId} is not assigned to team!`);
  }

  playerInGame(playerId: string): boolean {
    return (
      this.allGames.find(
        (element) => element.yellowPlayerId === playerId || element.yellowPlayerId === playerId
      ) !== undefined
    );
  }

  getGameIdByPlayerId(playerId: string): string {
    const game: Game | undefined = this.allGames.find(
      (element) => element.yellowPlayerId === playerId || element.redPlayerId === playerId
    );
    if (game === undefined) throw new Error(`No game found with playerId ${playerId}`);
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
