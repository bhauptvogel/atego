const nFieldsWidth = 4;
const nFieldsHeight = 5;

class GamePiece extends createjs.Container {
  constructor(characterID, field, pieceTeam, hasFought) {
    super();
    this.characterID = characterID;
    this.moveToField(field.x, field.y);
    this.isSelected = false;

    this.team = pieceTeam;
    if (this.team === heroTeam || hasFought)
      this.bitmapImage = new createjs.Bitmap(loader.getResult(`${this.characterID}-${this.team}`));
    else this.bitmapImage = new createjs.Bitmap(loader.getResult(`unknown-${this.team}`));

    this.addChild(this.bitmapImage);
  }

  moveToField(fieldX, fieldY) {
    this.x = flipFieldXIfRed(fieldX) * tileSize + tileSize / 4;
    this.y = flipFieldYIfRed(fieldY) * tileSize + tileSize / 4;
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
      const x = flipFieldXIfRed(possibleMovesList[i].x) * tileSize + tileSize / 2;
      const y = flipFieldYIfRed(possibleMovesList[i].y) * tileSize + tileSize / 2;
      const color = "#646669";
      if (fieldOccupiedByTeam(possibleMovesList[i].x, possibleMovesList[i].y))
        circle.graphics.beginFill(color);
      else circle.graphics.setStrokeStyle(2).beginStroke(color);
      circle.graphics.drawCircle(x, y, radius);
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
    if (piece.field.x == fieldX && piece.field.y == fieldY && heroTeam == piece.team) {
      piece.isSelected = true;
      possibleMovesRenderer.render(piece.getPossibleMoves());
      mainStage.update();
    }
  }
}

function flipFieldXIfRed(x) {
  if (heroTeam !== "red") return x;
  return nFieldsWidth - 1 - x;
}
function flipFieldYIfRed(y) {
  if (heroTeam !== "red") return y;
  return nFieldsHeight - 1 - y;
}

function deselectAllPieces() {
  possibleMovesRenderer.removeAllChildren();
  pieceContainer.children.forEach((piece) => (piece.isSelected = false));
  mainStage.update();
}

