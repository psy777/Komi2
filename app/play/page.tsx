"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaInfoCircle, FaChevronDown, FaChevronUp, FaCommentAlt, FaEdit, FaCog, FaCircle, FaSquare, FaPlay, FaPaintBrush, FaFire, FaTimes, FaFont, FaArrowRight, FaRuler, FaEye, FaPaintRoller } from 'react-icons/fa';
import { GoCircle, GoTriangleUp } from 'react-icons/go';
import { RxValueNone } from 'react-icons/rx';
import { CgScrollV } from 'react-icons/cg';
import ShudanBoard from '../../components/ShudanBoard';
import GeminiChat from '../../components/GeminiChat';
import Header from '../../components/Header';
import GameStatsOverlay from '../../components/GameStatsOverlay';
import GameControls from '../../components/GameControls';
import TabsHeader from '../../components/TabsHeader';
import EditView, { EditTool } from '../../components/EditView';
import SettingsView from '../../components/SettingsView';
import { useGameState } from '../../hooks/useGameState';
import { fromSgfCoordinate } from '../../utils/goLogic';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuLabel
} from "../../components/ui/context-menu";

export default function Home() {
    const {
        gameTree,
        boardState,
        currentPlayer,
        currentDepth,
        blackPlayer,
        whitePlayer,
        blackRank,
        whiteRank,
        gameResult,
        komi,
        handleIntersectionClick,
        handleEditIntersectionClick,
        handleFirst,
        handlePrev,
        handleNext,
        handleUndo,
        handleLast,
        handleJumpToMove,
        handleChatUpdate,
        handleInteractionComplete,
        handleFileUpload,
        handleSaveSGF,
        handleMarkDeadStones,
        handleClearAllChanges,
        handleNewGame,
    } = useGameState();

    const [showStats, setShowStats] = useState(false);
    const [chatExpanded, setChatExpanded] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState('chat');

    // Edit View State
    const [activeTool, setActiveTool] = useState<EditTool | null>(null);
    const [boardSize, setBoardSize] = useState<number>(19);
    const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
    const [isBusy, setIsBusy] = useState<boolean>(false);
    const [fuzzyPlacement, setFuzzyPlacement] = useState<boolean>(false);
    const [animatePlacement, setAnimatePlacement] = useState<boolean>(true);
    const [rangeX, setRangeX] = useState<[number, number]>([0, 18]);
    const [rangeY, setRangeY] = useState<[number, number]>([0, 18]);

    // Handle board size changes reflecting on range
    const handleBoardSizeChange = (newSize: number) => {
        setBoardSize(newSize);
        setRangeX([0, newSize - 1]);
        setRangeY([0, newSize - 1]);
    };

    // Auto-Scroll State
    const [autoScroll, setAutoScroll] = useState<{ active: boolean; originX: number; originY: number; currentY: number } | null>(null);
    const autoScrollRef = useRef<{ active: boolean; originY: number; currentY: number } | null>(null);
    const handlersRef = useRef({ handleNext, handlePrev });

    useEffect(() => {
        handlersRef.current = { handleNext, handlePrev };
    }, [handleNext, handlePrev]);

    useEffect(() => {
        autoScrollRef.current = autoScroll;
    }, [autoScroll]);

    useEffect(() => {
        let lastTime = performance.now();
        let accumulatedDelta = 0;
        let reqId: number;

        const loop = (currentTime: number) => {
            reqId = requestAnimationFrame(loop);
            if (!autoScrollRef.current?.active) return;

            const dt = currentTime - lastTime;
            lastTime = currentTime;

            const { originY, currentY } = autoScrollRef.current;
            const diffY = currentY - originY;

            // Deadzone of 20px
            if (Math.abs(diffY) > 20) {
                // Determine scrolling speed based on distance
                const speedMultiplier = (Math.abs(diffY) - 20) * 0.1; // moves per second
                accumulatedDelta += (speedMultiplier * dt) / 1000;

                if (accumulatedDelta >= 1) {
                    const movesToMake = Math.floor(accumulatedDelta);
                    accumulatedDelta -= movesToMake;

                    if (diffY > 0) {
                        for (let i = 0; i < movesToMake; i++) handlersRef.current.handleNext();
                    } else {
                        for (let i = 0; i < movesToMake; i++) handlersRef.current.handlePrev();
                    }
                }
            } else {
                accumulatedDelta = 0; // Reset accumulation in deadzone
            }
        };

        reqId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(reqId);
    }, []);

    // Global Mouse Handlers for Auto-Scroll
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (autoScrollRef.current?.active) {
                setAutoScroll(prev => prev ? { ...prev, currentY: e.clientY } : null);
            }
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            if (autoScrollRef.current?.active) {
                // If the user clicks middle mouse again, or left clicks, cancel auto-scroll.
                setAutoScroll(null);
            }
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);

    const handleBoardWrapperMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1) { // Middle click
            e.preventDefault();
            setAutoScroll(prev => prev?.active ? null : {
                active: true,
                originX: e.clientX,
                originY: e.clientY,
                currentY: e.clientY
            });
        }
    };

    const handleBoardClick = (x: number, y: number) => {
        if (activeTool) {
            handleEditIntersectionClick(x, y, activeTool);
        } else {
            handleIntersectionClick(x, y);
        }
    };

    useEffect(() => {
        setChatExpanded(typeof window !== 'undefined' && window.innerWidth >= 768);
    }, []);

    const [moveInput, setMoveInput] = useState<string>("0");
    const scrollThrottleRef = useRef<number>(0);

    useEffect(() => {
        setMoveInput(currentDepth.toString());
    }, [currentDepth]);

    const onMoveInputSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleJumpToMove(parseInt(moveInput, 10));
    };

    const onMoveBoxWheel = (e: React.WheelEvent) => {
        const now = Date.now();
        if (now - scrollThrottleRef.current < 50) return;
        scrollThrottleRef.current = now;
        if (e.deltaY > 0) handleNext();
        else if (e.deltaY < 0) handlePrev();
    };

    const currentNode = gameTree.nodes[gameTree.currentId];
    const nextNodes = currentNode.childrenIds.map(id => gameTree.nodes[id]);

    // Compute Markers for Shudan from node properties
    const activeMarkers: { x: number; y: number; type: string }[] = [];
    const activeLines: { v1: [number, number]; v2: [number, number]; type: 'line' | 'arrow' }[] = [];

    if (currentNode && currentNode.properties) {
        const tryAddMarker = (propKey: string, type: string) => {
            if (currentNode.properties[propKey]) {
                const coords = currentNode.properties[propKey].split(',');
                coords.forEach(c => {
                    const parsed = fromSgfCoordinate(c.substring(0, 2));
                    if (parsed) {
                        if (propKey === 'LB') {
                            const label = c.includes(':') ? c.split(':')[1] : 'A';
                            activeMarkers.push({ x: parsed.x, y: parsed.y, type: label });
                        } else {
                            activeMarkers.push({ x: parsed.x, y: parsed.y, type });
                        }
                    }
                });
            }
        };

        tryAddMarker('TR', 'triangle');
        tryAddMarker('CR', 'circle');
        tryAddMarker('SQ', 'square');
        tryAddMarker('MA', 'cross');
        tryAddMarker('LB', 'label');

        // Parse Lines and Arrows
        const tryAddLines = (propKey: string, type: 'line' | 'arrow') => {
            if (currentNode.properties[propKey]) {
                const pairs = currentNode.properties[propKey].split(',');
                pairs.forEach(p => {
                    const parts = p.split(':');
                    if (parts.length === 2) {
                        const start = fromSgfCoordinate(parts[0]);
                        const end = fromSgfCoordinate(parts[1]);
                        if (start && end) {
                            activeLines.push({
                                v1: [start.x, start.y],
                                v2: [end.x, end.y],
                                type: type
                            });
                        }
                    }
                });
            }
        };
        tryAddLines('LN', 'line');
        tryAddLines('AR', 'arrow');
    }

    const activeDimmedCoordinates: { x: number; y: number }[] = [];
    if (currentNode && currentNode.properties && currentNode.properties['DD']) {
        const coords = currentNode.properties['DD'].split(',');
        coords.forEach(c => {
            const parsed = fromSgfCoordinate(c.substring(0, 2));
            if (parsed) activeDimmedCoordinates.push(parsed);
        });
    }

    // Maps: Shudan expects flat arrays or a function. Let's use custom SGF properties:
    // PM[x:y:val] = Paint Map
    // HM[x:y:val] = Heat Map
    const paintMapArr = Array(19 * 19).fill(0);
    const heatMapArr = Array(19 * 19).fill(0);

    if (currentNode && currentNode.properties) {
        const tryParseMap = (propKey: string, arr: number[]) => {
            if (currentNode.properties[propKey]) {
                const entries = currentNode.properties[propKey].split(',');
                entries.forEach(e => {
                    const parts = e.split(':');
                    if (parts.length === 3) {
                        const parsed = fromSgfCoordinate(parts[0] + parts[1]);
                        if (parsed) {
                            const val = parseFloat(parts[2]);
                            if (!isNaN(val)) {
                                arr[parsed.y * 19 + parsed.x] = val;
                            }
                        }
                    }
                });
            }
        };

        tryParseMap('PM', paintMapArr);
        tryParseMap('HM', heatMapArr);
    }

    // Convert 1D back to 2D for Shudan.
    // Shudan expects (number | null)[][] for paintMap
    // and ({ strength: number } | null)[][] for heatMap
    const create2DMap = <T,>(
        arr: number[],
        transform: (val: number) => T | null
    ): (T | null)[][] | undefined => {
        if (!arr.some(v => v !== 0)) return undefined;
        const map2D: (T | null)[][] = [];
        for (let y = 0; y < 19; y++) {
            const row: (T | null)[] = [];
            for (let x = 0; x < 19; x++) {
                row.push(transform(arr[y * 19 + x]));
            }
            map2D.push(row);
        }
        return map2D;
    };

    const paintMapObj = create2DMap(paintMapArr, val => val !== 0 ? val : null);
    const heatMapObj = create2DMap(heatMapArr, val => val !== 0 ? { strength: val } : null);

    return (
        <div className="h-[100dvh] bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden relative">

            {showStats && (
                <GameStatsOverlay
                    onClose={() => setShowStats(false)}
                    blackPlayer={blackPlayer}
                    whitePlayer={whitePlayer}
                    blackRank={blackRank}
                    whiteRank={whiteRank}
                    captures={boardState.captures}
                    komi={komi}
                    gameResult={gameResult}
                    currentPlayer={currentPlayer}
                />
            )}

            <Header
                onFileUpload={handleFileUpload}
                onSaveSGF={handleSaveSGF}
            />

            {/* Main Layout */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950 relative">

                {/* Left Panel: Board (Seamless wood surface integration) */}
                <ContextMenu>
                    <ContextMenuTrigger asChild>
                        <div
                            className="flex-1 min-w-0 min-h-0 relative flex items-center justify-center overflow-hidden p-0"
                            onWheel={onMoveBoxWheel}
                            onMouseDown={handleBoardWrapperMouseDown}
                        >
                            {autoScroll?.active && (
                                <div
                                    className="fixed z-50 pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full border border-slate-600 shadow-xl"
                                    style={{
                                        left: autoScroll.originX - 16,
                                        top: autoScroll.originY - 16,
                                        width: 32,
                                        height: 32
                                    }}
                                >
                                    <CgScrollV className="text-white text-xl animate-pulse" />
                                </div>
                            )}
                            <div className="w-full h-full max-w-full max-h-full flex flex-col">
                                <ShudanBoard
                                    grid={boardState.grid}
                                    lastMove={boardState.lastMove}
                                    onIntersectionClick={handleBoardClick}
                                    showCoordinates={showCoordinates}
                                    busy={isBusy}
                                    fuzzyStonePlacement={fuzzyPlacement}
                                    animateStonePlacement={animatePlacement}
                                    rangeX={rangeX}
                                    rangeY={rangeY}
                                    markers={activeMarkers}
                                    lines={activeLines}
                                    dimmedCoordinates={activeDimmedCoordinates.length > 0 ? activeDimmedCoordinates : undefined}
                                    paintMap={paintMapObj}
                                    heatMap={heatMapObj}
                                />
                            </div>
                        </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-64 bg-slate-900 border-slate-800 text-slate-100">
                        <ContextMenuItem onClick={() => { }} disabled className="focus:bg-slate-800 text-slate-300 font-semibold mb-1 pointer-events-none opacity-50">
                            Select Mode
                        </ContextMenuItem>

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                <FaEye className="mr-2 text-slate-400" /> View
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 bg-slate-900 border-slate-800 text-slate-100">
                                <ContextMenuItem onClick={() => setShowCoordinates(!showCoordinates)} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                    {showCoordinates ? "Hide Coordinates" : "Show Coordinates"}
                                </ContextMenuItem>
                                <ContextMenuItem onClick={() => setFuzzyPlacement(!fuzzyPlacement)} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                    {fuzzyPlacement ? "Disable Fuzzy Placement" : "Enable Fuzzy Placement"}
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSeparator className="bg-slate-800" />

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                <FaCircle className="mr-2 text-slate-400" /> Place Stones
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 bg-slate-900 border-slate-800 text-slate-100">
                                <ContextMenuRadioGroup value={activeTool || ""} onValueChange={(val) => setActiveTool(val === activeTool ? null : val as EditTool)}>
                                    <ContextMenuRadioItem value="stone_black" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'stone_black' ? null : 'stone_black'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaCircle className="text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)] min-w-[14px]" /> Black Stones
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="stone_white" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'stone_white' ? null : 'stone_white'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaCircle className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] min-w-[14px]" /> White Stones
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="stone_clear" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'stone_clear' ? null : 'stone_clear'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <RxValueNone className="min-w-[14px]" /> Remove Stones
                                    </ContextMenuRadioItem>
                                </ContextMenuRadioGroup>
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                <GoTriangleUp className="mr-2 text-slate-400" /> Place Markers
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 bg-slate-900 border-slate-800 text-slate-100">
                                <ContextMenuRadioGroup value={activeTool || ""} onValueChange={(val) => setActiveTool(val === activeTool ? null : val as EditTool)}>
                                    <ContextMenuRadioItem value="marker_triangle" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_triangle' ? null : 'marker_triangle'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <GoTriangleUp className="min-w-[14px]" /> Triangle Marks
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="marker_square" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_square' ? null : 'marker_square'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaSquare className="min-w-[14px]" /> Square Marks
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="marker_circle" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_circle' ? null : 'marker_circle'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <GoCircle className="min-w-[14px]" /> Circle Marks
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="marker_cross" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_cross' ? null : 'marker_cross'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaTimes className="min-w-[14px]" /> Cross Marks
                                    </ContextMenuRadioItem>
                                </ContextMenuRadioGroup>
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                <FaFont className="mr-2 text-slate-400" /> Place Labels
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 bg-slate-900 border-slate-800 text-slate-100">
                                <ContextMenuRadioGroup value={activeTool || ""} onValueChange={(val) => setActiveTool(val === activeTool ? null : val as EditTool)}>
                                    <ContextMenuRadioItem value="marker_alpha" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_alpha' ? null : 'marker_alpha'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaFont className="min-w-[14px]" /> Alphabetical Letters
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="marker_number" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_number' ? null : 'marker_number'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <span className="font-bold min-w-[14px] text-center w-[14px]">1</span> Numerical Numbers
                                    </ContextMenuRadioItem>
                                    <ContextMenuRadioItem value="marker_label" onClick={(e) => { e.preventDefault(); setActiveTool(activeTool === 'marker_label' ? null : 'marker_label'); }} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                        <FaEdit className="min-w-[14px]" /> Custom Label
                                    </ContextMenuRadioItem>
                                </ContextMenuRadioGroup>
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSub>
                            <ContextMenuSubTrigger className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer">
                                <FaPaintBrush className="mr-2 text-slate-400" /> Analysis
                            </ContextMenuSubTrigger>
                            <ContextMenuSubContent className="w-48 bg-slate-900 border-slate-800 text-slate-100">
                                <ContextMenuItem onClick={handleMarkDeadStones} className="focus:bg-slate-800 focus:text-slate-100 cursor-pointer flex gap-2">
                                    <FaFire className="text-red-500" /> Mark Dead Stones
                                </ContextMenuItem>
                            </ContextMenuSubContent>
                        </ContextMenuSub>

                        <ContextMenuSeparator className="bg-slate-800" />

                        <ContextMenuItem onClick={() => handleUndo()} disabled={currentDepth === 0} className="focus:bg-slate-800 text-slate-100 focus:text-slate-300 cursor-pointer font-medium pl-8">
                            Undo Move
                        </ContextMenuItem>
                        <ContextMenuItem onClick={handleClearAllChanges} className="focus:bg-slate-800 text-slate-100 focus:text-slate-300 cursor-pointer font-medium pl-8">
                            Clear all Changes
                        </ContextMenuItem>
                        <ContextMenuItem onClick={handleNewGame} className="focus:bg-slate-800 text-slate-100 focus:text-slate-300 cursor-pointer font-medium pl-8">
                            New Game
                        </ContextMenuItem>
                        <ContextMenuItem onClick={handleSaveSGF} className="focus:bg-slate-800 text-slate-100 focus:text-slate-300 cursor-pointer font-medium pl-8">
                            Save Game
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>

                {/* Sidebar Docked Layout */}
                <div className="w-full md:w-[400px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 z-20 h-auto md:h-full overflow-hidden">

                    {/* Sidebar Tabs Header */}
                    <TabsHeader
                        tabs={[
                            { id: 'chat', label: 'Chat', icon: FaCommentAlt },
                            { id: 'edit', label: 'Edit', icon: FaEdit },
                            { id: 'settings', label: 'Settings', icon: FaCog }
                        ]}
                        activeTab={activeSidebarTab}
                        onTabChange={setActiveSidebarTab}
                    />

                    {/* Sidebar Content Area */}
                    <div className={`flex-1 overflow-hidden bg-slate-950/20 flex flex-col transition-all duration-300 ease-in-out ${chatExpanded ? 'h-[250px] md:h-full opacity-100' : 'h-0 opacity-0 md:opacity-100 md:h-full'}`}>
                        <div className={`w-full h-full flex flex-col ${activeSidebarTab === 'chat' ? 'flex-1' : 'hidden'}`}>
                            <GeminiChat
                                currentNodeId={gameTree.currentId}
                                gameTree={gameTree}
                                boardState={boardState}
                                currentPlayer={currentPlayer}
                                komi={komi}
                                messages={currentNode.chatHistory || []}
                                onMessagesUpdate={(msgs) => handleChatUpdate(gameTree.currentId, msgs)}
                                onInteractionComplete={handleInteractionComplete}
                                minimized={!chatExpanded}
                                hideInput={true}
                            />
                        </div>
                        <div className={`w-full h-full flex flex-col ${activeSidebarTab === 'edit' ? 'flex-1' : 'hidden'}`}>
                            <EditView
                                activeTool={activeTool}
                                onSelectTool={setActiveTool}
                                boardSize={boardSize}
                                onBoardSizeChange={handleBoardSizeChange}
                                showCoordinates={showCoordinates}
                                onToggleCoordinates={setShowCoordinates}
                                isBusy={isBusy}
                                onToggleBusy={setIsBusy}
                                fuzzyPlacement={fuzzyPlacement}
                                onToggleFuzzyPlacement={setFuzzyPlacement}
                                animatePlacement={animatePlacement}
                                onToggleAnimatePlacement={setAnimatePlacement}
                                rangeX={rangeX}
                                onRangeXChange={setRangeX}
                                rangeY={rangeY}
                                onRangeYChange={setRangeY}
                            />
                        </div>
                        <div className={`w-full h-full flex flex-col ${activeSidebarTab === 'settings' ? 'flex-1' : 'hidden'}`}>
                            <SettingsView />
                        </div>
                    </div>

                    {/* Bottom Controls Hub */}
                    <div className="bg-slate-900 flex flex-col border-t border-slate-800 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-30 shrink-0">

                        {/* Mobile Expand Button (Above Chatbar) */}
                        <div
                            className="md:hidden flex items-center justify-center h-6 bg-slate-800/50 hover:bg-slate-800 cursor-pointer border-b border-slate-700/30 transition-colors"
                            onClick={() => setChatExpanded(!chatExpanded)}
                        >
                            {chatExpanded ? <FaChevronDown className="text-slate-600 text-[10px]" /> : <FaChevronUp className="text-slate-600 text-[10px]" />}
                        </div>

                        {/* Gemini Chat Input Area */}
                        {activeSidebarTab === 'chat' && (
                            <div className="border-b-0">
                                <GeminiChat
                                    currentNodeId={gameTree.currentId}
                                    gameTree={gameTree}
                                    boardState={boardState}
                                    currentPlayer={currentPlayer}
                                    komi={komi}
                                    messages={currentNode.chatHistory || []}
                                    onMessagesUpdate={(msgs) => handleChatUpdate(gameTree.currentId, msgs)}
                                    onToggleStats={() => setShowStats(!showStats)}
                                    onInteractionComplete={handleInteractionComplete}
                                    showOnlyInput={true}
                                />
                            </div>
                        )}

                        <GameControls
                            onFirst={handleFirst}
                            onPrev={handlePrev}
                            onNext={handleNext}
                            onLast={handleLast}
                            moveInput={moveInput}
                            onMoveInputChange={setMoveInput}
                            onMoveInputSubmit={onMoveInputSubmit}
                            onMoveInputBlur={() => handleJumpToMove(parseInt(moveInput, 10))}
                            onMoveBoxWheel={onMoveBoxWheel}
                            nextNodes={nextNodes}
                        />

                        {/* Micro Footer */}
                        <div className="px-4 py-1.5 border-t border-slate-800 text-[9px] text-slate-600 flex items-center justify-between bg-slate-950/40 shrink-0">
                            <span className="flex items-center gap-1 opacity-50"><FaInfoCircle /> v1.7.5</span>
                            <span className="opacity-40 font-medium">Stone Ghost Analysis Active</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
