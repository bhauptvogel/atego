import * as createjs from "createjs-module";
import type { Resources } from "./resources";
import type { Field } from "./models";
import { flipFieldXIfRed, flipFieldYIfRed } from "./utils";

export class GamePiece extends createjs.Container {
  characterId: string;
  isSelected: boolean;
  team: string;
  image: createjs.Bitmap;
  field: Field;
  nFieldsWidth: number;
  nFieldsHeight: number;

  constructor(
    characterId: string,
    field: Field,
    pieceTeam: string,
    exposed: boolean,
    heroTeam: string,
    tileSize: number,
    nFieldsWidth: number,
    nFieldsHeight: number,
    resourceManager: Resources
  ) {
    super();

    this.characterId = characterId;
    this.team = pieceTeam;
    this.isSelected = false;

    this.nFieldsWidth = nFieldsWidth;
    this.nFieldsHeight = nFieldsHeight;

    this.field = field;
    this.updateXY(tileSize, heroTeam);

    let imageId: string = characterId;
    if (this.team !== heroTeam && exposed == false) imageId = "unknown";

    this.image = resourceManager.getPieceImageByIdAndTeam(imageId, this.team);
    if (this.image === undefined) throw new Error("Image not found!");

    this.addChild(this.image);
  }

  updateXY(tileSize: number, heroTeam: string): void {
    this.x =
      flipFieldXIfRed(this.field.fieldX, heroTeam, this.nFieldsWidth) * tileSize + tileSize / 4;
    this.y =
      flipFieldYIfRed(this.field.fieldY, heroTeam, this.nFieldsHeight) * tileSize + tileSize / 4;
  }

  getPossibleMoves(fieldOccupiedByTeam: Function): Field[] {
    const possibleMoves: Field[] = [];
    const maxMoves: number =
      this.characterId == "bomb" ? 0 : this.characterId == "runner" ? 1000 : 1;

    // right
    for (let i = this.field.fieldX + 1; i < this.nFieldsWidth; i++) {
      const fieldOccupied: string = fieldOccupiedByTeam({ fieldX: i, fieldY: this.field.fieldY });
      if (i > this.field.fieldX + maxMoves) {
        break;
      } else if (fieldOccupied != "") {
        if (fieldOccupied !== this.team)
          possibleMoves.push({ fieldX: i, fieldY: this.field.fieldY });
        break;
      } else {
        possibleMoves.push({ fieldX: i, fieldY: this.field.fieldY });
      }
    }
    // left
    for (let i = this.field.fieldX - 1; i >= 0; i--) {
      const fieldOccupied: string = fieldOccupiedByTeam({ fieldX: i, fieldY: this.field.fieldY });
      if (i < this.field.fieldX - maxMoves) {
        break;
      } else if (fieldOccupied != "") {
        if (fieldOccupied !== this.team)
          possibleMoves.push({ fieldX: i, fieldY: this.field.fieldY });
        break;
      } else {
        possibleMoves.push({ fieldX: i, fieldY: this.field.fieldY });
      }
    }
    // up
    for (let i = this.field.fieldY + 1; i < this.nFieldsHeight; i++) {
      const fieldOccupied: string = fieldOccupiedByTeam({ fieldX: this.field.fieldX, fieldY: i });
      if (i > this.field.fieldY + maxMoves) {
        break;
      } else if (fieldOccupied != "") {
        if (fieldOccupied !== this.team)
          possibleMoves.push({ fieldX: this.field.fieldX, fieldY: i });
        break;
      } else {
        possibleMoves.push({ fieldX: this.field.fieldX, fieldY: i });
      }
    }
    // down
    for (let i = this.field.fieldY - 1; i >= 0; i--) {
      const fieldOccupied: string = fieldOccupiedByTeam({ fieldX: this.field.fieldX, fieldY: i });
      if (i < this.field.fieldY - maxMoves) {
        break;
      } else if (fieldOccupied != "") {
        if (fieldOccupied !== this.team)
          possibleMoves.push({ fieldX: this.field.fieldX, fieldY: i });
        break;
      } else {
        possibleMoves.push({ fieldX: this.field.fieldX, fieldY: i });
      }
    }

    return possibleMoves;
  }
}
