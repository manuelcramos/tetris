/*
  TETRIS COMPLETAMENTE COMENTADO - script.js
  Por Manuel Campos
  Explicaciones paso a paso para entender cada parte
*/

/* === CONFIGURACIÓN INICIAL === */

// Tamaño del tablero (ancho x alto)
// Número de columnas y filas del tablero de Tetris
const COLS = 15;
const ROWS = 25;

// Velocidad de caída según el nivel, en milisegundos (menos tiempo = más rápido)
const LEVEL_SPEED = {
  1: 800,  // Nivel 1: baja cada 800 ms
  2: 500,  // Nivel 2: baja cada 500 ms
  3: 300   // Nivel 3: baja cada 300 ms
};

// Puntuación según el número de líneas eliminadas al mismo tiempo
const SCORE_PER_LINES = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200
};

// Definición de cada pieza con sus posibles rotaciones (matrices 2D)
// 1 representa bloque, 0 espacio vacío
const PIECES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // Horizontal
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]]  // Vertical
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]], // Rotación 0
    [[0,1,1],[0,1,0],[0,1,0]], // Rotación 1
    [[0,0,0],[1,1,1],[0,0,1]], // Rotación 2
    [[0,1,0],[0,1,0],[1,1,0]]  // Rotación 3
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]]
  ],
  O: [
    [[1,1],[1,1]]  // Pieza cuadrada, solo una rotación
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

// Lista con los tipos de piezas para elegir aleatoriamente
const PIECE_TYPES = ['I','J','L','O','S','T','Z'];

/* === VARIABLES GLOBALES DEL JUEGO === */

let grid = [];              // Matriz 2D que representa el tablero con las piezas fijas
let currentPiece = null;    // Matriz 2D de la pieza que está cayendo ahora
let currentX = 0;           // Posición X (columna) de la pieza actual
let currentY = 0;           // Posición Y (fila) de la pieza actual
let currentRotation = 0;    // Rotación actual (índice en PIECES)
let currentType = '';       // Tipo de pieza actual (I, J, L, etc.)
let nextPiece = null;       // Próxima pieza que se mostrará
let timer = null;           // ID del temporizador para la caída automática
let gamePaused = false;     // Estado si el juego está en pausa
let gameStarted = false;    // Estado si el juego está iniciado
let score = 0;              // Puntuación actual
let level = 1;              // Nivel actual (velocidad)
let linesCleared = 0;       // Líneas totales eliminadas

// Referencias a elementos HTML para actualizar la interfaz
// Referencias a elementos del DOM para controlar y mostrar el estado del juego

const tetrisGrid = document.getElementById('tetris-grid');  // Contenedor del tablero principal donde se dibujan las piezas
const nextGrid = document.getElementById('next-grid');      // Contenedor donde se muestra la próxima pieza que caerá
const scoreSpan = document.getElementById('score');         // Elemento donde se muestra la puntuación actual del jugador
const levelSpan = document.getElementById('level');         // Elemento donde se muestra el nivel actual del juego
const startBtn = document.getElementById('start-btn');      // Botón para iniciar el juego
const pauseBtn = document.getElementById('pause-btn');      // Botón para pausar o reanudar el juego
const resetBtn = document.getElementById('reset-btn');      // Botón para reiniciar la partida (resetear el juego)
const leftBtn = document.getElementById('left-btn');        // Botón para mover la pieza actual hacia la izquierda
const rightBtn = document.getElementById('right-btn');      // Botón para mover la pieza actual hacia la derecha
const downBtn = document.getElementById('down-btn');        // Botón para acelerar la caída de la pieza (bajar rápido)
const rotateBtn = document.getElementById('rotate-btn');    // Botón para rotar la pieza actual

/* === FUNCIONES PRINCIPALES === */

// Inicializa la matriz del tablero con filas vacías
function initGrid() {
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = new Array(COLS).fill(''); // Cada celda vacía (string vacío)
    grid.push(row);
  }
}

// Crea los elementos div del tablero en el DOM, según tamaño ROWS x COLS
function createGridDOM() {
  tetrisGrid.innerHTML = '';  // Limpia cualquier contenido previo
  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement('div');  // Crear celda individual
    cell.classList.add('cell');                   // Añadir clase para estilos CSS
    tetrisGrid.appendChild(cell);                 // Añadir celda al contenedor principal
  }
}


