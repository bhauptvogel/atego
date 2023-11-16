interface Field {
  fieldX: number;
  fieldY: number;
}
interface gameState {
  heroTeam: string;
  gameStarted: boolean;
  gameOver: string;
  currentTurn: string;
}

interface Piece {
  id: string;
  field: Field;
  team: string;
  hasFought: boolean;
  alive: boolean;
  active: boolean;
}

interface Move {
  from: Field;
  to: Field;
}
