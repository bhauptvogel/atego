

function movePiece(pieces, move) {
  for (const piece of pieces) {
    if (piece.position.x == move.from.x && piece.position.y == move.from.y) {
      // TODO: Move Validation (no piece of same team on field & move possible by character)
      piece.position = move.to;
      return pieces;
    }
  }
  throw new Error("No piece was moved!");

}

module.exports = {
    movePiece
}