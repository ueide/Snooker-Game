/* Balls.js
    Manages all balls on the snooker table, including their properties,
    positions, movements, collisions, potting, and visual effects.
*/


//---- Balls Class ---//
class Balls {

    // Table reference 
    constructor(table) {

        // Reference to the table object
        this.table = table;
        this.allBalls = [];
        this.cueBall = null;
        this.isCueBallPlaced = false; 
        this.ballRadius = this.table.ballDiameter / 2;

        this.pottedObjBallsOnShot = [];
        this.cueBallPottedOnShot = false;
        this.firstBallHit = null; // Track the first ball hit by the cue ball
        
        // Visual animations (cue impact, pocket entry)
        this.animations = [];

        this.clusterGap = 0.5;

        // Rolling physics tuning (practice-proven defaults)
        this.rollingFrictionCoeff = 0.0009;   // Per ms; higher = slows quicker
        this.angularFrictionCoeff = 0.0015;   // Per ms; higher = faster spin decay
        this.linearStopThreshold = 0.02;      // Below this speed, snap to rest
        this.angularStopThreshold = 0.02;     // Below this spin, snap to rest

        this.setClusterGap = (gap) => {
            const g = Number(gap);
            if (!isNaN(g)) {
                this.clusterGap = Math.max(0, Math.min(8, g));
            }
        };

        // Define the properties for each type of ball
        this.balls_prop = {
            CUE: { name: 'White', value: 0, rgb: [255, 255, 240] },
            RED: { name: 'Red', value: 1, rgb: [235, 0, 7] },
            YELLOW: { name: 'Yellow', value: 2, rgb: [235, 219, 6] },
            GREEN: { name: 'Green', value: 3, rgb: [65, 226, 6] },
            BROWN: { name: 'Brown', value: 4, rgb: [88, 57, 39] },
            BLUE: { name: 'Blue', value: 5, rgb: [0, 20, 219] },
            PINK: { name: 'Pink', value: 6, rgb: [222, 120, 204] },
            BLACK: { name: 'Black', value: 7, rgb: [10, 10, 10] },

            //Ball On: Displayed in header
            COLOUR: { name: 'Colour', value: null, rgb: [255, 255, 255] }
        };

        // Starting positions for each ball on the table
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


        // Re-spot coloured balls after they are potted
        this.reSpotPositions = {
            YELLOW: this.balls_spot.YELLOW,
            GREEN: this.balls_spot.GREEN,
            BROWN: this.balls_spot.BROWN,
            BLUE: this.balls_spot.BLUE,
            PINK: this.balls_spot.PINK,
            BLACK: this.balls_spot.BLACK,
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


    // Get a random position on the felt area for ball placement
    getRandomFeltPosition() {
        const padding = this.ballRadius * 2;
        return {
            x: random(this.table.feltX + padding, this.table.feltX + this.table.feltWidth - padding),
            y: random(this.table.feltY + padding, this.table.feltY + this.table.feltHeight - padding)
        };
    }


    // Initialize balls based on selected mode
    initializeBalls(mode) {

        // Clear existing balls
        this.reset();

        //--- MODE 04: FULL RANDOM --- //
        if(mode === 4) { 
            let ballsToPlace = [
                this.balls_prop.YELLOW, this.balls_prop.GREEN, this.balls_prop.BROWN,
                this.balls_prop.BLUE, this.balls_prop.PINK, this.balls_prop.BLACK
            ];

            for (let i = 0; i < 15; i++) { // Add 15 red balls
                ballsToPlace.push(this.balls_prop.RED);
            }

            for(let prop of ballsToPlace) {
                let pos;
                let overlap;

                do {
                    overlap = false;
                    pos = this.getRandomFeltPosition(); // Get random position on felt
                    
                    // Check for overlaps with existing balls
                    for (let existingBall of this.allBalls) {
                        let d = dist(pos.x, pos.y, existingBall.body.position.x, existingBall.body.position.y);

                        // If overlap detected, set flag to true
                        if(d < this.ballRadius * 2 + 0.1) { // Small padding to avoid overlaps
                            overlap = true;
                            break;
                        } 
                    }

                } while (overlap); // Repeat until a non-overlapping position is found
                this.allBalls.push(new Ball(pos.x, pos.y, this.ballRadius, prop, prop.value));
            }
            return; // Exit after initializing mode 4
        }

        //--- MODE 01, 02, 03 (Mode 5 reserved for menu) --- //
        // Place Coloured Balls on their spots
        this.allBalls.push(new Ball(this.balls_spot.YELLOW.x, this.balls_spot.YELLOW.y, this.ballRadius, this.balls_prop.YELLOW, 2));
        this.allBalls.push(new Ball(this.balls_spot.GREEN.x, this.balls_spot.GREEN.y, this.ballRadius, this.balls_prop.GREEN, 3));
        this.allBalls.push(new Ball(this.balls_spot.BROWN.x, this.balls_spot.BROWN.y, this.ballRadius, this.balls_prop.BROWN, 4));
        this.allBalls.push(new Ball(this.balls_spot.BLUE.x, this.balls_spot.BLUE.y, this.ballRadius, this.balls_prop.BLUE, 5));
        this.allBalls.push(new Ball(this.balls_spot.PINK.x, this.balls_spot.PINK.y, this.ballRadius, this.balls_prop.PINK, 6));
        this.allBalls.push(new Ball(this.balls_spot.BLACK.x, this.balls_spot.BLACK.y, this.ballRadius, this.balls_prop.BLACK, 7));

        const redBalls = [];
        if(mode === 1) { // mode 1: Standard - Red ball pyramid
            const redPositions = this.getRedPyramidPositions(this.balls_spot.RED_APEX); // Pyramid apex at Pink spot
            for (let pos of redPositions) {
                redBalls.push(new Ball(pos.x, pos.y, this.ballRadius, this.balls_prop.RED, 1));
            }
        } 
        else if(mode === 2) { // mode 2: Cluster (1 center + 4 around)
            const clusters = 3; // 15 reds = 3 clusters of 5
            const spacing = this.ballRadius * 2 + this.clusterGap; // Safety spacing between balls in cluster

            // Safe margins so outer balls stay inside felt
            const marginX = spacing + this.ballRadius + 1;
            const marginY = spacing + this.ballRadius + 1;

            const getRandomCenter = () => ({
                x: random(this.table.feltX + marginX, this.table.feltX + this.table.feltWidth - marginX),
                y: random(this.table.feltY + marginY, this.table.feltY + this.table.feltHeight - marginY)
            });

            for(let c = 0; c < clusters; c++) {
                let placed = false;
                for(let attempt = 0; attempt < 80 && !placed; attempt++) {
                    const center = getRandomCenter();

                    // Define 5-ball cross: center plus 4 cardinals
                    const positions = [
                        {x: center.x, y: center.y},
                        {x: center.x + spacing, y: center.y},
                        {x: center.x - spacing, y: center.y},
                        {x: center.x, y: center.y + spacing},
                        {x: center.x, y: center.y - spacing}
                    ];

                    // Validate boundaries and overlaps vs existing balls and already scheduled reds
                    let invalid = false;
                    for(const p of positions) {
                        // Boundary check
                        if(p.x < this.table.feltX + this.ballRadius ||
                            p.x > this.table.feltX + this.table.feltWidth - this.ballRadius ||
                            p.y < this.table.feltY + this.ballRadius ||
                            p.y > this.table.feltY + this.table.feltHeight - this.ballRadius) { invalid = true; break; }

                        // Overlap vs coloured and previously placed reds
                        for(const existing of this.allBalls) {
                            const d1 = dist(p.x, p.y, existing.body.position.x, existing.body.position.y);
                            if(d1 < this.ballRadius * 2 + 0.1) { invalid = true; break; }
                        }
                        if(invalid) break;
                        for(const r of redBalls) {
                            const d2 = dist(p.x, p.y, r.body.position.x, r.body.position.y);
                            if(d2 < this.ballRadius * 2 + 0.1) { invalid = true; break; }
                        }
                        if(invalid) break;
                    }

                    if(!invalid) {
                        for(const p of positions) {
                            redBalls.push(new Ball(p.x, p.y, this.ballRadius, this.balls_prop.RED, 1));
                        }
                        placed = true;
                    }
                }
            }
        }
        else if(mode === 3) { // mode 3: Red Random - 15 random red balls
            for(let i = 0; i < 15; i++) {
                const pos = this.getRandomFeltPosition(); // Get random position on felt
                redBalls.push(new Ball(pos.x, pos.y, this.ballRadius, this.balls_prop.RED, 1));
            }
        }

        this.allBalls.push(...redBalls); // Add red balls to allBalls array
    };


    //--- Visual Effects: Cue Impact and Pocket Entry ---//
    //cue impact animation
    addCueImpact(x, y) {
        this.animations.push({
            type: 'cueImpact', x, y, start: millis(), duration: 220
        });
    }

    // pocket entry animation
    addPocketEntry(x, y, color) {
        this.animations.push({
            type: 'pocketEntry', x, y, start: millis(), duration: 400,
            rgb: color && color.rgb ? color.rgb : [255, 255, 255]
        });
    }

    // Draw ongoing animations
    drawAnimations() {
        if(!this.animations.length) return;
        const now = millis();
        for(let i = this.animations.length - 1; i >= 0; i--) {
            const a = this.animations[i];
            const t = now - a.start;
            if(t > a.duration) { this.animations.splice(i, 1); continue; }
            const p = t / a.duration; // 0..1

            if(a.type === 'cueImpact') {
                const r = this.ballRadius * (0.4 + 1.2 * p);
                const alpha = 220 * (1 - p);
                push(); noFill();
                stroke(240, 240, 240, alpha);
                strokeWeight(2.2 - 1.6 * p);
                circle(a.x, a.y, r * 2);
                pop();
            }
            else if(a.type === 'pocketEntry') {
                const [cr, cg, cb] = a.rgb;
                const r = this.ballRadius * (0.6 + 2.0 * p);
                const alpha = 200 * (1 - p);
                push(); noFill();
                stroke(cr, cg, cb, alpha);
                strokeWeight(2);
                circle(a.x, a.y, r * 2);
                // Subtle star burst
                stroke(cr, cg, cb, alpha * 0.8);
                const rays = 6;
                for(let k = 0; k < rays; k++) {
                    const ang = k * TWO_PI / rays;
                    const len = this.ballRadius * (0.6 + 1.4 * p);
                    line(a.x, a.y, a.x + cos(ang) * len, a.y + sin(ang) * len);
                }
                pop();
            }
        }
    }


    // Apply rolling friction to all balls
    applyRollingFriction() {
        const delta = (engine && engine.timing && engine.timing.delta) ? engine.timing.delta : 16.666;
        const linDecay = Math.max(0, 1 - this.rollingFrictionCoeff * delta);
        const angDecay = Math.max(0, 1 - this.angularFrictionCoeff * delta);

        for (let ball of this.allBalls) {
            if (ball.isPotted) continue;

            const vx = ball.body.velocity.x;
            const vy = ball.body.velocity.y;
            const speed = Math.hypot(vx, vy);

            if (speed > this.linearStopThreshold) {
                const scale = linDecay;
                Matter.Body.setVelocity(ball.body, { x: vx * scale, y: vy * scale });
            } else {
                Matter.Body.setVelocity(ball.body, { x: 0, y: 0 });
            }

            const av = ball.body.angularVelocity;
            if (Math.abs(av) > this.angularStopThreshold) {
                Matter.Body.setAngularVelocity(ball.body, av * angDecay);
            } else {
                Matter.Body.setAngularVelocity(ball.body, 0);
            }
        }
    }


    //--- Display Functions ---//
    display() {
        //--- Display all balls ---//
        for (let ball of this.allBalls) {
            ball.display();
        }


        //--- Predicted Path for Balls ---//
        if(!snookerGame.isShotTaken && this.cueBall && !snookerGame.isCueBallPlacementMode) {

            // Get the coordinates of the cue ball
            const cueBallPos = this.cueBall.body.position;
            let aimAngle;
            if(poolCue.isLocked) {
            aimAngle = poolCue.lockAngle;
            } else {
                // when unlocked, aim towards mouse position
                aimAngle = atan2(mouseY - cueBallPos.y, mouseX - cueBallPos.x);
            }

            // Predict the path of the cue ball
            const predictedPath = this.drawPredictedPath(this.cueBall, aimAngle);

            push(); // First push: solid line
            for(let i = 0; i < predictedPath.length; i++) {
                const segment = predictedPath[i];

                // Draw White ball path (solid line)
                if (segment.type.startsWith ('cue_')) {
                    stroke(240, 240, 240, 150);
                    strokeWeight(2);
                    line(segment.start.x, segment.start.y, segment.end.x, segment.end.y);
                }
                // Coloured balls path after hit (dashed line)
                else if (segment.type.startsWith('object_ball_')) {
                    const centerBall = segment.start;
                    const deflectionAngle = segment.angle;
                    const endPos = segment.end;

                    const actualLength = dist(centerBall.x, centerBall.y, endPos.x, endPos.y);

                    push(); // Second push: dashed line
                    stroke(240, 240, 240, 150);
                    strokeWeight(2);

                    // Draw dashed line for deflected ball path
                    const dashLength = 4;
                    const gapLength = 6;
                    const segmentStep = dashLength + gapLength;

                    let startX = centerBall.x;
                    let startY = centerBall.y;

                    for(let currentTravel = 0; currentTravel < actualLength; currentTravel += segmentStep) {
                        let x1 = startX + cos(deflectionAngle) * currentTravel; // Starting point of dash
                        let y1 = startY + sin(deflectionAngle) * currentTravel; // Starting point of dash
                        let x2 = startX + cos(deflectionAngle) * Math.min(currentTravel + dashLength, actualLength); // End point of dash
                        let y2 = startY + sin(deflectionAngle) * Math.min(currentTravel + dashLength, actualLength); // End point of dash

                        line(x1, y1, x2, y2); // Dashed Line segment
                    }
                    pop(); // End second push
                }
            }
            pop(); // End first push
        }

        // Draw ongoing animations
        this.drawAnimations();
    }



    //--- Place Cue Ball ---//
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


    //--- Display Cue Ball Hand ---//
    displayCueBallHand(){
        // Display semi-transparent cue ball at mouse position during placement
        push();
        noStroke();
        const color = this.balls_prop.CUE.rgb;

        fill(color[0], color[1], color[2], 200);
        circle(mouseX, mouseY, this.ballRadius * 2);
        pop();
    }


    //--- Ball Movement and Collision Handling ---//
    areBallsMoving() { 
        const movimentThreshold = 0.001; // Velocity threshold to consider ball as moving
        const angularThreshold = 0.01; // Angular velocity threshold

        for(let ball of this.allBalls) {
            if(ball.isPotted) continue; // Skip potted balls

            const velX = ball.body.velocity.x;
            const velY = ball.body.velocity.y;
            const angularVel = ball.body.angularVelocity;

            const speed = Math.sqrt(velX * velX + velY * velY);
            if(speed > movimentThreshold || Math.abs(angularVel) > angularThreshold) {
                return true; // At least one ball is still moving
            }
        }
        
        return false; // All balls are stationary

    }


    // Check for potted balls
    checkBallsInPockets() { // Check and handle balls that have been potted
        for (let i = this.allBalls.length - 1; i >= 0; i--) {
            let ball = this.allBalls[i];

            if(ball.isPotted) continue; // Skip already potted balls

            // Check if ball is in any pocket
            const pocked = this.table.isBallInPocket(ball);
            if(pocked) {
                // Mark ball as potted
                ball.isPotted = true;

                // Sounds effect
                on_pocket_sound.play();

                // Pocket entry animation (use pocket position)
                this.addPocketEntry(pocked.x, pocked.y, ball.color);

                // Remove ball from physics world
                Matter.World.remove(engine.world, ball.body);

                // If it's a coloured ball, re-spot it
                if(ball.isCueBall) {
                    this.cueBallPottedOnShot = true;
                    this.allBalls.splice(i, 1);
                    this.cueBall = null;
                    this.isCueBallPlaced = false;

                } else {
                    // Track potted object balls for shot result checking
                    this.pottedObjBallsOnShot.push(ball);
                }
                
            }
        }
    }


    // Handle collision events to track first ball hit by cue ball
    handleCollision(event) { // Track first ball hit by cue ball
        const pairs = event.pairs;

        for(let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA; // First body in collision
            const bodyB = pairs[i].bodyB; // Second body in collision

            let otherBody = null;
            // If cue ball is involved in the collision
            if(bodyA.label === 'cueBall') otherBody = bodyB;
            else if(bodyB.label === 'cueBall') otherBody = bodyA;

            if(otherBody) {
                // Find the ball object corresponding to otherBody
                if(otherBody.label !== 'cushion' && otherBody.label !== 'pocket') {
                    if(!this.firstBallHit) {
                        const hitBall = this.allBalls.find(ball => ball.body === otherBody);
                        if(hitBall) {
                            this.firstBallHit = hitBall;
                            //console.log(`First ball hit by cue ball: ${hitBall.color.name}`);
                        }
                    }
                }
            }
        }
    } // End handleCollision


    //--- Check for Reds Remaining ---//
    hasRedsRemaining() { // Check if any red balls are still on the table
        return this.allBalls.some(ball => ball.color.name === 'Red' && !ball.isPotted);
    }


    //--- Check Shot Result: Foul, Score, Ball On Update ---//
    checkShotResult() {
        const pottedBalls = this.pottedObjBallsOnShot;
        const ballOn = snookerGame.BallOn;
        const firstHit = this.firstBallHit;

        let isFoul = false;
        let turnScore = 0;
        let message = '';
        let penaltyPoints = 4;

        // --- Check FOULS --- //

        // -- Cue Bal Potted
        if(this.cueBallPottedOnShot) {
            isFoul = true;
            message = "Foul: Cue ball potted. ";
            snookerGame.isCueBallPlacementMode = true; // Enable cue ball placement
        }

        // -- No Ball Hit
        else if (!firstHit) {
            isFoul = true;
            message = "Foul: No ball hit. ";
        }

        // -- Wrong Ball Hit First
        else {
            let validFirstHit = false;

            // Check if first hit ball matches Ball On
            if(ballOn === 'Red') {
                if(firstHit.color.name === 'Red') validFirstHit = true;
            }
            else if (ballOn === 'Colour') {
                if(firstHit.color.name !== 'Red') validFirstHit = true;
            } else {
                // When there is no Reds remaining
                if(firstHit.color.name === ballOn) validFirstHit = true;
            }

            // Wrong ball hit first - FOUL
            if(!validFirstHit) {
                isFoul = true;
                message = `Foul: You hit (${firstHit.color.name}) first instead of (${ballOn}). `;
                let valOn = (ballOn === 'Colour' || ballOn === 'Red') ? 1 : snookerGame.getBallValue(ballOn);
                penaltyPoints = Math.max(4, valOn, firstHit.value);
            }
        }


        // --- Check Potted Balls & Add Score --- //
        let nextBallOn = ballOn;
        let legalPotCount = 0;

        // Only evaluate potted balls if no foul occurred
        if(!isFoul) {
            if(pottedBalls.length === 0) {
                // Legal but no Balls Potted. Change turn
                message = "No ball potted.";
                if(ballOn === 'Colour' ) nextBallOn = 'Red'; // After Colour, Ball On goes to Red
            }
            // Ball Potted
            else {
                for (let ball of pottedBalls) {
                    let isValidPot = false;
                    // Check if potted ball matches Ball On
                    if(ballOn === 'Red') {
                        if(ball.color.name === 'Red') isValidPot = true;
                    }
                    else if (ballOn === 'Colour') {
                        if(ball.color.name !== 'Red') isValidPot = true;
                    }
                    else {
                        // When there is no Reds remaining
                        if(ball.color.name === ballOn) isValidPot = true;
                    }

                    // Check if potted balls are valid and calculate score
                    if(isValidPot) {
                        // Note: Multiple reds can be potted

                        turnScore += ball.value;
                        legalPotCount ++;
                        if(ballOn !== 'Red' && legalPotCount > 1) {
                            isFoul = true;
                            message = "Foul: More than one Colour ball potted";
                        }
                    }
                    else { // Invalid Pot - penalty
                        isFoul = true;
                        message = `Foul: Potted (${ball.color.name}) instead of (${ballOn}). `;
                        penaltyPoints = Math.max(penaltyPoints, ball.value);
                    }
                }
            }
        } // End no foul check (!isFoul)


        // --- Conclude Shot Result --- //
        if(isFoul) {
            snookerGame.applyFoul(penaltyPoints, message);

            // After foul, next target is determined by remaining balls
            if(this.hasRedsRemaining()) {
                snookerGame.BallOn = 'Red';
            } 
            else {
                const order = Game.COLOR_ORDER;
                let correctedBallOn = null;

                for(const colorName of order) {
                    const ballExists = this.allBalls.some(ball => ball.color.name === colorName);
                    if(ballExists) {
                        correctedBallOn = colorName;
                        break;
                    }
                }
                if(correctedBallOn) {
                    snookerGame.BallOn = correctedBallOn;
                } else {
                    snookerGame.BallOn = 'End Game';
                    snookerGame.displayMessage("All balls potted! Good Job!");
                }
            }
            // Re-spot potted balls after foul
            snookerGame.ballsToRespot.push(...pottedBalls);
            
            // Switch player in VS mode after foul
            if (snookerGame.isVsMode) {
                snookerGame.switchPlayer();
            }

        } 
        else {
            // Legal shot - add score

            if(turnScore > 0) {
                snookerGame.updateScore(turnScore);

                // Update Message
                const lastName = pottedBalls[pottedBalls.length - 1].color.name;
                snookerGame.displayMessage(`${lastName} Ball: ${turnScore} points!`);

                if(ballOn === 'Red') {
                    // Red Potted, next Ball On is Colour
                    if(this.hasRedsRemaining()) {
                        snookerGame.BallOn = 'Colour';
                    } else {
                        snookerGame.BallOn = 'Yellow'; // No Reds left
                    }

                } else if (ballOn === 'Colour') {
                    if(this.hasRedsRemaining()) {
                        snookerGame.BallOn = 'Red'; // After Colour, Ball On goes to Red
                        snookerGame.ballsToRespot.push(...pottedBalls); // Respot Colours
                    } else {
                        // No Reds remaining, continue with Colours in order
                        snookerGame.ballsToRespot.push(...pottedBalls); // Respot Colours
                        snookerGame.BallOn = Game.COLOR_ORDER;
                    }
                }
                else {
                    const order = Game.COLOR_ORDER;
                    let idX = order.indexOf(ballOn);
                    if(idX !== -1) {
                        for(let ball of pottedBalls) {
                            const index = this.allBalls.indexOf(ball);
                            if(index > -1) {
                                this.allBalls.splice(index, 1); // Remove potted colour from allBalls
                            }
                        }

                        if (idX < order.length - 1) {
                            snookerGame.BallOn = order[idX + 1]; // Next Colour in order
                        } else {
                            snookerGame.BallOn = 'End Game'; // End of frame
                            snookerGame.displayMessage("All balls potted! Good Job!");
                        }
                    } 
                }
            } 
            // No Balls Potted
            else {
                if(ballOn === 'Colour' && !this.hasRedsRemaining()) {
                    nextBallOn = 'Red'; // After Colour, Ball On goes to Red
                }
                snookerGame.displayMessage("No ball potted.");
                
                // Switch player in VS mode when no balls potted
                if (snookerGame.isVsMode) {
                    snookerGame.switchPlayer();
                }
            }
        } // end isFoul
    } // End checkShotResult


    // Re-spot potted coloured balls
    reSpotBall(pottedBall) {

        if(pottedBall.color.name === 'Red' && !snookerGame.foulCommitted) return; // Reds are not re-spotted unless foul

        const ballName = pottedBall.color.name.toUpperCase();
        const originalSpot = this.reSpotPositions[ballName];
        let targetSpot = originalSpot;


        // If need to re-spot Red ball, choose random position
        if(pottedBall.color.name === 'Red') {
            targetSpot = this.getRandomFeltPosition();
        }


        if(!targetSpot) {
            //console.error(`No spot defined for ${ballName} ball.`);
            return;
        }

        let isSpotOccupied = false;
        const collisionRadius = this.ballRadius * 2 + 0.1; // Small padding to avoid overlaps

        // Check if the original spot is occupied
        for(let otherBall of this.allBalls) {
            // Check if other ball is too close to the target spot
            if(otherBall.isPotted || otherBall === pottedBall) continue;

            // Check distance between target spot and other ball
            const distance = dist(targetSpot.x, targetSpot.y, otherBall.body.position.x, otherBall.body.position.y);
            if(distance < collisionRadius) {
                isSpotOccupied = true;
                break;
            }
        }

        // Re-spot the ball if spot is occupied
        if(isSpotOccupied) {
            // Find nearest available position around the original spot
            targetSpot = this.reSpotPositions.BLACK; // Default to black spot if needed
            //console.log(`${ballName} spot occupied. Re-spotting at Black ball spot.`);
        
        } else {
            // Re-spot at original position
        }

        // Create and add the re-spotted ball to the world
        const newBall = new Ball(
                targetSpot.x, targetSpot.y, this.ballRadius, pottedBall.color, pottedBall.value);

        // Add new ball to allBalls array, replacing the potted ball
        const index = this.allBalls.indexOf(pottedBall);
        if(index > - 1) {
            this.allBalls.splice(index, 1, newBall);
        }

        newBall.isPotted = false; // Reset potted status
    }


    //--- Predictive Path Calculation ---//
    findClosestColission(startPos, directionAngle, ballRadius, ballToExclude) {
        let closestCollision = {
            dist: Infinity,
            pos: null,
            type: null, // 'ball', 'pocket', 'cushion'
            targetBall: null,
            pocket: null
        };

        const directionVector = p5.Vector.fromAngle(directionAngle);
        const rayStart = createVector(startPos.x, startPos.y);

        // Check collision with other balls
        const ballsToCheck = this.allBalls.filter(ball => ball !== ballToExclude && !ball.isPotted);
        for(let ball of ballsToCheck) {
            const ballPos = createVector(ball.body.position.x, ball.body.position.y);
            const toBall = p5.Vector.sub(ballPos, rayStart);
            const radius = ballRadius + ballRadius;

            const tca = toBall.dot(directionVector);
            if(tca < 0) continue; // Ball is behind the ray

            const d2 = toBall.dot(toBall) - tca * tca;
            if(d2 > radius * radius) continue; // No collision

            const thc = Math.sqrt(radius * radius - d2);
            const t0 = tca - thc;
            
            if(t0 > 0.001 && t0 < closestCollision.dist) {
                closestCollision = {
                    dist: t0,
                    pos: p5.Vector.add(rayStart, p5.Vector.mult(directionVector, t0)),
                    type: 'ball',
                    targetBall: ball,
                    pocket: null
                };
            }
        }


        // Check collision with pockets
        for(let pocket of snookerTable.pockets) {
            const pocketPos = createVector(pocket.x, pocket.y);
            const toPocket = p5.Vector.sub(pocketPos, rayStart);
            const radius = snookerTable.pocketRadius + 12; // Effective radius for collision

            const tca = toPocket.dot(directionVector);
            const d2 = toPocket.dot(toPocket) - tca * tca;
            const radiusEff = radius - ballRadius;

            if(d2 > radiusEff * radiusEff) continue; // No collision

            const thc = Math.sqrt(radiusEff * radiusEff - d2);
            const t0 = tca - thc;

            if(t0 > 0.001 && t0 < closestCollision.dist) {
                closestCollision = {
                    dist: t0,
                    pos: p5.Vector.add(rayStart, p5.Vector.mult(directionVector, t0)),
                    type: 'pocket',
                    targetBall: null,
                    pocket: pocket
                };
            }
        }


        // Check collision with table cushions
        const minX = snookerTable.feltX + ballRadius;
        const maxX = snookerTable.feltX + snookerTable.feltWidth - ballRadius;
        const minY = snookerTable.feltY + ballRadius;
        const maxY = snookerTable.feltY + snookerTable.feltHeight - ballRadius;

        // Vertical cushions
        if(abs(directionVector.x) > 0.001) {
            const targetX = directionVector.x > 0 ? maxX : minX;
            const t = (targetX - startPos.x) / directionVector.x;

            if(t > 0.001 && t < closestCollision.dist) {
                const yHit = startPos.y + directionVector.y * t;

                if(yHit >= minY && yHit <= maxY) {
                    closestCollision = {
                        dist: t,
                        pos: createVector(targetX, yHit),
                        type: 'cushion',
                        targetBall: null,
                        pocket: null,
                        normalAngle: directionVector.x > 0 ? PI : 0
                    };
                }
            }
        }

        // Horizontal cushions
        if(abs(directionVector.y) > 0.001) {
            const targetY = directionVector.y > 0 ? maxY : minY;
            const t = (targetY - startPos.y) / directionVector.y;

            if(t > 0.001 && t < closestCollision.dist) {
                const xHit = startPos.x + directionVector.x * t;
                if(xHit >= minX && xHit <= maxX) {
                    closestCollision = {
                        dist: t,
                        pos: createVector(xHit, targetY),
                        type: 'cushion',
                        targetBall: null,
                        pocket: null,
                        normalAngle: directionVector.y > 0 ? -HALF_PI : HALF_PI
                    };
                }
            }
        }

        return closestCollision.dist === Infinity ? null : closestCollision;

    } // ---- End of findClosestColission ---- //


    // Draw predicted path for cue ball and object ball
    drawPredictedPath(startBall, initialAngle) {
        // ---- Cue Ball (solid line)Path Prediction ---- //
        const {segments: cueSegments, lastCollision} = this._getPredictionSegments(
            startBall.body.position,
            initialAngle,
            startBall,
            'cue_path',
            true, //stopOnBallCollision
            [800, 400] // Line Lengths
        );

        let allSegments = cueSegments;

        // ---- Object Ball (dashed line) Path Prediction ---- //
        if(lastCollision && lastCollision.type === 'ball') {
            const targetBall = lastCollision.targetBall;
            const hitPos = lastCollision.pos;
            const targetPos = targetBall.body.position;

            // Calculate deflection angle for the target ball
            const deflectionAngle = atan2(targetPos.y - hitPos.y, targetPos.x - hitPos.x);

            // Get prediction segments for the target ball
            const {segments: objSegments} = this._getPredictionSegments(
                targetPos,
                deflectionAngle,
                targetBall,
                'object_ball_path',
                false, //stopOnBallCollision
                [500, 300] // Line Lengths
            );

            // Combine segments ( cue ball path + object ball path )
            // Annotate object-ball segments with the target ball's name
            const annotated = objSegments.map(s => ({...s, objectBallName: targetBall.color.name}));
            allSegments = allSegments.concat(annotated);
        }
        return allSegments;
    }


    // Helper function to get prediction segments
    _getPredictionSegments(startPos, startAngle, ballToExclude, pathType, stopOnBallCollision, maxLengths) {
        const Max_Seg = 2;  // Maximum number of segments to predict
        const segments = []; // To store path segments
        let lastCollision = null; // To store the last collision info

        let currentPos = startPos; // Initial position
        let currentAngle = startAngle; // Initial angle
        
        // Loop to find segments and collisions
        for(let i = 0; i < Max_Seg; i++) {
            // Define max length for current segment
            const currentMaxLength = (maxLengths && maxLengths[i]) ? maxLengths[i] : Infinity;

            const collision = this.findClosestColission(
                currentPos,
                currentAngle,
                this.ballRadius,
                ballToExclude
            );

            if(!collision) { // No collision found, extend line
                const endPos = p5.Vector.add(
                    createVector(currentPos.x, currentPos.y),
                    p5.Vector.fromAngle(currentAngle).mult(currentMaxLength)
                    // Line Length 
                );

                segments.push({start: currentPos, end: endPos, type: pathType, angle: currentAngle});
                break; // No more collisions
            }


            //-- Check if collision is beyond max length 
            if(collision.dist > currentMaxLength) {
                const endPos = p5.Vector.add(
                    createVector(currentPos.x, currentPos.y),
                    p5.Vector.fromAngle(currentAngle).mult(currentMaxLength)
                );
                segments.push({start: currentPos, end: endPos, type: pathType, angle: currentAngle});
                break; // Segment ends before collision
            }


            // Calculate end position of the segment
            let pathEndPos = collision.pos;

            if(collision.type === 'cushion') {
                const incomingVector = p5.Vector.fromAngle(currentAngle);
                pathEndPos = createVector(collision.pos.x + incomingVector.x * 2,
                            collision.pos.y + incomingVector.y * 2);
            }

            // Add segment to the list 
            segments.push({start: currentPos, end: pathEndPos, type: pathType, angle: currentAngle});
            lastCollision = collision; // Update last collision


            // --- Handle collision response --- //

            // Stop prediction on pocket collision
            if(collision.type === 'pocket') {
                break; 
            }

            // Ball collision: predict object ball path
            if(collision.type === 'ball') {
                if(stopOnBallCollision) {
                    break; // Stop prediction on ball collision
                } else {
                    // Continue predicting for object ball
                    currentPos = collision.pos;
                    currentAngle = currentAngle; // Angle remains same for object ball
                    continue;
                }
            }

            // Bounce off cushion: calculate reflection angle
            if(collision.type === 'cushion') { 
                const normalAngle = collision.normalAngle;

                // Return the absolute angle after reflection
                if(Math.abs(cos(currentAngle - normalAngle)) > 0.001 &&
                    (normalAngle === 0 || normalAngle === PI)) {
                    // Vertical cushion
                    currentAngle = PI - currentAngle;
                }
                else if(Math.abs(sin(currentAngle - normalAngle)) > 0.001 &&
                    (normalAngle === HALF_PI || normalAngle === -HALF_PI)) {
                    // Horizontal cushion
                    currentAngle = -currentAngle;
                }
                else {
                    break; // Angle too close to normal, stop prediction
                }

                // Update position slightly beyond cushion to avoid immediate re-collision
                currentPos = collision.pos; // Update position to collision point
                const directionVector = p5.Vector.fromAngle(currentAngle);
                currentPos.x += directionVector.x * 2;
                currentPos.y += directionVector.y * 2;

                // Normalize angle between 0 and TWO_PI
                currentAngle = (currentAngle % TWO_PI + TWO_PI) % TWO_PI; // Normalize angle
            }

        }  // End of for loop

        return {segments, lastCollision};


    } // End of _getPredictionSegments

}
