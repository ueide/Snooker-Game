
class Table {

    constructor() {
        // Table dimensions and position
        this.width = Game.TABLE_WIDTH; // 740
        this.height = Game.TABLE_HEIGHT; // 370
        this.x = Game.TABLE_X_OFFSET ; //350
        this.y = Game.TABLE_Y_OFFSET ; //201



    }

    display () {
        
        push();

        const frame_w = 18; // Thickness of the frame
        const cushion_w = 10; // Width of the cushions

        // Calculate pocket dimensions based on table size
        const ballDiameter = this.height / 36; // ~10.25
        const pocketDiam = ballDiameter * 1.5; // ~15.375
        const RadiusCorner = 12; //Math.round(pocketDiam / 2);
        const RadiusSide = 12; //Math.round(RadiusCorner * 1.5) //~12
        const OffSet = RadiusCorner / 2; 
        const cushionOffset = 8;

        //Dinamics Pockets Positioning
        const diamConer = RadiusCorner * 2;
        const diamSide = RadiusSide * 2;

        // Felt dimensions (area inside the cushions)
        const feltX = this.x + cushion_w;
        const feltY = this.y + cushion_w;
        const feltWidth = this.width - cushion_w * 2;
        const feltHeight = this.height - cushion_w * 2;



        // ---- TABLE BOARD (wooden frame) ---- //
        noStroke();
        fill(123, 65, 20); // Brown color for the wooden frame
        rect(this.x - frame_w, this.y - frame_w, 
                this.width + frame_w * 2, this.height + frame_w * 2,
                24);
        // ---- END TABLE BOARD ---- //



        // ---- TABLE DETAILS (inlays) ---- //
        const inlaySize = 6;
        const inlayOffset = 18;
        fill(200, 200, 200, 180);

        // Top-left inlay
        rect(this.x - frame_w, this.y + inlayOffset, frame_w, inlaySize, 4);
        rect(this.x + inlayOffset, this.y - frame_w, inlaySize, frame_w, 4);

        // ---- End TABLE DETAILS ---- //



        // ---- FELT (the green playing surface) ---- //
        noStroke();
        const feltCenterX = feltX + feltWidth / 2;
        const feltCenterY = feltY + feltHeight / 2;
        const feltRadius =  feltWidth / 2;  

        //Gradient for the felt
        const gradient = drawingContext.createRadialGradient(
            feltCenterX, feltCenterY, 50, // x0, y0, r0
            feltCenterX, feltCenterY, feltRadius // x1, y1, r1
            );
        
        // Define gradient color stops
        gradient.addColorStop(0, 'rgb(39, 131, 2)'); // Center color
        gradient.addColorStop(1, 'rgba(32, 94, 8, 1)'); // Edge color

        drawingContext.fillStyle = gradient; // Apply gradient to fill style
        
        // Felt surface
        rect(feltX, feltY, feltWidth, feltHeight, 12);
        fill(255); // Reset fill to white
        // ---- END FELT ---- //



        // ---- TABLE MARKINGS (white lines) ---- //
        //Specific Dimensions
        this.baulkLineX = feltX + feltWidth * 0.20 ; // X position
        this.D_Radius = 64; // Radius of the D

        stroke(200, 200, 200, 180); // Light gray for lines
        strokeWeight(2);
        // Baulk Line
        line(this.baulkLineX, this.y + cushion_w, this.baulkLineX, this.y + this.height - cushion_w);

        // D Zone
        noFill();
        arc(
            this.baulkLineX,
            feltY + feltHeight / 2,
            this.D_Radius * 2,
            this.D_Radius * 2,
            HALF_PI, -HALF_PI // From 90 degrees to -90 degrees
        );
        // ---- END TABLE MARKINGS ---- //



        // ---- CUSHION (the light green part) ---- //
        // Cushion shadows
        drawingContext.shadowBlur = 10;
        drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;

        // Draw the 6 Cushions 
        noStroke();
        fill(73, 154, 12); // Lighter green for cushions

        // -- Top-Left Cushion
        quad(
            feltX + cushionOffset, this.y, // Top-Left
            this.x + this.width / 2 - diamConer + 14, this.y, // Top-Middle Left
            this.x + this.width / 2 - diamConer, feltY, // Bottom-Middle Left
            feltX + cushionOffset + 14, feltY // Bottom-Left
        )

        // -- Top-Right Cushion
        quad(
            this.x + this.width / 2 + diamSide -14, this.y, // Top-left
            this.x + this.width - diamSide - cushionOffset + 14, this.y, // Top-Right
            this.x + this.width - diamSide - cushionOffset, feltY, // Bottom-Right
            this.x + this.width / 2 + diamSide, feltY // Bottom-left
        )

        // -- Bottom-Left Cushion
        quad(
            feltX + cushionOffset, this.y + this.height, // Bottom-Left
            this.x + this.width / 2 - diamConer + 14, this.y + this.height, // Bottom-Right
            this.x + this.width / 2 - diamConer, feltY + feltHeight, // Top-Right
            feltX + cushionOffset + 14, feltY + feltHeight // Top-Left
        )

        // -- Bottom-Right Cushion
        quad(
            this.x + this.width / 2 + diamSide -14, this.y + this.height, // Bottom-Left
            this.x + this.width - diamSide - cushionOffset + 14, this.y + this.height, // Bottom-Right
            this.x + this.width - diamSide - cushionOffset, feltY + feltHeight, // Top-Right
            this.x + this.width / 2 + diamSide, feltY + feltHeight // Top-Left
        )

        // -- Left Cushion
        quad(
            this.x, feltY + cushionOffset, // Top-Left
            feltX, feltY + cushionOffset + 14, // Top-Right
            feltX, feltY + feltHeight - cushionOffset - 14, // Bottom-Right
            this.x, feltY + feltHeight - cushionOffset // Bottom-Left
        )

        // -- Right Cushion
        quad(
            this.x + this.width, feltY + cushionOffset, // Top-Left
            this.x + this.width - cushion_w, feltY + cushionOffset + 14, // Top-Right
            this.x + this.width - cushion_w, feltY + feltHeight - cushionOffset - 14, // Bottom-Right
            this.x + this.width, feltY + feltHeight - cushion_w // Bottom-Left
        )


        // Turn off shadows
        drawingContext.shadowBlur = 0;
        drawingContext.shadowColor = 'rgba(0, 0, 0, 0)';







        // ---- POCKETS (black holes) ---- //
        noStroke();
        fill(18); // Black color for pockets

        // Corner Pockets
        ellipse(this.x + OffSet, this.y + OffSet, diamConer, diamConer); // Top-Left Corner
        ellipse(this.x + OffSet, this.y + this.height - OffSet, diamConer, diamConer); // Bottom-Left Corner

        ellipse(this.x + this.width - OffSet, this.y + OffSet, diamConer, diamConer); // Top-Right Corner
        ellipse(this.x + this.width - OffSet, this.y + this.height - OffSet, diamConer, diamConer); // Bottom-Right Corner

        ellipse(this.x + this.width / 2, this.y + OffSet, diamSide, diamSide); // Top-Center
        ellipse(this.x + this.width / 2, this.y + this.height - OffSet, diamSide, diamSide); // Bottom-Center

        // Silver dots on the table
        const dotRadius = 2.7;
        const dotDiameter = dotRadius * 2;

        // Dots positions
        const topDot_y = this.y - frame_w / 2;
        const bottomDot_y = this.y + this.height + frame_w / 2;
        const leftDot_x = this.x - frame_w / 2;
        const rightDot_x = this.x + this.width + frame_w / 2;

        noStroke();
        fill(222, 222, 222, 140); // Silver color for dots

        // Draw dots
        const numDots = 6;
        for (let i = 1; i <= numDots; i++) {
            const fraction = i / (numDots + 1);
            const dot_x = this.x - 56 + (this.width * fraction * 1.16);

            // Top edge dot
            circle(dot_x, topDot_y, dotDiameter);
            // Bottom edge dot
            circle(dot_x, bottomDot_y, dotDiameter);
        }

        const numDotsSide = 3;
        for (let i = 1; i <= numDotsSide; i++) {
            const fraction = i / (numDotsSide + 1);
            const dot_y = this.y - 48 + (fraction * this.height * 1.2);

            // Left edge dot
            circle(leftDot_x, dot_y, dotDiameter);
            // Right edge dot
            circle(rightDot_x, dot_y, dotDiameter);
        }

        pop();
    }

}