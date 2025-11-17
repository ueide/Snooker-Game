
// matter.js module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Runner = Matter.Runner;

//Global variables
let snookerGame;
let snookerTable;
let poolCue;
let shotPower;
let snookerBalls;

function setup() {
    createCanvas(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

    // Create the Matter.js engine
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0; // No gravity in the snooker table


    // Create instances
    snookerGame = new Game(); // Game instance
    snookerTable = new Table(); // Table instance
    poolCue = new PoolCue(); // PoolCue instance
    shotPower = new ShotPower(); // ShotPower instance
    snookerBalls = new Balls(snookerTable);


    // Run the engine
    Runner.run(engine);


    // Event listener for after each engine update
    Matter.Events.on(engine, 'afterUpdate', function() {
        if(!snookerGame.isCueBallPlacementMode) {
            snookerBalls.checkBallsInPockets();
        }
    });


    // Log setup info
    console.log(`Setup complete. Canvas size: ${Game.CANVAS_WIDTH}x${Game.CANVAS_HEIGHT}`);
    console.log(`Table position: (${Game.TABLE_X_OFFSET}, ${Game.TABLE_Y_OFFSET}), Size: ${Game.TABLE_WIDTH}x${Game.TABLE_HEIGHT}`);

}


function draw() {
    background('#27374d'); // Green felt background

    // Display header
    snookerGame.displayHeader();

    // Display game mode info
    snookerGame.displayGameMode();


    // Display table and balls
    snookerTable.display();
    snookerBalls.display();


    // ---- Cue Ball Placement Logic ---- //
    if(snookerGame.isCueBallPlacementMode && !snookerBalls.isCueBallPlaced) {
        const r = snookerBalls.ballRadius;
        const mouseOverFelt = 
            mouseX > snookerTable.feltX && mouseX < snookerTable.feltX + snookerTable.feltWidth &&
            mouseY > snookerTable.feltY && mouseY < snookerTable.feltY + snookerTable.feltHeight;

        if(mouseOverFelt) {
            // Draw cue ball at mouse position
            snookerBalls.displayCueBallHand();
            cursor(HAND)
        } else {
            cursor(ARROW); // Show cursor
        }
    return; // Skip the rest of draw loop
    } // ---- End cue ball placement logic



    // ---- Display pool cue and shot power ---- //
    if(!snookerGame.isCueBallPlacementMode && snookerBalls.cueBall) {
        const cueBallPos = snookerBalls.cueBall.body.position;
        poolCue.display(cueBallPos.x, cueBallPos.y, mouseX, mouseY);
    }


    shotPower.display(); // Display shot power UI


    // ---- Check if all balls have stopped moving ---- //
    if(!snookerBalls.BallsMoving()) {

        // Re-spot coloured balls
        if(snookerGame.ballsToRespot.length > 0) {
            for(let ball of snookerGame.ballsToRespot) {
                snookerBalls.reSpotBall(ball);
            }
            snookerGame.ballsToRespot = []; // Clear the list after re-spotting
        }

        // Reset for next shot
        snookerGame.isShotTaken = false; // Reset shot taking flag
        console.log("All balls have stopped moving. Ready for next shot.");
    }




    // ---- Draw Prediction Line ---- //
    if(poolCue && poolCue.isLocked && snookerBalls.cueBall && !snookerGame.isShotTaken) {
        snookerBalls.drawPredictedPath(snookerBalls.cueBall, poolCue.lockAngle);
    }



} // End draw function


function keyPressed() {

    if(!snookerGame) return;

    // ---- Mode Game Selection ---- //
    // Select game mode
    if (key === '1') {
        snookerGame.setGameMode(1); // UI mode
        snookerBalls.initializeBalls(1); // Initialize balls for mode 1
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    } 
    else if (key === '2') {
        snookerGame.setGameMode(2); // UI mode
        snookerBalls.initializeBalls(2); // Initialize balls for mode 2
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    } 
    else if (key === '3') {
        snookerGame.setGameMode(3); // UI mode
        snookerBalls.initializeBalls(3); // Initialize balls for mode 3
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    }
    // ---- END Mode Game Selection ---- //

}


function mousePressed() {

    // ---- Cue Ball Placement ---- //
    if(snookerGame.isCueBallPlacementMode && !snookerBalls.isCueBallPlaced) {
        const r = snookerBalls.ballRadius;
        const isValidPosition = snookerTable.isInsideDZone(mouseX, mouseY, r);

        let isOverLapping = false; // Check for overlap with existing balls
        // Check overlap with existing balls
        for(let ball of snookerBalls.allBalls) {
            const d = dist(mouseX, mouseY, ball.body.position.x, ball.body.position.y);
            if(d < (r * 2)) {
                isOverLapping = true;
                break;
            }
        }

        if(isValidPosition && !isOverLapping) {
            snookerBalls.placeCueBall(mouseX, mouseY);
            snookerGame.isCueBallPlacementMode = false; // Exit cue ball placement mode
            poolCue.isLocked = false; // Reset cue lock state

            console.log(`Cue ball placed at: (${mouseX}, ${mouseY})`);
            return;
        } else {
            console.log("Invalid cue ball position. Please place within the D-zone and avoid overlapping other balls.");
            return;
        }
    }


    if(snookerGame.isShotTaking) {
        console.log("Shot already in progress. Please wait for balls to stop moving.");
        return;
    }


    // ---- Pool Cue Interaction (lock/unlock) ---- //
    if(!poolCue || !snookerBalls.cueBall) return;

    if(!poolCue.isLocked) {
        const cueBallPos = snookerBalls.cueBall.body.position;

        poolCue.isLocked = true;
        poolCue.lockPositionX = cueBallPos.x;
        poolCue.lockPositionY = cueBallPos.y;

        poolCue.lockAngle = atan2(mouseY - cueBallPos.y, mouseX - cueBallPos.x);

        console.log(`Cue locked at position: (${mouseX}, ${mouseY}) with angle: ${poolCue.lockAngle}`);
    }
    // ---- END Pool Cue Interaction ---- //



    // ---- Shot Power Interaction ---- //
    if(shotPower.isMouseOver()) {
        shotPower.startDragging(mouseY);
        console.log("Started dragging shot power.");
    }
    // ---- END Shot Power Interaction ---- //

} // End mousePressed function


function doubleClicked() {
    if(poolCue && poolCue.isLocked) {
        poolCue.isLocked = false;
        console.log("Cue unlocked.");
    }
}


function mouseDragged() {

    // ---- Ignore dragging if shot is taken ---- //
    if(snookerGame.isShotTaken) {
        return; // Ignore dragging if shot is taken
    }


    // ---- Shot Power Dragging ---- //
    if(shotPower.isDragging) {
        shotPower.updateDrag(mouseY);
    }
    // ---- END Shot Power Dragging ---- //

}


function mouseReleased() {

    // ---- Shot Power Release ---- //
    if(shotPower.isDragging) {
        shotPower.endDrag();
        console.log("Shot power set to.");
    }
    // ---- END Shot Power Release ---- //

}
