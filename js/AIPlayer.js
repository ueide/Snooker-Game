/* AIPlayer.js
    Automatic logic for playing snooker against the human player.
    The AI analyzes the table, selects shots, and executes them.
*/


//--- AI Player Class ---///
class AIPlayer {
    constructor() {
        this.thinkingTime = 1500; // Delay before shot (ms) - makes it feel more natural
        this.isThinking = false;
        this.selectedAngle = 0;
        this.selectedPower = 0;
        
        // Shot analysis parameters
        this.angleTestSteps = 72; // Test 72 angles (every 5 degrees)
        this.minPower = 0.6;
        this.maxPower = 1.0;
    }

    // Called when it's the AI's turn to play
    takeTurn() {
        if (this.isThinking) {
            console.log("AI already thinking, skipping");
            return;
        }
        
        console.log("AI takeTurn() called");
        this.isThinking = true;
        
        // Delay to simulate thinking
        setTimeout(() => {
            this.analyzeAndShoot();
            this.isThinking = false;
        }, this.thinkingTime);
    }

    // Analyze the table and choose the best shot
    analyzeAndShoot() {
        if (!snookerBalls.cueBall) {
            console.log("AI: No cue ball found");
            return;
        }

        const cueBallPos = snookerBalls.cueBall.body.position;
        const targetBallName = snookerGame.BallOn;
        
        console.log("AI analyzing shot - Target:", targetBallName);
        
        // Find best shot
        const bestShot = this.findBestShot(cueBallPos, targetBallName);
        
        if (bestShot) {
            console.log("AI executing shot with score:", bestShot.score);
            // Lock the cue at the chosen angle
            poolCue.isLocked = true;
            poolCue.lockPositionX = cueBallPos.x;
            poolCue.lockPositionY = cueBallPos.y;
            poolCue.lockAngle = bestShot.angle;
            
            // Set power
            shotPower.currentPower = bestShot.power;
            
            // Execute shot after a brief moment
            setTimeout(() => {
                this.executeShot();
            }, 300);
        } else {
            console.log("AI: No good shot found, executing random shot");
            // Fallback: random shot if no good option found
            this.executeRandomShot(cueBallPos);
        }
    }

    // Find the best shot by testing multiple angles and evaluating outcomes
    findBestShot(cueBallPos, targetBallName) {
        let bestShot = null;
        let bestScore = -1;

        // Get target balls
        const targetBalls = this.getTargetBalls(targetBallName);
        if (targetBalls.length === 0) {
            console.log("No target balls found for:", targetBallName);
            return null;
        }

        // Test multiple angles
        for (let i = 0; i < this.angleTestSteps; i++) {
            const angle = (TWO_PI * i) / this.angleTestSteps;
            
            // Use the existing trajectory prediction to find what we'll hit
            const prediction = snookerBalls._getPredictionSegments(
                cueBallPos,
                angle,
                snookerBalls.cueBall,
                'cue_path',
                true,
                [800, 400]
            );

            // Check if we hit a ball
            if (prediction.lastCollision && prediction.lastCollision.type === 'ball') {
                const hitBall = prediction.lastCollision.targetBall;
                const hitBallName = hitBall.color.name;
                
                // Only evaluate if we hit the correct target
                if (this.isValidTarget(hitBallName, targetBallName)) {
                    const hitBallPos = hitBall.body.position;
                    const score = this.evaluateShot(cueBallPos, hitBallPos, angle, prediction);
                    
                    // If this is better than previous best, save it
                    if (score > bestScore) {
                        bestScore = score;
                        
                        // Calculate power based on distance and shot difficulty
                        const distanceToBall = dist(
                            cueBallPos.x, cueBallPos.y,
                            hitBallPos.x, hitBallPos.y
                        );
                        
                        // Adjust power: closer shots = less power, farther = more power
                        let power = 0.7 + (distanceToBall / 500) * 0.3;
                        power = constrain(power, this.minPower, this.maxPower);
                        
                        bestShot = {
                            angle: angle,
                            power: power,
                            targetBall: hitBall,
                            score: score
                        };
                    }
                }
            }
        }

        console.log("Best shot found:", bestShot ? `angle=${bestShot.angle.toFixed(2)}, power=${bestShot.power.toFixed(2)}, score=${bestShot.score.toFixed(1)}` : "None");
        return bestShot;
    }

