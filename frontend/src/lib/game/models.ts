export interface Field {
  fieldX: number;
  fieldY: number;
}
export interface gameState {
  heroTeam: string;
  gameStarted: boolean;
  gameOver: string;
  currentTurn: string;
}

export interface Piece {
  id: string;
  field: Field;
  team: string;
  hasFought: boolean;
  alive: boolean;
  active: boolean;
}

// export interface Move {
//   from: Field;
//   to: Field;
// }
