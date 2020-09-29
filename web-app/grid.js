const ctx = document.getElementById('drawingarea');
const dim = {width: 1600, height: 900};
let two = new Two(dim);
two.appendTo(ctx);

let [cx, cy, cz] = [dim.width/2, dim.height/2, 100];

let previousMousePos = {x: 0, y: 0};
let lmbDown = false;

let xLine = two.makeLine(0, cy, dim.width, cy);
xLine.linewidth = 5;
let yLine = two.makeLine(cx, 0,  cx, dim.height);
yLine.linewidth = 5;

let smallXLines = [];
for (let i = -cz; i <= dim.height + cz; i+=cz) {
    smallXLines.push(two.makeLine(0, i, dim.width, i));
}

let smallYLines = [];

for (let i = -cz; i <= dim.width + cz; i+=cz) {
    smallYLines.push(two.makeLine(i, 0, i, dim.height));
}

drawGrid();


document.addEventListener("mousedown", startDragGrid, false);
document.addEventListener("mousemove", dragGrid, false);
document.addEventListener("mouseup", mouseRelease, false);
document.addEventListener("mousewheel", updateZoom, false);

function startDragGrid(e) {
    lmbDown = true;
    previousMousePos = {x: e.clientX, y: e.clientY};
}

function mouseRelease(e) { lmbDown = false; }

function dragGrid(e) {
    if (lmbDown) {
        cx = cx + e.x - previousMousePos.x;
        cy = cy + e.y - previousMousePos.y;

        previousMousePos = {x: e.clientX, y: e.clientY};

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

// class Vector {
//
//     constructor(canvas, x0, y0, x1, y1) {
//         this.canvas = canvas;
//         [this.x0, this.y0, this.x1, this.y1] = [x0, y0, x1, y1];
//
//         this.line = this.canvas.makeLine(x0, y0, x1, y1);
//         this.canvas.update();
//     }
//
//     draw() {
//         this.line.translation.set(cx  - dim.width / 2, cy - dim.height / 2);
//         this.canvas.update();
//     }
// }
