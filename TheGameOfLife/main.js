let grid;

let cols;
let rows;
let resolution = 15;
let canvasPadding = 3;

let neighborsMax; // 3
let neighborsMin; // 2

let r;
let g;
let b;

let backgroundColor = 250;
let emptyColor = 255;
let strokeColor = 240;
let rectRadius = 50;

let isRandom = true;
let isStart = true;
let liveCount = 0;

const getBody = document.querySelector('body');
const getCanvas = document.querySelector('#canvas');

const getSpeedLabel = document.querySelector('#speedLabel');
const getSpeed = document.querySelector('#speed');

const getNeighborsMaxLabel = document.querySelector('#neighborsMaxLabel');
const getNeighborsMax = document.querySelector('#neighborsMax');

const getNeighborsMinLabel = document.querySelector('#neighborsMinLabel');
const getNeighborsMin = document.querySelector('#neighborsMin');

const getThemeMode = document.querySelector('#themeMode');
const getColorMode = document.querySelector('#colorMode');
const getShapeMode = document.querySelector('#shapeMode');

const getGridSizeLabel = document.querySelector('#gridSizeLabel');
const getGridSize = document.querySelector('#gridSize');

const getStart = document.querySelector('#start');
const getRestart = document.querySelector('#restart');
const getClear = document.querySelector('#clear');

//

// const getAddPattern = document.querySelector('#addPattern');

let patternGosperGliderGun = `........................O
......................O.O
............OO......OO............OO
...........O...O....OO............OO
OO........O.....O...OO
OO........O...O.OO....O.O
..........O.....O.......O
...........O...O
............OO`;

let patternArray = patternGosperGliderGun.split('\n');

let patternLength = patternArray.reduce((a, b) => {
    return a.length > b.length ? a : b;
})

let newPattern = patternArray.map(x => {
    let stringLength = patternLength.length - x.length;
    if (stringLength === 0) {
        return x.split('');
    } else {
        let dot = '';
        for(i = 0; i < stringLength; i++){
            dot += '.';
        }
        return (x + dot).split('');
    }
})

console.log(newPattern);


// getAddPattern.addEventListener('click', function(){
// });

// for (i in newPattern) {
//     for (j in newPattern[i]) {
//         if (newPattern[i][j] === 'O') {
//             fill(color(random(r), random(g), random(b)));
//         } else {
//             fill(emptyColor);
//         }
//         stroke(strokeColor);
//         rect(x, y, resolution - 1, resolution - 1, rectRadius);
//     }
// }

//

// Data structure to store the grid
function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }
    return arr;
}

function makeGrid(status) {
    // create new canvas
    const canvas = createCanvas(getCanvas.offsetWidth , getCanvas.offsetHeight);
    canvas.parent(getCanvas);

    cols = floor(width / resolution);
    rows = floor(height / resolution);

    // create empty 2D array
    grid = make2DArray(cols, rows);

    // fill each column random 0 or 1
    // console.table(grid) can see the result
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (status) {
                isRandom = true;
                grid[i][j] = {live: floor(random(2)), count: 0};
            } else {
                isRandom = false;
                grid[i][j] = {live: 0, count: 0};
            }
        }
    }
}

function canvasStatus(status) {
    if (status) {
        loop();
        getStart.innerHTML = 'STOP';
    } else {
        noLoop();
        getStart.innerHTML = 'START'; 
    }
}

function setup() {
    makeGrid(true);
}

