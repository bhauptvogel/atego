import * as createjs from "createjs-module";
import io, { Socket } from "socket.io-client";
import { drawGameField } from "$lib/game/field";
import { Resources } from "$lib/game/resources";
import { GamePiece } from "$lib/game/piece";
import { flipFieldXIfRed, flipFieldYIfRed } from "$lib/game/utils";
import type { gameState, Field, Piece } from "$lib/game/models";

const nFieldsWidth: number = 4;
const nFieldsHeight: number = 5;
let gameId: string;
let playerId: string;
let mainStageWidth: number;
let mainStageHeight: number;
let resourceManager: Resources;
let socket: Socket;
let mainStage: createjs.Stage;
let heroCharacterSpace: createjs.Stage;
let villainCharacterSpace: createjs.Stage;
let tileSize: number = 128;
let pieceContainer: createjs.Container;
let heroArea: createjs.Shape;
let possibleMovesContainer: createjs.Container;
let textWaitingforOpponent: createjs.Text;
let state: gameState;

export function newGame(pageId: string, playerUUID: string) {
  gameId = pageId;
  playerId = playerUUID;
  state = {
    heroTeam: "",
    gameStarted: false,
    gameOver: "",
    currentTurn: "",
  };
  resourceManager = new Resources();
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
  resourceManager.loadResources(handleResourcesLoaded);
}

function handleResourcesLoaded(): void {
  drawGameField(mainStage, nFieldsWidth, nFieldsHeight, tileSize);
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
  if (import.meta.env.VITE_SOCKET_ADRESS == undefined)
    throw new Error("VITE_SOCKET_ADRESS not defined");
  socket = io(import.meta.env.VITE_SOCKET_ADRESS);
  socket.emit("joinGame", gameId, playerId);

  socket.on("connect", () => console.log(`Successfully connected to the server!`));
  socket.on("updatePieces", (pieces) => updatePieces(pieces));
  socket.on("updatePlayerTurn", (updatedTurn: string) => (state.currentTurn = updatedTurn));
  socket.on("assignTeam", (assignedTeam: string) => (state.heroTeam = assignedTeam));
  socket.on("startGame", () => (state.gameStarted = true));
  socket.on("gameOver", (winningTeam) => visualizeEndOfGame(winningTeam));
}

function addDeadPieceToSpace(characterID: string, team: string): void {
  const deadPiece: GamePiece = new GamePiece(
    characterID,
    { fieldX: -1, fieldY: -1 },
    team,
    true,
    state.heroTeam,
    tileSize,
    nFieldsWidth,
    nFieldsHeight,
    resourceManager
  );
  const space: createjs.Stage =
    team === state.heroTeam ? heroCharacterSpace : villainCharacterSpace;
  deadPiece.x = 16 + space.children.length * 96;
  deadPiece.y = 16;
  space.addChild(deadPiece);
}

function addUnplacedPiece(characterID: string): void {
  const unplacedPiece: GamePiece = new GamePiece(
    characterID,
    { fieldX: -1, fieldY: -1 },
    state.heroTeam,
    false,
    state.heroTeam,
    tileSize,
    nFieldsWidth,
    nFieldsHeight,
    resourceManager
  );
  unplacedPiece.x = 16 + heroCharacterSpace.children.length * 96;
  unplacedPiece.y = 16;
  heroCharacterSpace.addChild(unplacedPiece);
}

function updatePieces(pieces: Piece[]): void {
  if (state.gameStarted == true) {
    pieceContainer.removeAllChildren();
    heroCharacterSpace.removeAllChildren();
    villainCharacterSpace.removeAllChildren();
    possibleMovesContainer.removeAllChildren();
  }
  const heroCharacterSpaceIsEmpty = heroCharacterSpace.children.length === 0;
  pieces.forEach((piece) => {
    if (piece.alive === true)
      pieceContainer.addChild(
        new GamePiece(
          piece.id,
          piece.field,
          piece.team,
          piece.exposed,
          state.heroTeam,
          tileSize,
          nFieldsWidth,
          nFieldsHeight,
          resourceManager
        )
      );
    else if (state.gameStarted == true && piece.alive === false)
      addDeadPieceToSpace(piece.id, piece.team);
    else if (
      state.gameStarted == false &&
      piece.team === state.heroTeam &&
      piece.alive == false &&
      heroCharacterSpaceIsEmpty
    )
      addUnplacedPiece(piece.id);
  });

  // draw and remove waiting for opponent text and placement area
  if (!state.gameStarted) {
    if (pieces.filter((piece) => piece.team !== state.heroTeam && piece.alive == true).length > 0)
      villainCharacterSpace.removeChild(textWaitingforOpponent);
    else drawWaitingForOpponent();
    if (pieces.filter((piece) => piece.team === state.heroTeam && piece.alive == true).length > 0)
      mainStage.removeChild(heroArea);
    else visualizeTeamArea();
  }

  mainStage.update();
  heroCharacterSpace.update();
  villainCharacterSpace.update();
}

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

function visualizeTeamArea(): void {
  mainStage.removeChild(heroArea);
  if (state.heroTeam == "") return;
  heroArea = new createjs.Shape();
  heroArea.graphics.beginFill("rgb(55, 61, 73, 0.4)");
  heroArea.graphics.drawRect(0, tileSize * 3, mainStageWidth, tileSize * 2);
  mainStage.addChild(heroArea);
}

function drawWaitingForOpponent(): void {
  const opponentTeam: string = state.heroTeam === "red" ? "yellow" : "red";
  textWaitingforOpponent = new createjs.Text("Waiting for Opponent...", "25px Arial", opponentTeam);
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
        exposed: false,
        alive: true,
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
      piece.field.fieldY == field.fieldY &&
      state.heroTeam == piece.team
    ) {
      piece.isSelected = true;
      renderPossibleMoves(piece.getPossibleMoves(fieldOccupiedByTeam));
      mainStage.update();
    }
  }
}

function renderPossibleMoves(possibleMovesList: Field[]): void {
  possibleMovesContainer.removeAllChildren();
  for (const possibleMove of possibleMovesList) {
    const circle: createjs.Shape = new createjs.Shape();
    const radius: number = 10;
    const x: number =
      flipFieldXIfRed(possibleMove.fieldX, state.heroTeam, nFieldsWidth) * tileSize + tileSize / 2;
    const y: number =
      flipFieldYIfRed(possibleMove.fieldY, state.heroTeam, nFieldsHeight) * tileSize + tileSize / 2;
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
    fieldX: flipFieldXIfRed(Math.floor(evt.stageX / tileSize), state.heroTeam, nFieldsWidth),
    fieldY: flipFieldYIfRed(Math.floor(evt.stageY / tileSize), state.heroTeam, nFieldsHeight),
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
            false,
            state.heroTeam,
            tileSize,
            nFieldsWidth,
            nFieldsHeight,
            resourceManager
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
          .getPossibleMoves(fieldOccupiedByTeam)
          .find(
            (field) => field.fieldX == clickedField.fieldX && field.fieldY == clickedField.fieldY
          ) !== undefined
      ) {
        socket.emit("pieceMoved", {
          from: piece.field,
          to: clickedField,
        });
        piece.field = clickedField;
        piece.updateXY(tileSize, state.heroTeam);
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
