import { useEffect, useState } from 'react';
import { initializeGame, isValidMove, executeMove, checkWinCondition, getAutoMoves } from '../logic/freecell';
import { Tableau } from './Tableau';
import { FreeCells } from './FreeCells';
import { Foundation } from './Foundation';
import type { GameState, Move, Optional } from '../types/game';

interface GameProps {
    seed?: number;
    onComplete: (score: number) => void;
    onBack?: () => void;
}

type Selection = (
    { type: 'freecell', index: number } |
    { type: 'tableau', index: number, cardIndex: number } |
    null
);

export const Game: React.FC<GameProps> = ({ seed, onComplete, onBack }) => {
    const [gameState, setGameState] = useState<Optional<GameState>>(null);
    const [selection, setSelection] = useState<Selection>(null);
    const [win, setWin] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);

    const [shakingCard, setShakingCard] = useState<string | null>(null);
    const [highlightedDestinations, setHighlightedDestinations] = useState<number[]>([]);

    const [history, setHistory] = useState<GameState[]>([]);

    useEffect(() => {
        startNewGame();
    }, [seed]); // Restart if seed changes

    // Separate effect for keyboard undo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, gameState]);

    const startNewGame = () => {
        setGameState(initializeGame(seed));
        setSelection(null);
        setWin(false);
        setHasMoved(false);
        setHighlightedDestinations([]);
        setHistory([]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const previousState = history[history.length - 1];
        const newHistory = history.slice(0, -1);
        setGameState(previousState);
        setHistory(newHistory);
        setSelection(null);
        setHighlightedDestinations([]);
    };

    const saveState = () => {
        if (gameState) {
            setHistory(prev => [...prev, gameState]);
        }
    };

    useEffect(() => {
        if (gameState && !win && hasMoved) {
            const moves = getAutoMoves(gameState);
            if (moves.length > 0) {
                const timer = setTimeout(() => {
                    let newState = gameState;
                    for (const move of moves) {
                        newState = executeMove(newState, move);
                    }
                    setGameState(newState);
                    setSelection(null);
                    // Check win only after auto moves complete
                    if (checkWinCondition(newState)) setWin(true);
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState, win, hasMoved]);

    const attemptMove = (target: { type: 'tableau' | 'freecell' | 'foundation', index: number }) => {
        if (!gameState || !selection) return;

        let sourceMove: Move['source'];
        let cardToMove: any;

        if (selection.type === 'freecell') {
            sourceMove = { type: 'freecell', index: selection.index };
            cardToMove = gameState.freecells[selection.index];
        } else {
            sourceMove = { type: 'tableau', index: selection.index };
            const col = gameState.tableau[selection.index];
            cardToMove = col[selection.cardIndex];
        }

        if (!cardToMove) return;

        const move: Move = {
            source: sourceMove,
            target: target,
            card: cardToMove
        };

        if (isValidMove(gameState, move)) {
            saveState();
            const newState = executeMove(gameState, move);
            setGameState(newState);
            setSelection(null);
            setHasMoved(true);
            if (checkWinCondition(newState)) {
                setWin(true);
            }
        } else {
            setSelection(null);
        }
    };

    const findValidTableauMoves = (card: any, sourceIndex: number): number[] => {
        if (!gameState) return [];
        const validCols: number[] = [];
        gameState.tableau.forEach((_, index) => {
            if (index === sourceIndex) return;
            const move: Move = {
                source: { type: 'tableau', index: sourceIndex },
                target: { type: 'tableau', index },
                card
            };
            if (isValidMove(gameState, move)) {
                validCols.push(index);
            }
        });
        return validCols;
    };

    const findValidFreecellMoves = (card: any, freecellIndex: number): number[] => {
        if (!gameState) return [];
        const validCols: number[] = [];
        gameState.tableau.forEach((_, index) => {
            const move: Move = {
                source: { type: 'freecell', index: freecellIndex },
                target: { type: 'tableau', index },
                card
            };
            if (isValidMove(gameState, move)) {
                validCols.push(index);
            }
        });
        return validCols;
    };

    const [highlightedFreecells, setHighlightedFreecells] = useState<number[]>([]);
    const [highlightedFoundations, setHighlightedFoundations] = useState<number[]>([]);

    // ...

    const onTableauClick = (colIndex: number, cardIndex: number) => {
        if (!gameState) return;

        // Reset separate highlights if clicking on tableau
        if (highlightedFreecells.length > 0 || highlightedFoundations.length > 0) {
            setHighlightedFreecells([]);
            setHighlightedFoundations([]);
        }

        if (selection) {
            if (selection.type === 'tableau' && selection.index === colIndex && selection.cardIndex === cardIndex) {
                setSelection(null);
                setHighlightedDestinations([]);
                setHighlightedFreecells([]);
                setHighlightedFoundations([]);
                return;
            }
            attemptMove({ type: 'tableau', index: colIndex });
            setHighlightedDestinations([]);
            setHighlightedFreecells([]);
            setHighlightedFoundations([]);
            return;
        }

        const col = gameState.tableau[colIndex];
        if (col.length === 0) return;

        const card = col[cardIndex];
        if (!card.movable) {
            setShakingCard(card.id);
            setTimeout(() => setShakingCard(null), 500);
            return;
        }

        const validDestinations = findValidTableauMoves(card, colIndex);

        if (validDestinations.length === 0) {
            setShakingCard(card.id);
            setTimeout(() => setShakingCard(null), 500);
        } else if (validDestinations.length === 1) {
            const move: Move = {
                source: { type: 'tableau', index: colIndex },
                target: { type: 'tableau', index: validDestinations[0] },
                card
            };
            saveState();
            const newState = executeMove(gameState, move);
            setGameState(newState);
            setHasMoved(true);
            if (checkWinCondition(newState)) setWin(true);
        } else {
            setSelection({ type: 'tableau', index: colIndex, cardIndex });
            setHighlightedDestinations(validDestinations);
        }
    };

    const onCardLongPress = (colIndex: number, cardIndex: number) => {
        if (!gameState) return;
        const col = gameState.tableau[colIndex];
        const card = col[cardIndex];
        if (!card.movable) return;

        // Check for Freecell move
        const emptyFreecellIndex = gameState.freecells.findIndex(cell => cell === null);
        const canMoveToFreecell = emptyFreecellIndex !== -1;

        // Check for Foundation move
        const foundationMove: Move = {
            source: { type: 'tableau', index: colIndex },
            target: { type: 'foundation', index: 0 },
            card
        };
        const canMoveToFoundation = isValidMove(gameState, foundationMove);

        // Ambiguous Case: Can move to BOTH
        if (canMoveToFreecell && canMoveToFoundation) {
            setSelection({ type: 'tableau', index: colIndex, cardIndex });

            // Highlight all empty freecells
            const emptyFreecellIndices = gameState.freecells
                .map((cell, idx) => cell === null ? idx : -1)
                .filter(idx => idx !== -1);
            setHighlightedFreecells(emptyFreecellIndices);

            // Highlight valid foundation piles
            // We need to find which pile fits.
            // Foundation is array of [suit, rank].
            // If card suit matches, it goes there. 
            // If card is Ace, it goes to empty suit spot (if any empty spots exist? Actually our state has 4 generic spots? 
            // Wait, state is `type FoundationState = [Suit, number][]`. It has 4 entries, usually fixed suits?
            // Let's check `initializeGame`. Usually it sets up 4 suits.
            // If so, we just find the index where pile.suit === card.suit.
            const targetFoundationIndex = gameState.foundation.findIndex(([suit]) => suit === card.suit);
            if (targetFoundationIndex !== -1) {
                setHighlightedFoundations([targetFoundationIndex]);
            }
            return;
        }

        // Priority Logic (Exclusive)
        if (canMoveToFreecell) {
            const move: Move = {
                source: { type: 'tableau', index: colIndex },
                target: { type: 'freecell', index: emptyFreecellIndex },
                card
            };
            // Double check validity (should be valid if empty exists, but good practice)
            if (isValidMove(gameState, move)) {
                saveState();
                const newState = executeMove(gameState, move);
                setGameState(newState);
                setHasMoved(true);
                if (checkWinCondition(newState)) setWin(true);
                return;
            }
        }

        if (canMoveToFoundation) {
            saveState();
            const newState = executeMove(gameState, foundationMove);
            setGameState(newState);
            setHasMoved(true);
            if (checkWinCondition(newState)) setWin(true);
            return;
        }

        // Neither possible
        setShakingCard(card.id);
        setTimeout(() => setShakingCard(null), 500);
    };

    const onFreecellLongPress = (index: number) => {
        // ... existing logic ...
        if (!gameState) return;
        const card = gameState.freecells[index];
        if (!card) return;

        const move: Move = {
            source: { type: 'freecell', index },
            target: { type: 'foundation', index: 0 },
            card: card
        };

        if (isValidMove(gameState, move)) {
            saveState();
            const newState = executeMove(gameState, move);
            setGameState(newState);
            setHasMoved(true);
            if (checkWinCondition(newState)) setWin(true);
        } else {
            setShakingCard(card.id);
            setTimeout(() => setShakingCard(null), 500);
        }
    };

    const onFreecellClick = (index: number) => {
        if (!gameState) return;

        // Clear separate highlights
        setHighlightedFreecells([]);
        setHighlightedFoundations([]);

        if (selection) {
            if (selection.type === 'freecell' && selection.index === index) {
                setSelection(null);
                setHighlightedDestinations([]);
                return;
            }
            attemptMove({ type: 'freecell', index });
            setHighlightedDestinations([]);
            return;
        } else {
            // ... existing selection logic
            const card = gameState.freecells[index];
            if (!card) return;

            const validDestinations = findValidFreecellMoves(card, index);

            if (validDestinations.length === 0) {
                setShakingCard(card.id);
                setTimeout(() => setShakingCard(null), 500);
            } else if (validDestinations.length === 1) {
                const move: Move = {
                    source: { type: 'freecell', index },
                    target: { type: 'tableau', index: validDestinations[0] },
                    card
                };
                saveState();
                const newState = executeMove(gameState, move);
                setGameState(newState);
                setHasMoved(true);
                if (checkWinCondition(newState)) setWin(true);
            } else {
                setSelection({ type: 'freecell', index });
                setHighlightedDestinations(validDestinations);
            }
        }
    };

    const onFoundationClick = () => {
        if (!gameState) return;

        // Clear separate highlights
        setHighlightedFreecells([]);
        setHighlightedFoundations([]);

        if (selection) {
            attemptMove({ type: 'foundation', index: 0 }); // Logic handles specific pile finding
            setHighlightedDestinations([]);
        }
    };

    if (!gameState) return <div>Loading...</div>;

    return (
        <div
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
            style={{ position: 'relative', height: '100vh' }}>
            <style>{`
                :root {
                    --card-width: 4rem;
                    --card-height: 6rem;
                    --card-gap: 1rem;
                    --card-visible-top: 1.5rem;
                    --card-vertical-margin: -4.5rem; /* calc(1.5rem - 6rem) */
                    --game-padding: 1rem;
                    --section-gap: 2rem;
                }

                @media (max-width: 800px) {
                    :root {
                        --card-gap: 0.25rem;
                        --section-gap: var(--card-gap);
                        --game-padding: 0.5rem;
                        /* Width = (100vw - (2 * padding) - (7 * gap)) / 8 */
                        --card-width: min(4rem, calc((100vw - (2 * var(--game-padding)) - (7 * var(--card-gap))) / 8));
                        --card-height: calc(var(--card-width) * 1.5);
                        --card-visible-top: 1.5rem;
                        --card-vertical-margin: calc(var(--card-visible-top) - var(--card-height));
                    }
                }
            `}</style>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '800px', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={undo}
                        disabled={history.length === 0}
                        style={{
                            backgroundColor: '#334155',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            border: '1px solid #475569',
                            cursor: history.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: history.length === 0 ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { if (history.length > 0) e.currentTarget.style.backgroundColor = '#475569'; }}
                        onMouseLeave={(e) => { if (history.length > 0) e.currentTarget.style.backgroundColor = '#334155'; }}>
                        Undo
                    </button>
                    <button
                        onClick={startNewGame}
                        style={{
                            backgroundColor: '#334155',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            border: '1px solid #475569',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}>
                        Restart
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: 'white', lineHeight: 1.2 }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase' }}>Level {seed}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>SCORE: {gameState?.freecellMoves ?? 0}</div>
                    </div>

                    <button
                        onClick={onBack}
                        style={{
                            backgroundColor: '#334155',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600,
                            border: '1px solid #475569',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}>
                        Map
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--section-gap)', marginBottom: '1rem' }}>
                <FreeCells
                    cells={gameState.freecells}
                    onCardClick={onFreecellClick}
                    onCardLongPress={onFreecellLongPress}
                    selectedIndex={selection?.type === 'freecell' ? selection : undefined}
                    highlightedIndices={highlightedFreecells}
                />
                <Foundation
                    foundation={gameState.foundation}
                    onCardClick={onFoundationClick}
                    highlightedIndices={highlightedFoundations}
                />
            </div>

            <Tableau
                tableau={gameState.tableau}
                autoMovable={gameState.autoMovable}
                shakingCard={shakingCard}
                highlightedDestinations={highlightedDestinations}
                onCardClick={onTableauClick}
                onCardLongPress={onCardLongPress}
                selectedCard={selection?.type === 'tableau' ? selection : undefined}
            />

            {win && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div style={{
                        backgroundColor: '#fffbeb',
                        padding: '3rem',
                        borderRadius: '1.5rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        border: '4px solid #f59e0b',
                        maxWidth: '90vw',
                        width: '400px'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{
                            fontSize: '2rem',
                            color: '#92400e',
                            margin: '0 0 0.5rem 0',
                            fontWeight: 800
                        }}>
                            Level Complete!
                        </h2>
                        <div style={{
                            fontSize: '1.25rem',
                            color: '#b45309',
                            marginBottom: '2rem',
                            fontWeight: 600
                        }}>
                            Difficulty Score: <span style={{ fontSize: '1.5rem', color: '#B91C1C' }}>{gameState.freecellMoves}</span>
                        </div>
                        <button
                            className="btn"
                            style={{
                                fontSize: '1.2rem',
                                padding: '0.75rem 2.5rem',
                                backgroundColor: '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.5)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => onComplete(gameState.freecellMoves)}
                        >
                            Continue Quest
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
