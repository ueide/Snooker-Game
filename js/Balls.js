/* Here is the code for all the BALLS in the game */
// The Balls class will manage the properties and behaviors of the balls used in the game.

class Balls {

    constructor(table) {

        // Reference to the table object
        this.table = table;
        this.allBalls = [];
        this.cueBall = null;
        this.isCueBallPlaced = false; 
        this.ballRadius = this.table.ballDiameter / 2;

        // Define the properties for each type of ball
        this.balls_prop = {
            CUE: { name: 'White', value: 0, rgb: [255, 255, 255] },
            RED: { name: 'Red', value: 1, rgb: [255, 0, 0] },
            YELLOW: { name: 'Yellow', value: 2, rgb: [255, 255, 0] },
            GREEN: { name: 'Green', value: 3, rgb: [0, 255, 0] },
            BROWN: { name: 'Brown', value: 4, rgb: [165, 42, 42] },
            BLUE: { name: 'Blue', value: 5, rgb: [0, 0, 255] },
            PINK: { name: 'Pink', value: 6, rgb: [255, 192, 203] },
            BLACK: { name: 'Black', value: 7, rgb: [10, 10, 10] },
        };

        // Starting positions for each ball on the table
        //Use the table dimensions to calculate positions
        this.balls_spot = {
            BLACK: {x: table.feltX + table.feltWidth * (1 - 0.09075), y: table.feltC_y },
            PINK: {x: table.feltC_x + table.feltWidth * 0.20, y: table.feltC_y },
            BLUE: {x: table.feltC_x, y: table.feltC_y },
            BROWN: {x: table.baulkLineX, y: table.feltC_y },
            YELLOW: {x: table.baulkLineX, y: table.feltC_y - table.D_Radius},
            GREEN: {x: table.baulkLineX, y: table.feltC_y + table.D_Radius},

            CUE_DEFAULT: {x: table.feltX + table.feltWidth * 0.1, y: table.feltC_y},

            RED_APEX: {x: table.feltC_x + table.feltWidth * 0.232, y: table.feltC_y}, // Apex of red triangle
        };

        // Initialize all balls and store them in allBalls array
        this.initializeBalls(1); // Start with 1 red ball for simplicity

    } // End of constructor



    // Remove all balls from the world and reset the array
    reset() {
        for (let ball of this.allBalls) {
            Matter.World.remove(engine.world, ball.body);
        }

        this.allBalls = [];
        this.isCueBallPlaced = false;
    }



    // Calculate positions for a pyramid of red balls
    getRedPyramidPositions(startSpot) {
        let positions = [];
        const b_radius = this.ballRadius;
        const gap = b_radius * 2 + 0.5; // Minimum gap between balls
        const trinagleHeight = Math.sqrt(3) * gap / 2;

        // Row 1
        positions.push({x: startSpot.x, y: startSpot.y});

        // Row 2 to 5
        for (let row = 1; row < 5; row++) {
            const numBallsinRow = row + 1;
            const rowX = startSpot.x + trinagleHeight * row;
            const rowYStart = startSpot.y - (gap * (numBallsinRow - 1) / 2);
            for (let i = 0; i < numBallsinRow; i++) {
                const rowY = rowYStart + i * gap;
                positions.push({x: rowX, y: rowY} );
            }
        }
        return positions;

    }



    getRandomFeltPosition() {
        const padding = this.ballRadius * 2;
        return {
            x: random(this.table.feltX + padding, this.table.feltX + this.table.feltWidth - padding),
            y: random(this.table.feltY + padding, this.table.feltY + this.table.feltHeight - padding)
        };
    }



    initializeBalls(mode) {

        // Clear existing balls
        this.reset();

        // Place Coloured Balls on their spots
        this.allBalls.push(new Ball(this.balls_spot.YELLOW.x, this.balls_spot.YELLOW.y, this.ballRadius, this.balls_prop.YELLOW, 2));
        this.allBalls.push(new Ball(this.balls_spot.GREEN.x, this.balls_spot.GREEN.y, this.ballRadius, this.balls_prop.GREEN, 3));
        this.allBalls.push(new Ball(this.balls_spot.BROWN.x, this.balls_spot.BROWN.y, this.ballRadius, this.balls_prop.BROWN, 4));
        this.allBalls.push(new Ball(this.balls_spot.BLUE.x, this.balls_spot.BLUE.y, this.ballRadius, this.balls_prop.BLUE, 5));
        this.allBalls.push(new Ball(this.balls_spot.PINK.x, this.balls_spot.PINK.y, this.ballRadius, this.balls_prop.PINK, 6));
        this.allBalls.push(new Ball(this.balls_spot.BLACK.x, this.balls_spot.BLACK.y, this.ballRadius, this.balls_prop.BLACK, 7));

        const redBalls = [];
        if(mode === 1) { // mode 1: Single red ball pyramid
            const redPositions = this.getRedPyramidPositions(this.balls_spot.RED_APEX); // Pyramid apex at Pink spot
            for (let pos of redPositions) {
                redBalls.push(new Ball(pos.x, pos.y, this.ballRadius, this.balls_prop.RED, 1));
            }
        } 
        else if(mode === 2) { // mode 2: Full set of 15 red balls
            for(let i = 0; i < 15; i++) {
                const pos = this.getRandomFeltPosition(); // Get random position on felt
                redBalls.push(new Ball(pos.x, pos.y, this.ballRadius, this.balls_prop.RED, 1));
            }
        }
        else if (mode === 3) { // mode 3: Reds are random, Coloured stay on spots
            for (let i = 0; i < 15; i++) {
                const pos = this.getRandomFeltPosition(); // Get random position on felt
                redBalls.push(new Ball(pos.x, pos.y, this.ballRadius, this.balls_prop.RED, 1));
            }
        }

        this.allBalls.push(...redBalls); // Add red balls to allBalls array
    };



    display() {
        for (let ball of this.allBalls) {
            ball.display();
        }
    }


    // Place the cue ball at specified coordinates
    placeCueBall(x, y) {
        const cueProps = this.balls_prop.CUE;

        if(this.cueBall) {
            Matter.World.remove(engine.world, this.cueBall.body);
            // Remove existing cue ball from allBalls array
            this.allBalls = this.allBalls.filter(ball => ball !== this.cueBall);
        }

        //Create new cue ball at specified position
        this.cueBall = new Ball(x, y, this.ballRadius, cueProps, 0, true);
        this.allBalls.push(this.cueBall);

        //Reset physics properties
        Matter.Body.setVelocity(this.cueBall.body, {x: 0, y: 0});
        Matter.Body.setAngularVelocity(this.cueBall.body, 0);

        this.isCueBallPlaced = true;
    }



    displayCueBallHand(){
        push();
        noStroke();
        const color = this.balls_prop.CUE.rgb;

        fill(color[0], color[1], color[2], 200);
        circle(mouseX, mouseY, this.ballRadius * 2);

        //Put a img hand holding the ball
        //let handImg; function preload() { handImg = loadImage('path/to/hand.png'); }
        pop();
    }


}