function clickedOnField(evt) {
  if (!heroTeam || gameOver) return;

  const clickedField = {
    x: flipFieldXIfRed(Math.floor(evt.stageX / tileSize)),
    y: flipFieldYIfRed(Math.floor(evt.stageY / tileSize)),
  };

  // PLACING
  if (!gameStarted) {
    if (heroCharacterSpace.selectedPiece !== undefined) {
      const fieldIsOccupied =
        pieceContainer.children
          .map((piece) => piece.field)
          .filter((field) => clickedField.x === field.x && clickedField.y === field.y).length > 0;
      const teamArea = { x: [0, 1, 2, 3], y: heroTeam === "red" ? [0, 1] : [3, 4] };
      const fieldIsInTeamArea =
        teamArea.x.includes(clickedField.x) && teamArea.y.includes(clickedField.y);
      if (!fieldIsOccupied && fieldIsInTeamArea) {
        pieceContainer.addChild(
          new GamePiece(heroCharacterSpace.selectedPiece.characterID, clickedField, heroTeam)
        );
        heroCharacterSpace.removeChild(heroCharacterSpace.selectedPiece);
        heroCharacterSpace.update();
        heroCharacterSpace.selectedPiece = undefined;
        mainStage.update();
        if (heroCharacterSpace.children.length === 0) {
          const packagePieces = [];
          pieceContainer.children
            .filter((piece) => piece.team === heroTeam)
            .forEach((piece) =>
              packagePieces.push({
                id: piece.characterID,
                position: piece.field,
                team: piece.team,
                hasFought: false,
              })
            );
          socket.emit("allPiecesPlaced", packagePieces);
          mainStage.removeChild(heroArea);
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
  if (currentTurn === heroTeam) selectPiece(clickedField.x, clickedField.y);
}

function clickedOnClientCharacterSpace(evt) {
  if (!gameStarted)
    for (const unplacedPiece of heroCharacterSpace.children) {
      if (
        evt.stageX > unplacedPiece.x - 8 &&
        evt.stageY > unplacedPiece.y - 8 &&
        evt.stageX < unplacedPiece.x + 64 + 8 &&
        evt.stageY < unplacedPiece.y + 64 + 8
      ) {
        heroCharacterSpace.selectedPiece = unplacedPiece;
      }
    }
}

function drawGameField() {
  const board = new createjs.Shape();
  for (let x = 1; x < nFieldsWidth; x++) {
    board.graphics
      .setStrokeStyle(1)
      .beginStroke("#646669")
      .moveTo(tileSize * x, 0)
      .lineTo(tileSize * x, nFieldsHeight * tileSize);
  }
  for (let y = 1; y < nFieldsHeight; y++) {
    board.graphics
      .setStrokeStyle(1)
      .beginStroke("#646669")
      .moveTo(0, tileSize * y)
      .lineTo(nFieldsHeight * tileSize, tileSize * y);
  }
  mainStage.addChild(board);
  mainStage.update();
}

function visualizeTeamArea() {
  if (!heroTeam) return;
  heroArea = new createjs.Shape();
  heroArea.graphics.beginFill("rgb(55, 61, 73, 0.4)");
  heroArea.graphics.drawRect(0, tileSize * 3, mainStage.canvas.width, tileSize * 2);
  mainStage.addChild(heroArea);
}

function updatePieces(pieces) {
  if (gameStarted) {
    pieceContainer.removeAllChildren();
    heroCharacterSpace.removeAllChildren();
    villainCharacterSpace.removeAllChildren();
    possibleMovesRenderer.removeAllChildren();
  } else if (
    pieces.filter((piece) => piece.team !== heroTeam && Object.keys(piece.position).length > 0)
      .length > 0
  )
    villainCharacterSpace.removeChild(textWaitingforOpponent);
  const heroCharacterSpaceIsEmpty = heroCharacterSpace.children.length === 0;
  pieces.forEach((piece) => {
    if (Object.keys(piece.position).length !== 0)
      pieceContainer.addChild(new GamePiece(piece.id, piece.position, piece.team, piece.hasFought));
    else if (
      (piece.team !== heroTeam && gameStarted) ||
      (piece.team === heroTeam && heroCharacterSpaceIsEmpty)
    )
      addPieceToSpace(piece.id, piece.team);
  });
  mainStage.update();
  heroCharacterSpace.update();
  villainCharacterSpace.update();
}

function drawWaitingForOpponent() {
  const opponentTeam = heroTeam === "red" ? "yellow" : "red";
  textWaitingforOpponent = new createjs.Text("Waiting for Opponent...", "25px Arial", opponentTeam);
  textWaitingforOpponent.textAlign = "center";
  textWaitingforOpponent.x = villainCharacterSpace.canvas.width / 2;
  textWaitingforOpponent.y = villainCharacterSpace.canvas.height / 2;
  if (pieceContainer.children.filter((piece) => piece.team === opponentTeam).length === 0)
    villainCharacterSpace.addChild(textWaitingforOpponent);
}

function addPieceToSpace(id, team) {
  const deadPiece = new createjs.Container();
  deadPiece.addChild(new createjs.Bitmap(loader.getResult(`${id}-${team}`)));
  const space = team === heroTeam ? heroCharacterSpace : villainCharacterSpace;
  deadPiece.x = 16 + space.children.length * 96;
  deadPiece.y = 16;
  deadPiece.characterID = id;
  space.addChild(deadPiece);
}

function visualizeEndOfGame(winningTeam) {
  gameOver = winningTeam;
  const endOfGameString =
    winningTeam === heroTeam ? "You win!" : winningTeam === "tie" ? "Tie!" : "You lose!";
  const endOfGameTextColor = winningTeam === heroTeam ? "green" : "black";
  const textEndOfGame = new createjs.Text(endOfGameString, "60px Arial", endOfGameTextColor);
  textEndOfGame.textAlign = "center";
  textEndOfGame.textBaseline = "middle";
  textEndOfGame.x = mainStage.canvas.width / 2;
  textEndOfGame.y = mainStage.canvas.height / 2;
  mainStage.addChild(textEndOfGame);
  mainStage.update();
}
// ------------ ENTRY POINT ------------
function init() {
  // Global client variables
  mainStage = new createjs.Stage("gameCanvas");
  if (mainStage.canvas.width * nFieldsHeight !== mainStage.canvas.height * nFieldsWidth)
    throw new Error(`Game has not correct dimensions (${nFieldsWidth} x ${nFieldsHeight})`);
  tileSize = mainStage.canvas.width / nFieldsWidth;
  heroCharacterSpace = new createjs.Stage("heroCharacterCanvas");
  villainCharacterSpace = new createjs.Stage("villainCharacterCanvas");
  loader = new createjs.LoadQueue(false);
  pieceContainer = new createjs.Container();
  possibleMovesRenderer = new possibleMovesContainer();
  heroTeam = undefined;
  currentTurn = undefined;
  gameStarted = false;
  gameOver = false;

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
  socket.on("assignTeam", (assignedTeam) => {
    heroTeam = assignedTeam;
    visualizeTeamArea();
    drawWaitingForOpponent();
  });
  socket.on("startGame", () => (gameStarted = true));
  socket.on("newDeadPiece", (piece) => addDeadPieceToSpace(piece));
  socket.on("gameOver", (winningTeam) => visualizeEndOfGame(winningTeam));
  socket.on("clockUpdate", (remainingPlayerTime) => updateClock(remainingPlayerTime, heroTeam, currentTurn, gameStarted));
}

function renderGame() {
  drawGameField();
  mainStage.addChild(pieceContainer);
  mainStage.addChild(possibleMovesRenderer);
  mainStage.on("stagemousedown", (evt) => clickedOnField(evt));
  heroCharacterSpace.on("stagemousedown", (evt) => clickedOnClientCharacterSpace(evt));
  mainStage.update();
  connectToServer();
}
