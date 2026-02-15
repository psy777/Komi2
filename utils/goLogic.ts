
import { StoneColor, BoardState, Coordinate } from '../types';

export const BOARD_SIZE = 19;

export const createEmptyGrid = (size: number = BOARD_SIZE): StoneColor[][] => {
  return Array.from({ length: size }, () => Array(size).fill(StoneColor.EMPTY));
};

export const getNeighbors = (x: number, y: number, size: number = BOARD_SIZE): Coordinate[] => {
  const neighbors: Coordinate[] = [];
  if (x > 0) neighbors.push({ x: x - 1, y });
  if (x < size - 1) neighbors.push({ x: x + 1, y });
  if (y > 0) neighbors.push({ x, y: y - 1 });
  if (y < size - 1) neighbors.push({ x, y: y + 1 });
  return neighbors;
};

// Returns true if the group has liberties.
// Also returns the group of stones.
export const checkLiberties = (
  grid: StoneColor[][],
  x: number,
  y: number,
  color: StoneColor
): { hasLiberties: boolean; group: Coordinate[] } => {
  const visited = new Set<string>();
  const stack: Coordinate[] = [{ x, y }];
  const group: Coordinate[] = [];
  let hasLiberties = false;

  while (stack.length > 0) {
    const current = stack.pop()!;
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    group.push(current);

    const neighbors = getNeighbors(current.x, current.y);
    for (const n of neighbors) {
      const stone = grid[n.y][n.x];
      if (stone === StoneColor.EMPTY) {
        hasLiberties = true;
      } else if (stone === color && !visited.has(`${n.x},${n.y}`)) {
        stack.push(n);
      }
    }
  }

  return { hasLiberties, group };
};

export const playMove = (
  currentState: BoardState,
  x: number,
  y: number,
  color: StoneColor
): { newState: BoardState; valid: boolean; message?: string } => {
  if (currentState.grid[y][x] !== StoneColor.EMPTY) {
    return { newState: currentState, valid: false, message: 'Point is occupied' };
  }

  // Check Ko
  if (currentState.koPoint && currentState.koPoint.x === x && currentState.koPoint.y === y) {
    return { newState: currentState, valid: false, message: 'Ko rule violation' };
  }

  // Clone grid
  const newGrid = currentState.grid.map((row) => [...row]);
  newGrid[y][x] = color;

  const opponent = color === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK;
  let capturedStones: Coordinate[] = [];

  // Check neighbors for captures
  const neighbors = getNeighbors(x, y);
  for (const n of neighbors) {
    if (newGrid[n.y][n.x] === opponent) {
      const result = checkLiberties(newGrid, n.x, n.y, opponent);
      if (!result.hasLiberties) {
        capturedStones = [...capturedStones, ...result.group];
      }
    }
  }

  // Remove captured stones
  capturedStones.forEach((s) => {
    newGrid[s.y][s.x] = StoneColor.EMPTY;
  });

  // Check suicide
  if (capturedStones.length === 0) {
    const selfResult = checkLiberties(newGrid, x, y, color);
    if (!selfResult.hasLiberties) {
      return { newState: currentState, valid: false, message: 'Suicide move not allowed' };
    }
  }

  // Update captures
  const newCaptures = { ...currentState.captures };
  if (color === StoneColor.BLACK) {
    newCaptures.B += capturedStones.length;
  } else {
    newCaptures.W += capturedStones.length;
  }

  // Set Ko point
  let newKoPoint: Coordinate | null = null;
  if (capturedStones.length === 1) {
    const s = capturedStones[0];
    const selfResult = checkLiberties(newGrid, x, y, color);
    if (selfResult.group.length === 1 && selfResult.hasLiberties) {
       newKoPoint = { x: s.x, y: s.y };
    }
  }

  return {
    newState: {
      grid: newGrid,
      captures: newCaptures,
      lastMove: { x, y },
      koPoint: newKoPoint,
    },
    valid: true,
  };
};

export const boardToAscii = (grid: StoneColor[][]): string => {
  const size = grid.length;
  let ascii = '   ';
  const coords = 'ABCDEFGHJKLMNOPQRST'.slice(0, size);
  for (let i = 0; i < size; i++) ascii += `${coords[i]} `;
  ascii += '\n';
  
  for (let y = 0; y < size; y++) {
    const rowNum = size - y;
    ascii += `${rowNum < 10 ? ' ' : ''}${rowNum} `;
    for (let x = 0; x < size; x++) {
       const s = grid[y][x];
       if (s === StoneColor.BLACK) ascii += 'X ';
       else if (s === StoneColor.WHITE) ascii += 'O ';
       else ascii += '. ';
    }
    ascii += `${rowNum}\n`;
  }
  ascii += '   ';
  for (let i = 0; i < size; i++) ascii += `${coords[i]} `;
  return ascii;
};

export const toGtpCoordinate = (x: number, y: number): string => {
  const letters = 'ABCDEFGHJKLMNOPQRST'; // I is skipped in Go
  if (x < 0 || x >= 19 || y < 0 || y >= 19) return 'pass';
  const col = letters[x];
  const row = 19 - y;
  return `${col}${row}`;
};
