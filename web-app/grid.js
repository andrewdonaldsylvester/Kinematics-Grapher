// Find the drawing area
const canvas = document.getElementById('drawing-area');
let dim = {width: screen.width, height: screen.height};

// Set up two.js
let two = new Two(dim);
two.appendTo(canvas);

// Initialize the camera in the center at 100 zoom
let [cx, cy, cz] = [dim.width/2, dim.height/2, 100];

// Setup miscellaneous variables
let mouseEvent = null;
let particles = [];
let hoveredParticle = null;
let hoveredVector = null;
let rect = canvas.getBoundingClientRect();
let offsetX = rect.left;
let offsetY = rect.top;

// Initialize the variables for the lines and draw them
let xLine = null;
let yLine = null;

// let originLabel = two.makeText("0", dim.width/2 - 12.5, dim.height/2 + 17.5);
// originLabel.size = 15;

let smallXLines = [];
let smallYLines = [];

// let xLineLabels = [];
// let yLineLabels = [];

draw();

// Bind mouse events to their respective functions
canvas.addEventListener("mousedown", mouseDown, false);
document.addEventListener("mouseup", mouseUp, false);
document.addEventListener("mousemove", mouseMove, false);
document.addEventListener("mousewheel", zoom, false);
document.addEventListener('contextmenu', event => event.preventDefault());

window.addEventListener("resize", onResize);

function onResize() {
    dim = {width: window.innerWidth, height: window.innerHeight};

    cx = dim.width/2;
    cy = dim.height/2;

    rect = canvas.getBoundingClientRect();
    offsetX = rect.left;
    offsetY = rect.top;

    // Clear the screen and redraw all of the grid lines with the new scale
    two.clear();

    draw();
}

// Handle mouse events
function mouseDown(e) {
    if (e.buttons % 2 === 1) {

        if (hoveredVector === null) {
            hoveredParticle = null;
        }

        for (let i = 0; i < particles.length; i++) {
            if (particles[i].hovering(e.clientX - offsetX, e.clientY - offsetY)) {
                hoveredParticle = particles[i];
            }
        }

        if (hoveredParticle === null) {
            let graphCoords = canvasToGraph(e.clientX - offsetX, e.clientY - offsetY);

            if (e.ctrlKey) {
                particles.push(new Particle(Math.round(graphCoords[0]), Math.round(graphCoords[1])));
            } else {
                particles.push(new Particle(graphCoords[0], graphCoords[1]));
            }

            hoveredParticle = particles[particles.length - 1];
        }
    }
}

function mouseUp(e) {
    if (e.buttons % 2 === 0) {
        hoveredParticle = null;
        hoveredVector = null;
    }
}

function mouseMove(e) {
    if (e.buttons % 4 >= 2) {
        moveGrid(e);
    }

    if (e.buttons % 2 === 1) {
        if (hoveredParticle !== null) {
            let graphCoords = canvasToGraph(e.clientX - offsetX, e.clientY - offsetY);
            let roundedCoords = roundCoords(graphCoords[0], graphCoords[1], hoveredParticle.x, hoveredParticle.y);

            if (hoveredVector === null) {
                if (e.ctrlKey) {
                    hoveredVector = new Vector(roundedCoords[0], roundedCoords[1], hoveredParticle);
                } else {
                    hoveredVector = new Vector(graphCoords[0], graphCoords[1], hoveredParticle);
                }

            } else {
                if (e.ctrlKey) {
                    [hoveredVector.x, hoveredVector.y] = roundedCoords;
                } else {
                    [hoveredVector.x, hoveredVector.y] = [graphCoords[0], graphCoords[1]];
                }

                hoveredVector.particle.draw();
            }
        }
    }

    mouseEvent = e;
}

// Zoom in and out with the mouse wheel
function zoom(e) {
    // Graph coordinates are preserved when zooming
    let [mouseX, mouseY] = canvasToGraph(e.x - offsetX, e.y - offsetY);

    if (e.wheelDelta > 0) {
        cz *= 1.1;
    } else if (e.wheelDelta < 0) {
        cz /= 1.1;
    }

    // Calculate the mouse coordinates after zooming
    [mouseX, mouseY] = graphToCanvas(mouseX, mouseY);

    // Use this to find the change in camera position
    cx += e.x - offsetX - mouseX;
    cy += e.y - offsetY - mouseY;

    // Clear the screen and redraw all of the grid lines with the new scale
    two.clear();

    draw();
}


