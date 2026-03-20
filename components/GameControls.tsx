import React from 'react';
import { FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward, FaCodeBranch } from 'react-icons/fa';
import { GameNode } from '../types';

interface GameControlsProps {
    onFirst: () => void;
    onPrev: () => void;
    onNext: (childIndex?: number) => void;
    onLast: () => void;
    moveInput: string;
    onMoveInputChange: (val: string) => void;
    onMoveInputSubmit: (e: React.FormEvent) => void;
    onMoveInputBlur: () => void;
    onMoveBoxWheel: (e: React.WheelEvent) => void;
    nextNodes: GameNode[];
}

const GameControls: React.FC<GameControlsProps> = ({
    onFirst,
    onPrev,
    onNext,
    onLast,
    moveInput,
    onMoveInputChange,
    onMoveInputSubmit,
    onMoveInputBlur,
    onMoveBoxWheel,
    nextNodes
}) => {
    return (
        <div className="p-3 bg-slate-900 flex flex-col gap-2 shrink-0 border-t border-slate-800/50">
            <div className="flex items-center justify-between gap-1 max-w-sm mx-auto w-full">
                <button onClick={onFirst} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all" title="Start">
                    <FaStepBackward size={14} />
                </button>
                <button onClick={onPrev} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all" title="Back">
                    <FaChevronLeft size={16} />
                </button>

                <div className="flex items-center justify-center bg-slate-950 rounded-lg px-3 py-1 border border-slate-800 shadow-inner group cursor-ns-resize" onWheel={onMoveBoxWheel}>
                    <span className="text-[10px] text-slate-600 font-black mr-2 uppercase tracking-widest select-none">Move</span>
                    <form onSubmit={onMoveInputSubmit}>
                        <input
                            className="w-10 bg-transparent text-center font-mono font-bold text-emerald-500 focus:outline-none text-base"
                            value={moveInput}
                            onChange={e => onMoveInputChange(e.target.value)}
                            onBlur={onMoveInputBlur}
                        />
                    </form>
                </div>

                <button onClick={() => onNext()} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all" title="Next">
                    <FaChevronRight size={16} />
                </button>
                <button onClick={onLast} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-all" title="End">
                    <FaStepForward size={14} />
                </button>
            </div>

            {/* Variations */}
            {nextNodes.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1 border-t border-slate-800/40 mt-1">
                    <span className="text-[9px] text-emerald-600 font-black uppercase tracking-[0.1em] mr-1 flex items-center shrink-0">
                        <FaCodeBranch size={10} className="mr-1" /> Vars
                    </span>
                    <div className="flex gap-1">
                        {nextNodes.map((node, idx) => (
                            <button
                                key={node.id}
                                onClick={() => onNext(idx)}
                                className="h-6 min-w-[28px] px-2 flex items-center justify-center text-[10px] font-bold bg-slate-800 hover:bg-emerald-600 border border-slate-700 rounded-md text-slate-400 hover:text-white transition-all shadow-sm"
                            >
                                {String.fromCharCode(65 + idx)}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameControls;
