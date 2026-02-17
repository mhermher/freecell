import React from 'react';
import type { Card as CardType } from '../types/game';
import { Card } from './Card';

interface TableauProps {
    tableau: Array<Array<CardType>>;
    autoMovable: Array<string>;
    shakingCard: string | null;
    highlightedDestinations: number[];
    onCardClick: (colIndex: number, cardIndex: number) => void;
    onCardLongPress: (colIndex: number, cardIndex: number) => void;
    selectedCard?: { type: 'tableau', index: number, cardIndex: number };
}

export const Tableau: React.FC<TableauProps> = ({ tableau, autoMovable, shakingCard, highlightedDestinations, onCardClick, onCardLongPress, selectedCard }) => {
    return (
        <div style={{ display: 'flex', gap: 'var(--card-gap)', marginTop: '2rem', justifyContent: 'center' }}>
            {tableau.map((col, colIndex) => (
                <div
                    key={colIndex}
                    style={{
                        width: 'var(--card-width)',
                        minHeight: 'var(--card-height)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        // Highlight empty column if it's a valid destination
                        boxShadow: highlightedDestinations.includes(colIndex) && col.length === 0 ? '0 0 10px 2px rgba(74, 222, 128, 0.6)' : 'none',
                        borderRadius: '0.5rem'
                    }}
                >
                    {col.length === 0 && (
                        <div
                            style={{
                                width: '100%',
                                height: 'var(--card-height)',
                                border: 'var(--placeholder-border)',
                                borderRadius: '0.5rem',
                                backgroundColor: 'var(--placeholder-bg)',
                                position: 'absolute'
                            }}
                            onClick={() => onCardClick(colIndex, -1)}
                        />
                    )}

                    {col.map((card, cardIndex) => (
                        <div
                            key={card.id}
                            style={{
                                marginTop: cardIndex === 0 ? 0 : 'var(--card-vertical-margin)',
                                zIndex: cardIndex
                            }}
                        >
                            <Card
                                card={card}
                                onClick={() => onCardClick(colIndex, cardIndex)}
                                onLongPress={() => onCardLongPress(colIndex, cardIndex)}
                                isSelected={selectedCard?.type === 'tableau' && selectedCard.index === colIndex && selectedCard.cardIndex === cardIndex}
                                isAutoMovable={autoMovable.includes(card.id)}
                                isShaking={shakingCard === card.id}
                                isTarget={highlightedDestinations.includes(colIndex) && cardIndex === col.length - 1}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
