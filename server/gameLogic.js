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
  const yellowBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "yellow");
  const redBomb = pieces.find((piece) => piece.id === "bomb" && piece.team === "red");
  if (Object.keys(yellowBomb.position).length === 0) return "red";
  if (Object.keys(redBomb.position).length === 0) return "yellow";
  const yellowMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "yellow");
  const redMiner = pieces.find((piece) => piece.id === "miner" && piece.team === "red");
  if (Object.keys(yellowMiner.position).length === 0 && Object.keys(redMiner.position).length === 0)
    return "tie";
  return null;
}

module.exports = {
  movePiece,
  isGameOver,
};