// Move the grid around with the mouse
function moveGrid(e) {
    cx = cx + e.x - mouseEvent.x;
    cy = cy + e.y - mouseEvent.y;

    position();
}

function draw() {
    xLine = two.makeLine(0, dim.height/2, dim.width, dim.height/2);
    yLine = two.makeLine(dim.width/2, 0,  dim.width/2, dim.height);

    xLine.linewidth = 5;
    yLine.linewidth = 5;

// originLabel = two.makeText("0", dim.width/2 - 12.5, dim.height/2 + 17.5);
// originLabel.size = 15;

    smallXLines = [];
    smallYLines = [];

// xLineLabels = [];
// yLineLabels = [];

    for (let i = -cz; i <= dim.height + cz; i+=cz) {
        smallXLines.push(two.makeLine(0, i, dim.width, i));

        // if (i != dim.height / 2) {
        //     xLineLabels.push(two.makeText(canvasToGraph(i)[0].toString(), dim.width / 2 - 12.5, i));
        //     xLineLabels[xLineLabels.length - 1].size = 15;
        // }
    }

    for (let i = -cz; i <= dim.width + cz; i+=cz) {
        smallYLines.push(two.makeLine(i, 0, i, dim.height));

        // if (i != dim.width / 2) {
        //     yLineLabels.push(two.makeText(canvasToGraph(i)[0].toString(), i, dim.height / 2 + 17.5));
        //     yLineLabels[yLineLabels.length - 1].size = 15;
        // }

    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    position();
}

// Translate all the objects into the camera view
function position() {
    // Translate into the camera view
    xLine.translation.set(0, cy - dim.height / 2);
    yLine.translation.set(cx - dim.width / 2, 0);

    // let originCoords = graphToCanvas(0, 0);
    // originLabel.translation.set(cx - 12.5, cy + 17.5);

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

// Conversion to and from cartesian and polar
function cartesianToPolar(x, y) {
    let radius = Math.sqrt(x**2 + y**2);
    let theta = Math.atan(y/x);
    return {r: radius, t: theta};
}
function polarToCartesian(r, theta) {
    let X = r * Math.cos(theta);
    let Y = r * Math.sin(theta);
    return {x: X, y: Y};
}

function roundCoords(x, y, px, py) {
    // Takes in graph coords

    let roundedCartesian = [Math.round(x), Math.round(y)];

    let roundedPolar = cartesianToPolar(x - px, y  - py);
    roundedPolar = [Math.round(roundedPolar.r), Math.round(roundedPolar.t * 12/Math.PI) * Math.PI/12];

    if (px > x) {
        roundedPolar[1] += Math.PI;
    }

    roundedPolar = polarToCartesian(roundedPolar[0], roundedPolar[1]);
    roundedPolar = [roundedPolar.x + px, roundedPolar.y + py];

    let cartesianError = Math.sqrt((roundedCartesian[0] - x)**2 + (roundedCartesian[1] - y)**2);
    let polarError = Math.sqrt((roundedPolar[0] - x)**2 + (roundedPolar[1] - y)**2);

    if (cartesianError < polarError) {
        return roundedCartesian;
    } else {
        return roundedPolar;
    }
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
    this.pointRadius = 0.1*cz;
    this.circle = two.makeCircle(0, 0, 0.1*cz);
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

    let tip = cartesianToPolar(coords[0] - particleCoords[0], coords[1] - particleCoords[1]);
    let theta = tip.t;

    tip = polarToCartesian(tip.r - this.particle.pointRadius, tip.t);

    if (this.x < this.particle.x) {
        tip.x *= -1;
        tip.y *= -1;
        theta += Math.PI;
    }

    this.line = two.makeLine(0, 0, tip.x, tip.y);

    this.lineWidth = 0.05*cz;
    this.line.linewidth = this.lineWidth;

    this.line.addTo(this.particle.group);

    this.triangle = two.makePolygon(tip.x, tip.y, this.particle.pointRadius, 3);
    this.triangle.fill = "black";

    this.triangle.rotation = theta - (Math.PI/6);

    this.triangle.addTo(this.particle.group);
};

// Test if the mouse is on top of the vector's head
Vector.prototype.hovering = function(mx, my) {
    let canvasCoords = graphToCanvas(this.x, this.y);
    let [dx, dy] = [mx - canvasCoords[0], my - canvasCoords[1]];
    return (Math.sqrt(dx ** 2 + dy ** 2) <= this.pointRadius);
};
