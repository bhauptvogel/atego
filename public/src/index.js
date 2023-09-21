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
    this.bitmapImage = new createjs.Bitmap(loader.getResult(`${characterID}_${team}`));
    this.addChild(this.bitmapImage);

    this.characterID = characterID;
    this.moveToField(field.x, field.y);
    this.isSelected = false;

    this.team = team;
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
      const color = fieldOccupiedByTeam(possibleMovesList[i].x, possibleMovesList[i].y)
        ? "orange"
        : "green";
      circle.graphics.beginFill(color).drawCircle(x, y, radius);
      this.addChild(circle);
    }
  }
}

function fieldOccupiedByTeam(fieldX, fieldY) {
  for (let i = 0; i < allFigures.length; i++) {
    if (allFigures[i].field.x == fieldX && allFigures[i].field.y == fieldY) {
      return allFigures[i].team;
    }
  }
  return false;
}

function selectFigure(fieldX, fieldY) {
  deselectAllFigures(allFigures, possibleMovesRenderer);

  for (let i = 0; i < allFigures.length; i++) {
    if (allFigures[i].field.x == fieldX && allFigures[i].field.y == fieldY) {
      allFigures[i].isSelected = true;
      possibleMovesRenderer.render(allFigures[i].getPossibleMoves());
      stage.update(); // maybe remove
      return true;
    }
  }
  return false;
}

function figureStartsFight(movingFigureIndex) {
  const opponentTeam = allFigures[movingFigureIndex].team == "yellow" ? "red" : "yellow";
  for (
    let opponentFigureIndex = 0;
    opponentFigureIndex < allFigures.length;
    opponentFigureIndex++
  ) {
    if (
      allFigures[opponentFigureIndex].team === opponentTeam &&
      allFigures[opponentFigureIndex].field.x === allFigures[movingFigureIndex].field.x &&
      allFigures[opponentFigureIndex].field.y === allFigures[movingFigureIndex].field.y
    ) {
      const movingFigureObj = characters.find(
        (ch) => ch.id === allFigures[movingFigureIndex].characterID
      );
      const opponentFigureObj = characters.find(
        (ch) => ch.id === allFigures[opponentFigureIndex].characterID
      );
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
    allFigures[index].delete();
    allFigures.splice(index, 1);
  });
}

function moveFigure(selectedIndex, fieldX, fieldY) {
  for (const move of possibleMovesRenderer.possibleMovesList) {
    if (move.x == fieldX && move.y == fieldY) {
      allFigures[selectedIndex].moveToField(move.x, move.y);
      if (fieldOccupiedByTeam(fieldX, fieldY) !== false) {
        figureStartsFight(selectedIndex);
      }
      deselectAllFigures(allFigures, possibleMovesRenderer);
      return true;
    }
  }
  return false;
}

function deselectAllFigures() {
  possibleMovesRenderer.removeAllChildren();
  for (let i = 0; i < allFigures.length; i++) {
    allFigures[i].isSelected = false;
  }
  stage.update();
}

function clickedOnField(evt) {
  const fieldX = Math.floor(evt.stageX / tileSize);
  const fieldY = Math.floor(evt.stageY / tileSize);

  // MOVING
  for (let i = 0; i < allFigures.length; i++) {
    if (allFigures[i].isSelected == true) {
      const movePossible = moveFigure(i, fieldX, fieldY);
      if (movePossible) return;
      else break;
    }
  }

  // SELECTING
  const selectPossible = selectFigure(fieldX, fieldY);
  if (selectPossible) return;
  else {
    deselectAllFigures();
  }
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
  const socket = io();
  stage = new createjs.Stage("gameCanvas");
  loader = new createjs.LoadQueue(false);
  loader.addEventListener("complete", startGame);
  loader.loadManifest(
    characters
      .map((char) => [
        { id: char.id + "_yellow", src: `${char.id}-goldenrod.png` },
        { id: char.id + "_red", src: `${char.id}-darkred.png` },
      ])
      .flat(),
    true,
    "./assets/"
  );
}

function startGame() {
  drawGameField();

  allFigures = [
    new Figure("bomb", { x: 0, y: 0 }, "yellow"),
    new Figure("spy", { x: 1, y: 0 }, "yellow"),
    new Figure("runner", { x: 2, y: 0 }, "yellow"),
    new Figure("runner", { x: 0, y: 1 }, "yellow"),
    new Figure("miner", { x: 3, y: 0 }, "yellow"),
    new Figure("assassin", { x: 1, y: 1 }, "yellow"),
    new Figure("killer", { x: 2, y: 1 }, "yellow"),
    new Figure("mr_x", { x: 3, y: 1 }, "yellow"),
    new Figure("bomb", { x: 0, y: 4 }, "red"),
    new Figure("spy", { x: 1, y: 4 }, "red"),
    new Figure("runner", { x: 2, y: 4 }, "red"),
    new Figure("runner", { x: 0, y: 3 }, "red"),
    new Figure("miner", { x: 3, y: 4 }, "red"),
    new Figure("assassin", { x: 1, y: 3 }, "red"),
    new Figure("killer", { x: 2, y: 3 }, "red"),
    new Figure("mr_x", { x: 3, y: 3 }, "red"),
  ];

  for (let i = 0; i < allFigures.length; i++) {
    stage.addChild(allFigures[i]);
  }

  possibleMovesRenderer = new possibleMovesContainer();
  stage.addChild(possibleMovesRenderer);

  stage.on("stagemousedown", (evt) => clickedOnField(evt));

  stage.update();
}
