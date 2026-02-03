/* sketch.js
    Main p5.js sketch file for Snooker Game
*/

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
let menu;
let aiPlayer;

// sounds effects
let ball_collision_sound;
let on_pocket_sound;
let strike_sound;

// menu image
let menuImage;


function preload() {
    // Load sound effects
    ball_collision_sound = loadSound('assets/ball_collision_sound.mp3');
    on_pocket_sound = loadSound('assets/on_pocket_sound.mp3');
    strike_sound = loadSound('assets/strike_sound.mp3');

    ball_collision_sound.setVolume(0.4);
    on_pocket_sound.setVolume(0.4);
    strike_sound.setVolume(0.2);

    // Load menu image
    menuImage = loadImage('assets/menu.png');
}



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
    menu = new Menu(); // Menu instance
    menu.setMenuImage(menuImage); // Set the menu background image
    aiPlayer = new AIPlayer(); // AI Player instance


    // Run the engine
    Runner.run(engine);


    // Event listener for after each engine update
    Matter.Events.on(engine, 'afterUpdate', function() {
        if(!snookerGame.isCueBallPlacementMode) {
            // Apply friction and settle balls smoothly, then check pockets
            snookerBalls.applyRollingFriction();
            snookerBalls.checkBallsInPockets();
        }
    });


    // Detect first collision for rule checking
    Matter.Events.on(engine, 'collisionStart', function(event) {
        if(snookerGame.isShotTaken && !snookerBalls.firstBallHit) {
            snookerBalls.handleCollision(event);
            ball_collision_sound.play();
        }
    });

}


