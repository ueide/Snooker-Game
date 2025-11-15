
class Table {

    constructor() {
        // Table dimensions and position
        this.width = Game.TABLE_WIDTH; // 740
        this.height = Game.TABLE_HEIGHT; // 370
        this.x = Game.TABLE_X_OFFSET ; //350
        this.y = Game.TABLE_Y_OFFSET ; //201

        // Ball and pocket dimensions
        this.ballDiameter = this.width / 36; // 740/36 = ~20.55
        this.pocketDiameter = this.ballDiameter * 1.5; // ~30.83
        this.pocketRadius = this.pocketDiameter / 2;
        this.pocket_OffSet = this.pocketRadius / 2;

        // Frame and cushion dimensions
        this.woodFrameThickness = 20;
        this.cushionWidth = 10;

        // Felt - playing surface dimensions
        this.feltX = this.x + this.cushionWidth;
        this.feltY = this.y + this.cushionWidth;
        this.feltWidth = this.width - this.cushionWidth * 2;
        this.feltHeight = this.height - this.cushionWidth * 2;
        this.feltC_x = this.feltX + this.feltWidth / 2;
        this.feltC_y = this.feltY + this.feltHeight / 2;

        // Baulk line and D zone properties
        this.baulkLineX = this.feltX + this.feltWidth * 0.20 ; // X position
        this.D_Radius = 64; // Radius of the D

        // Inlay (Dots) Dimensions
        this.inlay_size = 56;
        this.inlay_diameter = 5.4;

    }

    display () {
        
        push();
        rectMode(CORNER);
        noStroke();

        // ---- CONSTANTS ---- //
        const wd_f = this.woodFrameThickness;
        const pk_R = this.pocketRadius;
        const pk_diam = this.pocketDiameter;
        const pk_OS = this.pocket_OffSet;
        const cu_w = this.cushionWidth;
        const inlaySize = this.inlay_size;

        //---- END CONSTANTS ---- //



        // ---- TABLE BOARD (wooden frame) ---- //
        fill(123, 65, 20); // Brown color
        rect(this.x - wd_f, this.y - wd_f, 
                this.width + wd_f * 2, this.height + wd_f * 2, 10);
        // ---- END TABLE BOARD ---- //


        // ---- TABLE DETAILS (inlays) ---- //
        fill(180); // color for inlays

        // Top-left inlay
        rect(this.x - wd_f, this.y - wd_f, inlaySize, wd_f, 32, 0, 0, 0);
        rect(this.x - wd_f, this.y - wd_f, wd_f, inlaySize, 32, 0, 0, 0);

        // Top-right inlay
        rect(this.x + this.width + wd_f - inlaySize, this.y - wd_f, inlaySize, wd_f, 0, 32, 0, 0);
        rect(this.x + this.width, this.y - wd_f, wd_f, inlaySize, 0, 32, 0, 0);

        // Bottom-left inlay
        rect(this.x - wd_f, this.y + this.height, inlaySize, wd_f, 0, 0, 0, 32);
        rect(this.x - wd_f, this.y + this.height + wd_f - inlaySize, wd_f, inlaySize, 0, 0, 0, 32);

        // Bottom-right inlay
        rect(this.x + this.width + wd_f - inlaySize, this.y + this.height, inlaySize, wd_f, 0, 0, 32, 0);
        rect(this.x + this.width, this.y + this.height + wd_f - inlaySize, wd_f, inlaySize, 0, 0, 32, 0);

        // Middle Top inlay
        rect(this.x + (this.width - inlaySize) / 2, this.y - wd_f, inlaySize, wd_f);

        // Middle Bottom inlay
        rect(this.x + (this.width - inlaySize) / 2, this.y + this.height, inlaySize, wd_f);

        // ---- End TABLE DETAILS ---- //



        // ---- FELT (the green playing surface) ---- //
        const feltRadius =  this.feltWidth / 2;  

        //Gradient for the felt
        const gradient = drawingContext.createRadialGradient(
            this.feltC_x, this.feltC_y, 50, // x0, y0, r0
            this.feltC_x, this.feltC_y, feltRadius // x1, y1, r1
            );
        
        // Define gradient color stops
        gradient.addColorStop(0, 'rgb(39, 131, 2)'); // Center color
        gradient.addColorStop(1, 'rgba(32, 94, 8, 1)'); // Edge color

        drawingContext.fillStyle = gradient; // Apply gradient to fill style
        
        // Felt surface
        rect(this.feltX - cu_w, this.feltY - cu_w, this.feltWidth + cu_w * 2, this.feltHeight + cu_w * 2);
        fill(255); // Reset fill to white
        // ---- END FELT ---- //



        // ---- D-ZONE AND BAULK LIEN (white lines) ---- //
        stroke(200, 180); // Light gray // color and transparency
        strokeWeight(2);
        noFill();

        // Baulk Line
        line(this.baulkLineX, this.feltY, this.baulkLineX, this.feltY + this.feltHeight);

        // D Zone
        const D_centerY = this.feltC_y;
        arc(
            this.baulkLineX,
            D_centerY,
            this.D_Radius * 2,
            this.D_Radius * 2,
            HALF_PI, -HALF_PI // From 90 degrees to -90 degrees
        );
        noStroke(); 
        // ---- END TABLE MARKINGS ---- //



        // ---- CUSHION (the light green part) ---- //

        // Draw the 6 Cushions 
        fill(73, 154, 12); // Lighter green for cushions
        const cushionOffset = 8;
        const cornerGap = pk_R * 2 + cushionOffset;
        const sideGap = pk_R * 2; // Gap for side cushions

        // -- Top-Left Cushion
        // Cushion shadows - TOP
        drawingContext.shadowBlur = 6;
        drawingContext.shadowColor = 'rgba(26, 24, 24, 0.6)';
        drawingContext.shadowOffsetY = 2;

        quad(
            this.feltX + 10, this.y, // Top-Left
            this.x + this.width / 2 - sideGap + 18, this.y, // Top-Middle Left
            this.x + this.width / 2 - sideGap + 2, this.feltY, // Bottom-Middle Left
            this.feltX + cornerGap - 12, this.feltY // Bottom-Left
        )
        // -- Top-Right Cushion
        quad(
            this.x + this.width / 2 + sideGap - 18, this.y, // Top-left
            this.x + this.width - cornerGap + 18, this.y, // Top-Right
            this.x + this.width - cornerGap + 2, this.feltY, // Bottom-Right
            this.x + this.width / 2 + sideGap, this.feltY // Bottom-left
        )

        // -- Bottom-Left Cushion
        // Cushion shadows - BOTTOM
        drawingContext.shadowOffsetY = -2;
        quad(
            this.feltX + 10, this.y + this.height, // Bottom-Left
            this.x + this.width / 2 - sideGap + 18, this.y + this.height, // Bottom-Right
            this.x + this.width / 2 - sideGap, this.feltY + this.feltHeight, // Top-Right
            this.feltX + cornerGap - 10, this.feltY + this.feltHeight // Top-Left
        )
        // -- Bottom-Right Cushion
        quad(
            this.x + this.width / 2 + sideGap - 18, this.y + this.height, // Bottom-Left
            this.x + this.width - cornerGap + 18, this.y + this.height, // Bottom-Right
            this.x + this.width - cornerGap - 2, this.feltY + this.feltHeight, // Top-Right
            this.x + this.width / 2 + sideGap, this.feltY + this.feltHeight // Top-Left
        )

        // -- Left Cushion
        // Cushion shadows - LEFT
        drawingContext.shadowOffsetX = 1;
        drawingContext.shadowOffsetY = 0;
        quad(
            this.x, this.feltY + cornerGap - 28, // Top-Left
            this.feltX, this.feltY + cornerGap - 12, // Top-Right
            this.feltX, this.feltY + this.feltHeight - cornerGap + 12, // Bottom-Right
            this.x, this.feltY + this.feltHeight - cornerGap + 28 // Bottom-Left
        )
        // -- Right Cushion
        // Cushion shadows - RIGHT
        drawingContext.shadowOffsetX = -1;
        quad(
            this.x + this.width, this.feltY + cornerGap - 28 , // Top-Left
            this.x + this.width - cu_w, this.feltY + cornerGap - 12, // Top-Right
            this.x + this.width - cu_w, this.feltY + this.feltHeight - cornerGap + 12, // Bottom-Right
            this.x + this.width, this.feltY + this.feltHeight - cornerGap + 28// Bottom-Left
        )

        // Turn off shadows
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0, 0, 0, 0)';

