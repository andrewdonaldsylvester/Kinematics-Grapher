const ctx = document.getElementById('drawingarea');
const dim = {width: 1600, height: 900};
let two = new Two(dim);
two.appendTo(ctx);

let mode = "move";

let [cx, cy, cz] = [dim.width/2, dim.height/2, 100];

let previousMousePos = [0, 0];
let lmbDown = false;

let xLine = two.makeLine(0, cy, dim.width, cy);
let yLine = two.makeLine(cx, 0,  cx, dim.height);

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

drawGrid();

ctx.addEventListener("mousedown", startDragGrid, false);
ctx.addEventListener("mousemove", onMouseMove, false);
ctx.addEventListener("mouseup", mouseRelease, false);
ctx.addEventListener("mousewheel", updateZoom, false);

function drawMode() {
    mode = "draw";
}

function moveMode() {
    mode = "move";
}

function startDragGrid(e) {
    lmbDown = true;
    previousMousePos = [e.clientX, e.clientY];
}

function mouseRelease(e) { lmbDown = false; }

function onMouseMove(e) {
    if (mode === "move") {
        dragGrid(e);
    }
}

function dragGrid(e) {
    if (lmbDown) {
        cx = cx + e.x - previousMousePos[0];
        cy = cy + e.y - previousMousePos[1];

        previousMousePos = [e.clientX, e.clientY];

        drawGrid();
    }
}

function drawGrid() {

    xLine.translation.set(0, cy - dim.height / 2);
    yLine.translation.set(cx - dim.width / 2, 0);

    for (let i = 0; i < smallXLines.length; i++) {
        smallXLines[i].translation.set(0, cy % cz);
    }
    for (let i = 0; i < smallYLines.length; i++) {
        smallYLines[i].translation.set(cx % cz, 0);
    }

    two.update();
}

function updateZoom(e) {
    let [mx, my] = tkToGraph(e.x, e.y);

    if (e.wheelDelta > 0) {
        cz *= 1.1;
    }
    else if (e.wheelDelta < 0)
    {
        cz /= 1.1;
    }

    [mx, my] = graphToTk(mx, my);

    cx += e.x - mx;
    cy += e.y - my;

    two.clear();

    xLine = two.makeLine(0, dim.height/2, dim.width, dim.height/2);
    xLine.linewidth = 5;
    yLine = two.makeLine(dim.width/2, 0,  dim.width/2, dim.height);
    yLine.linewidth = 5;

    smallXLines = [];
    for (let i = -cz; i <= dim.height + cz; i+=cz) {
        smallXLines.push(two.makeLine(0, i, dim.width, i));
    }

    smallYLines = [];

    for (let i = -cz; i <= dim.width + cz; i+=cz) {
        smallYLines.push(two.makeLine(i, 0, i, dim.height));
    }

    drawGrid();
}

function tkToGraph(tx, ty) {
    let gx = (tx - cx)/cz;
    let gy = (-ty + cy)/cz;
    return [gx, gy];
}

function graphToTk(gx, gy) {
    let tx = cz * gx + cx;
    let ty = -cz * gy + cy;
    return [tx, ty];
}

class Vector {

    constructor(drawer, x0, y0, x1, y1) {
        this.drawer = drawer;
        [this.x0, this.y0, this.x1, this.y1] = [x0, y0, x1, y1];

        this.line = this.drawer.makeLine(x0, y0, x1, y1);
        this.drawer.update();
    }

    draw() {
        this.drawer.translation.set(cx  - dim.width / 2, cy - dim.height / 2);
        this.drawer.update();
    }
}
