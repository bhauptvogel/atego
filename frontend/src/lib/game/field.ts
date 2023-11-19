import * as createjs from "createjs-module";

export function drawGameField(
  mainStage: createjs.Stage,
  nFieldsWidth: number,
  nFieldsHeight: number,
  tileSize: number
): void {
  const board: createjs.Shape = new createjs.Shape();
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
}
