import { StoneColor, BoardState, Coordinate } from '../types';

import Board from '@sabaki/go-board';

export const BOARD_SIZE = 19;

export const playMove = (
  currentState: BoardState,
  x: number,
  y: number,
  color: StoneColor
): { newState: BoardState; valid: boolean; message?: string } => {
  const sign = color === StoneColor.BLACK ? 1 : (color === StoneColor.WHITE ? -1 : 0);

  if (sign === 0) {
    return { newState: currentState, valid: false, message: 'Invalid stone color' };
  }

  try {
    const nextBoard = currentState.board.makeMove(sign, [x, y], { preventOverwrite: true, preventSuicide: true, preventKo: true });

    // Calculate new captures based on difference
    const newCaptures = { ...currentState.captures };

    // Instead of using undocumented getCaptures, let's track captures differently, 
    // or rely on analyzing the move if needed. Actually Sabaki Board natively tracks them:
    const capturedByBlack = nextBoard.getCaptures(1); // Usually tracks stones captured *by* black
    const capturedByWhite = nextBoard.getCaptures(-1);

    // Update capture counts based on new state.
    // getCaptures returns total captures by that player.
    const newB = capturedByBlack;
    const newW = capturedByWhite;

    return {
      newState: {
        board: nextBoard,
        grid: nextBoard.signMap as (0 | 1 | -1)[][],
        captures: { B: newB, W: newW },
        lastMove: { x, y },
        koPoint: null, // Basic Ko is handled internally by makeMove, but for UI rendering we might not track strictly unless needed
      },
      valid: true,
    };
  } catch (error: any) {
    return { newState: currentState, valid: false, message: error.message };
  }
};

export const boardToAscii = (grid: (0 | 1 | -1)[][]): string => {
  if (!grid || grid.length === 0) return '';
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
      if (s === 1) ascii += 'X ';
      else if (s === -1) ascii += 'O ';
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

export const toSgfCoordinate = (x: number, y: number): string => {
  const charX = String.fromCharCode(x + 97);
  const charY = String.fromCharCode(y + 97);
  return `${charX}${charY}`;
}

export const fromSgfCoordinate = (sgfString: string): Coordinate | null => {
  if (!sgfString || sgfString.length !== 2) return null;
  const x = sgfString.charCodeAt(0) - 97;
  const y = sgfString.charCodeAt(1) - 97;
  return { x, y };
}

export const fromGtpCoordinate = (gtpString: string): Coordinate | null => {
  if (!gtpString) return null;
  const s = gtpString.toUpperCase();
  if (s === 'PASS' || s === 'RESIGN') return null;
  const letters = 'ABCDEFGHJKLMNOPQRST';
  const colChar = s.charAt(0);
  const x = letters.indexOf(colChar);
  if (x === -1) return null;
  const rowStr = s.substring(1);
  const row = parseInt(rowStr, 10);
  if (isNaN(row)) return null;
  const y = 19 - row; // 1-indexed, so 19 is y=0
  return { x, y };
};
