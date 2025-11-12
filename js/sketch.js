// matter.js module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Runner = Matter.Runner;

//Global variables
let snookerGame;


function setup() {
    createCanvas(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

    // Create the Matter.js engine
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0; // No gravity in the snooker table


    // New Game instance
    snookerGame = new Game();

    // Run the engine
    Runner.run(engine);

    // Log setup info
    console.log(`Setup complete. Canvas size: ${Game.CANVAS_WIDTH}x${Game.CANVAS_HEIGHT}`);
    console.log(`Table position: (${Game.TABLE_X_OFFSET}, ${Game.TABLE_Y_OFFSET}), Size: ${Game.TABLE_WIDTH}x${Game.TABLE_HEIGHT}`);

}


function draw() {

    // Display header
    snookerGame.displayHeader();


    //Placeholder for the table
    fill(34, 139, 32); // Green background for the table
    noStroke();
    rect(Game.TABLE_X_OFFSET, Game.TABLE_Y_OFFSET - 24, Game.TABLE_WIDTH, Game.TABLE_HEIGHT, 20);

    //Placeholder for Mode selection
    fill(255);
    textSize(18);
    textAlign(LEFT, TOP);
    text("Press 1: Start Mode | Press 2: Red Random Mode | Press 3: Full Random Mode", 96, Game.CANVAS_HEIGHT - 48);


}



function keyPressed() {
    // Select game mode
    if (key === '1') {
        snookerGame.setMode('Start');
    } else if (key === '2') {
        snookerGame.setMode('Red Random');
    } else if (key === '3') {
        snookerGame.setMode('Full Random');
    }
}
