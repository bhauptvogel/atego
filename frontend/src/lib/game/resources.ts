import * as createjs from "createjs-module";

export class Resources {
  piecesManifest: { id: string; team: string; bitmap: createjs.Bitmap }[];
  loadedImages: number = 0;
  erroredImages: number = 0;

  constructor() {
    const ids = [
      "assassin",
      "bomb",
      "killer",
      "miner",
      "mr_x",
      "runner",
      "spy",
      "unknown",
    ];

    this.piecesManifest = ids.flatMap((id) => [
      this.createManifestEntry(id, "yellow"),
      this.createManifestEntry(id, "red"),
    ]);
  }

  private createManifestEntry(id: string, team: string) {
    const img = new Image();
    const bitmap = new createjs.Bitmap(img);
    return { id, team, bitmap };
  }

  loadResources(handleOnLoad: Function): void {
    const total = this.piecesManifest.length;

    const checkDone = () => {
      if (this.loadedImages + this.erroredImages === total) {
        handleOnLoad();
      }
    };

    this.piecesManifest.forEach((element) => {
      const img = element.bitmap.image as HTMLImageElement;

      if (img.complete && img.naturalWidth > 0) {
        this.loadedImages += 1;
        checkDone();
        return;
      }

      img.onload = () => {
        this.loadedImages += 1;
        checkDone();
      };
      img.onerror = () => {
        this.erroredImages += 1;
        console.warn(`Failed to load image: ${img.src}`);
        checkDone();
      };

      // Set src after handlers so cached images still fire onload
      img.src = `/pieces/${element.id}-${element.team}.png`;
    });
  }

  getPieceImageByIdAndTeam(id: string, team: string): createjs.Bitmap {
    const entry = this.piecesManifest.find(
      (element) => element.id === id && element.team === team
    );
    if (entry === undefined) throw new Error(`No image found with id ${id} and team ${team}`);
    return entry.bitmap.clone();
  }
}
