/* AIPlayer.js
    Automatic logic for playing snooker against the human player.
    The AI analyzes the table, selects shots, and executes them.
*/


//--- AI Player Class ---///
class AIPlayer {
    constructor() {
        this.thinkingTime = 1500; // Delay to simulate thinking (ms)
        this.isThinking = false;
        this.selectedAngle = 0;
        this.selectedPower = 0;
        
        // Shot analysis parameters
        this.angleTestSteps = 36; // Test 36 angles (every 5 degrees, only in valid 180 degree range)
        this.minPower = 0.6;
        this.maxPower = 1.0;
        
        // Weights for scoring shots
        this.weights = {
            pocketProximity: 250,      // Bonus for balls near pockets
            directPath: 200,           // Heavy bonus for direct shots (no cushions)
            targetDistance: 80,        // Prefer closer target balls
            tableCenter: 20,           // Slight preference for centered balls
            pocketAlignment: 150       // Bonus for good angle to pocket
        };
    }

    // Main function to take a turn
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

    // Analyze the table and decide on a shot
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
            // Lock cue position and angle
            poolCue.isLocked = true;
            poolCue.lockPositionX = cueBallPos.x;
            poolCue.lockPositionY = cueBallPos.y;
            poolCue.lockAngle = bestShot.angle;
            
            // Set the shot power
            shotPower.currentPower = bestShot.power;
            
