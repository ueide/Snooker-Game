// matter.js module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Runner = Matter.Runner;

//Global variables
let snookerGame;
let snookerTable;


function setup() {
    createCanvas(Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT);

    // Create the Matter.js engine
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0; // No gravity in the snooker table


    // Create instances
    snookerGame = new Game(); // New Game instance
    snookerTable = new Table(); // New Table instance


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

}



function keyPressed() {

    if(!snookerGame) return;


    // Select game mode
    if (key === '1') {
        snookerGame.setGameMode(1);
    } else if (key === '2') {
        snookerGame.setGameMode(2);
    } else if (key === '3') {
        snookerGame.setGameMode(3);
    }
}
