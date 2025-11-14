
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


    // Run the engine
    Runner.run(engine);

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

    // Display table
    snookerTable.display();

    // Display pool cue
    poolCue.display(mouseX, mouseY);

    // Display shot power
    shotPower.display();

}


function keyPressed() {

    if(!snookerGame) return;

    // ---- Mode Game Selection ---- //
    // Select game mode
    if (key === '1') {
        snookerGame.setGameMode(1);
    } else if (key === '2') {
        snookerGame.setGameMode(2);
    } else if (key === '3') {
        snookerGame.setGameMode(3);
    }
    // ---- END Mode Game Selection ---- //

}


function mousePressed() {

    // ---- Pool Cue Interaction (lock/unlock) ---- //
    if(!poolCue) return;

    if(!poolCue.isLocked) {
        const areaX = Game.CANVAS_WIDTH/2;
        const areaY = Game.CANVAS_HEIGHT/2;

        poolCue.isLocked = true;
        poolCue.lockPositionX = mouseX;
        poolCue.lockPositionY = mouseY;

        poolCue.lockAngle = atan2(mouseY - areaY, mouseX - areaX);

        console.log(`Cue locked at position: (${mouseX}, ${mouseY}) with angle: ${poolCue.lockAngle}`);
    }
    // ---- END Pool Cue Interaction ---- //


    // ---- Shot Power Interaction ---- //
    if(shotPower.isMouseOver()) {
        shotPower.startDragging(mouseY);
        console.log("Started dragging shot power.");
    }
    // ---- END Shot Power Interaction ---- //
    
}


function doubleClicked() {
    if(poolCue && poolCue.isLocked) {
        poolCue.isLocked = false;
        console.log("Cue unlocked.");
    }
}


function mouseDragged() {

    // ---- Shot Power Dragging ---- //
    if(shotPower.isDragging) {
        shotPower.updateDrag(mouseY);
    }
    // ---- END Shot Power Dragging ---- //

}


function mouseReleased() {

    // ---- Shot Power Release ---- //
    if(shotPower && shotPower.isDragging) {
        shotPower.endDrag();
        console.log("Shot power set to.");
    }
    // ---- END Shot Power Release ---- //

}
