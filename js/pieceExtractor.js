// Configuration variables
const GRID_COLOR = { r: 50, g: 77, b: 131 }; // Example grid color (background color)
const COLOR_THRESHOLD = 10;
const BOTTOM_CROP_PERCENTAGE = 30;
const SIZE_RATIO = 2.1905;
const CELL_SIZE = 8;

// Function to calculate color distance between two colors
function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Function to group shapes in the grid
function groupShapes(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const shapes = [];

  // Directions for 4-way adjacency (up, down, left, right)
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];

  // Helper function for flood fill to collect coordinates of a shape
  function floodFill(x, y) {
    const stack = [[x, y]];
    visited[x][y] = true;
    const shapeCoordinates = [[x, y]]; // Start the shape with the current coordinate

    while (stack.length > 0) {
      const [cx, cy] = stack.pop();

      for (const [dx, dy] of directions) {
        const nx = cx + dx;
        const ny = cy + dy;

        if (
          nx >= 0 &&
          nx < rows &&
          ny >= 0 &&
          ny < cols &&
          grid[nx][ny] === 1 &&
          !visited[nx][ny]
        ) {
          visited[nx][ny] = true;
          shapeCoordinates.push([nx, ny]); // Add the new coordinate to the shape
          stack.push([nx, ny]);
        }
      }
    }

    return shapeCoordinates;
  }

  // Iterate through the grid
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (grid[i][j] === 1 && !visited[i][j]) {
        const shapeCoordinates = floodFill(i, j); // Get coordinates of the current shape

        // Determine the bounding box of the shape
        const minX = Math.min(...shapeCoordinates.map((coord) => coord[0]));
        const maxX = Math.max(...shapeCoordinates.map((coord) => coord[0]));
        const minY = Math.min(...shapeCoordinates.map((coord) => coord[1]));
        const maxY = Math.max(...shapeCoordinates.map((coord) => coord[1]));

        // Create the subgrid (bounding box) filled with `1`s
        const subgrid = Array.from({ length: maxX - minX + 1 }, () =>
          Array(maxY - minY + 1).fill(0),
        );

        // Place `1`s in the subgrid based on the shape coordinates
        for (const [x, y] of shapeCoordinates) {
          subgrid[x - minX][y - minY] = 1;
        }

        // Add the subgrid (shape) to the shapes list
        shapes.push(subgrid);
      }
    }
  }

  return shapes;
}

// Function to process the image and extract the grid using canvas
async function processImage(image, gridY, gridHeight) {
  const canvas = document.createElement('canvas');
  canvas.style.display = "block";
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  // Calculate grid bottom Y (bottom of the grid)
  const gridBottomY = gridY + gridHeight;

  // Calculate the height of the cropped area starting from gridBottomY
  const cropHeight = (canvas.height - gridBottomY) * (BOTTOM_CROP_PERCENTAGE / 100);
  const remainingHeight = Math.round(canvas.height - gridBottomY - cropHeight); // Portion below gridBottomY after bottom crop

  // Extract image data for the cropped portion
  const croppedImageData = ctx.getImageData(0, gridBottomY, canvas.width, remainingHeight);
  const croppedPixels = croppedImageData.data;

  const largeCellSize = gridHeight / CELL_SIZE;
  const smallCellSize = largeCellSize / SIZE_RATIO;

  const cols = Math.floor(canvas.width / smallCellSize);
  const rows = Math.floor(remainingHeight / smallCellSize);

  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

  // Loop through the grid to detect background/foreground cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellX = Math.floor(col * smallCellSize + smallCellSize / 2);
      const cellY = Math.floor(row * smallCellSize + smallCellSize / 2);

      const index = (cellY * canvas.width + cellX) * 4; // RGBA data
      const [r, g, b] = [
        croppedPixels[index],
        croppedPixels[index + 1],
        croppedPixels[index + 2],
      ];

      const distance = colorDistance({ r, g, b }, GRID_COLOR);
      const isBackground = distance < COLOR_THRESHOLD;
      grid[row][col] = isBackground ? 0 : 1;
    }
  }

  canvas.remove()

  // Group the shapes from the grid
  const shapes = groupShapes(grid);
  return shapes;
}

export default processImage;