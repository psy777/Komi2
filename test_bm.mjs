import boardmatcher from '@sabaki/boardmatcher';

const data = Array(19).fill(0).map(() => Array(19).fill(0));
data[15][3] = 1; // place a black stone at D4 (x=3, y=15)
console.log("With stone already there:");
console.log(boardmatcher.nameMove(data, 1, [3, 15]));

const dataEmpty = Array(19).fill(0).map(() => Array(19).fill(0));
console.log("Without stone:");
console.log(boardmatcher.nameMove(dataEmpty, 1, [3, 15]));
