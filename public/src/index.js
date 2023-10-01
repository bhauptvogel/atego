const tileSize = 128;
const nFieldsWidth = 4;
const nFieldsHeight = 5;

class Piece extends createjs.Container {
  constructor(characterID, field, pieceTeam) {
    super();
    this.characterID = characterID;
    this.moveToField(field.x, field.y);
    this.isSelected = false;

    this.team = pieceTeam;
    if (this.team === team) this.bitmapImage = new createjs.Bitmap(loader.getResult(`${this.characterID}-${this.team}`));
    else this.bitmapImage = new createjs.Bitmap(loader.getResult(`unknown-${this.team}`));

    this.addChild(this.bitmapImage);
  }

  moveToField(fieldX, fieldY) {
    this.x = fieldX * tileSize + tileSize / 4;
    this.y = fieldY * tileSize + tileSize / 4;
    this.field = { x: fieldX, y: fieldY };
  }

  getPossibleMoves() {
    const possibleMoves = [];
    const maxMoves = this.characterID === "bomb" ? 0 : this.characterID === "runner" ? 1000 : 1;

    // right
    for (let i = this.field.x + 1; i < nFieldsWidth; i++) {
      const isFieldOccupied = fieldOccupiedByTeam(i, this.field.y);
      if (i > this.field.x + maxMoves) {
        break;
      } else if (isFieldOccupied !== false) {
        if (isFieldOccupied !== this.team) possibleMoves.push({ x: i, y: this.field.y });
        break;
      } else {
        possibleMoves.push({ x: i, y: this.field.y });
      }
    }
    // left
    for (let i = this.field.x - 1; i >= 0; i--) {
      const isFieldOccupied = fieldOccupiedByTeam(i, this.field.y);
      if (i < this.field.x - maxMoves) {
        break;
      } else if (isFieldOccupied !== false) {
        if (isFieldOccupied !== this.team) possibleMoves.push({ x: i, y: this.field.y });
        break;
      } else {
        possibleMoves.push({ x: i, y: this.field.y });
      }
    }
    // up
    for (let i = this.field.y + 1; i < nFieldsHeight; i++) {
      const isFieldOccupied = fieldOccupiedByTeam(this.field.x, i);
      if (i > this.field.y + maxMoves) {
        break;
      } else if (isFieldOccupied !== false) {
        if (isFieldOccupied !== this.team) possibleMoves.push({ x: this.field.x, y: i });
        break;
      } else {
        possibleMoves.push({ x: this.field.x, y: i });
      }
    }
    // down
    for (let i = this.field.y - 1; i >= 0; i--) {
      const isFieldOccupied = fieldOccupiedByTeam(this.field.x, i);
      if (i < this.field.y - maxMoves) {
        break;
      } else if (isFieldOccupied !== false) {
        if (isFieldOccupied !== this.team) possibleMoves.push({ x: this.field.x, y: i });
        break;
      } else {
        possibleMoves.push({ x: this.field.x, y: i });
      }
    }

    return possibleMoves;
  }
}

class possibleMovesContainer extends createjs.Container {
  constructor() {
    super();
  }

  render(possibleMovesList) {
    this.possibleMovesList = possibleMovesList;
    this.removeAllChildren();
    for (let i = 0; i < possibleMovesList.length; i++) {
      const circle = new createjs.Shape();
      const radius = 10;
      const x = possibleMovesList[i].x * tileSize + tileSize / 2;
      const y = possibleMovesList[i].y * tileSize + tileSize / 2;
      const color = fieldOccupiedByTeam(possibleMovesList[i].x, possibleMovesList[i].y)
        ? "orange"
        : "green";
      circle.graphics.beginFill(color).drawCircle(x, y, radius);
      this.addChild(circle);
    }
  }
}

