
class PoolCue {

    constructor() {
        // Cue properties
        this.length = 300; // Length of the cue/

        //Cue base properties
        this.baseLength = 80; // Base length of the cue
        this.baseThickness = 8; // Thickness of the base

        // Cue tip properties
        this.tipLength = 5; // Length of the tip
        this.tipThickness = 2.7; // Thickness of the tip
        this.lineTip = 5; // Length of the line near the tip

        //Cue body properties
        this.bodyLength = this.length - this.baseLength - this.tipLength - this.lineTip; // Length of the body
        this.bodyStartThickness = 8; // Thickness at the start of the body
        this.bodyEndThickness = 5; // Thickness at the end of the body


        this.isLocked = false; // Is the cue locked to a position
        this.lockPositionX = 0; // X position when locked
        this.lockPositionY = 0; // Y position when locked
        this.lockAngle = 0; // Angle when locked
    }


    display(targetX, targetY) {
        
        let cueX, cueY;
        let angle;

        // Determine cue position
        if(this.isLocked) {
            cueX = this.lockPositionX;
            cueY = this.lockPositionY;
            angle = this.lockAngle; // Use locked angle
        } else {
            cueX = targetX;
            cueY = targetY;
            angle = atan2(cueY - 700/2, cueX - 1440/2);

        }



        // ---- Calculate angle towards target ----//


        // ---- Draw the cue ---- //
        push();
        translate(cueX, cueY); // Move to cue position
        rotate(angle); // Rotate towards target

        // draw properties
        const X_tipEnd = 0; // 0
        const X_lineTip_Start = - this.tipLength; // -5
        const X_bodyStart = - (this.tipLength + this.lineTip); // -10
        const X_baseStart = - (this.tipLength + this.lineTip + this.bodyLength); // -220
        const X_baseEnd = -this.length; // -300

        noStroke();

        // -- Cue Base (brown part )-- //
        fill(102, 51, 0); // Brown color
        rect(X_baseEnd, -this.baseThickness / 2, this.baseLength, this.baseThickness, 4, 0, 0, 4);
        // -- End Cue Base -- //


        // -- Cue Body (Silver part) -- //
        fill(200);
        quad(
            X_bodyStart, - this.bodyEndThickness / 2,
            X_bodyStart, this.bodyEndThickness / 2,
            X_baseStart, this.bodyStartThickness / 2,
            X_baseStart, - this.bodyStartThickness / 2
        );
        // -- End Cue Body -- //


        // -- Cue Tip and line (end part) -- //

        //line near tip
        stroke(10);
        strokeWeight(3);
        line(X_bodyStart, -this.tipThickness / 2, X_bodyStart, this.tipThickness / 2);
        noStroke();

        fill(230);
        //tip
        arc(
            X_lineTip_Start - 4, 0, this.tipLength * 2,
            this.tipThickness * 2, -HALF_PI, HALF_PI
        );

        // -- End Cue Tip and line -- //

        pop();
    }


}
