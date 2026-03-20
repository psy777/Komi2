import { useState, useEffect, useRef, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StoneColor, BoardState, GameTree, GameNode, ChatMessage, Coordinate } from '../types';
import { playMove } from '../utils/goLogic';
import { summarizeCommentary } from '../services/geminiService';
import { parseSGF, generateSGF } from '../utils/sgfParser';

import Board from '@sabaki/go-board';
import * as deadstones from '@sabaki/deadstones';

deadstones.useFetch('/deadstones_bg.wasm');

export function useGameState() {
    const [gameTree, setGameTree] = useState<GameTree>(() => {
        const rootId = uuidv4();
        return {
            nodes: {
                [rootId]: { id: rootId, parentId: null, childrenIds: [], properties: {}, chatHistory: [] }
            },
            rootId,
            currentId: rootId,
        };
    });

    const [boardState, setBoardState] = useState<BoardState>(() => {
        const initialBoard = Board.fromDimensions(19);
        return {
            board: initialBoard,
            grid: initialBoard.signMap as (0 | 1 | -1)[][],
            captures: { B: 0, W: 0 },
            lastMove: null,
            koPoint: null,
        };
    });

    const [currentPlayer, setCurrentPlayer] = useState<StoneColor>(StoneColor.BLACK);
    const [interactionToSummarize, setInteractionToSummarize] = useState<{ nodeId: string, question: string, answer: string } | null>(null);

    const rootNode = gameTree.nodes[gameTree.rootId];
    const blackPlayer = rootNode.properties['PB'] || 'Black';
    const whitePlayer = rootNode.properties['PW'] || 'White';
    const blackRank = rootNode.properties['BR'] || '';
    const whiteRank = rootNode.properties['WR'] || '';
    const gameResult = rootNode.properties['RE'] || '?';

    const komiString = rootNode.properties['KM'] || '6.5';
    let parsedKomi = parseFloat(komiString);
    if (isNaN(parsedKomi)) parsedKomi = 6.5;
    const komi = parsedKomi;

    const currentDepth = useMemo(() => {
        let depth = 0;
        let ptr = gameTree.currentId;
        while (gameTree.nodes[ptr]?.parentId) {
            depth++;
            ptr = gameTree.nodes[ptr].parentId!;
        }
        return depth;
    }, [gameTree, gameTree.currentId]);

    useEffect(() => {
        const replayGame = () => {
            const initialBoard = Board.fromDimensions(19);
            let tempState: BoardState = {
                board: initialBoard,
                grid: initialBoard.signMap as (0 | 1 | -1)[][],
                captures: { B: 0, W: 0 },
                lastMove: null,
                koPoint: null,
            };

            const path: string[] = [];
            let ptr = gameTree.currentId;
            while (ptr) {
                path.unshift(ptr);
                ptr = gameTree.nodes[ptr].parentId!;
            }

            for (const nodeId of path) {
                const node = gameTree.nodes[nodeId];

                // 1. Process explicit moves
                if (node.move) {
                    const result = playMove(tempState, node.move.x, node.move.y, node.move.color);
                    if (result.valid) {
                        tempState = result.newState;
                    }
                }

                // 2. Process Setup Stones
                const applySetupStones = (propKey: string, color: StoneColor) => {
                    const prop = node.properties[propKey];
                    if (prop) {
                        const coords = prop.split(',');
                        let tempBoard = tempState.board;
                        coords.forEach(c => {
                            if (c.length === 2) {
                                const x = c.charCodeAt(0) - 97;
                                const y = c.charCodeAt(1) - 97;
                                // Directly modify board for setup stones, skipping legal checks
                                const sign = color === StoneColor.BLACK ? 1 : (color === StoneColor.WHITE ? -1 : 0);
                                tempBoard = tempBoard.set([x, y], sign);
                            }
                        });

                        tempState = {
                            ...tempState,
                            board: tempBoard,
                            grid: tempBoard.signMap as (0 | 1 | -1)[][]
                        };
                    }
                };

                applySetupStones('AB', StoneColor.BLACK);
                applySetupStones('AW', StoneColor.WHITE);
                applySetupStones('AE', StoneColor.EMPTY);
            }

            setBoardState(tempState);

            const currentNode = gameTree.nodes[gameTree.currentId];
            if (currentNode.move) {
                setCurrentPlayer(currentNode.move.color === StoneColor.BLACK ? StoneColor.WHITE : StoneColor.BLACK);
            } else {
                setCurrentPlayer(StoneColor.BLACK);
                if (currentNode.parentId) {
                    const p = gameTree.nodes[currentNode.parentId];
                    if (p.move && p.move.color === StoneColor.BLACK) setCurrentPlayer(StoneColor.WHITE);
                }
            }
        };
        replayGame();
    }, [gameTree, gameTree.currentId]);

    useEffect(() => {
        if (interactionToSummarize && interactionToSummarize.nodeId !== gameTree.currentId) {
            const { nodeId, question, answer } = interactionToSummarize;
            summarizeCommentary(question, answer).then(summary => {
                if (!summary) return;
                setGameTree(prev => {
                    const node = prev.nodes[nodeId];
                    if (!node) return prev;
                    const newComment = node.comment
                        ? `${node.comment}\n\n[AI Summary]: ${summary}`
                        : `[AI Summary]: ${summary}`;
                    return {
                        ...prev,
                        nodes: { ...prev.nodes, [nodeId]: { ...node, comment: newComment } }
                    };
                });
            });
            setInteractionToSummarize(null);
        }
    }, [gameTree.currentId, interactionToSummarize]);

    const [drawStartPoint, setDrawStartPoint] = useState<Coordinate | null>(null);

    const handleEditIntersectionClick = (x: number, y: number, tool: string) => {
        const charX = String.fromCharCode(x + 97);
        const charY = String.fromCharCode(y + 97);
        const coord = `${charX}${charY}`;

        if (tool === 'paint' || tool === 'heat') {
            const targetProp = tool === 'paint' ? 'PM' : 'HM';

            setGameTree(prev => {
                const node = prev.nodes[prev.currentId];
                const newProps = { ...node.properties };

                // Properties store a list of coordinate:value pairs. e.g. PM[ab:1,cd:0.5]
                // For simplicity here, each click adds or increments a value, or we just set to 1 for now.
                // An advanced implementation might use shift-click or a slider to determine value. 
                // We will toggle between 0 (remove) and 1 for simplicity of this demo.
                let entries: string[] = [];
                if (newProps[targetProp]) entries = newProps[targetProp].split(',');

                const prefix = `${coord}:`;
                const existingIdx = entries.findIndex(e => e.startsWith(prefix));

                if (existingIdx >= 0) {
                    // Toggle Off
                    entries.splice(existingIdx, 1);
                } else {
                    // Toggle On (value 1)
                    entries.push(`${coord}:1`);
                }

                if (entries.length > 0) {
                    newProps[targetProp] = entries.join(',');
                } else {
                    delete newProps[targetProp];
                }

                return {
                    ...prev,
                    nodes: {
                        ...prev.nodes,
                        [prev.currentId]: { ...node, properties: newProps }
                    }
                };
            });

            setDrawStartPoint(null);
            return;
        }

        if (tool === 'line' || tool === 'arrow') {
            if (!drawStartPoint) {
                setDrawStartPoint({ x, y });
                return;
            }

            // Second click, complete line/arrow
            const startCharX = String.fromCharCode(drawStartPoint.x + 97);
            const startCharY = String.fromCharCode(drawStartPoint.y + 97);
            const startCoord = `${startCharX}${startCharY}`;

            // Format is LN[ab:cd] or AR[ab:cd]
            const lineProp = `${startCoord}:${coord}`;
            const targetProp = tool === 'line' ? 'LN' : 'AR';

            setGameTree(prev => {
                const node = prev.nodes[prev.currentId];
                const newProps = { ...node.properties };

                if (newProps[targetProp]) {
                    // Check if already exists to remove, or add
                    if (newProps[targetProp].includes(lineProp)) {
                        const arr = newProps[targetProp].split(',').filter(c => c !== lineProp);
                        if (arr.length > 0) newProps[targetProp] = arr.join(',');
                        else delete newProps[targetProp];
                    } else {
                        newProps[targetProp] += `,${lineProp}`;
                    }
                } else {
                    newProps[targetProp] = lineProp;
                }

                return {
                    ...prev,
                    nodes: {
                        ...prev.nodes,
                        [prev.currentId]: { ...node, properties: newProps }
                    }
                };
            });

            setDrawStartPoint(null);
            return;
        }

        // Reset draw state if another tool is used
        setDrawStartPoint(null);

        let customLabelText = '';
        if (tool === 'marker_label') {
            const promptResult = window.prompt('Enter custom label (max 8 characters):');
            if (promptResult === null || promptResult.trim() === '') return;
            customLabelText = promptResult.trim().substring(0, 8);
        }

        setGameTree(prev => {
            const node = prev.nodes[prev.currentId];
            const newProps = { ...node.properties };

            // Determine which property to update
            let targetProp = '';
            if (tool === 'stone_black') targetProp = 'AB';
            else if (tool === 'stone_white') targetProp = 'AW';
            else if (tool === 'stone_clear') targetProp = 'AE';
            else if (tool === 'marker_triangle') targetProp = 'TR';
            else if (tool === 'marker_circle') targetProp = 'CR';
            else if (tool === 'marker_square') targetProp = 'SQ';
            else if (tool === 'marker_cross') targetProp = 'MA';
            else if (tool === 'marker_label' || tool === 'marker_alpha' || tool === 'marker_number') targetProp = 'LB'; // Usually label needs text, we map simple coordinate for now
            else if (tool === 'marker_clear') {
                // Remove from all marker props
                ['TR', 'CR', 'SQ', 'MA', 'LB'].forEach(p => {
                    if (newProps[p]) {
                        const arr = newProps[p].split(',').filter(c => !c.startsWith(coord));
                        if (arr.length > 0) newProps[p] = arr.join(',');
                        else delete newProps[p];
                    }
                });
                return { ...prev, nodes: { ...prev.nodes, [prev.currentId]: { ...node, properties: newProps } } };
            }

            if (tool === 'stone_black' || tool === 'stone_white' || tool === 'stone_clear') {
                const wasInTarget = newProps[targetProp] && newProps[targetProp].includes(coord);

                // Remove securely from AB, AW, AE since they are mutually exclusive
                ['AB', 'AW', 'AE'].forEach(p => {
                    if (newProps[p]) {
                        const arr = newProps[p].split(',').filter(c => !c.startsWith(coord));
                        if (arr.length > 0) newProps[p] = arr.join(',');
                        else delete newProps[p];
                    }
                });

                let sign: 1 | 0 | -1 = 0;
                if (!wasInTarget) {
                    if (newProps[targetProp]) {
                        newProps[targetProp] += `,${coord}`;
                    } else {
                        newProps[targetProp] = coord;
                    }
                    if (tool === 'stone_black') sign = 1;
                    else if (tool === 'stone_white') sign = -1;
                }

                const updatedBoard = boardState.board.set([x, y], sign);
                setBoardState(prevBoard => ({
                    ...prevBoard,
                    board: updatedBoard,
                    grid: updatedBoard.signMap as (0 | 1 | -1)[][]
                }));

            } else if (targetProp) {
                // If the coordinate is already in this property, remove it (toggle)
                if (newProps[targetProp] && newProps[targetProp].includes(coord)) {
                    const arr = newProps[targetProp].split(',').filter(c => !c.startsWith(coord));
                    if (arr.length > 0) newProps[targetProp] = arr.join(',');
                    else delete newProps[targetProp];
                } else {
                    let newCoordString = coord;
                    if (targetProp === 'LB') {
                        let labelText = 'A';
                        if (tool === 'marker_alpha') {
                            const currentLabels = newProps['LB'] ? newProps['LB'].split(',') : [];
                            const alphaLabels = currentLabels
                                .map((l: string) => l.split(':')[1])
                                .filter((t: string) => t && /^[A-Za-z]$/.test(t));
                            if (alphaLabels.length > 0) {
                                const maxCode = Math.max(...alphaLabels.map((a: string) => a.toUpperCase().charCodeAt(0)));
                                labelText = String.fromCharCode(maxCode + 1);
                                if (labelText > 'Z') labelText = 'A';
                            } else {
                                labelText = 'A';
                            }
                        } else if (tool === 'marker_number') {
                            const currentLabels = newProps['LB'] ? newProps['LB'].split(',') : [];
                            const numLabels = currentLabels
                                .map((l: string) => parseInt(l.split(':')[1], 10))
                                .filter((n: number) => !isNaN(n));
                            labelText = numLabels.length > 0 ? (Math.max(...numLabels) + 1).toString() : '1';
                        } else if (tool === 'marker_label') {
                            labelText = customLabelText;
                        }
                        newCoordString = `${coord}:${labelText}`;
                    }

                    if (newProps[targetProp]) {
                        newProps[targetProp] += `,${newCoordString}`;
                    } else {
                        newProps[targetProp] = newCoordString;
                    }
                }
            }

            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [prev.currentId]: {
                        ...node,
                        properties: newProps
                    }
                }
            };
        });
    };

    const handleIntersectionClick = (x: number, y: number) => {
        const currentNode = gameTree.nodes[gameTree.currentId];
        const existingChildId = currentNode.childrenIds.find(childId => {
            const child = gameTree.nodes[childId];
            return child.move && child.move.x === x && child.move.y === y && child.move.color === currentPlayer;
        });

        if (existingChildId) {
            setGameTree(prev => ({ ...prev, currentId: existingChildId }));
            return;
        }

        const result = playMove(boardState, x, y, currentPlayer);
        if (!result.valid) return;

        const newNodeId = uuidv4();
        const newNode: GameNode = {
            id: newNodeId,
            parentId: gameTree.currentId,
            childrenIds: [],
            move: { color: currentPlayer, x, y },
            properties: {},
            chatHistory: [],
        };

        setGameTree(prev => {
            const parent = prev.nodes[prev.currentId];
            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [prev.currentId]: {
                        ...parent,
                        childrenIds: [...parent.childrenIds, newNodeId],
                    },
                    [newNodeId]: newNode,
                },
                currentId: newNodeId,
            };
        });
    };

    const handleFirst = () => setGameTree(prev => ({ ...prev, currentId: prev.rootId }));
    const handlePrev = () => {
        const current = gameTree.nodes[gameTree.currentId];
        if (current.parentId) setGameTree(prev => ({ ...prev, currentId: current.parentId! }));
    };
    const handleNext = (childIndex: number = 0) => {
        const current = gameTree.nodes[gameTree.currentId];
        if (current.childrenIds.length > 0) {
            const targetId = current.childrenIds[childIndex] || current.childrenIds[0];
            setGameTree(prev => ({ ...prev, currentId: targetId }));
        }
    };
    const handleUndo = () => {
        setGameTree(prev => {
            const current = prev.nodes[prev.currentId];
            if (!current.parentId) return prev;

            const parent = prev.nodes[current.parentId];
            const newChildrenIds = parent.childrenIds.filter(id => id !== prev.currentId);

            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [current.parentId]: {
                        ...parent,
                        childrenIds: newChildrenIds
                    }
                },
                currentId: current.parentId
            };
        });
    };
    const handleLast = () => {
        let ptr = gameTree.currentId;
        while (true) {
            const node = gameTree.nodes[ptr];
            if (node.childrenIds.length === 0) break;
            ptr = node.childrenIds[0];
        }
        setGameTree(prev => ({ ...prev, currentId: ptr }));
    };

    const handleJumpToMove = (targetMove: number) => {
        if (isNaN(targetMove) || targetMove < 0) return;
        const path: string[] = [];
        let currId: string | null = gameTree.currentId;
        while (currId) {
            path.unshift(currId);
            currId = gameTree.nodes[currId].parentId;
        }
        if (targetMove < path.length) {
            setGameTree(prev => ({ ...prev, currentId: path[targetMove] }));
            return;
        }
        let ptr = gameTree.currentId;
        let currentDepthPtr = path.length - 1;
        while (currentDepthPtr < targetMove) {
            const node = gameTree.nodes[ptr];
            if (node.childrenIds.length === 0) break;
            ptr = node.childrenIds[0];
            currentDepthPtr++;
        }
        setGameTree(prev => ({ ...prev, currentId: ptr }));
    };

    const handleChatUpdate = (nodeId: string, newHistory: ChatMessage[]) => {
        setGameTree(prev => ({
            ...prev,
            nodes: { ...prev.nodes, [nodeId]: { ...prev.nodes[nodeId], chatHistory: newHistory } }
        }));
    };

    const handleInteractionComplete = (nodeId: string, question: string, answer: string) => {
        setInteractionToSummarize({ nodeId, question, answer });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) setGameTree(parseSGF(content));
        };
        reader.readAsText(file);
    };

    const handleSaveSGF = () => {
        const sgf = generateSGF(gameTree);
        const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'game.sgf';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearAllChanges = () => {
        setGameTree(prev => {
            const node = prev.nodes[prev.currentId];
            const newProps = { ...node.properties };
            ['AB', 'AW', 'AE', 'TR', 'CR', 'SQ', 'MA', 'LB', 'LN', 'AR', 'DD', 'PM', 'HM'].forEach(p => delete newProps[p]);
            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [prev.currentId]: {
                        ...node,
                        properties: newProps
                    }
                }
            };
        });
    };

    const handleNewGame = () => {
        if (window.confirm("Are you sure you want to start a new game? Any unsaved progress will be lost.")) {
            const rootId = uuidv4();
            setGameTree({
                nodes: {
                    [rootId]: { id: rootId, parentId: null, childrenIds: [], properties: {}, chatHistory: [] }
                },
                rootId,
                currentId: rootId,
            });
        }
    };

    const handleMarkDeadStones = async () => {
        // High iterations improve the Monte Carlo simulation's ability to find eyes.
        const dead = await deadstones.guess(boardState.grid, { finished: false, iterations: 2000 });

        setGameTree(prev => {
            const node = prev.nodes[prev.currentId];
            const newProps = { ...node.properties };

            const coords = dead.map(([x, y]: [number, number]) => {
                const charX = String.fromCharCode(x + 97);
                const charY = String.fromCharCode(y + 97);
                return `${charX}${charY}`;
            });

            if (coords.length > 0) {
                newProps['DD'] = coords.join(',');
            } else {
                delete newProps['DD'];
            }

            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [prev.currentId]: {
                        ...node,
                        properties: newProps
                    }
                }
            };
        });
    };

    return {
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
    };
}