// Función que crea la cuadrícula DOM para mostrar la próxima pieza (4x4)
function createNextGridDOM() {
  nextGrid.innerHTML = ''; // Limpiar contenido previo
  for (let i = 0; i < 16; i++) { // 4x4 = 16 celdas para la pieza preview
    const cell = document.createElement('div'); // Crear div para cada celda
    cell.classList.add('cell'); // Agregar clase base 'cell' para estilo
    nextGrid.appendChild(cell); // Añadir la celda al contenedor nextGrid
  }
}

// Función para dibujar el tablero actual (grid) en el DOM
function drawGrid() {
  const cells = tetrisGrid.children; // Obtener todas las celdas del tablero en el DOM
  for (let r = 0; r < ROWS; r++) {   // Recorrer filas del tablero lógico
    for (let c = 0; c < COLS; c++) { // Recorrer columnas del tablero lógico
      const cell = cells[r * COLS + c]; // Obtener la celda correspondiente en el DOM
      cell.className = 'cell';           // Resetear la clase (limpiar estilos previos)
      if (grid[r][c]) {                  // Si la celda en el tablero lógico tiene una pieza
        cell.classList.add(grid[r][c].toLowerCase()); // Añadir clase del tipo de pieza (color)
      }
    }
  }
}

// Función para dibujar una pieza específica en un grid (ya sea tablero siguiente o principal)
// gridElement: contenedor DOM donde dibujamos (ej: nextGrid para próxima pieza)
// pieceMatrix: matriz 2D que representa la forma de la pieza (ej: PIECES[tipo][rotación])
// type: string con el tipo de pieza para asignar clase CSS (color)
function drawPiece(gridElement, pieceMatrix, type) {
  const cells = gridElement.children; // Obtener las celdas DOM del contenedor
  for (let i = 0; i < cells.length; i++) {
    cells[i].className = 'cell'; // Limpiar clases previas (resetear colores)
  }
  for (let r = 0; r < pieceMatrix.length; r++) { // Recorrer filas de la matriz de la pieza
    for (let c = 0; c < pieceMatrix[r].length; c++) { // Recorrer columnas
      if (pieceMatrix[r][c]) { // Si hay bloque en esa posición (1 o true)
        const index = r * 4 + c; // Convertir posición 2D a índice lineal en grid 4x4
        if (index < cells.length) { // Solo si el índice está dentro del número de celdas
          cells[index].classList.add(type.toLowerCase()); // Añadir clase para color de pieza
        }
      }
    }
  }
}


// Función para dibujar la pieza actual en el tablero visualmente
function drawCurrentPiece() {
  // Creamos una copia temporal del tablero para no modificar el original
  const tempGrid = grid.map(row => row.slice());
  
  // Obtenemos la forma (matriz) de la pieza actual según su tipo y rotación
  const shape = PIECES[currentType][currentRotation];
  
  // Recorremos filas y columnas de la forma de la pieza
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      // Si en esa posición hay un bloque de la pieza (valor "1" o true)
      if (shape[r][c]) {
        // Calculamos la posición en el tablero sumando la posición actual de la pieza
        let newX = currentX + c;
        let newY = currentY + r;
        
        // Solo dibujamos si está dentro del tablero
        if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
          // Colocamos el tipo de pieza en la copia temporal para dibujar
          tempGrid[newY][newX] = currentType;
        }
      }
    }
  }
  
  // Obtenemos todas las celdas del DOM donde mostramos el tablero
  const cells = tetrisGrid.children;
  
  // Recorremos toda la cuadrícula fila por fila
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r * COLS + c];  // Obtenemos la celda DOM correspondiente
      const type = tempGrid[r][c];       // Qué tipo de pieza está en esa celda (o vacío)
      
      // Reseteamos la clase de la celda a 'cell' (clase base)
      cell.className = 'cell';
      
      // Si hay una pieza en esa celda, añadimos su clase para colorearla
      if (type) {
        cell.classList.add(type.toLowerCase());
      }
    }
  }
}

