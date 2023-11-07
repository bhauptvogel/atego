<script lang="ts">
  import { page } from "$app/stores";
  import io from "socket.io-client";
  import { onMount } from "svelte";

  let createjs: any;
  let mainStage: createjs.Stage;
  let heroCharacterSpace: createjs.Stage;
  let villainCharacterSpace: createjs.Stage;
  let tileSize: number = 128;
  let heroTeam: string | undefined = undefined;
  interface gameState {
    gameStarted: boolean;
    gameOver: boolean;
    currentTurn: string;
  }
  const gameId = $page.params.gameId;
  const nFieldsWidth: number = 4;
  const nFieldsHeight: number = 5;

  onMount(() => {
    import("createjs-module").then((cjs) => {
      createjs = cjs;
      // ------------ ENTRY POINT ------------
      mainStage = new createjs.Stage("gameCanvas");
      const mainStageWidth: number = (mainStage.canvas as HTMLCanvasElement).width;
      const mainStageHeight: number = (mainStage.canvas as HTMLCanvasElement).height;
      if (mainStageWidth * nFieldsHeight !== mainStageHeight * nFieldsWidth)
        throw new Error(`Game has not correct dimensions (${nFieldsWidth} x ${nFieldsHeight})`);
      tileSize = mainStageWidth / nFieldsWidth;
      heroCharacterSpace = new createjs.Stage("heroCharacterCanvas");
      villainCharacterSpace = new createjs.Stage("villainCharacterCanvas");
      const pieceContainer: createjs.Container = new createjs.Container();
      const possibleMovesRenderer: createjs.Container = new createjs.Container();
      const heroTeam = undefined;
      drawGameField();
      mainStage.addChild(pieceContainer);
      mainStage.addChild(possibleMovesRenderer);
    //   mainStage.on("stagemousedown", (evt) => clickedOnField(evt));
    //   heroCharacterSpace.on("stagemousedown", (evt) => clickedOnClientCharacterSpace(evt));
      mainStage.update();
      connectToServer();
    });
  });

  function connectToServer(): void {
    const socket = io("http://localhost:8000/");

    socket.emit("joinGame", gameId);

    socket.on("connect", () => {
      console.log(`Successfully connected to the server!`);
    });
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
    mainStage.update();
  }
  interface PossibleMove {
    fieldX: number;
    fieldY: number;
  }
</script>

<canvas id="villainCharacterCanvas" width="768" height="96" />
<canvas id="gameCanvas" width="512" height="640" />
<canvas id="heroCharacterCanvas" width="768" height="96" />
