
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

        // Table Border (wooden frame)
        noStroke();
        fill(125, 65, 18); // Brown color for the wooden frame
        rect(this.x - frame_w, this.y - frame_w, 
                this.width + frame_w * 2, this.height + frame_w * 2, 24);

        // Draw Cushions 
        noStroke();
        fill(22, 110, 22);
        rect(this.x, this.y, this.width, this.height, 16);


        // Felt - the green table surface
        const feltX = this.x + cushion_w;
        const feltY = this.y + cushion_w;
        const feltWidth = this.width - cushion_w * 2;
        const feltHeight = this.height - cushion_w * 2;

        noStroke();
        fill(32, 135, 32); // Green color for the table surface
        rect(feltX, feltY, feltWidth, feltHeight, 12);


        // Draw the baulk line and D Zone
        //Specific Dimensions
        this.baulkLineX = feltX + feltWidth * 0.20 ; // X position
        this.D_Radius = 72; // Radius of the D

        stroke(200, 200, 200, 180); // Light color for lines
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


        // Pockets (black holes)

        // Calculate pocket dimensions based on table size
        const ballDiameter = this.height / 36; // ~10.25
        const pocketDiam = ballDiameter * 1.5; // ~15.375
        const RadiusCorner = 12; //Math.round(pocketDiam / 2);
        const RadiusSide = 12; //Math.round(RadiusCorner * 1.5) //~12
        const OffSet = RadiusCorner / 2; 

        //Dinamics Pockets Positioning
        const diamConer = RadiusCorner * 2;
        const diamSide = RadiusSide * 2;

        noStroke();
        fill(0); // Black color for pockets

        // Corner Pockets
        ellipse(this.x + OffSet, this.y + OffSet, diamConer, diamConer); // Top-Left Corner
        ellipse(this.x + OffSet, this.y + this.height - OffSet, diamConer, diamConer); // Bottom-Left Corner

        ellipse(this.x + this.width - OffSet, this.y + OffSet, diamConer, diamConer); // Top-Right Corner
        ellipse(this.x + this.width - OffSet, this.y + this.height - OffSet, diamConer, diamConer); // Bottom-Right Corner

        ellipse(this.x + this.width / 2, this.y + OffSet, diamSide, diamSide); // Top-Center
        ellipse(this.x + this.width / 2, this.y + this.height - OffSet, diamSide, diamSide); // Bottom-Center

        // Silver dots on the table
        const dotRadius = 2.5;
        const dotColor = 200;
        const dotDiameter = dotRadius * 2;

        // Dots positions
        const topDot_y = this.y - frame_w / 2;
        const bottomDot_y = this.y + this.height + frame_w / 2;
        const leftDot_x = this.x - frame_w / 2;
        const rightDot_x = this.x + this.width + frame_w / 2;

        noStroke();
        fill(dotColor);

        // Draw dots
        const numDots = 6;
        for (let i = 1; i <= numDots; i++) {
            const fraction = i / (numDots + 1);
            const dot_x = this.x - 56 + (fraction * this.width * 1.14);

            // Top edge dot
            ellipse(dot_x, topDot_y, dotDiameter, dotDiameter);
            // Bottom edge dot
            ellipse(dot_x, bottomDot_y, dotDiameter, dotDiameter);
        }

        const numDotsSide = 3;
        for (let i = 1; i <= numDotsSide; i++) {
            const fraction = i / (numDotsSide + 1);
            const dot_y = this.y - 20 + (fraction * this.height * 1.14);

            // Left edge dot
            ellipse(leftDot_x, dot_y, dotDiameter, dotDiameter);
            // Right edge dot
            ellipse(rightDot_x, dot_y, dotDiameter, dotDiameter);
        }

        pop();
    }

}