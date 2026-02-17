import type { Card } from '../types/game';
import { RANKS, SUITS } from '../constants';

export const createDeck = (): Array<Card> => {
    const deck: Array<Card> = [];

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black',
                id: `${suit}-${rank}`,
                movable: false // Initial state
            });
        }
    }

    return deck;
};

// Simple pseudo-random number generator (Mulberry32)
const mulberry32 = (a: number) => {
    return () => {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

export const shuffleDeck = (deck: Array<Card>, seed?: number): Array<Card> => {
    const newDeck = [...deck];
    const random = seed !== undefined ? mulberry32(seed) : Math.random;

    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};