    // Evaluate the quality of a shot based on various factors
    evaluateShot(cueBallPos, targetBallPos, angle, prediction) {
        let score = 100; // Base score for hitting correct target
        
        // 1. POCKET PROXIMITY - Most important factor
        const closestPocket = this.getClosestPocket(targetBallPos);
        const distanceToPocket = dist(targetBallPos.x, targetBallPos.y, closestPocket.x, closestPocket.y);
        
        // Heavy bonus for balls very close to pockets
        if (distanceToPocket < 80) {
            score += 200; // Excellent pot opportunity
        } else if (distanceToPocket < 150) {
            score += 100; // Good pot opportunity
        } else if (distanceToPocket < 250) {
            score += 50; // Decent pot opportunity
        }
        
        // 2. ANGLE TO POCKET - Check if ball can travel to pocket
        const angleToPocket = atan2(closestPocket.y - targetBallPos.y, closestPocket.x - targetBallPos.x);
        const hitAngle = atan2(targetBallPos.y - cueBallPos.y, targetBallPos.x - cueBallPos.x);
        
        // Calculate angle difference (how well aligned the shot is with pocket)
        let angleDiff = abs(angleToPocket - hitAngle);
        if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
        
        // Big bonus for well-aligned shots
        const angleScore = (PI - angleDiff) / PI * 100;
        score += angleScore;
        
        // 3. DISTANCE TO TARGET BALL - Prefer closer balls
        const distanceToBall = dist(cueBallPos.x, cueBallPos.y, targetBallPos.x, targetBallPos.y);
        const distanceScore = Math.max(0, 80 - distanceToBall / 8);
        score += distanceScore;
        
        // 4. CLEAR PATH - Check if trajectory has cushion bounces
        let cushionBounces = 0;
        for (let segment of prediction.segments) {
            if (segment.bounces) {
                cushionBounces += segment.bounces;
            }
        }
        
        // Penalty for shots requiring cushions
        score -= cushionBounces * 30;
        
        // 5. TARGET BALL NEAR CENTER OF TABLE - Prefer balls in play area
        const tableCenterX = snookerTable.feltX + snookerTable.feltWidth / 2;
        const tableCenterY = snookerTable.feltY + snookerTable.feltHeight / 2;
        const distanceToTableCenter = dist(targetBallPos.x, targetBallPos.y, tableCenterX, tableCenterY);
        
        // Slight bonus for balls near center
        const centerScore = Math.max(0, 30 - distanceToTableCenter / 10);
        score += centerScore;
        
        return score;
    }

    // Find the closest pocket to a given position
    getClosestPocket(position) {
        const pockets = snookerTable.pockets;
        let closest = pockets[0];
        let minDist = Infinity;
        
        for (let pocket of pockets) {
            const d = dist(position.x, position.y, pocket.x, pocket.y);
            if (d < minDist) {
                minDist = d;
                closest = pocket;
            }
        }
        
        return closest;
    }

    // Get target balls based on current BallOn rule
    getTargetBalls(targetBallName) {
        const targets = [];
        
        if (targetBallName === 'Red') {
            // Find all red balls
            for (let ball of snookerBalls.allBalls) {
                if (ball.color.name === 'Red') {
                    targets.push(ball);
                }
            }
        } else if (targetBallName === 'Colour') {
            // Find all colored balls (not red, not white)
            for (let ball of snookerBalls.allBalls) {
                if (ball.color.name !== 'Red' && ball.color.name !== 'White') {
                    targets.push(ball);
                }
            }
        } else {
            // Find specific colored ball
            for (let ball of snookerBalls.allBalls) {
                if (ball.color.name === targetBallName) {
                    targets.push(ball);
                }
            }
        }
        
        return targets;
    }

    // Check if the hit ball is a valid target based on current BallOn rule
    isValidTarget(hitBallName, targetBallName) {
        if (targetBallName === 'Red') {
            return hitBallName === 'Red';
        } else if (targetBallName === 'Colour') {
            return hitBallName !== 'Red' && hitBallName !== 'White';
        } else {
            return hitBallName === targetBallName;
        }
    }

