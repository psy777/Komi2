import React, { useMemo } from 'react';
import { StoneColor, Coordinate } from '../types';
import { BOARD_SIZE } from '../utils/goLogic';

interface GoBoardProps {
  grid: StoneColor[][];
  lastMove: Coordinate | null;
  onIntersectionClick: (x: number, y: number) => void;
  markers?: { x: number; y: number; label: string }[];
}

const STAR_POINTS = [
  { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
  { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
  { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 },
];

const GoBoard: React.FC<GoBoardProps> = ({ grid, lastMove, onIntersectionClick, markers }) => {
  const cellSize = 30;
  // Reduced padding significantly to remove the "tan padding" feel while still allowing coordinates
  const padding = 18; 
  const boardPixelSize = (BOARD_SIZE - 1) * cellSize + padding * 2;

  // Render Grid Lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      // Vertical
      lines.push(
        <line
          key={`v-${i}`}
          x1={padding + i * cellSize}
          y1={padding}
          x2={padding + i * cellSize}
          y2={boardPixelSize - padding}
          stroke="#000"
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
      );
      // Horizontal
      lines.push(
        <line
          key={`h-${i}`}
          x1={padding}
          y1={padding + i * cellSize}
          x2={boardPixelSize - padding}
          y2={padding + i * cellSize}
          stroke="#000"
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />
      );
    }
    return lines;
  }, [boardPixelSize, padding]);

  // Render Star Points
  const starPoints = STAR_POINTS.map((p, i) => (
    <circle
      key={`star-${i}`}
      cx={padding + p.x * cellSize}
      cy={padding + p.y * cellSize}
      r={3.2}
      fill="#000"
      fillOpacity="0.9"
    />
  ));

  // Render Stones
  const stones = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = grid[y][x];
      if (stone !== StoneColor.EMPTY) {
        const cx = padding + x * cellSize;
        const cy = padding + y * cellSize;
        
        const gradId = stone === StoneColor.BLACK ? 'grad-black' : 'grad-white';

        stones.push(
          <g key={`stone-${x}-${y}`}>
            <circle
              cx={cx + 1}
              cy={cy + 2}
              r={cellSize / 2 - 1.5}
              fill="rgba(0,0,0,0.3)"
            />
            <circle
              cx={cx}
              cy={cy}
              r={cellSize / 2 - 1.5}
              fill={`url(#${gradId})`}
              stroke={stone === StoneColor.WHITE ? '#ccc' : '#000'}
              strokeWidth={0.5}
            />
            {lastMove && lastMove.x === x && lastMove.y === y && (
              <circle
                cx={cx}
                cy={cy}
                r={cellSize / 5}
                fill="transparent"
                stroke={stone === StoneColor.BLACK ? 'white' : 'black'}
                strokeWidth={2}
                strokeOpacity="0.8"
              />
            )}
          </g>
        );
      }
    }
  }

  const clickTargets = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      clickTargets.push(
        <rect
          key={`click-${x}-${y}`}
          x={padding + x * cellSize - cellSize / 2}
          y={padding + y * cellSize - cellSize / 2}
          width={cellSize}
          height={cellSize}
          fill="transparent"
          onClick={() => onIntersectionClick(x, y)}
          className="cursor-pointer hover:fill-black/5 transition-colors"
        />
      );
    }
  }

  // Coordinates
  const coords = [];
  const coordLabels = 'ABCDEFGHJKLMNOPQRST';
  for (let i = 0; i < BOARD_SIZE; i++) {
    // Tighter coordinate positions
    coords.push(<text key={`ct-${i}`} x={padding + i * cellSize} y={padding - 7} textAnchor="middle" fontSize="9" fill="#111" className="font-sans font-bold select-none opacity-60 tracking-tighter">{coordLabels[i]}</text>);
    coords.push(<text key={`cb-${i}`} x={padding + i * cellSize} y={boardPixelSize - padding + 13} textAnchor="middle" fontSize="9" fill="#111" className="font-sans font-bold select-none opacity-60 tracking-tighter">{coordLabels[i]}</text>);
    coords.push(<text key={`cl-${i}`} x={padding - 8} y={padding + i * cellSize + 3.5} textAnchor="end" fontSize="9" fill="#111" className="font-sans font-bold select-none opacity-60 tracking-tighter">{BOARD_SIZE - i}</text>);
    coords.push(<text key={`cr-${i}`} x={boardPixelSize - padding + 8} y={padding + i * cellSize + 3.5} textAnchor="start" fontSize="9" fill="#111" className="font-sans font-bold select-none opacity-60 tracking-tighter">{BOARD_SIZE - i}</text>);
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent relative overflow-hidden group p-4">
      {/* Reduced the board scale even further to 75% and minimized internal padding */}
      <div className="relative aspect-square h-[75%] max-h-[75%] flex items-center justify-center shrink-0 shadow-[0_25px_60px_rgba(0,0,0,0.7)] rounded-[2px] overflow-hidden bg-wood-300 transition-all duration-300">
        {/* Wooden texture local to the board */}
        <div className="absolute inset-0 pointer-events-none opacity-25 mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none"></div>

        <svg 
            viewBox={`0 0 ${boardPixelSize} ${boardPixelSize}`}
            className="w-full h-full block relative z-10 p-0"
            preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="grad-black" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#666" />
              <stop offset="20%" stopColor="#333" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
            <radialGradient id="grad-white" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="50%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#dcdcdc" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="transparent" />

          {gridLines}
          {starPoints}
          {coords}
          {stones}
          {clickTargets}
        </svg>
      </div>
    </div>
  );
};

export default GoBoard;