// Find the drawing area and set up two.js
const canvas = document.getElementById('drawing-area');
const dim = {width: 1600, height: 900};

let two = new Two(dim);
two.appendTo(canvas);

// Initialize the camera in the center at 100 zoom
let [cx, cy, cz] = [dim.width/2, dim.height/2, 100];

// Setup miscellaneous variables
let mouseMode = "move";
let mousePos = [0, 0];
let lmbDown = false;

// Draw the lines through the origin
let xLine = two.makeLine(0, cy, dim.width, cy);
let yLine = two.makeLine(cx, 0,  cx, dim.height);

xLine.linewidth = 5;
yLine.linewidth = 5;


// Draw the lines marking the units
let smallXLines = [];
let smallYLines = [];

for (let i = -cz; i <= dim.height + cz; i+=cz) {
    smallXLines.push(two.makeLine(0, i, dim.width, i));
}

for (let i = -cz; i <= dim.width + cz; i+=cz) {
    smallYLines.push(two.makeLine(i, 0, i, dim.height));
}

// Position these lines
updateGrid();

// Bind mouse events to their respective functions
canvas.addEventListener("mousedown", mouseDown, false);
canvas.addEventListener("mousemove", mouseMove, false);
canvas.addEventListener("mouseup", mouseUp, false);
canvas.addEventListener("mousewheel", zoom, false);

// Handle mouse events
function mouseDown(e) {
    lmbDown = true;
    mousePos = [e.clientX, e.clientY];
}
function mouseUp() { lmbDown = false; }
function mouseMove(e) {
    // Determine what mode the mouse is in and run that function
    switch (mouseMode) {
        case "move":
            moveGrid(e); break;
        case "draw":
            break;
        default:
            break;
    }
}

// Zoom in and out with the mouse wheel
function zoom(e) {
    // Graph coordinates are preserved when zooming
    let [mouseX, mouseY] = canvasToGraph(e.x, e.y);

    switch (e.wheelDelta) {
        case 240:
            cz *= 1.21; break;
        case 120:
            cz *= 1.1; break;
        case -120:
            cz /= 1.1; break;
        case -240:
            cz /= 1.21; break;
        default:
            break;
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

    // Position these lines
    updateGrid();
}

// Move the grid around with the mouse
function moveGrid(e) {
    if (lmbDown) {
        cx = cx + e.x - mousePos[0];
        cy = cy + e.y - mousePos[1];

        mousePos = [e.clientX, e.clientY];

        updateGrid();
    }
}

// Functions for the mouse mode buttons
function drawMode() { mouseMode = "draw"; }
function moveMode() {  mouseMode = "move"; }

function updateGrid() {
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

    two.update();
}

function canvasToGraph(x, y) {
    let gx = (x - cx)/cz;
    let gy = (-y + cy)/cz;
    return [gx, gy];
}

function graphToCanvas(gx, gy) {
    let x = cz * gx + cx;
    let y = -cz * gy + cy;
    return [x, y];
}
