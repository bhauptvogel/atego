const characters = require("./characters");

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
        const movingPieceCharacter = characters.characters.find(
          (character) => character.id === piece.id
        );
        const targetPieceCharacter = characters.characters.find(
          (character) => character.id === targetFieldPiece.id
        );
        piece.position = move.to;
        if (movingPieceCharacter.n === targetPieceCharacter.n)
          return pieces.filter((p) => p !== piece && p !== targetFieldPiece);
        else if (movingPieceCharacter.beats.includes(targetPieceCharacter.n))
          return pieces.filter((p) => p !== targetFieldPiece);
        else if (targetPieceCharacter.beats.includes(movingPieceCharacter.n)) return pieces.filter((p) => p !== piece);
        else throw new Error("fighting: Nobody dies which is not allowed in a fight!");
      }

      piece.position = move.to;
      return pieces;
    }
  }
  throw new Error("No piece was moved!");
}

module.exports = {
  movePiece,
};