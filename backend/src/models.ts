export interface Field {
  fieldX: number;
  fieldY: number;
}

export interface Piece {
  id: string;
  field: Field;
  team: string;
  hasFought: boolean;
  dead: boolean;
  active: boolean;
}

export interface Move {
  from: Field;
  to: Field;
}

export interface Game {
  gameId: string;
  yellowPlayerId: string | null;
  redPlayerId: string | null;
  yellowPlayerReady: boolean;
  redPlayerReady: boolean;
  yellowPlayerTime: number;
  redPlayerTime: number;
  turn: string;
  pieces: Piece[];
  gameOver: boolean;
}