function fieldOccupiedByTeam(fieldX, fieldY) {
  let output = false;
  pieceContainer.children.forEach((piece) => {
    if (piece.field.x == fieldX && piece.field.y == fieldY) {
      output = piece.team;
      return;
    }
  });
  return output;
}

function selectPiece(fieldX, fieldY) {
  deselectAllPieces();

  pieceContainer.children.forEach((piece) => {
    if (piece.field.x == fieldX && piece.field.y == fieldY && team == piece.team) {
      piece.isSelected = true;
      possibleMovesRenderer.render(piece.getPossibleMoves());
      stage.update(); // maybe remove
    }
  });
}

function deselectAllPieces() {
  possibleMovesRenderer.removeAllChildren();
  pieceContainer.children.forEach((piece) => {
    piece.isSelected = false;
  });
  stage.update();
}

function clickedOnField(evt) {
  if (!team) return;

  const fieldX = Math.floor(evt.stageX / tileSize);
  const fieldY = Math.floor(evt.stageY / tileSize);

  // MOVING
  let pieceMoved = false;
  pieceContainer.children.forEach((piece) => {
    if (piece.isSelected === true) {
      if (
        possibleMovesRenderer.possibleMovesList.find(
          (element) => element.x == fieldX && element.y == fieldY
        ) !== undefined
      ) {
        socket.emit("pieceMoved", {
          from: { x: piece.field.x, y: piece.field.y },
          to: { x: fieldX, y: fieldY },
        });
        piece.moveToField(fieldX, fieldY);
        deselectAllPieces();
        pieceMoved = true;
      }
    }
  });

  // SELECTING
  if (!pieceMoved) selectPiece(fieldX, fieldY);
}

function drawGameField() {
  line = new createjs.Shape();
  for (let x = 1; x < nFieldsWidth; x++) {
    line.graphics
      .setStrokeStyle(1)
      .beginStroke("#000000")
      .moveTo(tileSize * x, 0)
      .lineTo(tileSize * x, nFieldsHeight * tileSize);
  }
  for (let y = 1; y < nFieldsHeight; y++) {
    line.graphics
      .setStrokeStyle(1)
      .beginStroke("#000000")
      .moveTo(0, tileSize * y)
      .lineTo(nFieldsHeight * tileSize, tileSize * y);
  }
  stage.addChild(line);
  stage.update();
}

// ------------ ENTRY POINT ------------
function init() {
  stage = new createjs.Stage("gameCanvas");
  loader = new createjs.LoadQueue(false);
  pieceContainer = new createjs.Container();
  possibleMovesRenderer = new possibleMovesContainer();
  team = undefined;

  const manifest = ["bomb", "spy", "runner", "miner", "assassin", "killer", "mr_x", "unknown"]
    .map((char) => [
      { id: char + "-yellow", src: `${char}-yellow.png` },
      { id: char + "-red", src: `${char}-red.png` },
    ])
    .flat();
  loader.addEventListener("complete", renderGame);
  loader.loadManifest(manifest, true, "/assets/");
}

function connectToServer() {
  socket = io();
  const url = new URL(window.location.href);
  const urlSegments = url.pathname.split("/");
  gameId = urlSegments[2];
  socket.emit("joinGame", gameId);
  console.log(`Client: Joined Game (gameID=${gameId})`);

  // DEFINING EVENTS
  socket.on("updatePieces", (pieces) => updatePieces(pieces));
  socket.on("assignTeam", (assignedTeam) => (team = assignedTeam));
}

function renderGame() {
  drawGameField();
  stage.addChild(pieceContainer);
  stage.addChild(possibleMovesRenderer);
  stage.on("stagemousedown", (evt) => clickedOnField(evt));
  stage.update();
  connectToServer();
}

function updatePieces(pieces) {
  pieceContainer.removeAllChildren();
  possibleMovesRenderer.removeAllChildren();
  pieces.forEach((piece) =>
    pieceContainer.addChild(new Piece(piece.id, piece.position, piece.team))
  );
  stage.update();
}
