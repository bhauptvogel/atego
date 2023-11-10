import { getCharacterHierarchy, Character } from "./characterHierarchy";
import { Piece, Move } from "./models";

export function movePiece(pieces: Piece[], move: Move) {
  for (const piece of pieces) {
    if (piece.field.fieldX == move.from.fieldX && piece.field.fieldY == move.from.fieldY) {
      // TODO: Move Validation (move possible by character)

      // Fighting
      const targetFieldPiece: Piece | undefined = pieces.find(
        (targetPiece) =>
          targetPiece.field.fieldX == move.to.fieldX && targetPiece.field.fieldY === move.to.fieldY
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
        if (targetPieceCharacter.beats.includes(movingPieceCharacter.n)) piece.dead = true;
        piece.hasFought = true;

        if (movingPieceCharacter.beats.includes(targetPieceCharacter.n))
          targetFieldPiece.dead = true;
        targetFieldPiece.hasFought = true;
      }
      if (piece.dead == false) piece.field = move.to;
      return pieces;
    }
  }
  throw new Error("No piece was moved!");
}

/**
 * @returns 'red' if yellow bomb is killed, 'yellow' if red bomb is killed, 'tie' if both miners are killed, otherwise null
 */
export function isGameOver(
  pieces: Piece[],
  remainingPlayerTimeYellow: number,
  remainingPlayerTimeRed: number
): string | null {
  if (remainingPlayerTimeYellow <= 0) return "red";
  if (remainingPlayerTimeRed <= 0) return "yellow";

  const yellowBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "yellow");
  const yellowBombExists = yellowBomb !== undefined && yellowBomb.dead == true;
  const redBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "red");
  const redBombExists = redBomb !== undefined && redBomb.dead == true;

  const yellowPiecesLength = pieces.filter(
    (piece) => piece.team === "yellow" && piece.dead == true
  ).length;
  const redPiecesLength = pieces.filter(
    (piece) => piece.team === "red" && piece.dead == true
  ).length;

  if (!yellowBombExists || yellowPiecesLength <= 1) return "red";
  if (!redBombExists || redPiecesLength <= 1) return "yellow";

  const yellowMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "yellow");
  const yellowMinerExists = yellowMiner !== undefined && yellowMiner.dead == true;
  const redMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "red");
  const redMinerExists = redMiner !== undefined && redMiner.dead == true;

  if (!yellowMinerExists && !redMinerExists) return "tie";

  return null;
}

export function getStartingPieces(placedPiecesInGame: Piece[]): Piece[] {
  if (placedPiecesInGame.length === 16) return placedPiecesInGame;

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
    dead: false,
    active: false,
  }));
  const redStartingPieces: Piece[] = startingGamePieces.map((piece) => ({
    id: piece,
    field: { fieldX: 0, fieldY: 0 },
    team: "red",
    hasFought: false,
    dead: false,
    active: false,
  }));
  if (placedPiecesInGame.length === 0) return yellowStartingPieces.concat(redStartingPieces);
  else if (
    placedPiecesInGame.length === 8 &&
    placedPiecesInGame.filter((piece) => piece.team === "yellow").length === 8
  )
    return placedPiecesInGame.concat(redStartingPieces);
  else if (
    placedPiecesInGame.length === 8 &&
    placedPiecesInGame.filter((piece) => piece.team === "red").length === 8
  )
    return placedPiecesInGame.concat(yellowStartingPieces);
  else throw new Error("getStartingPieces");
}
