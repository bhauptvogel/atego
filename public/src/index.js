const characters = [
  {
    n: 0,
    id: "bomb",
    beats: [1, 2, 4, 5, 6],
  },
  {
    n: 1,
    id: "spy",
    beats: [6],
  },
  {
    n: 2,
    id: "runner",
    beats: [1],
  },
  {
    n: 3,
    id: "miner",
    beats: [0, 1, 2],
  },
  {
    n: 4,
    id: "assassin",
    beats: [1, 2, 3],
  },
  {
    n: 5,
    id: "killer",
    beats: [1, 2, 3, 4],
  },
  {
    n: 6,
    id: "mr_x",
    beats: [2, 3, 4, 5],
  },
];

const tileSize = 128;
const nFieldsWidth = 4;
const nFieldsHeight = 5;

class Figure extends createjs.Container {
  constructor(characterID, field, team) {
    super();
    // this.bitmapImage = new createjs.Bitmap(loader.getResult(`${characterID}_${team}`));
    // this.addChild(this.bitmapImage);
    this.characterID = characterID;
    this.moveToField(field.x, field.y);
    this.isSelected = false;

    this.team = team;
    this.loadImage();
  }

  loadImage() {
    this.removeChild(this.bitmapImage);
    this.bitmapImage = new createjs.Bitmap(loader.getResult(`${this.characterID}_${this.team}`));
    this.addChild(this.bitmapImage);
  }

  delete() {
    this.removeAllChildren();
  }

  moveToField(x, y) {
    this.x = x * tileSize + tileSize / 4;
    this.y = y * tileSize + tileSize / 4;
    this.field = { x: x, y: y };
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
      const color = fieldOccupiedByTeam(possibleMovesList[i].x, possibleMovesList[i].y) ? "orange" : "green";
      circle.graphics.beginFill(color).drawCircle(x, y, radius);
      this.addChild(circle);
    }
  }
}

function fieldOccupiedByTeam(fieldX, fieldY) {
  figureContainer.children.forEach((figure) => {
    if (figure.field.x == fieldX && figure.field.y == fieldY) {
      return figure.team;
    }
  });
  return false;
}

function selectFigure(fieldX, fieldY) {
  deselectAllFigures();

  figureContainer.children.forEach((figure) => {
    if (figure.field.x == fieldX && figure.field.y == fieldY) {
      figure.isSelected = true;
      possibleMovesRenderer.render(figure.getPossibleMoves());
      stage.update(); // maybe remove
    }
  });
}

function figureStartsFight(movingFigureIndex) {
  const movingFigure = figureContainer.getChildAt(movingFigureIndex);
  const opponentTeam = movingFigure.team == "yellow" ? "red" : "yellow";
  for (
    let opponentFigureIndex = 0;
    opponentFigureIndex < figureContainer.children.length;
    opponentFigureIndex++
  ) {
    const opponentFigure = figureContainer.getChildAt(opponentFigureIndex);
    if (
      opponentFigure.team === opponentTeam &&
      opponentFigure.field.x === movingFigure.field.x &&
      opponentFigure.field.y === movingFigure.field.y
    ) {
      const movingFigureObj = characters.find((ch) => ch.id === movingFigure.characterID);
      const opponentFigureObj = characters.find((ch) => ch.id === opponentFigure.characterID);
      let indicesToDelete = [];
      if (movingFigureObj.n === opponentFigureObj.n) {
        indicesToDelete = [opponentFigureIndex, movingFigureIndex];
      } else if (movingFigureObj.beats.includes(opponentFigureObj.n)) {
        indicesToDelete = [opponentFigureIndex];
      } else if (opponentFigureObj.beats.includes(movingFigureObj.n)) {
        indicesToDelete = [movingFigureIndex];
      } else {
        throw new Error("figureStartsFight: Nobody dies which is not allowed in a fight!");
      }
      deleteCharactersAtIndices(indicesToDelete);
      break;
    }
  }
}

function deleteCharactersAtIndices(indicesToDelete) {
  indicesToDelete.sort((a, b) => b - a);
  indicesToDelete.forEach((index) => {
    figureContainer.removeChildAt(index);
  });
}

function moveSelectedFigure(selectedFigure, fieldX, fieldY) {
  for (const move of possibleMovesRenderer.possibleMovesList) {
    if (move.x == fieldX && move.y == fieldY) {
      socket.emit("figureMoved", {
        from: { x: selectedFigure.field.x, y: selectedFigure.field.y },
        to: { x: fieldX, y: fieldY },
      });
      selectedFigure.moveToField(move.x, move.y);
      if (fieldOccupiedByTeam(fieldX, fieldY) !== false) {
        figureStartsFight(selectedIndex);
      }
      deselectAllFigures();
      return true;
    }
  }
  return false;
}

function moveFigureFromTo(fromX, fromY, toX, toY) {
  figureContainer.children.forEach((figure) => {
    if (figure.field.x == fromX && figure.field.y == fromY) {
      figure.moveToField(toX, toY);
      if (fieldOccupiedByTeam(toX, toY) !== false) {
        figureStartsFight(i);
      }
      deselectAllFigures();
      return;
    }
    throw new Error(`Could not move Figure from (${fromX}, ${fromY}) to (${toX}, ${toY})`);
  });
}

function deselectAllFigures() {
  possibleMovesRenderer.removeAllChildren();
  figureContainer.children.forEach((figure) => {
    figure.isSelected = false;
  });
  stage.update();
}

function clickedOnField(evt) {
  const fieldX = Math.floor(evt.stageX / tileSize);
  const fieldY = Math.floor(evt.stageY / tileSize);

  let figureHasMoved = false;

  // MOVING
  figureContainer.children.forEach((figure) => {
    if (figure.isSelected === true) {
      const movePossible = moveSelectedFigure(figure, fieldX, fieldY);
      if (movePossible) figureHasMoved = true;
    }
  });

  // SELECTING
  if (!figureHasMoved) selectFigure(fieldX, fieldY);
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
  figureContainer = new createjs.Container();
  possibleMovesRenderer = new possibleMovesContainer();

  loader.addEventListener("complete", renderGame);
  loader.loadManifest(
    characters
      .map((char) => [
        { id: char.id + "_yellow", src: `${char.id}-goldenrod.png` },
        { id: char.id + "_red", src: `${char.id}-darkred.png` },
      ])
      .flat(),
    true,
    "/assets/"
  );

  connectToServer();
  stage.addChild(figureContainer);
}

function connectToServer() {
  socket = io();
  const url = new URL(window.location.href);
  const urlSegments = url.pathname.split("/");
  gameId = urlSegments[2];
  socket.emit("joinGame", gameId);
  console.log(`Client: Joined Game (gameID=${gameId})`);

  socket.on("loadFigures", (figures) => loadFigures(figures));
  socket.on("moveFigure", (move) => moveFigureFromTo(move.from.x, move.from.y, move.to.x, move.to.y));
}

function renderGame() {
  drawGameField();

  figureContainer.children.forEach((figure) => figure.loadImage());

  stage.addChild(possibleMovesRenderer);

  stage.on("stagemousedown", (evt) => clickedOnField(evt));

  stage.update();
}

function loadFigures(figures) {
  figureContainer.removeAllChildren();
  for (const figure of figures) {
    figureContainer.addChild(new Figure(figure.id, figure.position, figure.team));
  }
  stage.update();
}
