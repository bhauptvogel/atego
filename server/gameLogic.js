const characterHierarchy = require("./characterHierarchy");

function movePiece(pieces, move) {
  for (const piece of pieces) {
    if (piece.position.x == move.from.x && piece.position.y == move.from.y) {
      // TODO: Move Validation (move possible by character)

      // Fighting
      const targetFieldPiece = pieces.find(
        (targetPiece) => targetPiece.position.x == move.to.x && targetPiece.position.y === move.to.y
      );
      if (targetFieldPiece) {
        if (targetFieldPiece.team === piece.team)
          throw new Error("Piece is trying move onto field which is occupied by own team");
        const movingPieceCharacter = characterHierarchy.characters.find(
          (character) => character.id === piece.id
        );
        const targetPieceCharacter = characterHierarchy.characters.find(
          (character) => character.id === targetFieldPiece.id
        );
        if (targetPieceCharacter.beats.includes(movingPieceCharacter.n)) piece.position = {};
        piece.hasFought = true;

        if (movingPieceCharacter.beats.includes(targetPieceCharacter.n))
          targetFieldPiece.position = {};
        targetFieldPiece.hasFought = true;
      }
      if (Object.keys(piece.position).length > 0) piece.position = move.to;
      return pieces;
    }
  }
  throw new Error("No piece was moved!");
}

/**
 * @returns 'red' if yellow bomb is killed, 'yellow' if red bomb is killed, 'tie' if both miners are killed, otherwise null
 */
function isGameOver(pieces) {
  const yellowBombExists =
    Object.keys(pieces.find((piece) => piece.id === "bomb" && piece.team === "yellow").position)
      .length > 0;
  const redBombExists =
    Object.keys(pieces.find((piece) => piece.id === "bomb" && piece.team === "red").position)
      .length > 0;
  const yellowPiecesLength = pieces.filter(
    (piece) => piece.team === "yellow" && Object.keys(piece.position).length > 0
  ).length;
  const redPiecesLength = pieces.filter(
    (piece) => piece.team === "red" && Object.keys(piece.position).length > 0
  ).length;
  if (yellowBombExists && redBombExists && yellowPiecesLength === 1 && redPiecesLength === 1)
    return "tie";
  if (!yellowBombExists || yellowPiecesLength <= 1) return "red";
  if (!redBombExists || redPiecesLength <= 1) return "yellow";
  const yellowMinerExists =
    Object.keys(pieces.find((piece) => piece.id === "miner" && piece.team === "yellow").position)
      .length > 0;
  const redMinerExists =
    Object.keys(pieces.find((piece) => piece.id === "miner" && piece.team === "red").position)
      .length > 0;
  if (!yellowMinerExists && !redMinerExists) return "tie";
  return null;
}

function getStartingPieces(placedPiecesInGame) {
  if (placedPiecesInGame.length === 16) return placedPiecesInGame;

  const startingGamePieces = [
    "bomb",
    "spy",
    "runner",
    "runner",
    "miner",
    "assassin",
    "killer",
    "mr_x",
  ];
  const yellowStartingPieces = startingGamePieces.map((piece) => ({
    id: piece,
    position: {},
    team: "yellow",
    hasFought: false,
  }));
  const redStartingPieces = startingGamePieces.map((piece) => ({
    id: piece,
    position: {},
    team: "red",
    hasFought: false,
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
module.exports = {
  movePiece,
  getStartingPieces,
  isGameOver,
};
