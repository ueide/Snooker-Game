//Candidate Number: RJ0630

// Snooker Game - Advanced Trajectory Prediction System
// The application features a mouse-centric interface that emphasises user experience, offering the precision and speed expected for arcade games.
// I developed a two-stage interaction system for the cue: aiming and striking. Users initially rotate the cue around the white ball with the mouse, then click to 'lock' the angle.
// This approach simulates real snooker, where players set their aim before applying power. After locking the aim, users adjust the ShotPower slider to set the strike power.
// This separation helps prevent accidental aim changes during power adjustments, a common problem with keyboard controls.

// A solid line shows the cue ball's path, while a light dashed line indicates the hit ball's path. The difference in line weight and style makes it easy to intuitively distinguish between them.
// The project follows strict Object-Oriented Programming (OOP) principles to promote modularity. The central Game class manages the game state, including scoring, rule enforcement like "Ball On" logic, and turn changes.
// Physical behaviour is handled by Matter.js within the Ball class in Ball_phy.js. This class constructor standardises physical attributes such as restitution (bounciness) and frictionAir (air resistance),
// ensuring all ball instances exhibit consistent and realistic physics.

// I implemented five different game modes, including a "Cluster" mode (Mode 2) that employs a custom algorithm to spawn groups of red balls without overlapping, verifying distances against existing objects before creating new ones.
// Visual feedback is managed through the animations array in Balls.js. For instance, the Cue Impact animation activates when the cue is struck;
// it calculates the precise contact point on the ball's edge using Math.cos and Math.sin based on poolCue.lockAngle, displaying a localised flash that gradually fades through alpha interpolation.

// A particular technical issue was the table's geometry. Standard rectangular colliders couldn’t handle the angular cushions properly.
// In Table.js, I used Matter.Bodies.fromVertices to create custom polygons that match the visual quad() vertices precisely, ensuring balls bounce predictably off the angular cushion noses instead of an invisible bounding box.

// Unique Extension: Raycasting Trajectory Prediction. I've developed an exciting Advanced Trajectory Prediction System that really elevates the standard! Unlike basic models that might only display a single line,
//  my system employs a raycasting algorithm in Balls.js (using drawPredictedPath and findclosestcollision) to accurately simulate future physics.

// It calculates the trajectory by projecting a vector from the cue ball and carefully considers potential collisions with cushions and other balls, making the prediction more reliable and insightful.
// Cushion Reflection: If the ray strikes a cushion, the code determines the reflection angle using the cushion's normal vector (either vertical or horizontal) and then extends the prediction line.

// Object Ball Deflection: Importantly, when the ray hits an object ball, the system determines the "ghost ball" position.
// It then divides the prediction into two parts: a solid line showing the cue ball’s path after impact, and a dashed line representing the object ball’s new trajectory.
// This involves calculating the deflection angle with atan2 based on the point of impact.



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

// sounds effects
let ball_collision_sound;
let on_pocket_sound;
let strike_sound;


function preload() {
    // Load sound effects
    ball_collision_sound = loadSound('assets/ball_collision_sound.mp3');
    on_pocket_sound = loadSound('assets/on_pocket_sound.mp3');
    strike_sound = loadSound('assets/strike_sound.mp3');

    ball_collision_sound.setVolume(0.4);
    on_pocket_sound.setVolume(0.4);
    strike_sound.setVolume(0.2);
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


    shotPower.display(); // Display shot power


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

        //console.log("All balls have stopped moving. Ready for next shot.");
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
    else if (key === '4') {
        snookerGame.setGameMode(4); // UI mode
        snookerBalls.initializeBalls(4); // Initialize balls for mode 4
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    }
    else if (key === '5') {
        snookerGame.setGameMode(5); // UI mode
        snookerBalls.initializeBalls(5); // Initialize balls for mode 5
        snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
    }
    // ---- END Mode Game Selection ---- //

}



function mousePressed() {

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
    if(poolCue && poolCue.isLocked) {
        poolCue.isLocked = false;
        //console.log("Cue unlocked.");
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
        //console.log("Shot power set to.");
    }
    // ---- END Shot Power Release ---- //

}
