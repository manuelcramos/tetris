/*
  TETRIS COMPLETAMENTE COMENTADO - script.js
  Por Manuel Campos
  Explicaciones paso a paso para entender cada parte
*/

/* === CONFIGURACIÓN INICIAL === */

// Tamaño del tablero (ancho x alto)
const COLS = 15;
const ROWS = 25;

// Velocidad por nivel (milisegundos entre movimientos hacia abajo)
const LEVEL_SPEED = {
  1: 800,
  2: 500,
  3: 300
};

// Puntuación según líneas eliminadas simultáneamente
const SCORE_PER_LINES = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200
};

// Definición de piezas y sus rotaciones
const PIECES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]]
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ],
  O: [
    [[1,1],[1,1]]
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]]
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]]
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]]
  ]
};

// Tipos de piezas disponibles para elegir aleatoriamente
const PIECE_TYPES = ['I','J','L','O','S','T','Z'];

/* === VARIABLES GLOBALES === */

let grid = [];              // Matriz del tablero
let currentPiece = null;    // Matriz de la pieza actual
let currentX = 0;           // Posición horizontal de la pieza actual
let currentY = 0;           // Posición vertical de la pieza actual
let currentRotation = 0;    // Índice de rotación de la pieza actual
let currentType = '';       // Tipo de la pieza actual
let nextPiece = null;       // Próxima pieza
let timer = null;           // Temporizador para caída automática
let gamePaused = false;     // Juego pausado o no
let gameStarted = false;    // Juego iniciado o no
let score = 0;              // Puntuación del jugador
let level = 1;              // Nivel actual
let linesCleared = 0;       // Líneas eliminadas acumuladas

// Referencias a elementos del DOM
const tetrisGrid = document.getElementById('tetris-grid');
const nextGrid = document.getElementById('next-grid');
const scoreSpan = document.getElementById('score');
const levelSpan = document.getElementById('level');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const downBtn = document.getElementById('down-btn');
const rotateBtn = document.getElementById('rotate-btn');

/* === FUNCIONES PRINCIPALES === */

function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill('');
    grid.push(row);
  }
}

function createGridDOM() {
  tetrisGrid.innerHTML = '';
  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    tetrisGrid.appendChild(cell);
  }
}

function createNextGridDOM() {
  nextGrid.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    nextGrid.appendChild(cell);
  }
}

function drawGrid() {
  const cells = tetrisGrid.children;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + c];
      cell.className = 'cell';
      if (grid[r][c]) {
        cell.classList.add(grid[r][c].toLowerCase());
      }
    }
  }
}

function drawPiece(gridElement, pieceMatrix, type) {
  const cells = gridElement.children;
  for (let i = 0; i < cells.length; i++) {
    cells[i].className = 'cell';
  }
  for (let r = 0; r < pieceMatrix.length; r++) {
    for (let c = 0; c < pieceMatrix[r].length; c++) {
      if (pieceMatrix[r][c]) {
        const index = r * 4 + c;
        if (index < cells.length) {
          cells[index].classList.add(type.toLowerCase());
        }
      }
    }
  }
}

function drawCurrentPiece() {
  const tempGrid = grid.map(row => row.slice());
  const shape = PIECES[currentType][currentRotation];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        let newX = currentX + c;
        let newY = currentY + r;
        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
          tempGrid[newY][newX] = currentType;
        }
      }
    }
  }
  const cells = tetrisGrid.children;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + c];
      const type = tempGrid[r][c];
      cell.className = 'cell';
      if (type) {
        cell.classList.add(type.toLowerCase());
      }
    }
  }
}

function isValidPosition(x, y, rotation) {
  const shape = PIECES[currentType][rotation];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        let newX = x + c;
        let newY = y + r;
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX])) {
          return false;
        }
      }
    }
  }
  return true;
}

function freezePiece() {
  const shape = PIECES[currentType][currentRotation];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = currentX + c;
        const newY = currentY + r;
        if (newY >= 0) {
          grid[newY][newX] = currentType;
        }
      }
    }
  }
}

function clearLines() {
  let lines = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (grid[r].every(cell => cell !== '')) {
      grid.splice(r, 1);
      grid.unshift(new Array(COLS).fill(''));
      lines++;
      r++;
    }
  }
  return lines;
}