function draw() {
    background(backgroundColor);

    // speed
    let speedValue = parseInt(getSpeed.value);
    getSpeedLabel.innerHTML = `Speed (${speedValue})`;
    frameRate(speedValue);

    // neighbors
    neighborsMax = parseInt(getNeighborsMax.value);
    getNeighborsMaxLabel.innerHTML = `Neighbors Max (${neighborsMax})`;

    neighborsMin = parseInt(getNeighborsMin.value);
    getNeighborsMinLabel.innerHTML = `Neighbors Min (${neighborsMin})`;

    // theme mode
    let selectThemeMode = getThemeMode.options[getThemeMode.selectedIndex].text;
    switch (selectThemeMode) {
        case 'LIGHT':
            document.documentElement.setAttribute('data-theme', 'light');
            backgroundColor = 250;
            emptyColor = 255;
            strokeColor = 240;
            break;
        case 'DARK':
            document.documentElement.setAttribute('data-theme', 'dark');
            backgroundColor = 50;
            emptyColor = 50;
            strokeColor = 65;
            break;
        default:
            break;
    }

    // color mode
    let selectColorMode = getColorMode.options[getColorMode.selectedIndex].text;
    switch (selectColorMode){
        case 'RED':
            r = 255; g = 100; b = 255;
            break;
        case 'GREEN':
            r = 255; g = 255; b = 100;
            break;
        case 'BLUE':
            r = 100; g = 255; b = 255;
            break;
        default:
            break;
    }

    // shape mode
    let selectShapeMode = getShapeMode.options[getShapeMode.selectedIndex].text;
    switch (selectShapeMode) {
        case 'CIRCLE':
            rectRadius = 50;
            break;
        case 'SQUARE':
            rectRadius = 0;
            break;
        default:
            break;
    }

    // grid size
    resolution = parseInt(getGridSize.value);
    getGridSizeLabel.innerHTML = `Grid Size (${resolution})`;

    // draw color
    // fill color to grid , square
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let x = i * resolution + canvasPadding;
            let y = j * resolution + canvasPadding;

            if (grid[i][j].live === 1 && grid[i][j].count > 20000) {
                fill(color(200));
            } else if (grid[i][j].live === 1) {
                fill(color(random(r), random(g), random(b)));
            } else {
                fill(emptyColor);
            }
            stroke(strokeColor);
            rect(x, y, resolution - 1, resolution - 1, rectRadius);
        }
    }

    let next = make2DArray(cols, rows);

    // rule1: Any live cell with fewer than two live neighbors dies, as if by underpopulation.
    // rule2: Any live cell with two or three live neighbors lives on to the next generation.
    // rule3: Any live cell with more than three live neighbors dies, as if by overpopulation.
    // rule4: Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.

    // Compute next based on grid
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let state = grid[i][j].live;
            
            // Count live neighbors
            let neighbors = countNeighbors(grid, i, j);

            if (state === 0 && neighbors === neighborsMax) {
                next[i][j] = {live: 1, count: 0};
            } else if (state == 1 && (neighbors < neighborsMin || neighbors > neighborsMax)) {
                next[i][j] = {live: 0, count: 0};
            } else {
                if (state === 1) {
                    liveCount++;
                    next[i][j] = {live: state, count: liveCount};
                } else {
                    next[i][j] = {live: state, count: 0};
                }
            }
        }
    }
    grid = next;
}

function countNeighbors(grid, x, y) {
    let sum = 0;
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {

            let col = (x + i + cols) % cols;
            let row = (y + j + rows) % rows;

            sum += grid[col][row].live;
        }
    }
    sum -= grid[x][y].live;
    return sum;
}

function mouseDragged() {
    let getBruchType = document.querySelector('input[name="brush"]:checked').value;

    if (mouseX > resolution * cols || mouseY > resolution * rows) {
        return;
    }

    const x = floor(mouseX / resolution);
    const y = floor(mouseY / resolution);

    switch (getBruchType) {
        case 'brushPen':
            grid[x][y].live = 1;
            grid[x][y].count = 0;
            fill(color(random(r), random(g), random(b)));
            break;
        case 'brushEraser':
            grid[x][y].live = 0;
            grid[x][y].count = 0;
            fill(emptyColor);
            break;
        default:
            break;
    }

    noStroke();
    rect(x * resolution + canvasPadding, y * resolution + canvasPadding, resolution - 1, resolution - 1, rectRadius);
}

// resize window
function windowResized() {
    if (isStart) {
        canvasStatus(true);
    } else {
        canvasStatus(true);
        canvasStatus(false);
    }
    resizeCanvas(getCanvas.offsetWidth, getCanvas.offsetHeight);
    makeGrid(isRandom);
}

// frame rate
getSpeed.addEventListener('mouseup', function() {
    canvasStatus(true);
});

// brush
getCanvas.addEventListener('mousedown', function() {
    canvasStatus(false);
    mouseDragged();
});

getCanvas.addEventListener('mouseup', function() {
    if (isStart) {
        canvasStatus(true);
    } else {
        canvasStatus(false);
    }
});

// custom mode
getThemeMode.addEventListener('change', function() {
    if (!isStart) {
        canvasStatus(true);
        canvasStatus(false);
    } 
});

getColorMode.addEventListener('change', function() {
    if (!isStart) {
        canvasStatus(true);
        canvasStatus(false);
    } 
});

getShapeMode.addEventListener('change', function() {
    if (!isStart) {
        canvasStatus(true);
        canvasStatus(false);
    } 
});

getGridSize.addEventListener('mouseup', function(){
    if (!isStart) {
        canvasStatus(true);
        canvasStatus(false);
    }
    makeGrid(isRandom);
});

// hotkey
getStart.addEventListener('click', function(){
    if (getStart.innerHTML === 'STOP'){
        isStart = false;
        canvasStatus(false);
    } else {
        isStart = true;
        canvasStatus(true);
    }
});

getRestart.addEventListener('click', function(){
    canvasStatus(true);
    makeGrid(true);

    // reset neighbors
    getNeighborsMax.value = 3;
    getNeighborsMin.value = 2;

    // reset live count
    liveCount = 0;
});

getClear.addEventListener('click', function(){
    canvasStatus(true);
    makeGrid(false);
});

getBody.addEventListener('keydown', function(e){
    switch(e.key) {
        case 'S':
        case 's':
            getStart.click();
            break;
        case 'R':
        case 'r': 
            getRestart.click();
            break;
        case ' ':
            getClear.click();
            break;
        default:
            break;
    }
});