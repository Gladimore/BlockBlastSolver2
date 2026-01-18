const movesDiv = document.getElementById('moves');

// Check if placing a block at (x, y) is valid
function isValidMove(grid, block, x, y) {
  // Loop through each cell of the block
  for (let i = 0; i < block.length; i++) {
    for (let j = 0; j < block[i].length; j++) {
      // Check if the block cell is occupied (value 1)
      if (block[i][j] === 1) {
        // Check if the block goes out of bounds of the grid
        if (
          x + i < 0 ||
          x + i >= grid.length ||
          y + j < 0 ||
          y + j >= grid[0].length
        ) {
          return false; // Out of bounds
        }
        // Check if the space in the grid is already taken
        if (grid[x + i][y + j] === 1) {
          return false; // Block overlaps with occupied space
        }
      }
    }
  }
  return true; // The move is valid
}

// Place a block on the grid
function placeBlock(grid, block, x, y) {
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  const newGrid = grid.map((row) => [...row]);

  for (let i = 0; i < blockSizeY; i++) {
    for (let j = 0; j < blockSizeX; j++) {
      if (block[i][j] === 1) {
        newGrid[x + i][y + j] = 1;
      }
    }
  }

  return newGrid;
}

// Clear completed rows and columns
function clearCompletedLines(grid) {
  const gridSize = grid.length;
  let score = 0;
  const newGrid = grid.map((row) => [...row]);

  // Clear completed rows
  for (let i = 0; i < gridSize; i++) {
    if (newGrid[i].every((cell) => cell === 1)) {
      newGrid[i].fill(0);
      score++;
    }
  }

  // Clear completed columns
  for (let j = 0; j < gridSize; j++) {
    if (newGrid.every((row) => row[j] === 1)) {
      for (let i = 0; i < gridSize; i++) {
        newGrid[i][j] = 0;
      }
      score++;
    }
  }

  return { grid: newGrid, score };
}

// Get all valid moves for a single block
function getAvailableMoves(grid, block) {
  const gridSize = grid.length;
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  const moves = [];

  for (let x = 0; x <= gridSize - blockSizeY; x++) {
    for (let y = 0; y <= gridSize - blockSizeX; y++) {
      if (isValidMove(grid, block, x, y)) {
        moves.push({ x, y });
      }
    }
  }

  return moves;
}

// Backtracking with dynamic lookahead
function backtrackWithDynamicLookahead(
  grid,
  pieces,
  index,
  currentScore,
  order,
  maxLookahead,
) {
  // Base case: all pieces placed or lookahead depth reached
  if (index === pieces.length || maxLookahead === 0) {
    return { grid, currentScore, order };
  }

  const block = pieces[index];
  const availableMoves = getAvailableMoves(grid, block);
  let bestScore = -Infinity;
  let bestGrid = grid;
  let bestOrder = [...order];

  for (const { x, y } of availableMoves) {
    // Place the block and clear completed lines
    const newGrid = placeBlock(grid, block, x, y);
    const { grid: clearedGrid, score } = clearCompletedLines(newGrid);

    // Lookahead: Explore future placements
    const newOrder = [...order, { pieceIndex: index, x, y }];
    const result = backtrackWithDynamicLookahead(
      clearedGrid,
      pieces,
      index + 1,
      currentScore + score,
      newOrder,
      maxLookahead - 1, // Decrease lookahead depth
    );

    // Choose the placement with the highest score
    if (result.currentScore > bestScore) {
      bestScore = result.currentScore;
      bestGrid = result.grid;
      bestOrder = result.order;
    }
  }

  return { grid: bestGrid, currentScore: bestScore, order: bestOrder };
}

// Play the game with dynamic lookahead
function playGameWithDynamicLookahead(grid, pieces) {
  const maxLookahead = 3; // Set maximum lookahead depth for the first piece
  const {
    grid: finalGrid,
    currentScore,
    order,
  } = backtrackWithDynamicLookahead(grid, pieces, 0, 0, [], maxLookahead);
  return { finalGrid, currentScore, order };
}

// Display the board in a human-readable format
function displayBoard(grid, piece, row, col) {
  const gridSize = grid.length

  for (let r = 0; r < gridSize; r++) {
    let rowStr = ""
    const span = document.createElement("span")
    for (let c = 0; c < gridSize; c++) {
      let isPartOfPiece = false

      if (piece) {
        isPartOfPiece = piece.some((rowPiece, pr) =>
          rowPiece.some(
            (cell, pc) => cell === 1 && r === row + pr && c === col + pc,
          ),
        )
      }

      if (isPartOfPiece) {
        rowStr += "🟪 "
      } else if (grid[r][c] === 1) {
        rowStr += "🟥 "
      } else {
        rowStr += "🟩 "
      }
    }
    span.innerText = rowStr
    movesDiv.appendChild(span)
  }
}

function makeMessage(msg) {
  const textElement = document.createElement("h2")
  textElement.innerText = msg

  movesDiv.appendChild(textElement)
}

// Display the board after each piece is placed
function displayWithOrder(grid, pieces, order) {
  order.forEach(({ pieceIndex, x, y }) => {
    const piece = pieces[pieceIndex]
    makeMessage(`Placing piece ${pieceIndex + 1} at (${y + 1}, ${8 - x}):`)
    grid = placeBlock(grid, piece, x, y)
    const { grid: clearedGrid } = clearCompletedLines(grid)
    displayBoard(clearedGrid, piece, x, y)
    grid = clearedGrid
  })
}

export default {
  playGameWithDynamicLookahead,
  displayWithOrder,
  displayBoard,
  makeMessage
};
