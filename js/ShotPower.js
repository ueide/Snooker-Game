/* ShotPower.js
    Manages the shot power bar display and interactions
*/


//--- ShotPower Class ---//
class ShotPower {

    constructor() {
        // Position and dimensions
        this.xPos = 136; // Left side of the canvas
        this.yPos = 200; 
        this.width = 40;
        this.height = 300;
        this.radius = 8; // Corner radius
    
        // Dragging state
        this.isDragging = false;
        this.shotPower = 0;
        this.dragStartY = 0;
        this.maxDragDistance = 200;
    }


    //--- Display Shot Power Bar ---//
    display() {

        push();
        rectMode(CORNER);
        noStroke();

        // ---- Shadow ----
        drawingContext.shadowBlur = 12;
        drawingContext.shadowColor = 'rgba(223, 228, 233, 0.4)';
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;

        // ---- Power Bar Background ----
        fill(230);
        rect(this.xPos, this.yPos, this.width, this.height, this.radius);
        
        // ---- Remove shadow for other elements ----
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0)';


        // ---- GAP area ----
        rect(this.xPos, this.yPos + this.height - this.gapHeight, 
                this.width, this.gapHeight, 0, 0, this.radius, this.radius);

        // ---- Power Fill ----
        this.drawPowerBar();

        // ---- Indicator ----
        this.drawIndicator();

        // ---- Cue Illustration ----
        this.drawCueIllustration();


        // --- Percentage Text ---
        if(this.isDragging && this.shotPower > 0.04) {
            // Calculate fill height based on shotPower
            let labelY = this.yPos - this.shotPower - 10;

            // Prevent text from going above the bar
            let powerPercent = this.shotPower * 100;
            let labelText = round(powerPercent) + '%';

            // Draw text
            fill(230);
            textSize(16);
            textAlign(CENTER, BOTTOM);
            text(labelText, this.xPos + this.width / 2, labelY);
        }
        // ---- END Percentage Text ----

