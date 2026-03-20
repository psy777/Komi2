import React from 'react';
import { IconType } from 'react-icons';

export interface TabOption {
    id: string;
    label: string;
    icon?: IconType;
}

interface TabsHeaderProps {
    tabs: TabOption[];
    activeTab: string;
    onTabChange: (id: string) => void;
    className?: string;
}

export default function TabsHeader({ tabs, activeTab, onTabChange, className = '' }: TabsHeaderProps) {
    return (
        <div className={`flex border-b border-slate-800 bg-slate-900 shrink-0 ${className}`}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1.5 py-3 px-2 text-[10px] md:text-[11px] uppercase font-bold tracking-wider transition-all ${isActive
                            ? 'text-purple-400 border-b-2 border-purple-500 bg-slate-800/40 relative'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border-b-2 border-transparent'
                            }`}
                    >
                        {Icon && <Icon size={14} className={isActive ? 'text-purple-400' : 'text-slate-600'} />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