// Función que valida si la pieza puede colocarse en la posición (x, y) con la rotación dada
function isValidPosition(x, y, rotation) {
  // Obtenemos la forma (matriz) de la pieza con la rotación dada
  const shape = PIECES[currentType][rotation];
  
  // Recorremos filas y columnas de la forma
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      // Si la pieza ocupa esa posición (bloque)
      if (shape[r][c]) {
        let newX = x + c;  // Posición horizontal en tablero
        let newY = y + r;  // Posición vertical en tablero
        
        // Validamos que:
        // 1) No salga fuera del tablero por la izquierda (newX < 0)
        // 2) No salga fuera del tablero por la derecha (newX >= COLS)
        // 3) No salga por abajo (newY >= ROWS)
        // 4) No choque con una celda ya ocupada (grid[newY][newX] tiene algo)
        // Importante: solo chequeamos ocupación si newY >= 0 para evitar chequeos fuera del tablero arriba
        if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && grid[newY][newX])) {
          return false; // Posición inválida
        }
      }
    }
  }
  
  return true; // Posición válida para colocar la pieza
}


// Esta función "congela" la pieza actual en el tablero,
// es decir, añade la pieza a la cuadrícula fija para que no se mueva más.
function freezePiece() {
  // Obtener la forma actual de la pieza según tipo y rotación
  const shape = PIECES[currentType][currentRotation];

  // Recorrer las filas y columnas de la matriz de la pieza
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      // Si el bloque en esta posición de la pieza está ocupado (es 1 o true)
      if (shape[r][c]) {
        // Calcular la posición en el tablero sumando la posición actual de la pieza
        const newX = currentX + c;
        const newY = currentY + r;

        // Si la posición vertical está dentro del tablero (>=0)
        if (newY >= 0) {
          // Asignar el tipo de pieza al tablero en esa posición
          // Esto "congela" el bloque ahí y lo hace parte fija del tablero
          grid[newY][newX] = currentType;
        }
      }
    }
  }
}

// Esta función revisa cada fila del tablero para ver si está completa (sin espacios vacíos),
// elimina las filas completas y añade nuevas filas vacías arriba,
// devolviendo el número de filas eliminadas para actualizar el puntaje.
function clearLines() {
  let lines = 0; // Contador de filas completadas

  // Recorremos desde abajo hacia arriba para detectar filas completas
  for (let r = ROWS - 1; r >= 0; r--) {
    // Si todos los bloques en la fila r están ocupados (no están vacíos)
    if (grid[r].every(cell => cell !== '')) {
      // Eliminamos la fila r
      grid.splice(r, 1);
      // Añadimos una fila vacía arriba para mantener la altura constante
      grid.unshift(new Array(COLS).fill(''));
      lines++;  // Incrementamos el contador de líneas eliminadas
      r++;      // Incrementamos r para volver a revisar esta fila que ahora contiene la fila que subió
    }
  }

  // Retornamos la cantidad de líneas eliminadas para actualizar el puntaje
  return lines;
}


// Actualiza la puntuación y el nivel según el número de líneas limpiadas
function updateScoreAndLevel(lines) {
  if (lines > 0) {
    // Sumar puntos según las líneas limpiadas y el nivel actual
    score += SCORE_PER_LINES[lines] * level;

    // Acumular el total de líneas limpiadas para avanzar de nivel
    linesCleared += lines;

    // Si se limpiaron suficientes líneas para subir de nivel y el nivel es menor que 3
    if (linesCleared >= level * 10 && level < 3) {
      level++;            // Aumentar el nivel
      linesCleared = 0;   // Resetear contador de líneas limpiadas para el siguiente nivel

      // Cambiar la velocidad de caída del juego según el nivel
      clearInterval(timer);
      timer = setInterval(moveDown, LEVEL_SPEED[level]);
    }

    // Actualizar la interfaz con la nueva puntuación y nivel
    scoreSpan.textContent = score;
    levelSpan.textContent = level;
  }
}

