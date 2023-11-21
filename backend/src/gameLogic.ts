import { getCharacterHierarchy, Character } from "./characterHierarchy";
import { Piece, Move } from "./models";

export function movePiece(pieces: Piece[], move: Move) {
  for (const piece of pieces) {
    if (piece.field.fieldX == move.from.fieldX && piece.field.fieldY == move.from.fieldY) {
      // TODO: Move Validation (move possible by character)

      // Fighting
      const targetFieldPiece: Piece | undefined = pieces.find(
        (targetPiece) =>
          targetPiece.alive == true &&
          targetPiece.field.fieldX == move.to.fieldX &&
          targetPiece.field.fieldY === move.to.fieldY
      );
      if (targetFieldPiece !== undefined) {
        if (targetFieldPiece.team === piece.team)
          throw new Error("Piece is trying move onto field which is occupied by own team");
        const movingPieceCharacter: Character | undefined = getCharacterHierarchy().find(
          (character) => character.id === piece.id
        );
        const targetPieceCharacter: Character | undefined = getCharacterHierarchy().find(
          (character) => character.id === targetFieldPiece.id
        );
        if (movingPieceCharacter === undefined || targetPieceCharacter === undefined)
          throw new Error("Character that is trying to move or that is attacked it not defined!");

        if (targetPieceCharacter.beats.includes(movingPieceCharacter.n)) {
          piece.alive = false;
          piece.field = { fieldX: -1, fieldY: -1 };
        }

        if (movingPieceCharacter.beats.includes(targetPieceCharacter.n)) {
          targetFieldPiece.field = { fieldX: -1, fieldY: -1 };
          targetFieldPiece.alive = false;
        }

        piece.hasFought = true;
        targetFieldPiece.hasFought = true;
      }
      if (piece.alive == true) piece.field = move.to;
      return pieces;
    }
  }
  throw new Error("No piece was moved!");
}

export function getWinner(
  pieces: Piece[],
  remainingPlayerTimeYellow: number,
  remainingPlayerTimeRed: number
): string {
  if (remainingPlayerTimeYellow <= 0) return "red";
  if (remainingPlayerTimeRed <= 0) return "yellow";

  const yellowMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "yellow");
  const yellowMinerIsDead = yellowMiner !== undefined && yellowMiner.alive !== true;
  const redMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "red");
  const redMinerIsDead = redMiner !== undefined && redMiner.alive !== true;

  if (yellowMinerIsDead && redMinerIsDead) return "tie";

  const yellowBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "yellow");
  const yellowBombIsDead = yellowBomb !== undefined && yellowBomb.alive !== true;
  const redBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "red");
  const redBombIsDead = redBomb !== undefined && redBomb.alive !== true;

  const yellowPiecesLength = pieces.filter(
    (piece) => piece.team === "yellow" && piece.alive == true
  ).length;
  const redPiecesLength = pieces.filter(
    (piece) => piece.team === "red" && piece.alive == true
  ).length;

  if (yellowBombIsDead || yellowPiecesLength <= 1) return "red";
  if (redBombIsDead || redPiecesLength <= 1) return "yellow";

  throw new Error("Game is not over!");
}

/**
 * @returns 'red' if yellow bomb is killed, 'yellow' if red bomb is killed, 'tie' if both miners are killed, otherwise null
 */
export function isGameOver(
  pieces: Piece[],
  remainingPlayerTimeYellow: number,
  remainingPlayerTimeRed: number
): boolean {
  if (remainingPlayerTimeYellow <= 0 || remainingPlayerTimeRed <= 0) return true;

  const yellowMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "yellow");
  const yellowMinerIsDead = yellowMiner !== undefined && yellowMiner.alive !== true;
  const redMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "red");
  const redMinerIsDead = redMiner !== undefined && redMiner.alive !== true;

  if (yellowMinerIsDead && redMinerIsDead) return true;

  const yellowBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "yellow");
  const yellowBombIsDead = yellowBomb !== undefined && yellowBomb.alive !== true;
  const redBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "red");
  const redBombIsDead = redBomb !== undefined && redBomb.alive !== true;

  const yellowPiecesLength = pieces.filter(
    (piece) => piece.team === "yellow" && piece.alive == true
  ).length;
  const redPiecesLength = pieces.filter(
    (piece) => piece.team === "red" && piece.alive == true
  ).length;

  if (yellowBombIsDead || yellowPiecesLength <= 1 || redBombIsDead || redPiecesLength <= 1)
    return true;

  return false;
}

export function getStartingPieces(): Piece[] {
  const startingGamePieces: string[] = [
    "bomb",
    "spy",
    "runner",
    "runner",
    "miner",
    "assassin",
    "killer",
    "mr_x",
  ];
  const yellowStartingPieces: Piece[] = startingGamePieces.map((piece) => ({
    id: piece,
    field: { fieldX: 0, fieldY: 0 },
    team: "yellow",
    hasFought: false,
    alive: false,
    active: false,
  }));
  const redStartingPieces: Piece[] = startingGamePieces.map((piece) => ({
    id: piece,
    field: { fieldX: 0, fieldY: 0 },
    team: "red",
    hasFought: false,
    alive: false,
    active: false,
  }));
  //   if (placedPiecesInGame.length === 0) return yellowStartingPieces.concat(redStartingPieces);
  //   else if (
  //     placedPiecesInGame.length === 8 &&
  //     placedPiecesInGame.filter((piece) => piece.team === "yellow").length === 8
  //   )
  //     return placedPiecesInGame.concat(redStartingPieces);
  //   else if (
  //     placedPiecesInGame.length === 8 &&
  //     placedPiecesInGame.filter((piece) => piece.team === "red").length === 8
  //   )
  return redStartingPieces.concat(yellowStartingPieces);
  //   else throw new Error("getStartingPieces");
}
