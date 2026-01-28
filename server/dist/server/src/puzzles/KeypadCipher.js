// Pool of symbols for keypad
const SYMBOL_POOL = [
    'Ω', '∂', 'Ψ', 'Ͼ', '★', '⊗', '☽', 'Ϙ', '⊕', 'ϗ',
    '⚡', '☆', '¥', '©', '¶', 'Ξ', 'Ͽ', '☀', 'Ԇ', '✿',
    '♠', '♣', '♥', '♦', '☢', '☣', '⚙', '⚛'
];
// Column sequences - symbols must be pressed in the order they appear in the matching column
const SYMBOL_COLUMNS = [
    ['Ω', '∂', 'Ψ', 'Ͼ', '★', '⊗'],
    ['☽', 'Ϙ', '⊕', 'Ω', '∂', 'ϗ'],
    ['⚡', '☽', 'Ͼ', '★', '⊗', 'Ψ'],
    ['¥', '©', '¶', 'Ξ', 'Ͽ', '★'],
    ['☀', '¥', 'Ԇ', '⊕', '©', '✿'],
    ['♠', '♣', '♥', '♦', '☢', '☣'],
];
export function generateKeypadCipher(difficulty, _serialNumber, indicators) {
    // Check if NSA indicator is present (forces column 6)
    const hasNSA = indicators.some(i => i.label === 'NSA');
    // Select which column to use
    let columnIndex;
    if (hasNSA) {
        columnIndex = 5; // Column 6 (0-indexed)
    }
    else {
        columnIndex = Math.floor(Math.random() * SYMBOL_COLUMNS.length);
    }
    const column = SYMBOL_COLUMNS[columnIndex];
    // Select 4 symbols from the column that will be on the keypad
    const shuffledColumn = [...column].sort(() => Math.random() - 0.5);
    const keypadSymbols = shuffledColumn.slice(0, 4);
    // Fill remaining keypad slots with random symbols NOT in the solution
    const otherSymbols = SYMBOL_POOL.filter(s => !column.includes(s));
    const shuffledOther = [...otherSymbols].sort(() => Math.random() - 0.5);
    // Create 16 symbols for 4x4 grid
    const allKeypadSymbols = [...keypadSymbols];
    while (allKeypadSymbols.length < 16) {
        allKeypadSymbols.push(shuffledOther[allKeypadSymbols.length - 4]);
    }
    // Shuffle all symbols
    const shuffledAll = allKeypadSymbols.sort(() => Math.random() - 0.5);
    // Arrange into 4x4 grid
    const symbols = [];
    for (let row = 0; row < 4; row++) {
        symbols.push(shuffledAll.slice(row * 4, (row + 1) * 4));
    }
    // Correct sequence is the 4 keypad symbols in column order
    const correctSequence = column.filter(s => keypadSymbols.includes(s));
    return {
        type: 'keypad-cipher',
        defuserView: {
            symbols,
            pressedSymbols: [],
            displaySlots: [null, null, null, null],
        },
        solution: { correctSequence },
    };
}
export function validateKeypadCipher(puzzle, action) {
    const view = puzzle.defuserView;
    const solution = puzzle.solution;
    const actionData = action;
    if (!actionData.symbol) {
        return { correct: false, message: 'Invalid action' };
    }
    const symbol = actionData.symbol;
    // Check if symbol exists on keypad
    const symbolExists = view.symbols.some(row => row.includes(symbol));
    if (!symbolExists) {
        return { correct: false, message: 'Symbol not on keypad' };
    }
    // Check if already pressed
    if (view.pressedSymbols.includes(symbol)) {
        return { correct: false, message: 'Symbol already pressed' };
    }
    // Check if this symbol is part of the correct sequence
    if (!solution.correctSequence.includes(symbol)) {
        // Wrong symbol - not in the solution at all!
        view.pressedSymbols.push(symbol);
        const nextSlot = view.displaySlots.findIndex(s => s === null);
        if (nextSlot !== -1) {
            view.displaySlots[nextSlot] = symbol;
        }
        return { correct: false, message: 'Wrong symbol! STRIKE!', strike: true };
    }
    // Check if pressed in correct order
    const expectedIndex = view.pressedSymbols.length;
    const expectedSymbol = solution.correctSequence[expectedIndex];
    if (symbol !== expectedSymbol) {
        // Wrong order!
        view.pressedSymbols.push(symbol);
        const nextSlot = view.displaySlots.findIndex(s => s === null);
        if (nextSlot !== -1) {
            view.displaySlots[nextSlot] = symbol;
        }
        return { correct: false, message: 'Wrong order! STRIKE!', strike: true };
    }
    // Correct symbol in correct order
    view.pressedSymbols.push(symbol);
    const nextSlot = view.displaySlots.findIndex(s => s === null);
    if (nextSlot !== -1) {
        view.displaySlots[nextSlot] = symbol;
    }
    // Check if complete (4 symbols entered correctly)
    if (view.pressedSymbols.length >= 4) {
        return { correct: true, message: 'Keypad cipher decoded!' };
    }
    return { correct: false, message: `${view.pressedSymbols.length}/4 symbols correct` };
}