            // Execute the shot after a short delay
            setTimeout(() => {
                this.executeShot();
            }, 300);
        } else {
            console.log("AI: No good shot found, executing random shot");
            // No good shot found, play a random shot
            this.executeRandomShot(cueBallPos);
        }
    }

    // Find the best shot by testing angles and scoring options
    findBestShot(cueBallPos, targetBallName) {
        let bestShot = null;
        let bestScore = -Infinity;

        // Get target balls
        const targetBalls = this.getTargetBalls(targetBallName);
        if (targetBalls.length === 0) {
            console.log("No target balls found for:", targetBallName);
            return null;
        }

        // Score target balls based on proximity to pockets and cue ball
        const scoredTargets = targetBalls.map(ball => {
            const ballPos = ball.body.position;
            const distToCue = dist(cueBallPos.x, cueBallPos.y, ballPos.x, ballPos.y);
            const closestPocket = this.getClosestPocket(ballPos);
            const distToPocket = dist(ballPos.x, ballPos.y, closestPocket.x, closestPocket.y);
            
            // Calculate option score for this ball
            let optionScore = 0;
            
            // Bonus for balls close to pockets
            if (distToPocket < 100) {
                optionScore += 500;
            } else if (distToPocket < 180) {
                optionScore += 300;
            } else if (distToPocket < 280) {
                optionScore += 150;
            }
            
            // Bonus for balls close to cue
            if (distToCue < 150) {
                optionScore += 200;
            } else if (distToCue < 280) {
                optionScore += 100;
            }
            
            return { ball, optionScore, distToCue, distToPocket };
        });

        // Sort targets by their option score
        scoredTargets.sort((a, b) => b.optionScore - a.optionScore);
        
        // Focus on top 4 best target balls for shot evaluation
        const relevantTargets = scoredTargets.slice(0, Math.min(4, scoredTargets.length)).map(t => t.ball);
        
        console.log(`AI evaluating ${relevantTargets.length} target ball(s): ${relevantTargets.map(b => b.color.name).join(', ')}`);

        // Test multiple angles around the cue ball
        for (let i = 0; i < this.angleTestSteps; i++) {
            // Angle from -PI to PI, then filter to valid range
            const baseAngle = (TWO_PI * i) / this.angleTestSteps;
            const angle = baseAngle; // Will naturally distribute across full range

            // Use the existing trajectory prediction to find what we'll hit
            const prediction = snookerBalls._getPredictionSegments(
                cueBallPos,
                angle,
                snookerBalls.cueBall,
                'cue_path',
                true,
                [800, 400]
            );

            // Check what ball we hit first
            if (prediction.lastCollision && prediction.lastCollision.type === 'ball') {
                const hitBall = prediction.lastCollision.targetBall;
                const hitBallName = hitBall.color.name;
                
                // Check if this is a valid target
                if (this.isValidTarget(hitBallName, targetBallName)) {
                    const hitBallPos = hitBall.body.position;
                    // Pass whether this is a high-priority target
                    const isHighPriority = relevantTargets.includes(hitBall);
                    const score = this.evaluateShot(cueBallPos, hitBallPos, angle, prediction, isHighPriority);
                    
                    // If this is better than previous best, save it
                    if (score > bestScore) {
                        bestScore = score;
                        
                        // Determine power based on distance to target ball
                        const distanceToBall = dist(
                            cueBallPos.x, cueBallPos.y,
                            hitBallPos.x, hitBallPos.y
                        );
                        
                        // Power scaling: closer balls need less power, distant balls need more
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

        console.log("Best shot found:", bestShot ? `angle=${bestShot.angle.toFixed(2)}, power=${bestShot.power.toFixed(2)}, score=${bestShot.score.toFixed(1)}, ball=${bestShot.targetBall.color.name}` : "None");
        return bestShot;
    }

    // Evaluate the quality of a shot based on various factors
    evaluateShot(cueBallPos, targetBallPos, angle, prediction, isHighPriority) {
        let score = 100; // Base score for hitting correct target
        
        // PRIORITY BONUS: If this is a high-priority target (near pocket and/or near cue)
        // Give massive boost to make sure AI picks these first
        if (isHighPriority) {
            score += 300; // Major priority boost
        }
        
        // MAJOR FACTOR 1: DIRECT PATH vs CUSHION USAGE
        // Count cushion bounces - heavy penalty for bounces
        let cushionBounces = 0;
        for (let segment of prediction.segments) {
            if (segment.type === 'cue_path') {
                // Check if this segment includes a cushion bounce
                const dx = segment.end.x - segment.start.x;
                const dy = segment.end.y - segment.start.y;
                const segmentDistance = Math.hypot(dx, dy);
                
                // If segment is short and there's a collision, it likely hit a cushion
                if (segmentDistance < 300) {
                    cushionBounces++;
                }
            }
        }
        
        // CRITICAL: Heavily penalize cushion shots
        // Direct path shots should be strongly preferred
        if (cushionBounces === 0) {
            score += this.weights.directPath; // Excellent: direct shot
        } else {
            score -= cushionBounces * 150; // Heavy penalty for each cushion bounce
        }
        
        // FACTOR 2: DISTANCE TO TARGET BALL
        // Prefer closer balls - they're easier and more reliable
        const distanceToBall = dist(
            cueBallPos.x, cueBallPos.y,
            targetBallPos.x, targetBallPos.y
        );
        
        // STRONGER weighting for distance - closer balls are MUCH better
        if (distanceToBall < 120) {
            score += this.weights.targetDistance * 1.5; // Very close ball
        } else if (distanceToBall < 200) {
            score += this.weights.targetDistance; // Close ball, good shot
        } else if (distanceToBall < 280) {
            score += this.weights.targetDistance * 0.6; // Medium distance
        } else if (distanceToBall < 400) {
            score += this.weights.targetDistance * 0.3; // Far ball
        } else {
            score += Math.max(0, this.weights.targetDistance * 0.1 - (distanceToBall - 400) / 20);
        }
        
        // FACTOR 3: POCKET PROXIMITY - Most important for potting
        const closestPocket = this.getClosestPocket(targetBallPos);
        const distanceToPocket = dist(
            targetBallPos.x, targetBallPos.y,
            closestPocket.x, closestPocket.y
        );
        
        // MASSIVE bonuses for balls near pockets (gimme shots)
        if (distanceToPocket < 80) {
            score += this.weights.pocketProximity * 1.3; // EXCELLENT pot opportunity - gimme
        } else if (distanceToPocket < 150) {
            score += this.weights.pocketProximity; // VERY GOOD pot opportunity
        } else if (distanceToPocket < 230) {
            score += this.weights.pocketProximity * 0.6; // Good pot opportunity
        } else if (distanceToPocket < 320) {
            score += this.weights.pocketProximity * 0.3; // Decent pot opportunity
        }
        
        // FACTOR 4: ANGLE TO POCKET ALIGNMENT
        // How well does the shot direction align with pocket direction?
        const angleToPocket = atan2(
            closestPocket.y - targetBallPos.y,
            closestPocket.x - targetBallPos.x
        );
        
        const hitAngle = atan2(
            targetBallPos.y - cueBallPos.y,
            targetBallPos.x - cueBallPos.x
        );
        
        let angleDiff = abs(angleToPocket - hitAngle);
        if (angleDiff > PI) {
            angleDiff = TWO_PI - angleDiff;
        }
        
        // Better alignment = higher score
        // Perfect alignment (0 degrees) = max score
        const alignmentScore = this.weights.pocketAlignment * (1 - Math.min(1, angleDiff / PI));
        score += alignmentScore;
        
        // FACTOR 5: TABLE POSITION
        // Slight preference for balls in center area (more potting opportunities)
        const tableCenterX = snookerTable.feltX + snookerTable.feltWidth / 2;
        const tableCenterY = snookerTable.feltY + snookerTable.feltHeight / 2;
        const distanceToTableCenter = dist(
            targetBallPos.x, targetBallPos.y,
            tableCenterX, tableCenterY
        );
        
        const centerScore = Math.max(0, this.weights.tableCenter - distanceToTableCenter / 20);
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
        
        // Use same physics as player - setVelocity with MaxSpeed
        const MaxSpeed = 18; // Same as ShotPower.js
        const speed = power * MaxSpeed;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        Matter.Body.setVelocity(
            snookerBalls.cueBall.body,
            { x: velocityX, y: velocityY }
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
        // Choose optimal cue ball placement in D-zone
        const targetBallName = snookerGame.BallOn;
        const targetBalls = this.getTargetBalls(targetBallName);
        
        if (targetBalls.length === 0) {
            // No targets, place at center
            return {
                x: snookerTable.baulkLineX,
                y: snookerTable.feltY + snookerTable.feltHeight / 2
            };
        }
        
        // Find closest target balls
        const sortedTargets = targetBalls.sort((a, b) => {
            const dBaulk = 80; // Distance from baulk line to check
            const cA = snookerTable.baulkLineX - dBaulk;
            const cB = snookerTable.baulkLineX - dBaulk;
            
            const distA = dist(cA, snookerTable.feltC_y, a.body.position.x, a.body.position.y);
            const distB = dist(cB, snookerTable.feltC_y, b.body.position.x, b.body.position.y);
            return distA - distB;
        });
        
        // D-zone parameters
        const baulkX = snookerTable.baulkLineX;
        const centerY = snookerTable.feltY + snookerTable.feltHeight / 2;
        const dRadius = snookerTable.D_Radius;
        
        // Generate test positions
        const testPositions = [
            { x: baulkX, y: centerY }, // Center
            { x: baulkX, y: centerY - dRadius * 0.5 }, // Top
            { x: baulkX, y: centerY + dRadius * 0.5 }, // Bottom
            { x: baulkX - dRadius * 0.5, y: centerY - dRadius * 0.3 }, // Upper left
            { x: baulkX - dRadius * 0.5, y: centerY + dRadius * 0.3 }, // Lower left
            { x: baulkX - dRadius * 0.7, y: centerY }, // Far left
            { x: baulkX + dRadius * 0.2, y: centerY } // Slightly right
        ];
        
        let bestPosition = testPositions[0];
        let bestScore = -Infinity;
        
        // Evaluate each position
        for (let pos of testPositions) {
            // Must be inside D-zone
            if (!snookerTable.isInsideDZone(pos.x, pos.y)) continue;
            
            let score = 0;
            
            // Evaluate access to closest target balls
            for (let j = 0; j < Math.min(2, sortedTargets.length); j++) {
                const targetBall = sortedTargets[j];
                const targetPos = targetBall.body.position;
                
                // Distance to this target
                const distance = dist(pos.x, pos.y, targetPos.x, targetPos.y);
                
                // Closer position = higher score
                const distanceScore = Math.max(0, 200 - distance / 2);
                score += distanceScore * (2 - j); // Closest target gets more weight
                
                // Check if target is pottable from this position
                const closestPocket = this.getClosestPocket(targetPos);
                const distanceToPocket = dist(targetPos.x, targetPos.y, closestPocket.x, closestPocket.y);
                
                if (distanceToPocket < 150) {
                    score += 100; // Good pottability
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = pos;
            }
        }
        
        console.log(`AI chose D-zone position: (${bestPosition.x.toFixed(0)}, ${bestPosition.y.toFixed(0)}) with score ${bestScore.toFixed(0)}`);
        return bestPosition;
    }
}