// Genera una nueva pieza para que caiga y actualiza la pieza siguiente en la vista previa
function spawnNewPiece() {
  // La pieza actual será la que estaba en la variable nextPiece (pieza siguiente generada anteriormente)
  // Si no hay pieza siguiente, se elige una al azar
  currentType = nextPiece || PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];

  currentRotation = 0;                // La rotación inicial es 0
  currentX = Math.floor(COLS / 2) - 2; // Posición horizontal inicial centrada en la parte superior
  currentY = 0;                      // Posición vertical inicial arriba del tablero

  // Se obtiene la forma de la pieza actual según tipo y rotación
  currentPiece = PIECES[currentType][currentRotation];

  // Se genera una nueva pieza para la siguiente que se mostrará en la mini-grid
  nextPiece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];

  // Se dibuja la pieza siguiente en la mini-grid de vista previa
  drawPiece(nextGrid, PIECES[nextPiece][0], nextPiece);
}


function moveDown() {
  // Si el juego no ha empezado o está pausado, no hace nada
  if (!gameStarted || gamePaused) return;

  // Comprueba si la pieza actual puede moverse una fila hacia abajo
  if (isValidPosition(currentX, currentY + 1, currentRotation)) {
    currentY++; // Si es válido, mueve la pieza hacia abajo incrementando la coordenada Y
  } else {
    // Si no puede moverse hacia abajo:
    freezePiece(); // 'Congela' la pieza en su posición actual, es decir, la fija en el tablero
    const lines = clearLines(); // Revisa y elimina las líneas completas, devuelve cuántas se eliminaron
    updateScoreAndLevel(lines); // Actualiza el puntaje y nivel según las líneas eliminadas
    spawnNewPiece(); // Crea una nueva pieza para que empiece a caer

    // Comprueba si la nueva pieza puede colocarse en la posición inicial
    if (!isValidPosition(currentX, currentY, currentRotation)) {
      endGame(); // Si no puede, el juego termina (se llegó al tope)
    }
  }

  drawCurrentPiece(); // Redibuja la pieza actual en la nueva posición (o la misma si no se movió)
}


function endGame() {
  clearInterval(timer); // Para el temporizador que mueve las piezas automáticamente, deteniendo el juego
  
  alert("Juego terminado. Puntuación: " + score); 
  // Muestra un mensaje al jugador informando que el juego ha terminado y mostrando la puntuación final
  
  gameStarted = false;  // Cambia el estado del juego para indicar que ya no está activo
  
  pauseBtn.textContent = 'Pausar'; 
  // Resetea el texto del botón de pausa, dejándolo en su estado inicial para la próxima partida
}


function startGame() {
  initGrid();            // Inicializa la estructura interna del tablero (matriz o array que representa el estado)
  createGridDOM();       // Crea el DOM visual del tablero de juego (las casillas visibles)
  createNextGridDOM();   // Crea el DOM para mostrar la siguiente pieza (preview)
  
  score = 0;             // Reinicia la puntuación
  level = 1;             // Establece el nivel inicial
  linesCleared = 0;      // Reinicia el contador de líneas eliminadas
  
  gameStarted = true;    // Marca que el juego ha comenzado
  gamePaused = false;    // Asegura que el juego no está en pausa
  
  scoreSpan.textContent = score;  // Muestra el puntaje inicial en la interfaz
  levelSpan.textContent = level;  // Muestra el nivel inicial en la interfaz
  
  // Selecciona aleatoriamente la próxima pieza a jugar
  nextPiece = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  
  spawnNewPiece();       // Genera y muestra la pieza actual para empezar a jugar
  
  // Inicia el temporizador que mueve la pieza hacia abajo cada cierto tiempo según la velocidad del nivel actual
  timer = setInterval(moveDown, LEVEL_SPEED[level]);
  
  pauseBtn.textContent = 'Pausar';  // Actualiza el texto del botón de pausa para reflejar que ahora se puede pausar
  
  // Habilita los botones de pausa y reinicio para que el jugador pueda usarlos durante la partida
  pauseBtn.disabled = false;  
  resetBtn.disabled = false;
}


// Función para alternar entre pausar y reanudar el juego
function togglePause() {
  if (!gameStarted) return;  // Si el juego no ha empezado, no hace nada

  gamePaused = !gamePaused;  // Cambia el estado de pausa (true -> false, false -> true)

  if (gamePaused) {
    clearInterval(timer);    // Si está pausado, detiene el temporizador para que el juego deje de avanzar
  } else {
    timer = setInterval(moveDown, LEVEL_SPEED[level]);  // Si se reanuda, reinicia el temporizador con la velocidad del nivel actual
  }
}

