// Find the drawing area
const canvas = document.getElementById('drawing-area');
const dim = {width: 1600, height: 900};

// Set up two.js
let two = new Two(dim);
two.appendTo(canvas);

// Initialize the camera in the center at 100 zoom
let [cx, cy, cz] = [dim.width/2, dim.height/2, 100];

// Setup miscellaneous variables
let mousePos = [0, 0];
let particles = [];

// Initialize the variables for the lines and draw them
let xLine = two.makeLine(0, dim.height/2, dim.width, dim.height/2);
let yLine = two.makeLine(dim.width/2, 0,  dim.width/2, dim.height);

xLine.linewidth = 5;
yLine.linewidth = 5;

let smallXLines = [];
let smallYLines = [];

for (let i = -cz; i <= dim.height + cz; i+=cz) {
    smallXLines.push(two.makeLine(0, i, dim.width, i));
}

for (let i = -cz; i <= dim.width + cz; i+=cz) {
    smallYLines.push(two.makeLine(i, 0, i, dim.height));
}

// Position these lines
position();

// Bind mouse events to their respective functions
canvas.addEventListener("mousedown", mouseDown, false);
document.addEventListener("mousemove", moveGrid, false);
document.addEventListener("mousewheel", zoom, false);
document.addEventListener('contextmenu', event => event.preventDefault());

// Handle mouse events
function mouseDown(e) {
    mousePos = [e.clientX, e.clientY];
    if (e.buttons % 2 === 1) {

        let hovering = false;

        for (let i = 0; i < particles.length; i++) {
            if (particles[i].hovering(e.clientX, e.clientY)) {
                hovering = true;
            }
        }

        if (!hovering) {
            let graphCoords = canvasToGraph(e.clientX, e.clientY);

            if (particles.length >= 1) {
                new Vector(graphCoords[0], graphCoords[1], particles[0]);
            } else {
                particles.push(new Particle(graphCoords[0], graphCoords[1]));
            }
        }
    }
}

// Move the grid around with the mouse
function moveGrid(e) {
    if (e.buttons % 4 >= 2) {
        cx = cx + e.x - mousePos[0];
        cy = cy + e.y - mousePos[1];

        mousePos = [e.clientX, e.clientY];

        position();
    }
}

// Zoom in and out with the mouse wheel
function zoom(e) {
    // Graph coordinates are preserved when zooming
    let [mouseX, mouseY] = canvasToGraph(e.x, e.y);

    if (e.wheelDelta > 0) {
        cz *= 1.1;
    } else if (e.wheelDelta < 0) {
        cz /= 1.1;
    }

    // Calculate the mouse coordinates after zooming
    [mouseX, mouseY] = graphToCanvas(mouseX, mouseY);

    // Use this to find the change in camera position
    cx += e.x - mouseX;
    cy += e.y - mouseY;

    // Clear the screen and redraw all of the grid lines with the new scale
    two.clear();

    xLine = two.makeLine(0, dim.height/2, dim.width, dim.height/2);
    yLine = two.makeLine(dim.width/2, 0,  dim.width/2, dim.height);

    xLine.linewidth = 5;
    yLine.linewidth = 5;

    smallXLines = [];
    smallYLines = [];

    for (let i = -cz; i <= dim.height + cz; i+=cz) {
        smallXLines.push(two.makeLine(0, i, dim.width, i));
    }

    for (let i = -cz; i <= dim.width + cz; i+=cz) {
        smallYLines.push(two.makeLine(i, 0, i, dim.height));
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    // Position these lines
    position();
}


// Translate all the objects into the camera view
function position() {
    // Translate into the camera view
    xLine.translation.set(0, cy - dim.height / 2);
    yLine.translation.set(cx - dim.width / 2, 0);

    // Reuse these lines when they go offscreen by using modulo
    for (let i = 0; i < smallXLines.length; i++) {
        smallXLines[i].translation.set(0, cy % cz);
    }
    for (let i = 0; i < smallYLines.length; i++) {
        smallYLines[i].translation.set(cx % cz, 0);
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].position();
    }

    two.update();
}

// Convert between mouse and graph coordinates
function canvasToGraph(x, y) {
    let gx = (x - cx)/cz;
    let gy = (-y + cy)/cz;
    return [gx, gy];
}

// Convert between graph and mouse coordinates
function graphToCanvas(gx, gy) {
    let x = cz * gx + cx;
    let y = -cz * gy + cy;
    return [x, y];
}


// Prototype object for a particle
function Particle (x, y) {
    this.x = x;
    this.y = y;
    this.vectors = [];
    this.draw();
}

// Create/update the circle and lines for the particle and vectors
Particle.prototype.draw = function() {

    // Remove the circle and all the vectors
    if (this.group !== undefined) {
        two.remove(this.group);
    }

    // Draw the circle and add it to the group
    this.pointRadius = 0.05*cz;
    this.circle = two.makeCircle(0, 0, 0.05*cz);
    this.circle.fill = "black";

    this.group = two.makeGroup(this.circle);

    // Draw the vectors and add them to the group
    for (let i = 0; i < this.vectors.length; i++) {
        this.vectors[i].draw();
    }

    // Position the entire group
    this.position();
};

// Translate the particle and vectors into the camera view
Particle.prototype.position = function() {
    let canvasCoords = graphToCanvas(this.x, this.y);
    this.group.translation.set(canvasCoords[0], canvasCoords[1]);
    two.update();
};

// Test if the mouse is on top of the particle
Particle.prototype.hovering = function(mx, my) {
    let canvasCoords = graphToCanvas(this.x, this.y);
    let [dx, dy] = [mx - canvasCoords[0], my - canvasCoords[1]];
    return (Math.sqrt(dx**2 + dy**2) <= this.pointRadius);
};


// Prototype object for a vector stemming from a particle
function Vector(x, y, particle) {
    this.x = x;
    this.y = y;
    this.particle = particle;
    this.particle.vectors.push(this);
    this.particle.draw();
}

// Create/update the line for the vector
Vector.prototype.draw = function() {
    let coords = graphToCanvas(this.x, this.y);
    let particleCoords = graphToCanvas(this.particle.x, this.particle.y);
    this.line = two.makeLine(0, 0, coords[0] - particleCoords[0], coords[1] - particleCoords[1]);

    this.lineWidth = 0.03*cz;
    this.line.linewidth = this.lineWidth;

    this.line.addTo(this.particle.group);
};