function draw() {
    background(39, 55, 77); // Dark blue background

    // If menu is active, show menu and return
    if (menu && menu.isActive) {
        menu.display();
        return;
    }

    // Display header
    snookerGame.displayHeader();

    // Display game mode info
    snookerGame.displayGameMode();


    // Display table and balls
    snookerTable.display();
    snookerBalls.display();


    // ---- Cue Ball Placement Logic ---- //
    if(snookerGame.isCueBallPlacementMode && !snookerBalls.isCueBallPlaced) {
        
        // If it's AI's turn to place cue ball, do it automatically
        if (snookerGame.isAITurn()) {
            // AI intelligently chooses where to place the cue ball in D-zone
            const chosenPosition = aiPlayer.chooseCueBallPlacement();
            snookerBalls.placeCueBall(chosenPosition.x, chosenPosition.y);
            snookerBalls.isCueBallPlaced = true;
            snookerGame.isCueBallPlacementMode = false;
            
            // Trigger AI to take their turn after placement
            setTimeout(() => {
                aiPlayer.takeTurn();
            }, 500);
            return;
        }
        
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
    // Hide controls during AI turn
    if(!snookerGame.isCueBallPlacementMode && snookerBalls.cueBall && !snookerGame.isAITurn()) {
        const cueBallPos = snookerBalls.cueBall.body.position;
        // Only use mouse position if cue is not locked (AI hasn't taken over)
        const mouseX_to_use = poolCue.isLocked ? poolCue.lockPositionX + cos(poolCue.lockAngle) * 100 : mouseX;
        const mouseY_to_use = poolCue.isLocked ? poolCue.lockPositionY + sin(poolCue.lockAngle) * 100 : mouseY;
        poolCue.display(cueBallPos.x, cueBallPos.y, mouseX_to_use, mouseY_to_use);
    }


    // Only show shot power for human player
    if (!snookerGame.isAITurn()) {
        shotPower.display(); // Display shot power
    }


    // ---- Check if all balls have stopped moving ---- //
    if(snookerGame.isShotTaken && !snookerBalls.areBallsMoving()) {

        snookerBalls.checkShotResult();

        if(snookerGame.ballsToRespot.length > 0) {
            for(let ball of snookerGame.ballsToRespot) {
                snookerBalls.reSpotBall(ball);
            }
            snookerGame.ballsToRespot = []; // Clear respot list
        }

        snookerGame.isShotTaken = false; // Reset shot taken flag

        snookerBalls.firstBallHit = null; // Reset first ball hit
        snookerBalls.pottedObjBallsOnShot = []; // Clear potted balls list
        snookerBalls.cueBallPottedOnShot = false; // Reset cue ball potted flag
        
        // Trigger AI turn if it's AI's turn
        if (snookerGame.isAITurn() && !snookerGame.isCueBallPlacementMode) {
            setTimeout(() => {
                aiPlayer.takeTurn();
            }, 1000); // 1 second delay before AI takes turn
        }

        //console.log("All balls have stopped moving. Ready for next shot.");
    }


    // ---- Draw Prediction Line ---- //
    // Show prediction for human player only
    if(poolCue && poolCue.isLocked && snookerBalls.cueBall && !snookerGame.isShotTaken && !snookerGame.isAITurn()) {
        snookerBalls.drawPredictedPath(snookerBalls.cueBall, poolCue.lockAngle);
    }

} // End draw function


function keyPressed() {

    if(!snookerGame) return;

    // ---- Mode Game Selection ---- //
    // Return to menu on 5 or Esc
    if (key === '5' || keyCode === ESCAPE) {
        menu.returnToMenu(); // Return to menu
        return;
    }

    // Prevent mode switching in VS mode
    if (snookerGame.isVsMode) {
        return;
    }
    
    // Select game mode
    if (key === '1') {
        snookerGame.setGameMode(1); // Standard mode
        snookerBalls.initializeBalls(1); // Initialize balls for mode 1
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    } 
    else if (key === '2') {
        snookerGame.setGameMode(2); // Cluster mode
        snookerBalls.initializeBalls(2); // Initialize balls for mode 2
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    } 
    else if (key === '3') {
        snookerGame.setGameMode(3); // Red Random mode
        snookerBalls.initializeBalls(3); // Initialize balls for mode 3
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    }
    else if (key === '4') {
        snookerGame.setGameMode(4); // Full Random mode
        snookerBalls.initializeBalls(4); // Initialize balls for mode 4
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    }
    // ---- END Mode Game Selection ---- //

}



function mousePressed() {

    // Handle menu clicks
    if (menu && menu.isActive) {
        menu.handleMousePressed();
        return;
    }
    
    // Prevent interaction during AI turn
    if (snookerGame.isAITurn()) {
        return;
    }

    // ---- Cue Ball Placement ---- //
    if (!snookerBalls.isCueBallPlaced) {
        
        // Check if mouse is inside D-Zone
        if (snookerTable.isInsideDZone(mouseX, mouseY)) {
            // Place the cue ball at mouse position
            snookerBalls.placeCueBall(mouseX, mouseY); 
            snookerBalls.isCueBallPlaced = true;
            snookerGame.isCueBallPlacementMode = false; // Disable cue ball placement mode
            console.log("Cue ball placed successfully.");
        } else {
            console.log("Invalid position: Place the ball inside the D-Zone.");
        }
        
        // Exit function after handling cue ball placement
        return; 
    }
    // ---- End Cue Ball Placement ---- //


    // ---- Shot Power Interaction ---- //
    if(shotPower.isMouseOver()) {
        shotPower.startDragging(mouseY);
        //console.log("Started dragging shot power.");
    }
    // ---- END Shot Power Interaction ---- //


    // ---- Pool Cue Interaction (lock/unlock) ---- //
    if(!poolCue || !snookerBalls.cueBall) return;

    if(!poolCue.isLocked) {
        const cueBallPos = snookerBalls.cueBall.body.position;

        poolCue.isLocked = true;
        poolCue.lockPositionX = cueBallPos.x;
        poolCue.lockPositionY = cueBallPos.y;

        poolCue.lockAngle = atan2(mouseY - cueBallPos.y, mouseX - cueBallPos.x);

        //console.log(`Cue locked at position: (${mouseX}, ${mouseY}) with angle: ${poolCue.lockAngle}`);
    }
    // ---- END Pool Cue Interaction ---- //

} // End mousePressed function



function doubleClicked() {
    if (snookerGame.isAITurn()) return;
    
    if(poolCue && poolCue.isLocked) {
        poolCue.isLocked = false;
        //console.log("Cue unlocked.");
    }
}



function mouseDragged() {

    // ---- Ignore dragging if shot is taken or AI turn ---- //
    if(snookerGame.isShotTaken || snookerGame.isAITurn()) {
        return; // Ignore dragging if shot is taken or AI turn
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
        //console.log("Shot power set to.");
    }
    // ---- END Shot Power Release ---- //

}