    // Execute the shot by applying force to the cue ball
    executeShot() {
        if (!poolCue.isLocked) return;
        
        const cueBallPos = snookerBalls.cueBall.body.position;
        const angle = poolCue.lockAngle;
        const power = shotPower.currentPower;
        
        // Calculate impulse based on power
        const maxImpulse = 0.12; // Tuned for snooker
        const impulse = power * maxImpulse;
        
        // Apply force to cue ball
        const forceX = cos(angle) * impulse;
        const forceY = sin(angle) * impulse;
        
        Matter.Body.applyForce(
            snookerBalls.cueBall.body,
            { x: cueBallPos.x, y: cueBallPos.y },
            { x: forceX, y: forceY }
        );
        
        // Play strike sound
        if (strike_sound) {
            strike_sound.play();
        }
        
        // Mark shot as taken
        snookerGame.isShotTaken = true;
        
        // Trigger cue impact animation
        snookerBalls.addCueImpact(cueBallPos.x, cueBallPos.y);
        
        // Reset for next turn
        poolCue.isLocked = false;
        shotPower.currentPower = 0;
    }

    executeRandomShot(cueBallPos) {
        // Random angle and power
        const angle = random(TWO_PI);
        const power = random(0.7, 1.0); // Strong power
        
        poolCue.isLocked = true;
        poolCue.lockPositionX = cueBallPos.x;
        poolCue.lockPositionY = cueBallPos.y;
        poolCue.lockAngle = angle;
        shotPower.currentPower = power;
        
        setTimeout(() => {
            this.executeShot();
        }, 300);
    }

    chooseCueBallPlacement() {
        // Smart cue ball placement in D-zone
        // Returns {x, y} coordinates for optimal cue ball position
        
        const targetBallName = snookerGame.BallOn;
        const targetBalls = this.getTargetBalls(targetBallName);
        
        if (targetBalls.length === 0) {
            // No targets, place at center
            return {
                x: snookerTable.baulkLineX,
                y: snookerTable.feltY + snookerTable.feltHeight / 2
            };
        }
        
        // Test several positions in the D-zone
        const baulkX = snookerTable.baulkLineX;
        const centerY = snookerTable.feltY + snookerTable.feltHeight / 2;
        const dRadius = snookerTable.D_Radius;
        
        // Test 5 positions: center, top, bottom, upper-mid, lower-mid
        const testPositions = [
            { x: baulkX, y: centerY }, // Center
            { x: baulkX, y: centerY - dRadius * 0.7 }, // Upper
            { x: baulkX, y: centerY + dRadius * 0.7 }, // Lower
            { x: baulkX - dRadius * 0.3, y: centerY - dRadius * 0.4 }, // Upper-mid left
            { x: baulkX - dRadius * 0.3, y: centerY + dRadius * 0.4 }  // Lower-mid left
        ];
        
        let bestPosition = testPositions[0];
        let bestScore = -1;
        
        // Evaluate each position
        for (let pos of testPositions) {
            // Make sure it's inside D-zone
            if (!snookerTable.isInsideDZone(pos.x, pos.y)) continue;
            
            let score = 0;
            
            // Count how many target balls we can hit from this position
            let canHitTargets = 0;
            
            for (let targetBall of targetBalls) {
                const targetPos = targetBall.body.position;
                
                // Calculate direct angle to target
                const angleToTarget = atan2(targetPos.y - pos.y, targetPos.x - pos.x);
                
                // Check if we can see this ball (no obstructions)
                const distance = dist(pos.x, pos.y, targetPos.x, targetPos.y);
                
                // Prefer closer balls
                const distanceScore = Math.max(0, 100 - distance / 5);
                
                // Check if ball is near a pocket
                const closestPocket = this.getClosestPocket(targetPos);
                const distanceToPocket = dist(targetPos.x, targetPos.y, closestPocket.x, closestPocket.y);
                
                let ballScore = distanceScore;
                
                // Big bonus if ball is pottable
                if (distanceToPocket < 100) {
                    ballScore += 150;
                } else if (distanceToPocket < 200) {
                    ballScore += 75;
                }
                
                // Check if angle to ball aligns with pocket
                const angleToPocket = atan2(closestPocket.y - targetPos.y, closestPocket.x - targetPos.x);
                let angleDiff = abs(angleToPocket - angleToTarget);
                if (angleDiff > PI) angleDiff = TWO_PI - angleDiff;
                
                // Bonus for good angle
                if (angleDiff < PI / 4) { // Within 45 degrees
                    ballScore += 50;
                }
                
                score += ballScore;
                canHitTargets++;
            }
            
            // Bonus for positions that can see more targets
            score += canHitTargets * 20;
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = pos;
            }
        }
        
        console.log(`AI chose D-zone position: (${bestPosition.x.toFixed(0)}, ${bestPosition.y.toFixed(0)}) with score ${bestScore.toFixed(0)}`);
        return bestPosition;
    }
}
