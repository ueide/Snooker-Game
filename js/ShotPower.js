
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
        //fill(180);
        rect(this.xPos, this.yPos + this.height - this.gapHeight, 
                this.width, this.gapHeight, 0, 0, this.radius, this.radius);

        // ---- Power Fill ----
        this.drawPowerBar();

        // ---- Indicator ----
        this.drawIndicator();

        // ---- Cue Illustration ----
        this.drawCueIllustration();

        pop();

    }



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



    drawIndicator() {

        // Length of dotted line
        const indicatorPositions = [
            {label: '25%', yFraction: 0.25},
            {label: '50%', yFraction: 0.50},
            {label: '75%', yFraction: 0.75},
            {label: '100%', yFraction: 1.0},
        ];

        // --- Draw dotted lines and labels ---
        const textOffset = 8; // Space between line end and text
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

            // -- Label 25%, 50%, 75%, 100%
            noStroke();
            fill(230)
            textAlign(LEFT, CENTER);
            textSize(14);
            text(indicator.label, this.xPos + this.width + textOffset, indicator_y);
        }


    } // --- END drawIndicator ---



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

        // ---- Cue Tip ----
        fill(240); // reddish brown color
        rect(0, -cue_height/2 + tip_height/2, cue_width, tip_height, 3, 3, 0, 0);



        pop();


    } // --- END drawCueIllustration ---


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
        }

    }


    endDrag() {
        this.isDragging = false;
        this.shotPower = 0; // Reset shot power after the shot
    }

}