// Función para reiniciar el juego
function resetGame() {
  clearInterval(timer);
  gameStarted = false;
  // Opcional: deshabilitar botones, limpiar tablero, etc.
  // ...
  startGame();  // Esto arranca el juego automáticamente después de resetear
}



/* === CONTROLES === */

// Escuchadores de eventos para los botones del juego

// Cuando se pulsa el botón "Iniciar", se llama a la función startGame que arranca el juego
startBtn.addEventListener('click', startGame);

// Cuando se pulsa el botón "Pausa", se cambia el estado de pausa del juego y el texto del botón cambia según esté pausado o no
pauseBtn.addEventListener('click', () => {
  togglePause(); // Cambia entre pausa y reanudar
  pauseBtn.textContent = gamePaused ? 'Reanudar' : 'Pausar'; // Actualiza texto del botón
});

// Cuando se pulsa el botón "Reiniciar", se reinicia el juego y se ajusta el texto del botón de pausa a "Pausar"
resetBtn.addEventListener('click', () => {
  // Cuando el usuario hace clic en el botón "Reiniciar" (resetBtn), se ejecuta esta función anónima
  
  resetGame(); 
  // Llama a la función resetGame() que se encarga de reiniciar el estado del juego:
  // - Detiene el temporizador
  // - Limpia o reinicia variables del juego
  // - Reinicia el tablero y la pieza actual
  // - Y en general deja el juego listo para empezar de nuevo

  pauseBtn.textContent = 'Pausar';
  // Cambia el texto del botón de "Pausa" a "Pausar"
  // Esto es porque al reiniciar el juego, normalmente el juego comienza activo,
  // por lo que el botón debe mostrar "Pausar" para que el jugador pueda pausar si quiere.
});


// Botón para mover la pieza a la izquierda