        pop();

    }


    //--- Draw the filled portion of the power bar ---//
    drawPowerBar() {

        // Calculate fill height based on shotPower
        const maxFillHeight = this.height;
        let fillHeight = this.shotPower * maxFillHeight ;


        // ---- Determine color based on shotPower ----
        let powerColor;
        if(this.shotPower <= 0.25) { 
            powerColor = color(152, 217, 129); // Light Green
        }
        else if(this.shotPower <= 0.5) {
            powerColor = color(31, 156, 31); // Green
        }
        else if(this.shotPower <= 0.75) {
            powerColor = color(255, 153, 51); // Orange
        }
        else { // Above 75%
            powerColor = color(255, 51, 51); // Red
        }


        // ---- Draw the filled portion ----
        fill(powerColor); // Set fill color
        if(this.shotPower >= 1.0) {
            // Full power - fill entire bar
            rect(this.xPos, this.yPos, this.width, this.height, this.radius);
        } else if(this.shotPower > 0) {
            // Partial power - fill from bottom up
            rect(this.xPos, this.yPos, this.width, fillHeight, this.radius, this.radius, 0, 0);
        }

    } // --- END drawPowerBar ---


    //--- Draw power level indicators ---//
    drawIndicator() {

        // Length of dotted line
        const indicatorPositions = [
            {label: '25%', yFraction: 0.25},
            {label: '50%', yFraction: 0.50},
            {label: '75%', yFraction: 0.75},
            {label: '100%', yFraction: 1.0},
        ];

        // --- Draw dotted lines and labels ---
        const dashLength = 4;
        const spaceLength = 3;

        for(let indicator of indicatorPositions) {
            let indicator_y = this.yPos + indicator.yFraction * this.height;
            let currentx = this.xPos;

            while (currentx < this.xPos + this.width && indicator.label !== '100%') {
            // -- Dotted line
            stroke(80);
            strokeWeight(1.5);
            line(currentx, indicator_y, 
                min(currentx + dashLength, this.xPos + this.width),
                indicator_y);
            currentx += dashLength + spaceLength;
            }
        }

    } // --- END drawIndicator ---


    //--- Draw Cue Illustration ---//
    drawCueIllustration() {
        // ---- Cue properties ----
        const cue_height = 200;
        const cue_width = 7;
        const base_height = cue_height * 0.4;
        const tip_height = cue_height * 0.02 ;
        const body_height = cue_height - base_height - tip_height;

        const center_y = this.yPos + this.height / 2 - 16;
        const cue_x = this.xPos + this.width / 2;

        // ---- Draw cue ----
        push();
        translate(cue_x, center_y);

        noStroke();
        rectMode(CENTER);

        // ---- Shadow ----
        drawingContext.shadowBlur = 8;
        drawingContext.shadowColor = 'rgba(19, 20, 20, 0.4)';
        drawingContext.shadowOffsetX = -2;
        drawingContext.shadowOffsetY = 4;

        // ---- Cue Body ----
        fill(200); // silver gray color
        rect(0, 0, cue_width, body_height + base_height);

        // ---- Cue Base ----
        fill(160, 82, 45); // wood darker color
        rect(0, body_height/2 + base_height/2, cue_width, base_height, 0, 0, 4, 4);

        // ---- Remove shadow ----
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0)';
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;

        // ---- Cue Tip ----
        fill(240); // reddish brown color
        rect(0, -cue_height/2 + tip_height/2, cue_width, tip_height, 3, 3, 0, 0);

        pop();

    } 


    //--- Check if mouse is over the shot power bar ---//
    isMouseOver() {
        return mouseX > this.xPos &&
                mouseX < this.xPos + this.width &&
                mouseY > this.yPos &&
                mouseY < this.yPos + this.height;
    }

    startDragging(currentMouseY) {
        this.isDragging = true;
        this.dragStartY = currentMouseY;
    }

    updateDrag(currentMouseY) {

        if(this.isDragging) {

            let dragDistance = currentMouseY - this.dragStartY;
            let powerFraction = constrain(dragDistance / this.maxDragDistance, 0, 1);

            this.shotPower = powerFraction;

            if(poolCue) {
                poolCue.shotDistance = this.shotPower * 50;
            }
        }

    }


    endDrag() {
        if(!this.isDragging) return;// Prevent multiple calls
        this.isDragging = false; // Stop dragging

        if(!snookerBalls.cueBall || !poolCue || !poolCue.isLocked) {
            this.shotPower = 0; // Reset shot power if no cue ball or cue not locked
            return;
        }

        //Sound effect
        strike_sound.play();
        

        //--- Cue impact animation near contact point ---
        if(snookerBalls && snookerBalls.cueBall && poolCue && poolCue.isLocked) {
            const cuePos = snookerBalls.cueBall.body.position;
            const impactX = cuePos.x - Math.cos(poolCue.lockAngle) * snookerBalls.ballRadius;
            const impactY = cuePos.y - Math.sin(poolCue.lockAngle) * snookerBalls.ballRadius;
            snookerBalls.addCueImpact(impactX, impactY);
        }
        

        // ---- SHOT PHYSICS ----
        const MaxSpeed = 18; // Maximum force applied to the cue ball
        const speed = this.shotPower * MaxSpeed; // Scale shot power to speed
        const angle = poolCue.lockAngle; // Use the locked angle of the cue
        const velocityX = Math.cos(angle) * speed; 
        const velocityY = Math.sin(angle) * speed;    

        Matter.Body.setVelocity(snookerBalls.cueBall.body, {x: velocityX, y: velocityY});

        poolCue.shotDistance = 0; // Reset shot distance after the shot
        poolCue.isLocked = false; // Unlock the cue after the shot

        snookerGame.isShotTaken = true; // Mark that a shot has been taken

        //console.log(`Shot taken with power: ${this.shotPower.toFixed(2)} (Speed: ${speed.toFixed(2)}) at angle: ${degrees(angle).toFixed(2)}°`);

        this.shotPower = 0; // Reset shot power after the shot
        //--- END SHOT PHYSICS ----

    }

}