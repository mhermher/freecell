export type Optional<T> = T | null;

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export type Color = 'red' | 'black';

export interface BaseCard {
    suit: Suit;
    rank: Rank;
    color: Color;
    id: string;
}

export interface Card extends BaseCard {
    movable: boolean;
}

export type FoundationState = [[Suit, number], [Suit, number], [Suit, number], [Suit, number]];

export interface BaseGameState {
    tableau: Array<Array<BaseCard>>;
    freecells: Array<Optional<BaseCard>>;
    foundation: FoundationState;
    history: Array<Move>;
    freecellMoves: number;
}

export interface GameState extends BaseGameState {
    tableau: Array<Array<Card>>;
    capacity: number;
    autoMovable: Array<string>; // IDs of cards that can be auto-moved
}

export interface Move {
    source: { type: 'tableau' | 'freecell' | 'foundation', index: number };
    target: { type: 'tableau' | 'freecell' | 'foundation', index: number };
    card: BaseCard;
}
