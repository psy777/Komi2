import React from 'react';
import { FaTimes, FaUserCircle } from 'react-icons/fa';
import { StoneColor } from '../types';

interface GameStatsOverlayProps {
    onClose: () => void;
    blackPlayer: string;
    whitePlayer: string;
    blackRank: string;
    whiteRank: string;
    captures: { B: number, W: number };
    komi: number;
    gameResult: string;
    currentPlayer: StoneColor;
}

const GameStatsOverlay: React.FC<GameStatsOverlayProps> = ({
    onClose,
    blackPlayer,
    whitePlayer,
    blackRank,
    whiteRank,
    captures,
    komi,
    gameResult,
    currentPlayer
}) => {
    return (
        <div className="absolute inset-x-0 top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-2xl p-6 animate-in slide-in-from-top duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Game Information</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                                    <FaUserCircle className="text-slate-600 text-2xl" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-white">{blackPlayer}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-tighter">{blackRank || 'No Rank'}</div>
                                </div>
                            </div>
                            <div className="text-emerald-400 font-mono font-bold text-2xl bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                                {captures.B}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-400">
                                    <FaUserCircle className="text-slate-600 text-2xl" />
                                </div>
                                <div>
                                    <div className="font-bold text-lg text-white">{whitePlayer}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-tighter">{whiteRank || 'No Rank'}</div>
                                </div>
                            </div>
                            <div className="text-slate-300 font-mono font-bold text-2xl bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shadow-inner">
                                {captures.W}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800 text-sm">
                            <div className="flex justify-between mb-3"><span className="text-slate-500 font-medium">Komi:</span> <span className="text-emerald-400 font-bold">{komi}</span></div>
                            <div className="flex justify-between mb-3"><span className="text-slate-500 font-medium">Result:</span> <span className="text-purple-400 font-bold">{gameResult}</span></div>
                            <div className="flex justify-between border-t border-slate-800 pt-3"><span className="text-slate-500 font-medium">Status:</span> <span className="text-slate-300 font-bold">{currentPlayer === StoneColor.BLACK ? 'Black' : 'White'}'s turn</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameStatsOverlay;
