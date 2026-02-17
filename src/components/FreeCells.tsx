import React from 'react';
import type { BaseCard, Optional } from '../types/game';
import { Card } from './Card';

interface FreeCellsProps {
    cells: Array<Optional<BaseCard>>;
    onCardClick: (index: number) => void;
    onCardLongPress: (index: number) => void;
    selectedIndex?: { type: 'freecell', index: number };
    highlightedIndices?: number[];
}

export const FreeCells: React.FC<FreeCellsProps> = ({ cells, onCardClick, onCardLongPress, selectedIndex, highlightedIndices = [] }) => {
    return (
        <div style={{ display: 'flex', gap: 'var(--card-gap)' }}>
            {cells.map((card, index) => (
                <div
                    key={index}
                    onClick={() => onCardClick(index)}
                    style={{
                        width: 'var(--card-width)',
                        height: 'var(--card-height)',
                        border: 'var(--placeholder-border)',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--placeholder-bg)',
                        position: 'relative',
                        boxSizing: 'border-box',
                        boxShadow: highlightedIndices.includes(index) ? '0 0 10px 4px rgba(74, 222, 128, 0.8)' : 'none', // Green glow
                        transition: 'box-shadow 0.2s'
                    }}
                >
                    {card && (
                        <Card
                            // Freecell cards move, but they are BaseCard in state. 
                            // In context of UI, they are selectable.
                            // We can hydrate it with 'movable: true' for the prop
                            card={{ ...card, movable: true }}
                            isSelected={selectedIndex?.type === 'freecell' && selectedIndex.index === index}
                            onClick={() => onCardClick(index)}
                            onLongPress={() => onCardLongPress(index)}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