        // ---- END CUSHION ---- //



        // ---- POCKETS (black holes) ---- //
        fill(18); // Black color for pockets

        // Corner Pockets
        ellipse(this.x + pk_OS, this.y + pk_OS, pk_diam, pk_diam); // Top-Left Corner
        ellipse(this.x + pk_OS, this.y + this.height - pk_OS, pk_diam, pk_diam); // Bottom-Left Corner

        ellipse(this.x + this.width - pk_OS, this.y + pk_OS, pk_diam, pk_diam); // Top-Right Corner
        ellipse(this.x + this.width - pk_OS, this.y + this.height - pk_OS, pk_diam, pk_diam); // Bottom-Right Corner

        ellipse(this.x + this.width / 2, this.y + pk_OS - 6, pk_diam, pk_diam); // Top-Center
        ellipse(this.x + this.width / 2, this.y + this.height - pk_OS + 6, pk_diam, pk_diam); // Bottom-Center

        // ---- END POCKETS ---- //



        // ---- TABLE INLAYS (silver dots) ---- //
        fill(180); // Silver color for dots

        const numDots = 6;
        const gapFraction = this.width / (numDots + 1);
        const topDot_y = this.y - wd_f / 2;
        const bottomDot_y = this.y + this.height + wd_f / 2;
        const dot_Diam = this.inlay_diameter;


        // Draw dots
        for (let i = 1; i <= numDots; i++) {
            const dotX = this.x + i * gapFraction;

            // Top edge dot
            circle(dotX, topDot_y, dot_Diam);
            // Bottom edge dot
            circle(dotX, bottomDot_y, dot_Diam);
        }

        const numDotsSide = 3;
        const gapFractionSide = this.height / (numDotsSide + 1);
        const leftDot_x = this.x - wd_f / 2;
        const rightDot_x = this.x + this.width + wd_f / 2;

        for (let i = 1; i <= numDotsSide; i++) {
            const dotY = this.y + gapFractionSide * i;
            circle(leftDot_x, dotY, dot_Diam); // Left edge dot
            circle(rightDot_x, dotY, dot_Diam); // Right edge dot
        }
        // ---- END TABLE DOTS ---- //


        pop();
    } // End of display method



    // Check if a point (x, y) with a given ballRadius is inside the D zone
    isInsideDZone(x, y, ballRadius) { //
        const D_centerY = this.feltC_y;
        const D_Radius = this.D_Radius;
        const baulkLineX = this.baulkLineX;

        // Calculate distance from point (x, y) to the center of the D
        const distanceToDCenter = dist(x, y, baulkLineX, D_centerY);

        if(distanceToDCenter > D_Radius - ballRadius) {
            return false; // Outside D zone
        } else if (x + ballRadius > baulkLineX) {
            return false; // Outside D zone
        }

        return true; // Inside D zone
    }

}


