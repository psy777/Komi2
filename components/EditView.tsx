import React from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

export type EditTool =
    | 'stone_black' | 'stone_white' | 'stone_clear'
    | 'marker_triangle' | 'marker_circle' | 'marker_square' | 'marker_cross' | 'marker_label' | 'marker_alpha' | 'marker_number' | 'marker_clear'
    | 'line' | 'arrow' | 'line_clear'
    | 'paint_white' | 'paint_black' | 'paint_clear'
    | 'heat_plus' | 'heat_minus' | 'heat_clear';

interface EditViewProps {
    activeTool: EditTool | null;
    onSelectTool: (tool: EditTool | null) => void;
    boardSize: number;
    onBoardSizeChange: (size: number) => void;
    showCoordinates: boolean;
    onToggleCoordinates: (show: boolean) => void;
    isBusy: boolean;
    onToggleBusy: (busy: boolean) => void;
    fuzzyPlacement: boolean;
    onToggleFuzzyPlacement: (fuzzy: boolean) => void;
    animatePlacement: boolean;
    onToggleAnimatePlacement: (animate: boolean) => void;
    rangeX: [number, number];
    onRangeXChange: (range: [number, number]) => void;
    rangeY: [number, number];
    onRangeYChange: (range: [number, number]) => void;
}

export default function EditView({
    activeTool,
    onSelectTool,
    boardSize,
    onBoardSizeChange,
    showCoordinates,
    onToggleCoordinates,
    isBusy,
    onToggleBusy,
    fuzzyPlacement,
    onToggleFuzzyPlacement,
    animatePlacement,
    onToggleAnimatePlacement,
    rangeX,
    onRangeXChange,
    rangeY,
    onRangeYChange
}: EditViewProps) {
    return (
        <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 text-slate-100 overflow-y-auto custom-scrollbar">
            <div className="flex-1 p-5 space-y-8">
                {/* Board Settings Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-300">Board Settings</h3>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="show-coords" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Show Coordinates
                        </Label>
                        <Switch
                            id="show-coords"
                            checked={showCoordinates}
                            onCheckedChange={onToggleCoordinates}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="is-busy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Busy State
                        </Label>
                        <Switch
                            id="is-busy"
                            checked={isBusy}
                            onCheckedChange={onToggleBusy}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="board-size" className="text-sm font-medium leading-none">
                            Board Size
                        </Label>
                        <Input
                            id="board-size"
                            type="number"
                            min="2" max="25"
                            value={boardSize}
                            onChange={(e) => onBoardSizeChange(parseInt(e.target.value) || 19)}
                            className="w-20 bg-slate-900 border-slate-800"
                        />
                    </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Field of View Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-300">Partial Field of View</h3>

                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-400 block mb-2">X Range (0 to {boardSize - 1})</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={rangeX[0]}
                                    onChange={e => onRangeXChange([parseInt(e.target.value) || 0, rangeX[1]])}
                                    className="w-20 bg-slate-900 border-slate-800 text-center"
                                />
                                <span className="text-slate-500 text-sm">to</span>
                                <Input
                                    type="number"
                                    value={rangeX[1]}
                                    onChange={e => onRangeXChange([rangeX[0], parseInt(e.target.value) || boardSize - 1])}
                                    className="w-20 bg-slate-900 border-slate-800 text-center"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-slate-400 block mb-2">Y Range (0 to {boardSize - 1})</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={rangeY[0]}
                                    onChange={e => onRangeYChange([parseInt(e.target.value) || 0, rangeY[1]])}
                                    className="w-20 bg-slate-900 border-slate-800 text-center"
                                />
                                <span className="text-slate-500 text-sm">to</span>
                                <Input
                                    type="number"
                                    value={rangeY[1]}
                                    onChange={e => onRangeYChange([rangeY[0], parseInt(e.target.value) || boardSize - 1])}
                                    className="w-20 bg-slate-900 border-slate-800 text-center"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Edit Tools Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-300">Edit Tools</h3>

                    <div className="space-y-3">
                        <div>
                            <Label className="text-xs text-slate-400 block mb-2">Place Stones</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => onSelectTool(activeTool === 'stone_black' ? null : 'stone_black')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'stone_black' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>Black</button>
                                <button onClick={() => onSelectTool(activeTool === 'stone_white' ? null : 'stone_white')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'stone_white' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>White</button>
                                <button onClick={() => onSelectTool(activeTool === 'stone_clear' ? null : 'stone_clear')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'stone_clear' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>Clear</button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-slate-400 block mb-2">Place Markers</Label>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => onSelectTool(activeTool === 'marker_triangle' ? null : 'marker_triangle')} className={`flex items-center justify-center p-2 rounded-md text-xl border transition-colors ${activeTool === 'marker_triangle' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`} title="Triangle">△</button>
                                <button onClick={() => onSelectTool(activeTool === 'marker_square' ? null : 'marker_square')} className={`flex items-center justify-center p-2 rounded-md text-xl border transition-colors ${activeTool === 'marker_square' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`} title="Square">□</button>
                                <button onClick={() => onSelectTool(activeTool === 'marker_circle' ? null : 'marker_circle')} className={`flex items-center justify-center p-2 rounded-md text-xl border transition-colors ${activeTool === 'marker_circle' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`} title="Circle">○</button>
                                <button onClick={() => onSelectTool(activeTool === 'marker_cross' ? null : 'marker_cross')} className={`flex items-center justify-center p-2 rounded-md text-xl border transition-colors ${activeTool === 'marker_cross' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`} title="Cross">✕</button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-slate-400 block mb-2">Place Labels</Label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => onSelectTool(activeTool === 'marker_alpha' ? null : 'marker_alpha')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'marker_alpha' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>A..Z</button>
                                <button onClick={() => onSelectTool(activeTool === 'marker_number' ? null : 'marker_number')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'marker_number' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>1..9</button>
                                <button onClick={() => onSelectTool(activeTool === 'marker_label' ? null : 'marker_label')} className={`flex items-center justify-center gap-2 p-2 rounded-md text-sm border transition-colors ${activeTool === 'marker_label' ? 'bg-slate-800 border-purple-500 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}>Text</button>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-800" />

                {/* Aesthetics Section */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight text-slate-300">Look & Feel</h3>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="fuzzy-placement" className="text-sm font-medium leading-none">
                            Fuzzy Stone Placement
                        </Label>
                        <Switch
                            id="fuzzy-placement"
                            checked={fuzzyPlacement}
                            onCheckedChange={onToggleFuzzyPlacement}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="animate-placement" className="text-sm font-medium leading-none">
                            Animate Placements
                        </Label>
                        <Switch
                            id="animate-placement"
                            checked={animatePlacement}
                            onCheckedChange={onToggleAnimatePlacement}
                        />
                    </div>
                </div>
            </div>

            {activeTool && (
                <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.2)] z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Tool</span>
                            <span className="text-sm font-bold text-purple-400 capitalize">{activeTool.replace('_', ' ')}</span>
                        </div>
                        <button
                            onClick={() => onSelectTool(null)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-slate-200 font-medium transition-colors border border-slate-700 hover:border-slate-600"
                        >
                            Deselect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

