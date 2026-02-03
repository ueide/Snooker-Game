/* Game.js
    Defines the Game class which manages game state, scoring, and modes.
*/


//--- Game Class ---//
class Game {
    static CANVAS_WIDTH = 1440;
    static CANVAS_HEIGHT = 700;
    static TABLE_WIDTH = 740; 
    static TABLE_HEIGHT = Game.TABLE_WIDTH/ 2; // Standard snooker table ratio 2:1

    static TABLE_X_OFFSET = (Game.CANVAS_WIDTH - Game.TABLE_WIDTH) / 2; //350
    static TABLE_Y_OFFSET = (Game.CANVAS_HEIGHT - Game.TABLE_HEIGHT) / 2; //201

    static BALL_INFO = {
        "Red": {value: 1, order: 0, isColoured: false, penalty: 4},
        "Yellow": {value: 2, order: 1, isColoured: true, penalty: 2},
        "Green": {value: 3, order: 2, isColoured: true, penalty: 3},
        "Brown": {value: 4, order: 3, isColoured: true, penalty: 4},
        "Blue": {value: 5, order: 4, isColoured: true, penalty: 5},
        "Pink": {value: 6, order: 5, isColoured: true, penalty: 6},
        "Black": {value: 7, order: 6, isColoured: true, penalty: 7}
    }

    static COLOR_ORDER = ["Yellow", "Green", "Brown", "Blue", "Pink", "Black"];


    constructor() {
        // VS Mode properties
        this.isVsMode = false;
        this.currentPlayer = 1; // 1 or 2
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1Break = 0;
        this.player2Break = 0;
        
        // Single player properties
        this.playerScore = 0;
        this.currentBreak = 0;
        this.highBreak = 0;
        this.BallOn = 'Red'; // Start with red ball
        this.gameMode = 1; // Standard mode by default

        this.isCueBallPlacementMode = true; // Start in cue ball placement mode
        this.isShotTaken = false; // Track if a shot has been taken

        this.pottedReds = 0; // Track number of potted reds
        this.consecutiveColoredPots = 0; // Track consecutive colored pots
        this.foulCommitted = false; // Track if a foul has been committed
        this.penaltyValue = 0; // Penalty points for fouls
        this.foulMessage = ''; // Message describing the foul
        this.ballsToRespot = []; // Coloured balls to respot after being potted

        this.uiMessage ='Put the cue ball in play to start the game'
        this.uiMessageTimer = 0; // Timer for displaying UI messages

        // Don't call startGame() here - let menu handle it
    } // End of constructor


    //--- Get Ball Value ---//
    getBallValue(name) {
        if(Game.BALL_INFO[name]) {
            return Game.BALL_INFO[name].value;
        }
        return 0; // Default to 0 for unknown balls
    }

    //--- Update Score After Potting a Ball ---//
    updateScore(ballValue) {
        this.addScore(ballValue);
    }


    //--- Apply Foul Penalty ---//
    applyFoul(penalty, message) { // Penalty and message
        // In VS mode, opponent gets the points
        if (this.isVsMode) {
            const opponentPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (opponentPlayer === 1) {
                this.player1Score += penalty;
            } else {
                this.player2Score += penalty;
            }
        } else {
            this.playerScore -= penalty;
            // Ensure score never goes below 0
            if(this.playerScore < 0) {
                this.playerScore = 0;
            }
        }
        
        this.foulCommitted = true;
        this.foulMessage = message;
        this.displayMessage(`${message} (- ${penalty})`);
        
        // Reset break
        if (this.isVsMode) {
            if (this.currentPlayer === 1) {
                this.player1Break = 0;
            } else {
                this.player2Break = 0;
            }
        } else {
            this.currentBreak = 0;
        }
    }


    //--- Start or Restart Game ---//
    startGame() {
        // Reset all game variables for a new game
        if (this.isVsMode) {
            this.player1Score = 0;
            this.player2Score = 0;
            this.player1Break = 0;
            this.player2Break = 0;
            this.currentPlayer = 1; // Player 1 starts
        } else {
            this.playerScore = 0;
            this.currentBreak = 0;
        }
        
        this.BallOn = 'Red';
        this.pottedReds = 0;
        this.consecutiveColoredPots = 0;
        this.foulCommitted = false;
        this.penaltyValue = 0;
        this.foulMessage = '';
        this.isCueBallPlacementMode = true;
        this.ballsToRespot = []; 
        this.displayMessage('Put the cue ball in play to start the game');
    }

