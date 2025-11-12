
class Game {
    static CANVAS_WIDTH = 1440;
    static CANVAS_HEIGHT = 772;
    static TABLE_WIDTH = 740;
    static TABLE_HEIGHT = Game.TABLE_WIDTH/ 2; // Standard snooker table ratio 2:1

    static TABLE_X_OFFSET = (Game.CANVAS_WIDTH - Game.TABLE_WIDTH) / 2;
    static TABLE_Y_OFFSET = (Game.CANVAS_HEIGHT - Game.TABLE_HEIGHT) / 2;

    constructor() {
        this.playerScore = 0;
        this.currentBreak = 0;
        this.highBreak = 0;
        this.BallOn = 'Red';
        this.mode = null; // Game mode (Start, Red Random, Full Random)
    }

    displayHeader() {
        const HEADER_HEIGHT = 88;
        const PADDING = 96;

        noStroke();
        fill('#132032');
        rect(0, 0, Game.CANVAS_WIDTH, HEADER_HEIGHT);

        // Display scores
        fill(210);
        textSize(22);
        textAlign(LEFT, CENTER);
        text(`Player Score: ${this.playerScore}`, PADDING, HEADER_HEIGHT / 2 + 8);

        // Display break
        text(`Current Break: ${this.currentBreak}  |  High Break: ${this.highBreak}`,
            Game.CANVAS_WIDTH / 2 - 160, HEADER_HEIGHT / 2 + 8);


        // Draw Highlight -> Ball On
        const HighlightWidth = 180; 
        const HighlightHeight = 40;
        const HighlightX = Game.CANVAS_WIDTH - HighlightWidth - PADDING + 24;
        const HighlightY = (HEADER_HEIGHT - HighlightHeight) / 2 + 5;
        fill(217); // Highlight background
        rect( HighlightX, HighlightY, HighlightWidth, HighlightHeight, 40);

        // Display Ball On
        fill(0); // Dark text for contrast
        textAlign(CENTER, CENTER);
        text(`Ball On: ${this.BallOn}`, HighlightX + HighlightWidth / 2, HEADER_HEIGHT / 2 + 8);
        

    }

    setMode(mode) {
        this.mode = newMode;
        console.log(`Game mode: ${this.mode}`);
    }

}
// End of class Game