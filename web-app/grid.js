const canvas = document.getElementById('drawing-area');
let dim = {width: screen.width, height: screen.height};

let two = new Two(dim);
two.appendTo(canvas);

let [cx, cy, cz] = [window.innerWidth/2, window.innerHeight/2, 100];

let prevMouseEvent = null;
let particles = [];
let hoveredParticle = null;
let hoveredVector = null;
let rect = canvas.getBoundingClientRect();
let offsetX = rect.left;
let offsetY = rect.top;

let xLine = null;
let yLine = null;

let smallXLines = [];
let smallYLines = [];

let bigXLines = [];
let bigYLines = [];

let originLabel = undefined;

let xLabels = [];
let yLabels = [];

draw();

canvas.addEventListener("mousedown", mouseDown, false);
document.addEventListener("mouseup", mouseUp, false);
document.addEventListener("mousemove", mouseMove, false);
document.addEventListener("mousewheel", zoom, false);
document.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener("resize", resize);

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
                particles.push(new Particle(Math.round(graphCoords.x), Math.round(graphCoords.y)));
            } else {
                particles.push(new Particle(graphCoords.x, graphCoords.y));
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
            let roundedCoords = roundCoords(graphCoords.x, graphCoords.y, hoveredParticle.x, hoveredParticle.y);

            if (hoveredVector === null) {
                if (e.ctrlKey) {
                    hoveredVector = new Vector(roundedCoords.x, roundedCoords.y, hoveredParticle);
                } else {
                    hoveredVector = new Vector(graphCoords.x, graphCoords.y, hoveredParticle);
                }

            } else {
                if (e.ctrlKey) {
                    [hoveredVector.x, hoveredVector.y] = [roundedCoords.x, roundedCoords.y];
                } else {
                    [hoveredVector.x, hoveredVector.y] = [graphCoords.x, graphCoords.y];
                }

                hoveredVector.particle.draw();
            }
        }
    }

    prevMouseEvent = e;
}
function zoom(e) {
    let mouseCoords = canvasToGraph(e.x - offsetX, e.y - offsetY);

    if (e.deltaY < 0) {
        cz *= 1.1;
    } else if (e.deltaY > 0) {
        cz /= 1.1;
    }

    mouseCoords = graphToCanvas(mouseCoords.x, mouseCoords.y);

    cx += e.x - offsetX - mouseCoords.x;
    cy += e.y - offsetY - mouseCoords.y;

    two.clear();

    draw();
}
function resize() {
    dim = {width: window.innerWidth, height: window.innerHeight};

    // cx = dim.width/2;
    // cy = dim.height/2;

    rect = canvas.getBoundingClientRect();
    [offsetX, offsetY] = [rect.left, rect.top];

    two.clear();

    draw();
}

function moveGrid(e) {
    cx = cx + e.x - prevMouseEvent.x;
    cy = cy + e.y - prevMouseEvent.y;

    position();
}

function draw() {
    originLabel = two.makeText("0", dim.width/2 - 12.5, dim.height/2 + 17.5);
    originLabel.size = 15;

    smallXLines = [];
    smallYLines = [];

    bigXLines = [];
    bigYLines = [];

    xLabels = [];
    yLabels = [];

    for (let i = -cz; i <= dim.height + cz; i+=cz) {
        smallXLines.push(two.makeLine(0, i, dim.width, i));
        smallXLines[smallXLines.length - 1].stroke = "#5e5e5e";
    }

    for (let i = -cz; i <= dim.width + cz; i+=cz) {
        smallYLines.push(two.makeLine(i, 0, i, dim.height));
        smallYLines[smallYLines.length - 1].stroke = "#5e5e5e";
    }

    for (let i = -5*cz; i <= dim.height + 5*cz; i+=5*cz) {
        bigXLines.push(two.makeLine(0, i, dim.width, i));
        bigXLines[bigXLines.length - 1].linewidth = 3;
        bigXLines[bigXLines.length - 1].stroke = "#5e5e5e";
        //
        // yLabels.push(two.makeText(Math.round(canvasToGraph(cx, cy - i).y).toString(), cx - 12.5, cy - i));
        // yLabels[yLabels.length - 1].size = 15;
    }

    for (let i = -5*cz; i <= dim.width + 5*cz; i+=5*cz) {
        bigYLines.push(two.makeLine(i, 0, i, dim.height));
        bigYLines[bigYLines.length - 1].linewidth = 3;
        bigYLines[bigYLines.length - 1].stroke = "#5e5e5e";
        //
        // xLabels.push(two.makeText(Math.round(canvasToGraph(cx + i, cy).x).toString(), cx + i, cy + 17.5));
        // xLabels[xLabels.length - 1].size = 15;
    }

    xLine = two.makeLine(0, dim.height/2, dim.width, dim.height/2);
    yLine = two.makeLine(dim.width/2, 0,  dim.width/2, dim.height);

    xLine.linewidth = 5;
    xLine.stroke = "#303030";
    yLine.linewidth = 5;
    yLine.stroke = "#303030";

    for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
    }

    position();
}
function position() {
    xLine.translation.set(0, cy - dim.height / 2);
    yLine.translation.set(cx - dim.width / 2, 0);

    originLabel.translation.set(cx - 12.5, cy + 17.5);

    for (let i = 0; i < smallXLines.length; i++) {
        smallXLines[i].translation.set(0, cy % cz);
    }
    for (let i = 0; i < smallYLines.length; i++) {
        smallYLines[i].translation.set(cx % cz, 0);
    }

    for (let i = 0; i < bigXLines.length; i++) {
        bigXLines[i].translation.set(0, cy % (5*cz));
    }
    for (let i = 0; i < bigYLines.length; i++) {
        bigYLines[i].translation.set(cx % (5*cz), 0);
    }

    for (let i = 0; i < xLabels.length; i++) {
        two.remove(xLabels[i]);
    }
    for (let i = 0; i < yLabels.length; i++) {
        two.remove(yLabels[i]);
    }

    xLabels = [];
    yLabels = [];

    for (let i = -5*cz*Math.floor((dim.height-cy)/(5*cz)); i <= cy + dim.height/2 + 5*cz; i+=5*cz) {
        if (i !== cy) {
            yLabels.push(two.makeText(Math.round(canvasToGraph(cx, cy - i).y).toString(), cx - 12.5, cy - i));
            yLabels[yLabels.length - 1].size = 15;
        }
    }

    for (let i = -5*cz*Math.floor((dim.width+cx)/(5*cz)); i <= -cx + dim.width/2 + 5*cz; i+=5*cz) {
        if (i !== cx) {
            xLabels.push(two.makeText(Math.round(canvasToGraph(cx + i, cy).x).toString(), cx + i, cy + 17.5));
            xLabels[xLabels.length - 1].size = 15;
        }
    }

    for (let i = 0; i < particles.length; i++) {
        particles[i].position();
    }

    two.update();
}

