/* Ball_phy.js
    Defines the Ball class with Matter.js physics integration
*/


//---- Ball Class -----//
class Ball {

    constructor(x, y, radius, color, value, isCueBall = false) {
        this.radius = radius;
        this.diameter = radius * 2;
        this.color = color;
        this.value = value;
        this.isCueBall = isCueBall;
        this.inPocket = false;
        this.isPotted = false;

        // ---- Matter.js physics body ----//
        this.body = Matter.Bodies.circle(x, y, radius, {
            label: isCueBall ? 'cueBall' : color.name, // Identifier for the ball
            // Physics tuned for smoother snooker-like behaviour
            restitution: 0.97,        // Collision bounciness
            friction: 0.005,          // friction during movement (table friction)
            frictionStatic: 0.005,    // static friction when stationary
            frictionAir: 0.0025,      // air resistance (rolling resistance)
            density: 0.01,            // Mass density

            collisionFilter: {
                group: 0 // Default collision group
            }
        })

        // Add the ball to the Matter.js world
        Matter.World.add(engine.world, this.body); // Add ball to the physics world

    } // end constructor


    //--- Display the ball on the canvas -----//
    display() {

        if(this.isPotted) return; // Don't display if potted

        // Get position and angle from Matter.js body
        const pos = this.body.position;
        const angle = this.body.angle;

        push();
        translate(pos.x, pos.y);
        rotate(angle);

        // Draw the ball
        noStroke();
        fill(this.color.rgb);
        circle(0, 0, this.diameter);

        // Effects for 3D look
        fill(255, 180);
        circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.4);

        pop();

    } // end display


}