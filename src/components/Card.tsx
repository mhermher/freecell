import React from 'react';
import type { Card as CardType, Suit } from '../types/game';

interface CardProps {
    card: CardType;
    isSelected?: boolean;
    isAutoMovable?: boolean;
    isShaking?: boolean;
    isTarget?: boolean;
    onClick?: () => void;
    onLongPress?: () => void;
    style?: React.CSSProperties;
}

const SuitIcon: React.FC<{ suit: Suit }> = ({ suit }) => {
    switch (suit) {
        case 'hearts': return <span>♥</span>;
        case 'diamonds': return <span>♦</span>;
        case 'clubs': return <span>♣</span>;
        case 'spades': return <span>♠</span>;
    }
};

const getRankSymbol = (rank: number): string => {
    switch (rank) {
        case 1: return 'A';
        case 11: return 'J';
        case 12: return 'Q';
        case 13: return 'K';
        default: return rank.toString();
    }
};

export const Card: React.FC<CardProps> = ({ card, isSelected, isAutoMovable, isShaking, isTarget, onClick, onLongPress, style }) => {
    const isImmovable = !card.movable;

    // Background Styling
    const backgroundColor = isAutoMovable
        ? '#fef08a' // Golden/Yellow tint for auto-movable
        : isImmovable
            ? '#e2e8f0' // Grey/Slate tint for disabled/immovable
            : 'var(--card-bg)'; // White for standard movable cards

    // Border & Shadow (Simplified)
    const borderColor = '#94a3b8'; // Slate-400 for standard border
    const borderWidth = '1px';

    const boxShadow = isTarget
        ? '0 0 10px 4px rgba(74, 222, 128, 0.8)' // Green glow for target
        : isSelected
            ? 'var(--card-selected-shadow)'
            : 'var(--card-shadow)';

    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = React.useRef(false);

    const handleStart = () => {
        isLongPress.current = false;
        if (onLongPress) {
            timerRef.current = setTimeout(() => {
                isLongPress.current = true;
                onLongPress();
            }, 500);
        }
    };

    const handleEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isLongPress.current) {
            e.stopPropagation();
            return;
        }
        onClick?.();
    };

    return (
        <div
            onClick={handleClick}
            onMouseDown={handleStart}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchEnd={handleEnd}
            style={{
                ...style,
                width: 'var(--card-width)',
                height: 'var(--card-height)',
                backgroundColor: backgroundColor,
                borderRadius: '0.5rem',
                border: `${borderWidth} solid ${borderColor}`,
                boxShadow: boxShadow,
                color: card.color === 'red' ? 'var(--red-suit)' : 'var(--black-suit)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '0.25rem',
                cursor: 'pointer',
                position: 'relative',
                boxSizing: 'border-box',
                animation: isShaking ? 'shake 0.5s' : 'none'
            }}
            className="card-face">
            <style>{`
                @keyframes shake {
                    0% { transform: translate(1px, 1px) rotate(0deg); }
                    10% { transform: translate(-1px, -2px) rotate(-1deg); }
                    20% { transform: translate(-3px, 0px) rotate(1deg); }
                    30% { transform: translate(3px, 2px) rotate(0deg); }
                    40% { transform: translate(1px, -1px) rotate(1deg); }
                    50% { transform: translate(-1px, 2px) rotate(-1deg); }
                    60% { transform: translate(-3px, 1px) rotate(0deg); }
                    70% { transform: translate(3px, 1px) rotate(-1deg); }
                    80% { transform: translate(-1px, -1px) rotate(1deg); }
                    90% { transform: translate(1px, 2px) rotate(0deg); }
                    100% { transform: translate(1px, -2px) rotate(-1deg); }
                }
            `}</style>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span>{getRankSymbol(card.rank)}</span><SuitIcon suit={card.suit} />
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontSize: '2rem', opacity: 0.2
            }}>
                <SuitIcon suit={card.suit} />
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', lineHeight: 1, transform: 'rotate(180deg)' }}>
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <span>{getRankSymbol(card.rank)}</span><SuitIcon suit={card.suit} />
                </div>
            </div>
        </div>
    );
};