leftBtn.addEventListener('click', () => {
  // Cuando se hace clic en el botón "leftBtn" (mover pieza a la izquierda),
  // se ejecuta esta función anónima.

  if (isValidPosition(currentX - 1, currentY, currentRotation))
    // Primero verifica si la pieza puede moverse una columna a la izquierda.
    // Esto se hace llamando a la función isValidPosition() con la posición
    // actual menos 1 en X (izquierda), misma fila Y y la misma rotación.
    // Si la posición es válida (no choca con paredes o piezas), continúa.

    currentX--;
    // Disminuye la coordenada X en 1, es decir, mueve la pieza a la izquierda.

  drawCurrentPiece();
  // Finalmente, vuelve a dibujar la pieza en su nueva posición actualizada,
  // para que el cambio sea visible en el tablero del juego.
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

// Botón para mover la pieza hacia abajo (caída rápida)
downBtn.addEventListener('click', moveDown);

// Botón para rotar la pieza
rotateBtn.addEventListener('click', () => {
  const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
  if (isValidPosition(currentX, currentY, nextRotation)) currentRotation = nextRotation;
  drawCurrentPiece();
});

// Evento para el botón "Abajo":
// Al hacer clic, se llama directamente a la función moveDown()
// que intenta bajar la pieza una fila, con todas las validaciones necesarias.
downBtn.addEventListener('click', moveDown);

// Evento para el botón "Rotar":
// Al hacer clic, calcula la siguiente rotación válida para la pieza actual.
// Si la rotación siguiente es válida, actualiza la rotación actual.
// Finalmente, dibuja la pieza con la nueva rotación.
rotateBtn.addEventListener('click', () => {
  const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
  if (isValidPosition(currentX, currentY, nextRotation)) currentRotation = nextRotation;
  drawCurrentPiece();
});


// Botón para mover la pieza a la derecha
rightBtn.addEventListener('click', () => {
  if (isValidPosition(currentX + 1, currentY, currentRotation)) currentX++; // Si es válido, mueve a la derecha
  drawCurrentPiece(); // Actualiza la pieza en pantalla
});

// Botón para mover la pieza hacia abajo (caída rápida)
downBtn.addEventListener('click', moveDown); // Ejecuta directamente la función para bajar la pieza

// Botón para rotar la pieza
rotateBtn.addEventListener('click', () => {
  // Calcula la siguiente rotación (ciclo entre 0 y la cantidad máxima de rotaciones)
  const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
  // Si la rotación es válida en la posición actual, la aplica
  if (isValidPosition(currentX, currentY, nextRotation)) currentRotation = nextRotation;
  drawCurrentPiece(); // Actualiza la pieza con la nueva rotación
});


// Escuchamos eventos de teclado (cuando el usuario presiona una tecla)
document.addEventListener('keydown', (e) => {
  // Si el juego no ha empezado o está en pausa, no hacemos nada
  if (!gameStarted || gamePaused) return;

  // Dependiendo de la tecla que se presione, ejecutamos una acción
  switch (e.key) {
    case 'ArrowLeft': // Flecha izquierda
      // Comprobar si mover la pieza una posición a la izquierda es válido
      if (isValidPosition(currentX - 1, currentY, currentRotation)) 
        currentX--; // Mover la pieza a la izquierda
      break;

    case 'ArrowRight': // Flecha derecha
      // Comprobar si mover la pieza una posición a la derecha es válido
      if (isValidPosition(currentX + 1, currentY, currentRotation)) 
        currentX++; // Mover la pieza a la derecha
      break;

    case 'ArrowDown': // Flecha abajo
      moveDown(); // Mover la pieza hacia abajo (caída más rápida)
      break;

    case 'ArrowUp': // Flecha arriba
    case ' ':       // Barra espaciadora
      // Calcular la siguiente rotación de la pieza (ciclo 0-3)
      const nextRotation = (currentRotation + 1) % PIECES[currentType].length;
      // Comprobar si la rotación es válida en la posición actual
      if (isValidPosition(currentX, currentY, nextRotation)) 
        currentRotation = nextRotation; // Aplicar rotación
      break;
  }

  // Después de cualquier movimiento o rotación, dibujamos la pieza en la nueva posición
  drawCurrentPiece();
});


// Exponemos las funciones principales al objeto global 'window'
// Esto permite que se puedan llamar desde los atributos 'onclick' de los botones en el HTML

// Función para mover la pieza actual una posición a la izquierda
function moveLeft() {
  // Verifica si la posición a la izquierda es válida (no choca con paredes ni otras piezas)
  if (isValidPosition(currentX - 1, currentY, currentRotation)) {
    currentX--; // Mueve la pieza hacia la izquierda
  }
  drawCurrentPiece(); // Redibuja la pieza en su nueva posición
}

// Función para mover la pieza actual una posición a la derecha
function moveRight() {
  // Verifica si la posición a la derecha es válida
  if (isValidPosition(currentX + 1, currentY, currentRotation)) {
    currentX++; // Mueve la pieza hacia la derecha
  }
  drawCurrentPiece(); // Redibuja la pieza en su nueva posición
}

// Función para rotar la pieza actual
function rotate() {
  // Calcula la siguiente rotación (circular entre 0 y la cantidad máxima de rotaciones)
  const nextRotation = (currentRotation + 1) % PIECES[currentType].length;

  // Verifica si la rotación es válida en la posición actual
  if (isValidPosition(currentX, currentY, nextRotation)) {
    currentRotation = nextRotation; // Aplica la rotación
  }
  drawCurrentPiece(); // Redibuja la pieza con la nueva rotación
}

/* 
  Estas funciones se asignan al objeto global 'window' para que puedan ser llamadas
  desde atributos onclick en el HTML u otros scripts externos.

  Por ejemplo, si en tu HTML tienes un botón con:
  <button onclick="moveLeft()">Izquierda</button>

  Al estar estas funciones en 'window', el navegador las encontrará y ejecutará correctamente.
*/

window.moveLeft = moveLeft;   // Permite llamar moveLeft() desde HTML o scripts externos
window.moveRight = moveRight; // Permite llamar moveRight() desde HTML o scripts externos
window.moveDown = moveDown;   // Ya definida antes, para bajar la pieza rápidamente
window.rotate = rotate;       // Permite llamar rotate() para rotar la pieza



