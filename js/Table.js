
class Table {

    constructor() {
        // Table dimensions and position
        this.width = Game.TABLE_WIDTH; // 740
        this.height = Game.TABLE_HEIGHT; // 370
        this.x = Game.TABLE_X_OFFSET ; //350
        this.y = Game.TABLE_Y_OFFSET ; //201

        //Specific Dimensions
        this.baulkLineX = this.x + this.width * 0.20; // X position
        this.D_Radius = 72; // Radius of the D

    }

    display () {
        
        push();
        // Table Border (wooden frame)
        const frame_w = 20; // Thickness of the frame
        noStroke();
        fill(125, 65, 18); // Brown color for the wooden frame
        rect(this.x - frame_w, this.y - frame_w, 
                this.width + frame_w * 2, this.height + frame_w * 2, 24);

        // Draw the green table surface
        noStroke();
        fill(32, 135, 32); // Green color for the table surface
        rect(this.x, this.y, this.width, this.height, 16);

        // Draw the baulk line and D Zone
        stroke(200);
        strokeWeight(2);
        // Baulk Line
        line(this.baulkLineX, this.y, this.baulkLineX, this.y + this.height);

        // D Zone
        noFill();
        arc(
            this.baulkLineX,
            this.y + this.height / 2,
            this.D_Radius * 2,
            this.D_Radius * 2,
            HALF_PI, -HALF_PI // From 90 degrees to -90 degrees
        );


        // Pockets (black holes)

        // Calculate pocket dimensions based on table size
        const ballDiameter = this.height / 36; // ~10.25
        const pocketDiam = ballDiameter * 1.5; // ~15.375
        const RadiusCorner = 12; //Math.round(pocketDiam / 2);
        const RadiusSide = 14; //Math.round(RadiusCorner * 1.5) //~12
        const OffSet = 2; 

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




        pop();
    }

}