    startVsMode() {
        this.isVsMode = true;
        this.gameMode = 1; // Always standard mode for VS
        this.startGame();
    }

    switchPlayer() {
        if (!this.isVsMode) return;
        
        // Switch between player 1 and 2
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        
        // Reset current break
        if (this.currentPlayer === 1) {
            this.player1Break = 0;
        } else {
            this.player2Break = 0;
        }
        
        console.log(`Switched to Player ${this.currentPlayer}'s turn`);
    }

    addScore(points) {
        if (this.isVsMode) {
            if (this.currentPlayer === 1) {
                this.player1Score += points;
                this.player1Break += points;
            } else {
                this.player2Score += points;
                this.player2Break += points;
            }
        } else {
            this.playerScore += points;
            this.currentBreak += points;
            if (this.currentBreak > this.highBreak) {
                this.highBreak = this.currentBreak;
            }
        }
    }

    getCurrentBreak() {
        if (this.isVsMode) {
            return this.currentPlayer === 1 ? this.player1Break : this.player2Break;
        } else {
            return this.currentBreak;
        }
    }

    isAITurn() {
        return this.isVsMode && this.currentPlayer === 2;
    }


    //--- Get Next Colour Ball in Sequence ---//
    getNextColourBall(currentBallName) { // Get next coloured ball in sequence
        const idX = Game.COLOR_ORDER.indexOf(currentBallName);
        if(idX !== -1 && idX < Game.COLOR_ORDER.length - 1) {
            return Game.COLOR_ORDER[idX + 1];
        }
        return null;
    }


    endTurn() { // Call this method at the end of a player's turn
        if(this.currentBreak > this.highBreak) {
            this.highBreak = this.currentBreak;
        }

        this.currentBreak = 0;
        this.consecutiveColoredPots = 0;

        // Reset foul and penalty
        this.foulCommitted = false;
        this.penaltyValue = 0;
    }


    //--- Render Messages ---//
    displayMessage(msg) {
        this.uiMessage = msg;
    }


    //--- Display Header ---//
    displayHeader() {
        if (this.isVsMode) {
            this.displayVsHeader();
        } else {
            this.displaySinglePlayerHeader();
        }
    }

    displayVsHeader() {
        // Constants
        const HEADER_HEIGHT = 88;
        const PADDING = 96;

        // Draw header background
        noStroke();
        fill(19, 32, 50);
        rect(0, 0, Game.CANVAS_WIDTH, HEADER_HEIGHT);

        // Player 1 section
        const p1X = PADDING;
        const p1HighlightWidth = 320;
        const p1HighlightHeight = 60;
        const p1HighlightY = (HEADER_HEIGHT - p1HighlightHeight) / 2;

        // Highlight for current player
        if (this.currentPlayer === 1) {
            fill(80, 120, 80); // Green highlight
        } else {
            fill(40, 60, 70); // Darker background
        }
        rect(p1X - 16, p1HighlightY, p1HighlightWidth, p1HighlightHeight, 8);


        // Player 1 text
        fill(this.currentPlayer === 1 ? 255 : 200);
        textSize(20);
        textAlign(LEFT, TOP);
        textStyle(BOLD);
        text("PLAYER 1", p1X, p1HighlightY + 8);
        
        textStyle(NORMAL);
        textSize(18);
        text(`Score: ${this.player1Score}  |  Break: ${this.player1Break}`, p1X, p1HighlightY + 34);

        // Player 2 section (AI)
        const p2X = Game.CANVAS_WIDTH - PADDING - p1HighlightWidth + 16;
        
        // Highlight for current player
        if (this.currentPlayer === 2) {
            fill(120, 80, 80); // Red highlight
        } else {
            fill(40, 60, 70); // Darker background
        }
        rect(p2X, p1HighlightY, p1HighlightWidth, p1HighlightHeight, 8);

        // Player 2 text
        fill(this.currentPlayer === 2 ? 255 : 200);
        textSize(20);
        textAlign(LEFT, TOP);
        textStyle(BOLD);
        text("PLAYER 2 (AI)", p2X + 16, p1HighlightY + 8);
        
        textStyle(NORMAL);
        textSize(18);
        text(`Score: ${this.player2Score}  |  Break: ${this.player2Break}`, p2X + 16, p1HighlightY + 34);

        // Center - Ball On
        const centerX = Game.CANVAS_WIDTH / 2;
        fill(210);
        textSize(16);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        let displayBallOn = this.BallOn;
        if(displayBallOn.includes('_')) {
            displayBallOn = displayBallOn === 'Colour' ? 'Colour' : displayBallOn.replace('_C', ' ');
        }
        text(`Ball On: ${displayBallOn}`, centerX, HEADER_HEIGHT / 2);

        // Display Message
        if(this.uiMessage) {
            fill(230);
            textSize(18);
            textAlign(CENTER, CENTER);
            text(this.uiMessage, Game.CANVAS_WIDTH / 2, Game.CANVAS_HEIGHT - 80);
        }
    }

