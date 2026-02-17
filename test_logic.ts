
import { initializeGame, executeMove, getAutoMoves } from './src/logic/freecell';
import type { Move } from './src/types/game';

console.log("Starting logic test...");

try {
    const state = initializeGame();
    console.log("Game initialized.");

    // Hack: Force an Ace to be under a specific card to simulate a scenario
    // Or just find a column where moving the top card uncovers an auto-movable card.

    // Let's create a synthetic state for testing
    // Col 0: [Ace of Hearts, 2 of Swords (blocking)]
    // Foundation: Empty
    // AutoMovable: [Ace of Hearts, etc.]

    console.log("Analyzing initial state for setup...");

    // We want to simulate:
    // 1. User moves card X.
    // 2. Card Y (Ace) is uncovered.
    // 3. getAutoMoves(newState) should return Card Y.

    // Let's verify that getAutoMoves works on a state where an Ace is exposed
    // Iterate until we find a move that exposes an Ace? Too complex.

    // Let's manually construct a state?
    // Harder with Typescript types unless we mock.

    // Let's just create a state where an Ace IS top.
    const ace = state.tableau.flat().find(c => c.rank === 1);
    if (!ace) throw new Error("No Ace found in deck? Impossible.");

    console.log(`Found Ace: ${ace.id}`);

    // Find where it is
    let colIndex = -1;
    let cardIndex = -1;
    state.tableau.forEach((col, idx) => {
        const found = col.findIndex(c => c.id === ace.id);
        if (found !== -1) {
            colIndex = idx;
            cardIndex = found;
        }
    });

    console.log(`Ace is at Col ${colIndex}, Index ${cardIndex}`);

    // Remove all cards above it to simulate "uncovering"
    const col = state.tableau[colIndex];
    const cardsAbove = col.slice(cardIndex + 1);

    console.log(`Removing ${cardsAbove.length} cards above Ace.`);

    // Create new state with exposed Ace
    const newTableau = state.tableau.map((c, idx) => {
        if (idx === colIndex) {
            return c.slice(0, cardIndex + 1);
        }
        return c;
    });

    const testState = {
        ...state,
        tableau: newTableau
    };

    // Verify getAutoMoves finds it
    console.log("Checking getAutoMoves on exposed Ace...");
    const moves = getAutoMoves(testState);

    console.log(`Auto moves found: ${moves.length}`);
    moves.forEach(m => console.log(`Move: ${m.card.id} to ${m.target.type}`));

    if (moves.length > 0 && moves[0].card.id === ace.id) {
        console.log("SUCCESS: Auto-move found correctly.");
    } else {
        console.error("FAILURE: Auto-move NOT found.");
        console.log("AutoMovable list:", testState.autoMovable);
        console.log("Top of col:", testState.tableau[colIndex][testState.tableau[colIndex].length - 1].id);
    }

} catch (e) {
    console.error(e);
}