function canvasToGraph(x, y) {
    return {x: (x - cx)/cz, y: (-y + cy)/cz};
}
function graphToCanvas(gx, gy) {
    return {x: cz * gx + cx, y: -cz * gy + cy};
}

function cartesianToPolar(x, y) {
    return {r: Math.sqrt(x**2 + y**2), t: Math.atan(y/x)};
}
function polarToCartesian(r, theta) {
    return {x: r * Math.cos(theta), y: r * Math.sin(theta)};
}

function roundCoords(x, y, px, py) {
    let roundedCartesian = {x: Math.round(x), y: Math.round(y)};

    let roundedPolar = cartesianToPolar(x - px, y  - py);
    roundedPolar = {r: Math.round(roundedPolar.r), t: Math.round(roundedPolar.t * 12/Math.PI) * Math.PI/12};

    if (px > x) {
        roundedPolar.t += Math.PI;
    }

    roundedPolar = polarToCartesian(roundedPolar.r, roundedPolar.t);
    roundedPolar.x += px;
    roundedPolar.y += py;

    let cartesianError = Math.sqrt((roundedCartesian.x - x)**2 + (roundedCartesian.y - y)**2);
    let polarError = Math.sqrt((roundedPolar.x - x)**2 + (roundedPolar.y - y)**2);

    if (cartesianError < polarError) {
        return roundedCartesian;
    } else {
        return roundedPolar;
    }
}

function Particle (x, y) {
    this.x = x;
    this.y = y;
    this.vectors = [];
    this.draw();
}
Particle.prototype.draw = function() {
    if (this.group !== undefined) {
        two.remove(this.group);
    }

    this.pointRadius = 0.1*cz;
    this.circle = two.makeCircle(0, 0, 0.1*cz);
    this.circle.fill = "black";

    this.group = two.makeGroup(this.circle);

    for (let i = 0; i < this.vectors.length; i++) {
        this.vectors[i].draw();
    }

    this.position();
};
Particle.prototype.position = function() {
    let canvasCoords = graphToCanvas(this.x, this.y);
    this.group.translation.set(canvasCoords.x, canvasCoords.y);
    two.update();
};
Particle.prototype.hovering = function(mx, my) {
    let canvasCoords = graphToCanvas(this.x, this.y);
    let [dx, dy] = [mx - canvasCoords.x, my - canvasCoords.y];
    return (Math.sqrt(dx**2 + dy**2) <= this.pointRadius);
};

function Vector(x, y, particle) {
    this.x = x;
    this.y = y;
    this.particle = particle;
    this.particle.vectors.push(this);
    this.particle.draw();
}
Vector.prototype.draw = function() {
    let coords = graphToCanvas(this.x, this.y);
    let particleCoords = graphToCanvas(this.particle.x, this.particle.y);

    let tip = cartesianToPolar(coords.x - particleCoords.x, coords.y - particleCoords.y);
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
Vector.prototype.hovering = function(mx, my) {
    let canvasCoords = graphToCanvas(this.x, this.y);
    let [dx, dy] = [mx - canvasCoords.x, my - canvasCoords.y];
    return (Math.sqrt(dx ** 2 + dy ** 2) <= this.pointRadius);
};