    //--- Display Single Player Header ---//
    displaySinglePlayerHeader() {
        // Constants
        const HEADER_HEIGHT = 88;
        const PADDING = 96;

        // Draw header background
        noStroke();
        fill(19, 32, 50);
        rect(0, 0, Game.CANVAS_WIDTH, HEADER_HEIGHT);


        // Display scores
        fill(210);
        textSize(22);
        textAlign(LEFT, CENTER);
        text(`Player Score: ${this.playerScore}`, PADDING, HEADER_HEIGHT / 2 + 8);

        // Display break
        text(`Break: ${this.currentBreak}  |  High Break: ${this.highBreak}`,
            Game.CANVAS_WIDTH / 2 - PADDING, HEADER_HEIGHT / 2 + 8);


        // Draw Highlight -> Ball On
        const HighlightWidth = 164; 
        const HighlightHeight = 40;
        const HighlightX = Game.CANVAS_WIDTH - HighlightWidth - PADDING + 24;
        const HighlightY = (HEADER_HEIGHT - HighlightHeight) / 2 + 5;
        fill(217); // Highlight background
        rect( HighlightX - 8, HighlightY + 1, HighlightWidth, HighlightHeight, 40);

        //Ball On
        fill(0);
        textSize(18);
        textAlign(CENTER, CENTER);
        let displayBallOn = this.BallOn;
        if(displayBallOn.includes('_')) {
            displayBallOn = displayBallOn === 'Colour' ? 'Colour' : displayBallOn.replace('_C', ' ');
        }
        text(`Ball On: ${displayBallOn}`, Game.CANVAS_WIDTH - PADDING - 64 , 
            HighlightY + HighlightHeight / 2 + 2);

        
        // Display Message 
        if(this.uiMessage) {
            fill(230);
            textSize(18);
            textAlign(CENTER, CENTER);
            text(this.uiMessage, Game.CANVAS_WIDTH / 2, Game.CANVAS_HEIGHT - 80);
        }
    }



    //--- Set Game Mode ---//
    setGameMode(newMode) {
        if(newMode >= 1 && newMode <= 4) {
            this.gameMode = newMode;
            //console.log(`Game mode set to: ${newMode}`);
            this.startGame(); // Restart game on mode change
        } else {
            console.warn(`Invalid game mode: ${newMode}`);
        }
    }


    //--- Display Game Mode ---//
    displayGameMode() {
        // Don't display game mode selector in VS mode
        if (this.isVsMode) {
            return;
        }
        
        // Constants for positioning
        const X_start = Game.CANVAS_WIDTH - 220; // X position for text
        const y_position = 188;
        const space_between = 32;

        const Y_title = y_position; // Y position for title
        const Y_press = y_position + 24; // Y position for instructions

        const Y_mode1 = y_position + space_between * 2; // Y position for mode 1
        const Y_mode2 = y_position + space_between * 3 + 8; // Y position for mode 2
        const Y_mode3 = y_position + space_between * 4 + 16; // Y position for mode 3
        const Y_mode4 = y_position + space_between * 5 + 24; // Y position for mode 4
        const Y_mode5 = y_position + space_between * 6 + 32; // Y position for menu key

        // Map actual game mode numbers to their display Y positions
        const modeMap_Y = {
            1: Y_mode1,   // Standard
            2: Y_mode2,   // Cluster
            3: Y_mode3,   // Red Random
            4: Y_mode4    // Full Random
        };


        // ---- Highlight for selected mode ---- //
        const HighlightWidth = 140;
        const HighlightHeight = 32;
        const HighlightY = modeMap_Y[this.gameMode] - 9;

        // Only show highlight if in a game mode (not menu)
        if (HighlightY !== undefined) {
            noStroke();
            fill(217); // Highlight background
            rect(X_start - 16, HighlightY, HighlightWidth, HighlightHeight, 20);
        }
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
            {text: "2: Cluster", y: Y_mode2, mode: 2 },
            {text: "3: Red Random", y: Y_mode3, mode: 3 },
            {text: "4: Full Random", y: Y_mode4, mode: 4 },
            {text: "5: Menu", y: Y_mode5, mode: 0 }
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