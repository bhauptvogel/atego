<script lang="ts">
  import { page } from "$app/stores";
  import io, { Socket } from "socket.io-client";
  import { onMount } from "svelte";
  import * as createjs from "createjs-module";

  interface Field {
    fieldX: number;
    fieldY: number;
  }
  interface gameState {
    heroTeam: string;
    gameStarted: boolean;
    gameOver: string;
    currentTurn: string;
  }

  interface Piece {
    id: string;
    field: Field;
    team: string;
    hasFought: boolean;
    dead: boolean;
    active: boolean;
  }

  interface Move {
    from: Field;
    to: Field;
  }

  const gameId: string = $page.params.gameId;
  const nFieldsWidth: number = 4;
  const nFieldsHeight: number = 5;
  let piecesManifest: { id: string; team: string; bitmap: createjs.Bitmap }[];
  let mainStageWidth: number;
  let mainStageHeight: number;
  let socket: Socket;
  let mainStage: createjs.Stage;
  let heroCharacterSpace: createjs.Stage;
  let villainCharacterSpace: createjs.Stage;
  let tileSize: number = 128;
  let pieceContainer: createjs.Container;
  let heroArea: createjs.Shape;
  let possibleMovesContainer: createjs.Container;
  let textWaitingforOpponent: createjs.Text;
  let state: gameState = {
    heroTeam: "",
    gameStarted: false,
    gameOver: "",
    currentTurn: "",
  };

  onMount(() => {
    mainStage = new createjs.Stage("gameCanvas");
    mainStageWidth = (mainStage.canvas as HTMLCanvasElement).width;
    mainStageHeight = (mainStage.canvas as HTMLCanvasElement).height;
    if (mainStageWidth * nFieldsHeight !== mainStageHeight * nFieldsWidth)
      throw new Error(`Game has not correct dimensions (${nFieldsWidth} x ${nFieldsHeight})`);
    tileSize = mainStageWidth / nFieldsWidth;
    heroCharacterSpace = new createjs.Stage("heroCharacterCanvas");
    villainCharacterSpace = new createjs.Stage("villainCharacterCanvas");
    pieceContainer = new createjs.Container();
    possibleMovesContainer = new createjs.Container();
    loadImages();
  });

  function loadImages(): void {
    piecesManifest = ["assassin", "bomb", "killer", "miner", "mr_x", "runner", "spy", "unknown"]
      .map((element) => [
        {
          id: element,
          team: "yellow",
          bitmap: new createjs.Bitmap(`pieces/${element}-yellow.png`),
        },
        { id: element, team: "red", bitmap: new createjs.Bitmap(`pieces/${element}-red.png`) },
      ])
      .flat();
    piecesManifest.forEach((element: any) => {
      element.bitmap.image.onload = handleLoad;
    });
  }

  let loadedImages: number = 0;
  function handleLoad(event: any): void {
    loadedImages += 1;
    if (loadedImages == piecesManifest.length) {
      allImagesLoaded();
    }
  }

  function allImagesLoaded(): void {
    drawGameField();
    mainStage.addChild(pieceContainer);
    mainStage.addChild(possibleMovesContainer);
    mainStage.on("stagemousedown", (eventObj: Object) => {
      clickedOnField(eventObj as createjs.MouseEvent);
    });
    heroCharacterSpace.on("stagemousedown", (eventObj: Object) => {
      clickedOnClientCharacterSpace(eventObj as createjs.MouseEvent);
    });
    mainStage.update();
    connectToServer();
  }

  function connectToServer(): void {
    socket = io("http://localhost:8000/");
    socket.emit("joinGame", gameId);

    // socket.on("connect", () => console.log(`Successfully connected to the server!`));
    socket.on("updatePieces", (pieces) => updatePieces(pieces));
    socket.on("updatePlayerTurn", (updatedTurn: string) => (state.currentTurn = updatedTurn));
    socket.on("assignTeam", (assignedTeam: string) => assignTeam(assignedTeam));
    socket.on("startGame", () => (state.gameStarted = true));
    // socket.on("newDeadPiece", (piece) => addDeadPieceToSpace(piece));
    socket.on("gameOver", (winningTeam) => visualizeEndOfGame(winningTeam));
    socket.on("clockUpdate", (remainingPlayerTime) => updateClock(remainingPlayerTime));
  }

  function addDeadPieceToSpace(characterID: string, team: string): void {
    const deadPiece: GamePiece = new GamePiece(
      characterID,
      { fieldX: -1, fieldY: -1 },
      team,
      false
    );
    const space: createjs.Stage =
      team === state.heroTeam ? heroCharacterSpace : villainCharacterSpace;
    deadPiece.x = 16 + space.children.length * 96;
    deadPiece.y = 16;
    space.addChild(deadPiece);
  }

  function updatePieces(pieces: Piece[]): void {
    if (state.gameStarted == true) {
      pieceContainer.removeAllChildren();
      heroCharacterSpace.removeAllChildren();
      villainCharacterSpace.removeAllChildren();
      possibleMovesContainer.removeAllChildren();
    } else if (
      pieces.filter((piece) => piece.team !== state.heroTeam && piece.dead == false).length > 0
    ) {
      villainCharacterSpace.removeChild(textWaitingforOpponent);
    }
    pieces.forEach((piece) => {
      if (piece.active == true)
        pieceContainer.addChild(new GamePiece(piece.id, piece.field, piece.team, piece.hasFought));
      else if (
        (piece.dead === true && state.gameStarted == true) ||
        (state.gameStarted == false && piece.team === state.heroTeam && piece.active == false)
      )
        addDeadPieceToSpace(piece.id, piece.team);
    });
    mainStage.update();
    heroCharacterSpace.update();
    villainCharacterSpace.update();
  }

  function assignTeam(assignedTeam: string): void {
    state.heroTeam = assignedTeam;
    visualizeTeamArea();
    drawWaitingForOpponent();
    teamAssignClock();
  }

  //   function addDeadPieceToSpace(piece: any): void {}

  function visualizeEndOfGame(winningTeam: string): void {
    state.gameOver = winningTeam;
    const endOfGameString: string =
      winningTeam === state.heroTeam ? "You win!" : winningTeam === "tie" ? "Tie!" : "You lose!";
    const endOfGameTextColor: string = winningTeam === state.heroTeam ? "green" : "black";
    const textEndOfGame: createjs.Text = new createjs.Text(
      endOfGameString,
      "60px Arial",
      endOfGameTextColor
    );
    textEndOfGame.textAlign = "center";
    textEndOfGame.textBaseline = "middle";
    textEndOfGame.x = mainStageWidth / 2;
    textEndOfGame.y = mainStageHeight / 2;
    mainStage.addChild(textEndOfGame);
    mainStage.update();
  }

  function updateClock(remainingPlayerTime: number): void {}

  function teamAssignClock(): void {}

  function visualizeTeamArea(): void {
    if (state.heroTeam == "") return;
    heroArea = new createjs.Shape();
    heroArea.graphics.beginFill("rgb(55, 61, 73, 0.4)");
    heroArea.graphics.drawRect(0, tileSize * 3, mainStageWidth, tileSize * 2);
    mainStage.addChild(heroArea);
  }

  function drawWaitingForOpponent(): void {
    const opponentTeam: string = state.heroTeam === "red" ? "yellow" : "red";
    textWaitingforOpponent = new createjs.Text(
      "Waiting for Opponent...",
      "25px Arial",
      opponentTeam
    );
    textWaitingforOpponent.textAlign = "center";
    textWaitingforOpponent.x = (villainCharacterSpace.canvas as HTMLCanvasElement).width / 2;
    textWaitingforOpponent.y = (villainCharacterSpace.canvas as HTMLCanvasElement).height / 2;
    if (
      pieceContainer.children.filter(
        (piece) => piece instanceof GamePiece && piece.team === opponentTeam
      ).length === 0
    )
      villainCharacterSpace.addChild(textWaitingforOpponent);
  }

  function getSelectedPiecesOfHeroCharacterSpace(): GamePiece | undefined {
    for (const piece of heroCharacterSpace.children) {
      if (piece instanceof GamePiece && piece.isSelected) return piece;
    }
    return undefined;
  }

  function deselectAllPiecesOfHeroCharacterSpace(): void {
    for (const piece of heroCharacterSpace.children) {
      if (piece instanceof GamePiece) piece.isSelected = false;
    }
  }

  function allPiecesPlaced(): void {
    const packagePieces = [];

    for (const piece of pieceContainer.children) {
      if (piece instanceof GamePiece && piece.team == state.heroTeam) {
        const packagedPiece: Piece = {
          id: piece.characterId,
          field: piece.field,
          team: piece.team,
          hasFought: false,
          dead: false,
          active: true,
        };
        packagePieces.push(packagedPiece);
      }
    }
    socket.emit("allPiecesPlaced", packagePieces);
    mainStage.removeChild(heroArea);
  }

  function deselectAllPieces(): void {
    possibleMovesContainer.removeAllChildren();
    for (const piece of pieceContainer.children) {
      if (piece instanceof GamePiece) piece.isSelected = false;
    }
    mainStage.update();
  }

  function selectPiece(field: Field): void {
    deselectAllPieces();

    for (const piece of pieceContainer.children) {
      if (
        piece instanceof GamePiece &&
        piece.field.fieldX == field.fieldX &&
        piece.field.fieldX == field.fieldX &&
        state.heroTeam == piece.team
      ) {
        piece.isSelected = true;
        renderPossibleMoves(piece.getPossibleMoves());
        mainStage.update();
      }
    }
  }

  function renderPossibleMoves(possibleMovesList: Field[]): void {
    possibleMovesContainer.removeAllChildren();
    for (const possibleMove of possibleMovesList) {
      const circle: createjs.Shape = new createjs.Shape();
      const radius: number = 10;
      const x: number = flipFieldYIfRed(possibleMove.fieldX) * tileSize + tileSize / 2;
      const y: number = flipFieldYIfRed(possibleMove.fieldY) * tileSize + tileSize / 2;
      const color: string = "#646669";
      if (fieldOccupiedByTeam(possibleMove) !== "") circle.graphics.beginFill(color);
      else circle.graphics.setStrokeStyle(2).beginStroke(color);
      circle.graphics.drawCircle(x, y, radius);
      possibleMovesContainer.addChild(circle);
    }
  }

  function clickedOnField(evt: createjs.MouseEvent): void {
    if (state.heroTeam == "" || state.gameOver != "") return;

    const clickedField: Field = {
      fieldX: flipfieldXIfRed(Math.floor(evt.stageX / tileSize)),
      fieldY: flipFieldYIfRed(Math.floor(evt.stageY / tileSize)),
    };

    // Placing
    if (state.gameStarted == false) {
      const selectedPiecesOfHeroCharacterSpace: GamePiece | undefined =
        getSelectedPiecesOfHeroCharacterSpace();
      if (selectedPiecesOfHeroCharacterSpace != undefined) {
        let fieldIsOccupied: boolean = false;
        for (const piece of pieceContainer.children) {
          if (
            piece instanceof GamePiece &&
            piece.field.fieldX == clickedField.fieldX &&
            piece.field.fieldY == clickedField.fieldY
          )
            fieldIsOccupied = true;
        }
        const teamAreaX: number[] = [0, 1, 2, 3];
        const teamAreaY: number[] = state.heroTeam === "red" ? [0, 1] : [3, 4];
        const fieldIsInTeamArea: boolean =
          teamAreaX.includes(clickedField.fieldX) && teamAreaY.includes(clickedField.fieldY);
        if (fieldIsOccupied == false && fieldIsInTeamArea == true) {
          pieceContainer.addChild(
            new GamePiece(
              selectedPiecesOfHeroCharacterSpace.characterId,
              clickedField,
              state.heroTeam,
              false
            )
          );
          heroCharacterSpace.removeChild(selectedPiecesOfHeroCharacterSpace);
          if (heroCharacterSpace.children.length == 0) allPiecesPlaced();
          heroCharacterSpace.update();
          deselectAllPiecesOfHeroCharacterSpace();
          mainStage.update();
        }
      }
    }

    // Moving
    for (const piece of pieceContainer.children) {
      if (piece instanceof GamePiece && piece.isSelected == true) {
        if (
          piece
            .getPossibleMoves()
            .find(
              (field) => field.fieldX == clickedField.fieldX && field.fieldY == clickedField.fieldY
            ) !== undefined
        ) {
          socket.emit("pieceMoved", {
            from: { x: piece.field.fieldX, y: piece.field.fieldY },
            to: { x: clickedField.fieldX, y: clickedField.fieldY },
          });
          piece.field = clickedField;
          piece.updateXY();
          deselectAllPieces();
          return;
        }
      }
    }

    // Selecting
    if (state.currentTurn == state.heroTeam) selectPiece(clickedField);
  }

  function clickedOnClientCharacterSpace(evt: createjs.MouseEvent): void {
    if (state.gameStarted == false) {
      deselectAllPiecesOfHeroCharacterSpace();
      for (const unplacedPiece of heroCharacterSpace.children) {
        if (
          unplacedPiece instanceof GamePiece &&
          evt.stageX > unplacedPiece.x - 8 &&
          evt.stageY > unplacedPiece.y - 8 &&
          evt.stageX < unplacedPiece.x + 64 + 8 &&
          evt.stageY < unplacedPiece.y + 64 + 8
        )
          unplacedPiece.isSelected = true;
      }
    }
  }

  function fieldOccupiedByTeam(field: Field): string {
    for (const piece of pieceContainer.children) {
      if (
        piece instanceof GamePiece &&
        piece.field.fieldX == field.fieldX &&
        piece.field.fieldY == field.fieldY
      )
        return piece.team;
    }
    return "";
  }

  function flipfieldXIfRed(x: number): number {
    if (state.heroTeam != "red") return x;
    else return nFieldsWidth - 1 - x;
  }

  function flipFieldYIfRed(y: number): number {
    if (state.heroTeam != "red") return y;
    else return nFieldsHeight - 1 - y;
  }

  function drawGameField(): void {
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

  class GamePiece extends createjs.Container {
    characterId: string;
    isSelected: boolean;
    team: string;
    image: createjs.Bitmap;
    field: Field;

    constructor(characterId: string, field: Field, pieceTeam: string, hasFought: boolean) {
      super();

      this.characterId = characterId;
      this.team = pieceTeam;
      this.isSelected = false;

      this.field = field;
      this.updateXY();

      let imageId: string = characterId;
      if (!(this.team == state.heroTeam || hasFought == true)) imageId = "unknown";

      const image = piecesManifest.find(
        (element: any) => element.team == this.team && element.id == imageId
      );
      if (image === undefined) throw new Error("Image not found!");
      this.image = image.bitmap.clone();

      this.addChild(this.image);
    }

    updateXY(): void {
      this.x = flipfieldXIfRed(this.field.fieldX) * tileSize + tileSize / 4;
      this.y = flipFieldYIfRed(this.field.fieldY) * tileSize + tileSize / 4;
    }

    getPossibleMoves(): Field[] {
      const possibleMoves: Field[] = [];
      const maxMoves: number =
        this.characterId == "bomb" ? 0 : this.characterId == "runner" ? 1000 : 1;

      // right
      for (let i = this.field.fieldX + 1; i < nFieldsWidth; i++) {
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
      for (let i = this.field.fieldY + 1; i < nFieldsHeight; i++) {
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
</script>

<div id="gameContainer">
  <canvas id="villainCharacterCanvas" width="768" height="96" />
  <canvas id="gameCanvas" width="512" height="640" />
  <canvas id="heroCharacterCanvas" width="768" height="96" />
</div>

<style>
  canvas {
    margin-bottom: 40px;
  }

  #gameContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
