import * as createjs from "createjs-module";

export class Resources {
  piecesManifest: { id: string; team: string; bitmap: createjs.Bitmap }[];
  loadedImages: number = 0;

  constructor() {
    this.piecesManifest = [
      "assassin",
      "bomb",
      "killer",
      "miner",
      "mr_x",
      "runner",
      "spy",
      "unknown",
    ]
      .map((element) => [
        {
          id: element,
          team: "yellow",
          bitmap: new createjs.Bitmap(`pieces/${element}-yellow.png`),
        },
        { id: element, team: "red", bitmap: new createjs.Bitmap(`pieces/${element}-red.png`) },
      ])
      .flat();
  }

  loadResources(handleOnLoad: Function): void {
    this.piecesManifest.forEach((element: any) => {
      element.bitmap.image.onload = (event: any) => {
        this.loadedImages += 1;
        if (this.loadedImages == this.piecesManifest.length) {
          handleOnLoad();
        }
      };
    });
  }

  getPieceImageByIdAndTeam(id: string, team: string): createjs.Bitmap {
    const image: createjs.Bitmap | undefined = this.piecesManifest.find(
      (element) => element.id === id && element.team === team
    )?.bitmap;
    if (image === undefined) throw new Error(`No image found with id ${id} and team ${team}`);
    return image.clone();
  }
}
