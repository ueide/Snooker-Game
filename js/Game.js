
class Game {
    static CANVAS_WIDTH = 1440;
    static CANVAS_HEIGHT = 700;
    static TABLE_WIDTH = 740; 
    static TABLE_HEIGHT = Game.TABLE_WIDTH/ 2; // Standard snooker table ratio 2:1

    static TABLE_X_OFFSET = (Game.CANVAS_WIDTH - Game.TABLE_WIDTH) / 2; //350
    static TABLE_Y_OFFSET = (Game.CANVAS_HEIGHT - Game.TABLE_HEIGHT) / 2; //201

    constructor() {
        this.playerScore = 0;
        this.currentBreak = 0;
        this.highBreak = 0;
        this.BallOn = 'Red';
        this.gameMode = 1; // Standard mode by default
    }

    displayHeader() {
        // Constants
        const HEADER_HEIGHT = 88;
        const PADDING = 96;

        // Draw header background
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

    setGameMode(newMode) {

        if(newMode >= 1 && newMode <= 3) {
            this.gameMode = newMode;
            console.log(`Game mode set to: ${newMode}`);
        } else {
            console.warn(`Invalid game mode: ${newMode}`);
        }
    }

    displayGameMode() {
        // Constants for positioning
        const X_start = Game.CANVAS_WIDTH - 220; // X position for text
        const y_position = 188;
        const Y_title = y_position; // Y position for title
        const Y_press = y_position + 24; // Y position for instructions
        const Y_mode1 = y_position + 64; // Y position for mode 1
        const Y_mode2 = y_position + 104; // Y position for mode 2
        const Y_mode3 = y_position + 144; // Y position for mode 3

        // Map mode numbers to their Y positions
        const modeMap_Y = {
            1: Y_mode1,
            2: Y_mode2,
            3: Y_mode3
        };


        // ---- Highlight for selected mode ---- //
        const HighlightWidth = 140;
        const HighlightHeight = 32;
        const HighlightY = modeMap_Y[this.gameMode] - 9;

        noStroke();
        fill(217); // Highlight background
        rect(X_start - 16, HighlightY, HighlightWidth, HighlightHeight, 20);
        // ---- End Highlight ---- //


        // ---- Display Mode Selection Text ---- //
        fill(230);
        textAlign(LEFT, TOP);

        // Title
        textSize(16);
        textStyle(BOLD);
        text("Game Mode", X_start, Y_title);

        // Instructions
        textSize(14);
        textStyle(NORMAL);
        text("Press a key:", X_start, Y_press);

        // Mode Options
        textSize(16);
        const textOptions = [ 
            {text: "1: Standard", y: Y_mode1, mode: 1 },
            {text: "2: Red Random", y: Y_mode2, mode: 2 },
            {text: "3: Full Random", y: Y_mode3, mode: 3 }
        ];

        for(let i = 0; i < textOptions.length; i++) {
            if(this.gameMode === textOptions[i].mode) {
                fill(0);
        } else {
                fill(230);
            }
            text(textOptions[i].text, X_start, textOptions[i].y);
        }
        // ---- End Display Mode Selection Text ---- //

    }
}
// End of class Game