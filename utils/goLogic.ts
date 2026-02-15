import { StoneColor, BoardState, Coordinate } from '../types';
import * as influence from '@sabaki/influence';
import boardmatcher from '@sabaki/boardmatcher';
import library from '@sabaki/boardmatcher/library';

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

  if (currentState.koPoint && currentState.koPoint.x === x && currentState.koPoint.y === y) {
    return { newState: currentState, valid: false, message: 'Ko rule violation' };
  }

  const newGrid = currentState.grid.map((row) => [...row]);
  newGrid[y][x] = color;

  const opponent = color === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK;
  let capturedStones: Coordinate[] = [];

  const neighbors = getNeighbors(x, y);
  for (const n of neighbors) {
    if (newGrid[n.y][n.x] === opponent) {
      const result = checkLiberties(newGrid, n.x, n.y, opponent);
      if (!result.hasLiberties) {
        capturedStones = [...capturedStones, ...result.group];
      }
    }
  }

  capturedStones.forEach((s) => {
    newGrid[s.y][s.x] = StoneColor.EMPTY;
  });

  if (capturedStones.length === 0) {
    const selfResult = checkLiberties(newGrid, x, y, color);
    if (!selfResult.hasLiberties) {
      return { newState: currentState, valid: false, message: 'Suicide move not allowed' };
    }
  }

  const newCaptures = { ...currentState.captures };
  if (color === StoneColor.BLACK) {
    newCaptures.B += capturedStones.length;
  } else {
    newCaptures.W += capturedStones.length;
  }

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
  const letters = 'ABCDEFGHJKLMNOPQRST'; 
  if (x < 0 || x >= 19 || y < 0 || y >= 19) return 'pass';
  const col = letters[x];
  const row = 19 - y;
  return `${col}${row}`;
};

const toSabakiData = (grid: StoneColor[][]): number[][] => {
    return grid.map(row => row.map(cell => 
        cell === StoneColor.BLACK ? 1 : 
        cell === StoneColor.WHITE ? -1 : 0
    ));
};

export const calculateInfluence = (grid: StoneColor[][]): { blackArea: number, whiteArea: number } => {
    const data = toSabakiData(grid);
    const areaMap = influence.areaMap(data);
    let blackArea = 0;
    let whiteArea = 0;
    areaMap.forEach(row => {
        row.forEach(val => {
            if (val === 1) blackArea++;
            else if (val === -1) whiteArea++;
        });
    });
    return { blackArea, whiteArea };
}

export const findShapes = (grid: StoneColor[][]): string[] => {
    const data = toSabakiData(grid);
    const size = grid.length;
    const found: string[] = [];
    const patterns = [...library.hane, ...library.cut, ...library.shapes];
    let count = 0;
    for(let y=0; y<size; y++) {
        for(let x=0; x<size; x++) {
            if(count > 20) break;
            const vertex: [number, number] = [x, y];
            for(const pattern of patterns) {
                const matches = [...boardmatcher.matchShape(data, vertex, pattern)];
                if(matches.length > 0) {
                    if(pattern.name) {
                        found.push(`${pattern.name} at ${toGtpCoordinate(x, y)}`);
                        count++;
                    }
                }
            }
        }
    }
    return Array.from(new Set(found));
}