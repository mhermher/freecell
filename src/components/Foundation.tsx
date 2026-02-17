import React from 'react';
import type { BaseCard, FoundationState } from '../types/game';
import { Card } from './Card';

interface FoundationProps {
    foundation: FoundationState;
    onCardClick: (index: number) => void;
    highlightedIndices?: number[];
}

export const Foundation: React.FC<FoundationProps> = ({ foundation, onCardClick, highlightedIndices = [] }) => {
    return (
        <div style={{ display: 'flex', gap: 'var(--card-gap)' }}>
            {foundation.map(([suit, rank], index) => {
                let topCard: BaseCard | null = null;
                if (rank > 0) {
                    topCard = {
                        suit,
                        rank: rank as any, // Cast to Rank type
                        color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                        id: `${suit}-${rank}`
                    };
                }

                return (
                    <div
                        key={suit}
                        onClick={() => onCardClick(index)}
                        style={{
                            width: 'var(--card-width)',
                            height: 'var(--card-height)',
                            border: 'var(--placeholder-border)',
                            borderRadius: '0.5rem',
                            backgroundColor: 'var(--placeholder-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            boxSizing: 'border-box',
                            boxShadow: highlightedIndices.includes(index) ? '0 0 10px 4px rgba(74, 222, 128, 0.8)' : 'none', // Green glow
                            transition: 'box-shadow 0.2s'
                        }}>
                        {topCard ? (
                            <Card card={{ ...topCard, movable: false }} />
                        ) : (
                            <span style={{ fontSize: '2rem', opacity: 0.3, color: 'white' }}>
                                {(suit === 'hearts' || suit === 'diamonds') ? '♥' : '♣'}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
