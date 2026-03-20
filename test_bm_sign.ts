import boardmatcher from '@sabaki/boardmatcher';
import Board from '@sabaki/go-board';

const board = Board.fromDimensions(19);

// Let's play Black at Q16 (4-4 point)
const x = 15; // Q
const y = 3;  // 16

const b1 = board.makeMove(1, [x, y]); // Black plays
const sign = 1;

// geminiService logic:
let gridCopy = b1.signMap.map(row => [...row]);
gridCopy[y][x] = 0; // temporarily remove
let name1 = boardmatcher.nameMove(gridCopy, sign, [x, y]);
console.log(`Black 1: [${x}, ${y}], sign: ${sign}, name: ${name1}`);

// Now White plays at O17 (3-5 approach)
const wx = 14; // O
const wy = 2;  // 17
const b2 = b1.makeMove(-1, [wx, wy]);
const signW = -1;

gridCopy = b2.signMap.map(row => [...row]);
gridCopy[wy][wx] = 0; // remove white
let name2 = boardmatcher.nameMove(gridCopy, signW, [wx, wy]);
console.log(`White 2: [${wx}, ${wy}], sign: ${signW}, name: ${name2}`);

// Let's test Katago logic for next move
const kx = 16, ky = 2; // R17 (3-3 point)
const nameBot = boardmatcher.nameMove(b2.signMap, 1, [kx, ky]);
console.log(`Bot 3 (Black): [${kx}, ${ky}], sign: 1, name: ${nameBot}`);
