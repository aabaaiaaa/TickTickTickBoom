// Wire colors available
const WIRE_COLORS = ['red', 'blue', 'yellow', 'white', 'black', 'green'];
// Symbols for wire tags
const WIRE_SYMBOLS = ['△', '○', '□', '☆', '◇', '♠', '♣', '♥', '♦'];
// Store solutions separately (not sent to client)
const puzzleSolutions = new Map();
export function generateWireArray(difficulty, serialNumber, _indicators) {
    // Number of wires based on difficulty
    const wireCount = difficulty === 'easy' ? 4 :
        difficulty === 'medium' ? 5 : 6;
    // Generate random wires
    const wires = [];
    const usedSymbols = new Set();
    for (let i = 0; i < wireCount; i++) {
        const color = WIRE_COLORS[Math.floor(Math.random() * WIRE_COLORS.length)];
        // Get unique symbol
        let symbol;
        do {
            symbol = WIRE_SYMBOLS[Math.floor(Math.random() * WIRE_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);
        // 20% chance of striped wire
        const isStriped = Math.random() < 0.2;
        const stripeColor = isStriped
            ? WIRE_COLORS.filter(c => c !== color)[Math.floor(Math.random() * (WIRE_COLORS.length - 1))]
            : undefined;
        wires.push({
            color,
            symbol,
            isStriped,
            stripeColor,
            position: i,
        });
    }
    // Determine correct wire(s) to cut based on rules
    const correctCuts = determineCorrectCuts(wires, serialNumber);
    const solution = { correctCuts };
    return {
        type: 'wire-array',
        defuserView: { wires, cutWires: [] },
        solution,
    };
}
function determineCorrectCuts(wires, serialNumber) {
    const wireCount = wires.length;
    const lastDigit = parseInt(serialNumber.slice(-1), 10) || 0;
    const isSerialEven = lastDigit % 2 === 0;
    const redCount = wires.filter(w => w.color === 'red').length;
    const blueCount = wires.filter(w => w.color === 'blue').length;
    const yellowWires = wires.filter(w => w.color === 'yellow');
    const stripedWires = wires.filter(w => w.isStriped);
    const starWire = wires.find(w => w.symbol === '☆');
    const triangleWire = wires.find(w => w.symbol === '△');
    // Rules based on wire count
    if (wireCount === 4) {
        // 4 wires
        if (redCount > 1 && isSerialEven) {
            // Cut last red wire
            const redWires = wires.filter(w => w.color === 'red');
            return [redWires[redWires.length - 1].position];
        }
        if (yellowWires.length === 0) {
            // Cut first wire
            return [0];
        }
        if (blueCount === 1) {
            // Cut first blue wire
            const firstBlue = wires.find(w => w.color === 'blue');
            return firstBlue ? [firstBlue.position] : [0];
        }
        // Default: cut last wire
        return [wireCount - 1];
    }
    if (wireCount === 5) {
        // 5 wires
        if (redCount > blueCount) {
            return starWire ? [starWire.position] : [1];
        }
        if (stripedWires.length > 0) {
            return [wireCount - 1];
        }
        if (triangleWire) {
            return [triangleWire.position];
        }
        // Default: cut second wire
        return [1];
    }
    // 6 wires
    if (yellowWires.length === 0 && !isSerialEven) {
        // Cut third wire
        return [2];
    }
    if (yellowWires.length === 1 && redCount > 1) {
        // Cut first yellow wire
        return [yellowWires[0].position];
    }
    if (wires.filter(w => w.color === 'white').length === 0) {
        // Cut fourth wire
        return [3];
    }
    // Default: cut first wire
    return [0];
}
export function validateWireArray(puzzle, action) {
    const view = puzzle.defuserView;
    const solution = puzzle.solution;
    const actionData = action;
    if (typeof actionData.wireIndex !== 'number') {
        return { correct: false, message: 'Invalid action' };
    }
    const wireIndex = actionData.wireIndex;
    // Check if wire exists and hasn't been cut
    if (wireIndex < 0 || wireIndex >= view.wires.length) {
        return { correct: false, message: 'Invalid wire' };
    }
    if (view.cutWires.includes(wireIndex)) {
        return { correct: false, message: 'Wire already cut' };
    }
    // Mark wire as cut
    view.cutWires.push(wireIndex);
    // Check if this was the correct wire to cut
    const correctWires = solution.correctCuts;
    const expectedCutIndex = view.cutWires.length - 1;
    if (expectedCutIndex < correctWires.length) {
        const expectedWire = correctWires[expectedCutIndex];
        if (wireIndex !== expectedWire) {
            // Wrong wire cut!
            return { correct: false, message: 'Wrong wire! STRIKE!', strike: true };
        }
    }
    // Check if puzzle is complete (all required cuts made)
    if (view.cutWires.length >= correctWires.length) {
        // Verify all cuts were correct
        const allCorrect = correctWires.every((correct, idx) => view.cutWires[idx] === correct);
        if (allCorrect) {
            return { correct: true, message: 'Wire array disarmed!' };
        }
    }
    return { correct: false, message: `Wire cut. ${correctWires.length - view.cutWires.length} more to go.` };
}
export { puzzleSolutions };
