import React from 'react';
import { FaCompass } from 'react-icons/fa';

export default function ExploreView() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center bg-slate-950/20">
            <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center border border-slate-800/50 mb-4">
                <FaCompass size={28} className="text-slate-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-widest">Explore</h3>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                Discover new patterns, professional games, and interactive tutorials. Coming soon.
            </p>
        </div>
    );
}
