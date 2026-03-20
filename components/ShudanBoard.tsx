"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { render, h } from 'preact';
import { Goban, Marker, HeatVertex } from '@sabaki/shudan';
import '@sabaki/shudan/css/goban.css';
import { StoneColor, Coordinate } from '../types';

export interface ShudanBoardProps {
    grid: (0 | 1 | -1)[][];
    lastMove?: Coordinate | null;
    onIntersectionClick?: (x: number, y: number) => void;
    // Markers can be an array of objects specifying coordinate and type
    markers?: { x: number; y: number; type: 'circle' | 'square' | 'triangle' | 'cross' | string }[];
    // Heatmap for AI evaluations: 2D array of HeatVertex
    heatMap?: (HeatVertex | null)[][];
    dimmedCoordinates?: Coordinate[];
    showCoordinates?: boolean;
    // Advanced Edit Props
    busy?: boolean;
    fuzzyStonePlacement?: boolean;
    animateStonePlacement?: boolean;
    rangeX?: [number, number];
    rangeY?: [number, number];
    lines?: { v1: [number, number]; v2: [number, number]; type: 'line' | 'arrow' }[];
    paintMap?: (number | null)[][]; // -1, 0, or 1
    ghostStoneMap?: ({ sign: number; type?: string; faint?: boolean } | null)[][];
}

const ShudanBoard: React.FC<ShudanBoardProps> = ({
    grid,
    lastMove,
    onIntersectionClick,
    markers = [],
    heatMap,
    dimmedCoordinates,
    showCoordinates = true,
    busy = false,
    fuzzyStonePlacement = false,
    animateStonePlacement = true,
    rangeX,
    rangeY,
    lines = [],
    paintMap,
    ghostStoneMap
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [vertexSize, setVertexSize] = React.useState(24);

    // Convert our internal `StoneColor` grid to Shudan's `signMap`
    // Shudan expects: 1 (Black), -1 (White), 0 (Empty)
    const signMap = grid;

    // Convert markers to Shudan's `markerMap`
    const markerMap = useMemo(() => {
        if (markers.length === 0 && !lastMove) return undefined;

        // Create an empty map matching the grid size
        const map: (Marker | null)[][] = grid.map(row => row.map(() => null));

        // Apply last move marker
        if (lastMove) {
            map[lastMove.y][lastMove.x] = { type: 'circle' };
        }

        // Apply custom markers
        markers.forEach(m => {
            // Shudan built-in types: circle, square, triangle, cross
            const isBuiltIn = ['circle', 'square', 'triangle', 'cross'].includes(m.type);
            if (isBuiltIn) {
                map[m.y][m.x] = { type: m.type as Marker['type'] };
            } else {
                map[m.y][m.x] = { type: 'label', label: m.type };
            }
        });

        return map;
    }, [grid, markers, lastMove]);

    // Convert dimmed coordinates
    const dimmedVertices = useMemo(() => {
        if (!dimmedCoordinates) return undefined;
        return dimmedCoordinates.map(c => [c.x, c.y] as [number, number]);
    }, [dimmedCoordinates]);

    // Handle intersection click mapped from Shudan's 
    const handleVertexClick = useMemo(() => {
        return (evt: any, [x, y]: [number, number]) => {
            if (onIntersectionClick) {
                onIntersectionClick(x, y);
            }
        };
    }, [onIntersectionClick]);

    useEffect(() => {
        const handleResize = () => {
            if (!wrapperRef.current || !containerRef.current) return;

            const padding = 32; // p-4 adds 16px padding on all sides, total 32px
            const { clientWidth, clientHeight } = wrapperRef.current;

            // Use rangeX/rangeY for calculating factors if strict slicing applies to bounds,
            // but for rough scaling, we can just use the absolute board size visible.
            const w = rangeX ? rangeX[1] - rangeX[0] + 1 : (grid[0]?.length || 19);
            const h = rangeY ? rangeY[1] - rangeY[0] + 1 : (grid.length || 19);

            const factorX = w + (showCoordinates ? 1.5 : 0);
            const factorY = h + (showCoordinates ? 1.5 : 0);

            const availableWidth = clientWidth - padding;
            const availableHeight = clientHeight - padding;

            const fontSize = Math.min(
                availableWidth / factorX,
                availableHeight / factorY
            );

            // Add a reasonable minimum constraint, but allow it to grow as large as needed
            const finalFontSize = Math.max(Math.floor(fontSize), 10);

            containerRef.current.style.fontSize = `${finalFontSize}px`;
            setVertexSize(finalFontSize);
        };

        const observer = new ResizeObserver(() => {
            window.requestAnimationFrame(handleResize);
        });

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }

        handleResize();

        return () => {
            observer.disconnect();
        };
    }, [grid, showCoordinates, rangeX, rangeY]);

    useEffect(() => {
        if (containerRef.current) {
            const gobanElement = h(Goban as any, {
                vertexSize,
                signMap,
                markerMap,
                heatMap,
                dimmedVertices,
                showCoordinates,
                busy,
                fuzzyStonePlacement,
                animateStonePlacement,
                rangeX,
                rangeY,
                lines,
                paintMap,
                ghostStoneMap,
                onVertexClick: handleVertexClick
            });
            render(gobanElement, containerRef.current);
        }
    }, [
        vertexSize,
        signMap, markerMap, heatMap, dimmedVertices, showCoordinates,
        busy, fuzzyStonePlacement, animateStonePlacement, rangeX, rangeY,
        lines, paintMap, ghostStoneMap, handleVertexClick
    ]);

    return (
        <div ref={wrapperRef} className="w-full h-full flex items-center justify-center p-4">
            <div ref={containerRef}></div>
        </div>
    );
};

export default ShudanBoard;
