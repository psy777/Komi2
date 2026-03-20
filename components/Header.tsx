import React from 'react';
import { FaFolderOpen, FaSave } from 'react-icons/fa';

interface HeaderProps {
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveSGF: () => void;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, onSaveSGF }) => {
    return (
        <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shadow-md z-20 shrink-0">
            <div className="flex items-center">
                <h1 className="text-2xl font-bold italic tracking-tight text-white font-google">komi</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all text-xs font-semibold">
                    <FaFolderOpen className="text-emerald-400" />
                    <span className="hidden sm:inline">Open</span>
                    <input type="file" accept=".sgf" className="hidden" onChange={onFileUpload} />
                </label>
                <button onClick={onSaveSGF} className="flex items-center gap-1.5 hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-all text-xs font-semibold">
                    <FaSave className="text-blue-400" />
                    <span className="hidden sm:inline">Save</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
