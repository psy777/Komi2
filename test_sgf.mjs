import pkg from '@sabaki/sgf';
const { parse, stringify } = pkg;
const sgf = "(;GM[1]FF[4]SZ[19];B[pd];W[dp]C[comment])";
const rootNodes = parse(sgf);
console.log(JSON.stringify(rootNodes, null, 2));

const outSgf = stringify(rootNodes);
console.log("OUT SGF:", outSgf);
