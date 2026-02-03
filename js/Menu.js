/* Menu.js
    Handles the main menu display and interactions
*/


//--- Menu Class ---//
class Menu {
    constructor() {
        this.isActive = true;
        this.menuImage = null;
        this.singlePlayerButton = {
            x: Game.CANVAS_WIDTH / 2,
            y: Game.CANVAS_HEIGHT / 2 - 40,
            width: 190,
            height: 60,
            text: "Single Player"
        };
        this.vsCopButton = {
            x: Game.CANVAS_WIDTH / 2,
            y: Game.CANVAS_HEIGHT / 2 - 40 + 60 + 24,
            width: 190,
            height: 60,
            text: "Vs Cop"
        };
    }

    setMenuImage(img) {
        this.menuImage = img;
    }

    display() {
        background(39, 55, 77);
        
        // Draw the menu background image at 0.85 of screen size, centered
        if (this.menuImage) {
            const imgWidth = Game.CANVAS_WIDTH * 0.85;
            const imgHeight = Game.CANVAS_HEIGHT * 0.85;
            const imgX = (Game.CANVAS_WIDTH - imgWidth) / 2;
            const imgY = (Game.CANVAS_HEIGHT - imgHeight) / 2;
            image(this.menuImage, imgX, imgY, imgWidth, imgHeight);
        }

        // Check if hovering over any button and set cursor
        if (this.isMouseOverButton(this.singlePlayerButton) || this.isMouseOverButton(this.vsCopButton)) {
            cursor(HAND);
        } else {
            cursor(ARROW);
        }

        // Draw Single Player button
        this.drawButton(this.singlePlayerButton);
        
        // Draw Vs Cop button
        this.drawButton(this.vsCopButton);
    }

    drawButton(button) {
        push();

        // Check if mouse is hovering over button
        const isHovering = this.isMouseOverButton(button);

        // Button background
        rectMode(CENTER);
        if (isHovering) {
            fill(220);
        } else {
            fill(193);
        }
        noStroke();
        rect(button.x, button.y, button.width, button.height, 8);

        // Button text
        fill(50, 40, 30);
        textSize(24);
        textAlign(CENTER, CENTER);
        textFont('Arial');
        textStyle(NORMAL);
        text(button.text, button.x, button.y);

        pop();
    }


    // Check if mouse is over a button
    isMouseOverButton(button) {
        return mouseX > button.x - button.width / 2 &&
                mouseX < button.x + button.width / 2 &&
                mouseY > button.y - button.height / 2 &&
                mouseY < button.y + button.height / 2;
    }


    // Handle mouse press events
    handleMousePressed() {
        if (this.isMouseOverButton(this.singlePlayerButton)) {
            this.startSinglePlayerGame();
        } else if (this.isMouseOverButton(this.vsCopButton)) {
            this.startVsCopGame();
        }
    }


    //--- Start Single Player Game ---//
    startSinglePlayerGame() {
        this.isActive = false;
        // Initialize the game
        snookerGame.setGameMode(1); // Standard mode
        snookerBalls.initializeBalls(1);
        snookerGame.isCueBallPlacementMode = true;
        console.log("Starting Single Player game...");
    }

    //--- Start Vs Cop Game ---//
    startVsCopGame() {
        this.isActive = false;
        // Initialize the game for VS Cop mode
        snookerGame.startVsMode(); // Start VS mode
        snookerBalls.initializeBalls(1); // Always standard mode
        snookerGame.isCueBallPlacementMode = true;
        console.log("Starting Vs Cop game...");
    }

    //--- Return to Menu ---//
    returnToMenu() {
        this.isActive = true;
        // Clear all balls from the game
        snookerBalls.reset();
        snookerBalls.isCueBallPlaced = false;
        // Reset VS mode
        snookerGame.isVsMode = false;
        console.log("Returning to menu...");
    }
}
