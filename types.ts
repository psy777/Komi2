export enum StoneColor {
  BLACK = 'B',
  WHITE = 'W',
  EMPTY = '.',
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface GameNode {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  move?: {
    color: StoneColor;
    x: number;
    y: number;
  };
  properties: Record<string, string>;
  comment?: string;
  chatHistory?: ChatMessage[];
}

export interface GameTree {
  nodes: Record<string, GameNode>;
  rootId: string;
  currentId: string;
}

import Board from '@sabaki/go-board';

export interface BoardState {
  board: Board;
  grid: (0 | 1 | -1)[][]; // -1 for White, 1 for Black, 0 for Empty (Sabaki SignMap format)
  captures: {
    B: number;
    W: number;
  };
  lastMove: Coordinate | null;
  koPoint: Coordinate | null;
}

export enum GameTool {
  PLAY = 'PLAY',
  EDIT = 'EDIT',
  SCORE = 'SCORE',
}
