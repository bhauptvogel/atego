export interface Field {
  fieldX: number;
  fieldY: number;
}

// TODO: refactor: remove hasFought, alive, active (search for more elegant solution)
export interface Piece {
  id: string;
  field: Field;
  team: string;
  exposed: boolean;
  alive: boolean;
}

export interface Move {
  from: Field;
  to: Field;
}

export interface Game {
  gameId: string;
  socketIdYellow: string | null;
  socketIdRed: string | null;
  playerUUIDYellow: string | null;
  playerUUIDRed: string | null;
  yellowPlayerReady: boolean;
  redPlayerReady: boolean;
  yellowPlayerTime: number;
  redPlayerTime: number;
  turn: string;
  pieces: Piece[];
  started: boolean;
  gameOver: boolean;
}
