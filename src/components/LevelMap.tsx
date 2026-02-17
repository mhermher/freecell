import React, { useEffect, useRef, useState } from 'react';
import { getLevelId, getMaxCompletedDepth, getSeed, parseLevelId } from '../logic/levels';

interface LevelMapProps {
    completedLevels: string[];
    levelScores: Record<string, number>;
    onSelectLevel: (levelId: string) => void;
}

export const LevelMap: React.FC<LevelMapProps> = ({ completedLevels, levelScores, onSelectLevel }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const maxDepth = getMaxCompletedDepth(completedLevels);
    // Show up to the next layer + some buffer
    const renderDepth = maxDepth + 2;

    // State for drag-to-pan
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startOffset, setStartOffset] = useState(0);

    const NODE_SIZE = 50;
    const LAYER_HEIGHT = 120;
    const LEFT_X = '30%';
    const RIGHT_X = '70%';

    // Initial scroll to bottom (latest levels)
    useEffect(() => {
        // Center the viewport on the latest unlocked level
        // Viewport height
        const vh = window.innerHeight;
        // Target Y (latest level)
        const targetY = maxDepth * LAYER_HEIGHT;
        // We want targetY to be somewhat near the middle/bottom, not off screen
        // Initial offset should be negative to scroll down
        // -targetY + vh/2
        const initialOffset = -Math.max(0, targetY - vh / 2);
        setOffsetY(initialOffset);
    }, [maxDepth]);

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setStartY(y);
        setStartOffset(offsetY);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const deltaY = y - startY;
        setOffsetY(startOffset + deltaY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        setOffsetY(prev => prev - e.deltaY);
    };

    const layers = [];
    for (let i = 0; i <= renderDepth; i++) {
        layers.push(i);
    }

    return (
        <div
            ref={containerRef}
            style={{
                width: '100vw',
                height: '100vh',
                backgroundColor: '#1e293b', // Darker background
                overflow: 'hidden',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none', // Prevent browser scroll
                userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '1rem',
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                color: '#f8fafc',
                zIndex: 100,
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                backdropFilter: 'blur(4px)'
            }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>WORLD MAP</h2>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.25rem' }}>Drag to explore • Depth: {maxDepth}</div>
            </div>

            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${offsetY}px)`,
                willChange: 'transform' // Optimize performance
            }}>
                <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', position: 'relative', height: `${(renderDepth + 1) * LAYER_HEIGHT + 200}px` }}>

                    {/* Connections Layer */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {layers.slice(0, -1).map(depth => {
                            const y1 = depth * LAYER_HEIGHT + 100 + NODE_SIZE / 2;
                            const y2 = (depth + 1) * LAYER_HEIGHT + 100 + NODE_SIZE / 2;

                            const nextUnlocked = (depth === -1) ||
                                completedLevels.includes(getLevelId(depth, 'left')) ||
                                completedLevels.includes(getLevelId(depth, 'right'));

                            const strokeColor = nextUnlocked ? "#3b82f6" : "#334155"; // Blue-500 or Slate-700
                            const strokeWidth = nextUnlocked ? 4 : 2;

                            return (
                                <React.Fragment key={depth}>
                                    <line x1={LEFT_X} y1={y1} x2={LEFT_X} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                                    <line x1={LEFT_X} y1={y1} x2={RIGHT_X} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                                    <line x1={RIGHT_X} y1={y1} x2={LEFT_X} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                                    <line x1={RIGHT_X} y1={y1} x2={RIGHT_X} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
                                </React.Fragment>
                            );
                        })}
                    </svg>

                    {/* Nodes Layer */}
                    {layers.map(depth => {
                        const leftId = getLevelId(depth, 'left');
                        const rightId = getLevelId(depth, 'right');

                        const leftCompleted = completedLevels.includes(leftId);
                        const rightCompleted = completedLevels.includes(rightId);

                        const unlocked = depth === 0 ||
                            completedLevels.includes(getLevelId(depth - 1, 'left')) ||
                            completedLevels.includes(getLevelId(depth - 1, 'right'));

                        const renderNode = (id: string, completed: boolean, x: string) => {
                            const score = levelScores[id];
                            const sides = parseLevelId(id);
                            const levelNum = sides ? getSeed(sides.depth, sides.side) : '?';

                            return (
                                <div
                                    key={id}
                                    onClick={() => {
                                        if (unlocked) onSelectLevel(id);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: x,
                                        top: `${depth * LAYER_HEIGHT + 100}px`,
                                        marginLeft: `-${NODE_SIZE / 2}px`,
                                        width: `${NODE_SIZE}px`,
                                        height: `${NODE_SIZE}px`,
                                        borderRadius: '50%',
                                        backgroundColor: completed ? '#fbbf24' : unlocked ? '#3b82f6' : '#1e293b',
                                        border: completed ? '4px solid #f59e0b' : unlocked ? '4px solid #60a5fa' : '4px solid #334155',
                                        boxShadow: unlocked ? '0 0 15px rgba(59, 130, 246, 0.5)' : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: unlocked ? 'pointer' : 'default',
                                        fontWeight: 'bold',
                                        color: unlocked || completed ? 'white' : '#475569',
                                        zIndex: 10,
                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (unlocked) {
                                            e.currentTarget.style.transform = 'scale(1.2)';
                                            e.currentTarget.style.boxShadow = '0 0 25px rgba(59, 130, 246, 0.8)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (unlocked) {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
                                        }
                                    }}
                                >
                                    <div>{levelNum}</div>
                                    {score !== undefined && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-25px',
                                            fontSize: '0.75rem',
                                            backgroundColor: '#1e293b',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid #475569',
                                            color: '#cbd5e1',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            Diff: {score}
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return (
                            <React.Fragment key={depth}>
                                {renderNode(leftId, leftCompleted, LEFT_X)}
                                {renderNode(rightId, rightCompleted, RIGHT_X)}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
