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
  const padding = 22; // Reduced padding for a tighter wooden border to maximize board size
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
          strokeWidth="1"
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
          strokeWidth="1"
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
      r={3}
      fill="#000"
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
              r={cellSize / 2 - 1}
              fill="rgba(0,0,0,0.3)"
            />
            <circle
              cx={cx}
              cy={cy}
              r={cellSize / 2 - 1}
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

  // Coordinates - Positioned within the border area
  const coords = [];
  const coordLabels = 'ABCDEFGHJKLMNOPQRST';
  for (let i = 0; i < BOARD_SIZE; i++) {
    coords.push(<text key={`ct-${i}`} x={padding + i * cellSize} y={padding - 8} textAnchor="middle" fontSize="10" fill="#111" className="font-sans font-bold select-none opacity-80">{coordLabels[i]}</text>);
    coords.push(<text key={`cb-${i}`} x={padding + i * cellSize} y={boardPixelSize - padding + 15} textAnchor="middle" fontSize="10" fill="#111" className="font-sans font-bold select-none opacity-80">{coordLabels[i]}</text>);
    coords.push(<text key={`cl-${i}`} x={padding - 10} y={padding + i * cellSize + 3.5} textAnchor="end" fontSize="10" fill="#111" className="font-sans font-bold select-none opacity-80">{BOARD_SIZE - i}</text>);
    coords.push(<text key={`cr-${i}`} x={boardPixelSize - padding + 10} y={padding + i * cellSize + 3.5} textAnchor="start" fontSize="10" fill="#111" className="font-sans font-bold select-none opacity-80">{BOARD_SIZE - i}</text>);
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-0">
      <div className="relative aspect-square w-full h-full max-w-full max-h-full shadow-2xl bg-wood-300 rounded overflow-hidden flex items-center justify-center shrink-0">
        <div className="absolute inset-0 pointer-events-none opacity-25" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")' }}></div>
        
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