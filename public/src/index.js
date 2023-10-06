const tileSize = 128;
const nFieldsWidth = 4;
const nFieldsHeight = 5;

class GamePiece extends createjs.Container {
  constructor(characterID, field, pieceTeam) {
    super();
    this.characterID = characterID;
    this.moveToField(field.x, field.y);
    this.isSelected = false;

    this.team = pieceTeam;
    if (this.team === clientTeam)
      this.bitmapImage = new createjs.Bitmap(loader.getResult(`${this.characterID}-${this.team}`));
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
      } else if (isFieldOccupied !== undefined) {
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
      } else if (isFieldOccupied !== undefined) {
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
      } else if (isFieldOccupied !== undefined) {
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
      } else if (isFieldOccupied !== undefined) {
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
  for (const piece of pieceContainer.children) {
    if (piece.field.x == fieldX && piece.field.y == fieldY) return piece.team;
  }
  return undefined;
}

function selectPiece(fieldX, fieldY) {
  deselectAllPieces();

  for (const piece of pieceContainer.children) {
    if (piece.field.x == fieldX && piece.field.y == fieldY && clientTeam == piece.team) {
      piece.isSelected = true;
      possibleMovesRenderer.render(piece.getPossibleMoves());
      mainStage.update();
    }
  }
}

function deselectAllPieces() {
  possibleMovesRenderer.removeAllChildren();
  pieceContainer.children.forEach((piece) => (piece.isSelected = false));
  mainStage.update();
}

function clickedOnField(evt) {
  if (!clientTeam) return;

  const clickedField = {
    x: Math.floor(evt.stageX / tileSize),
    y: Math.floor(evt.stageY / tileSize),
  };

  // PLACING
  if (!gameStarted) {
    if (clientCharacterSpace.selectedPiece !== undefined) {
      const fieldIsOccupied =
        pieceContainer.children
          .map((piece) => piece.field)
          .filter((field) => clickedField.x === field.x && clickedField.y === field.y).length > 0;
      if (!fieldIsOccupied) {
        pieceContainer.addChild(
          new GamePiece(clientCharacterSpace.selectedPiece.characterID, clickedField, clientTeam)
        );
        clientCharacterSpace.removeChild(clientCharacterSpace.selectedPiece);
        clientCharacterSpace.update();
        clientCharacterSpace.selectedPiece = undefined;
        mainStage.update();
        if (clientCharacterSpace.children.length === 0) {
          const packagePieces = [];
          pieceContainer.children
            .filter((piece) => piece.team === clientTeam)
            .forEach((piece) =>
              packagePieces.push({ id: piece.characterID, position: piece.field, team: piece.team })
            );
          socket.emit("allPiecesPlaced", packagePieces);
        }
      }
    }
    return;
  }

  // MOVING
  for (const piece of pieceContainer.children) {
    if (piece.isSelected === true) {
      if (
        possibleMovesRenderer.possibleMovesList.find(
          (element) => element.x == clickedField.x && element.y == clickedField.y
        ) !== undefined
      ) {
        socket.emit("pieceMoved", {
          from: { x: piece.field.x, y: piece.field.y },
          to: { x: clickedField.x, y: clickedField.y },
        });
        piece.moveToField(clickedField.x, clickedField.y);
        deselectAllPieces();
        return;
      }
    }
  }

  // SELECTING
  if (currentTurn === clientTeam) selectPiece(clickedField.x, clickedField.y);
}

function selectUnplacedPiece(evt) {
  if (!gameStarted)
    for (const unplacedPiece of clientCharacterSpace.children) {
      if (
        evt.stageX > unplacedPiece.x - 8 &&
        evt.stageY > unplacedPiece.y - 8 &&
        evt.stageX < unplacedPiece.x + 64 + 8 &&
        evt.stageY < unplacedPiece.y + 64 + 8
      ) {
        clientCharacterSpace.selectedPiece = unplacedPiece;
      }
    }
}

function drawGameField() {
  const board = new createjs.Shape();
  for (let x = 1; x < nFieldsWidth; x++) {
    board.graphics
      .setStrokeStyle(1)
      .beginStroke("#000000")
      .moveTo(tileSize * x, 0)
      .lineTo(tileSize * x, nFieldsHeight * tileSize);
  }
  for (let y = 1; y < nFieldsHeight; y++) {
    board.graphics
      .setStrokeStyle(1)
      .beginStroke("#000000")
      .moveTo(0, tileSize * y)
      .lineTo(nFieldsHeight * tileSize, tileSize * y);
  }
  mainStage.addChild(board);
  mainStage.update();
}

function updatePieces(pieces) {
  pieceContainer.removeAllChildren();
  possibleMovesRenderer.removeAllChildren();
  const addPiecesToCharacterSpace = clientCharacterSpace.children.length === 0;
  pieces.forEach((piece) => {
    if (Object.keys(piece.position).length !== 0)
      pieceContainer.addChild(new GamePiece(piece.id, piece.position, piece.team));
    else if (piece.team === clientTeam && addPiecesToCharacterSpace) {
      const unplacedPiece = new createjs.Container();
      unplacedPiece.addChild(new createjs.Bitmap(loader.getResult(`${piece.id}-${piece.team}`)));
      unplacedPiece.x = 16 + clientCharacterSpace.children.length * 96;
      unplacedPiece.y = 16;
      unplacedPiece.characterID = piece.id;
      clientCharacterSpace.addChild(unplacedPiece);
    }
  });
  mainStage.update();
  clientCharacterSpace.update();
}

// ------------ ENTRY POINT ------------
function init() {
  // Global client variables
  mainStage = new createjs.Stage("gameCanvas");
  clientCharacterSpace = new createjs.Stage("characterCanvas");
  loader = new createjs.LoadQueue(false);
  pieceContainer = new createjs.Container();
  possibleMovesRenderer = new possibleMovesContainer();
  clientTeam = undefined;
  currentTurn = undefined;
  gameStarted = false;

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
  socket.on("updatePlayerTurn", (updatedTurn) => (currentTurn = updatedTurn));
  socket.on("assignTeam", (assignedTeam) => (clientTeam = assignedTeam));
  socket.on("startGame", () => (gameStarted = true));
}

function renderGame() {
  drawGameField();
  mainStage.addChild(pieceContainer);
  mainStage.addChild(possibleMovesRenderer);
  mainStage.on("stagemousedown", (evt) => clickedOnField(evt));
  clientCharacterSpace.on("stagemousedown", (evt) => selectUnplacedPiece(evt));
  mainStage.update();
  connectToServer();
}