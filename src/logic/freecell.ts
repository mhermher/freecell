import type { BaseCard, Card, GameState, Move, Optional, FoundationState } from '../types/game';
import { createDeck, shuffleDeck } from '../utils/deck';

const calculateCapacity = (freecells: Array<Optional<BaseCard>>, tableau: Array<Array<BaseCard>>, destColIndex: number = -1): number => {
    const emptyFreecells = freecells.filter((card) => card === null).length;
    const emptyCols = tableau.filter((col, idx) => col.length === 0 && idx !== destColIndex).length;
    return (emptyFreecells + 1) * Math.pow(2, emptyCols);
};

/**
 * Calculates which cards are safe to auto-move based strictly on foundation ranks.
 */
const calculateAutoMovable = (foundation: FoundationState): Array<string> => {
    const ids: Array<string> = [];
    for (const [suit, currentRank] of foundation) {
        const nextRank = currentRank + 1;
        if (nextRank > 13) continue;
        if (nextRank <= 2) {
            ids.push(`${suit}-${nextRank}`);
        } else {
            const cardColor = (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
            const oppositeColor = cardColor === 'red' ? 'black' : 'red';
            // Check if both foundations of opposite color are >= nextRank - 1
            const safe = foundation.every(([checkSuit, checkRank]) => {
                const checkColor = (checkSuit === 'hearts' || checkSuit === 'diamonds') ? 'red' : 'black';
                if (checkColor !== oppositeColor) return true;
                return checkRank >= nextRank - 1;
            });
            if (safe) ids.push(`${suit}-${nextRank}`);
        }
    }
    return ids;
};

const updateColumnMovable = (col: Array<Card>): Array<Card> => {
    const newCol = [...col];
    let validSequence = true;
    for (let i = newCol.length - 1; i >= 0; i--) {
        if (i === newCol.length - 1) {
            newCol[i] = { ...newCol[i], movable: true };
            continue;
        }
        const current = newCol[i];
        const below = newCol[i + 1];
        if (validSequence) {
            const isAltColor = current.color !== below.color;
            const isRankOneHigher = current.rank === below.rank + 1;
            if (isAltColor && isRankOneHigher) {
                if (below.movable) {
                    newCol[i] = { ...current, movable: true };
                } else {
                    newCol[i] = { ...current, movable: true };
                }
            } else {
                validSequence = false;
                newCol[i] = { ...current, movable: false };
            }
        } else {
            newCol[i] = { ...current, movable: false };
        }
    }
    return newCol;
};

const updateMovableStatus = (tableau: Array<Array<Card>>, sourceColIndex?: number): Array<Array<Card>> => {
    if (sourceColIndex === undefined) {
        return tableau.map(col => updateColumnMovable(col));
    }
    return tableau.map((col, index) => {
        if (index === sourceColIndex) {
            return updateColumnMovable(col);
        }
        return col;
    });
};

export const initializeGame = (seed?: number): GameState => {
    const deck = shuffleDeck(createDeck(), seed);
    const tableau: Array<Array<Card>> = Array.from({ length: 8 }, () => []);
    deck.forEach((card, index) => {
        tableau[index % 8].push(card);
    });
    const initialTableau = updateMovableStatus(tableau);
    const freecells = Array(4).fill(null);
    const foundation: FoundationState = [
        ['hearts', 0],
        ['diamonds', 0],
        ['clubs', 0],
        ['spades', 0]
    ];
    return {
        tableau: initialTableau,
        freecells,
        foundation,
        history: [],
        freecellMoves: 0,
        capacity: calculateCapacity(freecells, initialTableau),
        autoMovable: calculateAutoMovable(foundation)
    };
};

export const isValidMove = (state: GameState, move: Move): boolean => {
    const { target, card } = move;
    if (target.type === 'freecell') {
        if (state.freecells[target.index] !== null) return false;
        if (move.source.type === 'tableau') {
            const col = state.tableau[move.source.index];
            if (col.length === 0) return false;
            if (col[col.length - 1].id !== card.id) return false;
        }
        return true;
    }
    if (target.type === 'foundation') {
        // Find current rank for this suit
        const pile = state.foundation.find(p => p[0] === card.suit);
        // Should always exist
        if (!pile) return false;

        const currentRank = pile[1];

        if (move.source.type === 'tableau') {
            const col = state.tableau[move.source.index];
            if (col.length === 0) return false;
            if (col[col.length - 1].id !== card.id) return false;
        }

        return card.rank === currentRank + 1;
    }
    if (target.type === 'tableau') {
        const destColumn = state.tableau[target.index];
        if (move.source.type === 'tableau') {
            const sourceCol = state.tableau[move.source.index];
            const sourceCardIndex = sourceCol.findIndex(c => c.id === card.id);
            if (sourceCardIndex === -1) return false;
            if (!sourceCol[sourceCardIndex].movable) return false;

            const numCards = sourceCol.length - sourceCardIndex;
            const capacity = calculateCapacity(state.freecells, state.tableau, target.index);
            if (numCards > capacity) return false;
        }

        if (destColumn.length === 0) return true;

        const targetCard = destColumn[destColumn.length - 1];
        return (card.color !== targetCard.color && card.rank === targetCard.rank - 1);
    }
    return false;
};

export const executeMove = (currentState: GameState, move: Move): GameState => {
    const tableau = currentState.tableau.map(col => [...col]);
    const freecells = [...currentState.freecells];
    const foundation: FoundationState = [
        [...currentState.foundation[0]],
        [...currentState.foundation[1]],
        [...currentState.foundation[2]],
        [...currentState.foundation[3]]
    ];
    let cardsToMove: Array<Card> = [];
    if (move.source.type === 'tableau') {
        const col = tableau[move.source.index];
        const cardIndex = col.findIndex(card => card.id === move.card.id);
        if (cardIndex !== -1) {
            cardsToMove = col.splice(cardIndex);
        }
    } else if (move.source.type === 'freecell') {
        const card = freecells[move.source.index];
        if (card) {
            cardsToMove = [{ ...card, movable: true }];
        }
        freecells[move.source.index] = null;
    }
    if (move.target.type === 'tableau') {
        tableau[move.target.index].push(...cardsToMove);
    } else if (move.target.type === 'freecell') {
        freecells[move.target.index] = cardsToMove[0];
    } else if (move.target.type === 'foundation') {
        const suit = cardsToMove[0].suit;
        const pile = foundation.find(p => p[0] === suit);
        if (pile) {
            pile[1] = cardsToMove[0].rank;
        }
    }
    const updatedTableau = move.source.type === 'tableau' ? updateMovableStatus(tableau, move.source.index) : tableau;
    const autoMovable = move.target.type === 'foundation' ? calculateAutoMovable(foundation) : currentState.autoMovable;

    // Calculate new freecell moves count
    // Increment if moving TO a freecell
    const newFreecellMoves = currentState.freecellMoves + (move.target.type === 'freecell' ? 1 : 0);

    return {
        tableau: updatedTableau,
        freecells,
        foundation,
        history: [...currentState.history, move],
        freecellMoves: newFreecellMoves,
        capacity: calculateCapacity(freecells, updatedTableau),
        autoMovable
    };
};

export const checkWinCondition = (state: GameState): boolean => {
    return state.foundation.every(([, rank]) => rank === 13);
};

export const getAutoMoves = (state: GameState): Array<Move> => {
    const moves: Array<Move> = [];
    // 1. Initialize simulation state
    let candidates: Array<string> = state.autoMovable;
    // Track depth of each column to allow O(1) peek
    const depths = state.tableau.map(col => col.length);
    const tops = new Map<string, { index: number, card: Card }>();
    state.tableau.forEach((col, idx) => {
        if (col.length > 0) {
            const card = col[col.length - 1];
            tops.set(card.id, { index: idx, card });
        }
    });
    const freecells = new Map<string, { index: number, card: BaseCard }>();
    state.freecells.forEach((card, idx) => {
        if (card) {
            freecells.set(card.id, { index: idx, card });
        }
    });
    // maintain virtual foundation ranks for recalculating requirements
    let foundation: FoundationState = [
        [...state.foundation[0]],
        [...state.foundation[1]],
        [...state.foundation[2]],
        [...state.foundation[3]]
    ];
    let found = true;
    while (found) {
        found = false;
        for (const id of candidates) {
            let move: Optional<Move> = null;
            if (tops.has(id)) {
                const info = tops.get(id)!;
                move = {
                    source: { type: 'tableau', index: info.index },
                    target: { type: 'foundation', index: 0 },
                    card: info.card
                };
            } else if (freecells.has(id)) {
                const info = freecells.get(id)!;
                move = {
                    source: { type: 'freecell', index: info.index },
                    target: { type: 'foundation', index: 0 },
                    card: info.card
                };
            } else {
                continue;
            }
            // Move found
            moves.push(move);
            found = true;
            // Execute locally
            const card = move.card;
            if (move.source.type === 'tableau') {
                const colIdx = move.source.index;
                tops.delete(id);
                depths[colIdx]--;
                const newDepth = depths[colIdx];
                if (newDepth > 0) {
                    const newTop = state.tableau[colIdx][newDepth - 1];
                    tops.set(newTop.id, { index: colIdx, card: newTop });
                }
            } else if (move.source.type === 'freecell') {
                freecells.delete(id);
            }
            // Update virtual foundation
            foundation = [
                ['hearts', card.suit == 'hearts' ? card.rank : foundation[0][1]],
                ['diamonds', card.suit == 'diamonds' ? card.rank : foundation[1][1]],
                ['clubs', card.suit == 'clubs' ? card.rank : foundation[2][1]],
                ['spades', card.suit == 'spades' ? card.rank : foundation[3][1]]
            ]
            // Recalculate requirements
            // We need to convert virtualFoundation Map back to tuple to reuse calculateAutoMovable
            // or just overload it. Converting Map to array is easy.
            candidates = calculateAutoMovable(foundation);
            break;
        }
    }
    return moves;
};