function updateScoreAndLevel(lines) {
  if (lines > 0) {
    score += SCORE_PER_LINES[lines] * level;
    linesCleared += lines;
    if (linesCleared >= level * 10 && level < 3) {
      level++;
      linesCleared = 0;
      clearInterval(timer);
      timer = setInterval(moveDown, LEVEL_SPEED[level]);
    }
    scoreSpan.textContent = score;
    levelSpan.textContent = level;
  }
}

function spawnNewPiece() {
  currentType = nextPiece || PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  currentRotation = 0;
  currentX = Math.floor(COLS / 2) - 2;
  currentY = 0;
  currentPiece = PIECES[currentType][currentRotation];
  nextPiece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  drawPiece(nextGrid, PIECES[nextPiece][0], nextPiece);
}

function moveDown() {
  if (!gameStarted || gamePaused) return;
  if (isValidPosition(currentX, currentY + 1, currentRotation)) {
    currentY++;
  } else {
    freezePiece();
    const lines = clearLines();
    updateScoreAndLevel(lines);
    spawnNewPiece();
    if (!isValidPosition(currentX, currentY, currentRotation)) {
      endGame();
    }
  }
  drawCurrentPiece();
}

function endGame() {
  clearInterval(timer);
  alert("Juego terminado. Puntuación: " + score);
  gameStarted = false;
  pauseBtn.textContent = 'Pausar';
}

function startGame() {
  initGrid();
  createGridDOM();
  createNextGridDOM();
  score = 0;
  level = 1;
  linesCleared = 0;
  gameStarted = true;
  gamePaused = false;
  scoreSpan.textContent = score;
  levelSpan.textContent = level;
  nextPiece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  spawnNewPiece();
  timer = setInterval(moveDown, LEVEL_SPEED[level]);
  pauseBtn.textContent = 'Pausar';
  // Aquí habilitamos los botones para que se puedan usar
  pauseBtn.disabled = false;  // Habilitar botón Pausa
  resetBtn.disabled = false;  // Habilitar botón Reiniciar

  pauseBtn.textContent = 'Pausar'; // Actualizamos texto del botón pausa
}

function togglePause() {
  if (!gameStarted) return;
  gamePaused = !gamePaused;
  if (gamePaused) {
    clearInterval(timer);
  } else {
    timer = setInterval(moveDown, LEVEL_SPEED[level]);
  }
}

function resetGame() {
  clearInterval(timer);
  gameStarted = false;
  // Opcional: deshabilitar botones de pausa y reinicio al resetear
  pauseBtn.disabled = true;
  resetBtn.disabled = true;

  startGame(); // Iniciar de nuevo el juego

}

/* === CONTROLES === */

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', () => {
  togglePause();
  pauseBtn.textContent = gamePaused ? 'Reanudar' : 'Pausar';
});
resetBtn.addEventListener('click', () => {
  resetGame();
  pauseBtn.textContent = 'Pausar';
});

leftBtn.addEventListener('click', () => {
  if (isValidPosition(currentX - 1, currentY, currentRotation)) currentX--;
  drawCurrentPiece();
});

rightBtn.addEventListener('click', () => {
  if (isValidPosition(currentX + 1, currentY, currentRotation)) currentX++;
  drawCurrentPiece();
});

downBtn.addEventListener('click', moveDown);

rotateBtn.addEventListener('click', () => {
  const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
  if (isValidPosition(currentX, currentY, nextRotation)) currentRotation = nextRotation;
  drawCurrentPiece();
});

document.addEventListener('keydown', (e) => {
  if (!gameStarted || gamePaused) return;
  switch (e.key) {
    case 'ArrowLeft':
      if (isValidPosition(currentX - 1, currentY, currentRotation)) currentX--;
      break;
    case 'ArrowRight':
      if (isValidPosition(currentX + 1, currentY, currentRotation)) currentX++;
      break;
    case 'ArrowDown':
      moveDown();
      break;
    case 'ArrowUp':
    case ' ':
      const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
      if (isValidPosition(currentX, currentY, nextRotation)) currentRotation = nextRotation;
      break;
  }
  drawCurrentPiece();
});
