const SWITCH_SYMBOLS = ['★', '◆', '●', '▲', '■', '♦'];
const HOUSING_COLORS = ['red', 'yellow', 'green', 'blue', 'white'];
export function generateMechanicalSwitches(_difficulty, _serialNumber, indicators) {
    const switches = [];
    const usedSymbols = new Set();
    // Generate 2 two-position switches
    for (let i = 0; i < 2; i++) {
        let symbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);
        switches.push({
            type: 'two-position',
            id: i + 1,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: Math.random() > 0.5 ? 'up' : 'down',
        });
    }
    // Generate 2 three-position switches
    for (let i = 0; i < 2; i++) {
        let symbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);
        const positions = ['up', 'middle', 'down'];
        switches.push({
            type: 'three-position',
            id: i + 3,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: positions[Math.floor(Math.random() * 3)],
        });
    }
    // Generate 2 rotary switches
    for (let i = 0; i < 2; i++) {
        let symbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);
        switches.push({
            type: 'rotary',
            id: i + 5,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: (1 + Math.floor(Math.random() * 4)),
        });
    }
    // Determine target pattern based on indicators
    const hasFRK = indicators.some(i => i.label === 'FRK' && i.isLit);
    const hasCAR = indicators.some(i => i.label === 'CAR' && i.isLit);
    let targetPattern;
    if (hasFRK && hasCAR) {
        targetPattern = [true, false, true, false, true];
    }
    else if (hasFRK) {
        targetPattern = [true, true, false, false, true];
    }
    else if (hasCAR) {
        targetPattern = [false, true, true, true, false];
    }
    else {
        targetPattern = [true, true, true, false, false];
    }
    // Calculate initial status lights based on switch positions
    const statusLights = calculateStatusLights(switches);
    return {
        type: 'mechanical-switches',
        defuserView: {
            switches,
            statusLights,
            targetPattern,
        },
        solution: {
            targetConfiguration: {}, // Would be calculated
        },
    };
}
function calculateStatusLights(switches) {
    // Simplified: lights based on switch positions
    const lights = [];
    for (let i = 0; i < 5; i++) {
        let lit = false;
        switches.forEach((sw, idx) => {
            if (sw.type === 'two-position' && sw.position === 'up' && idx === i)
                lit = true;
            if (sw.type === 'three-position' && sw.position !== 'down' && idx === i - 1)
                lit = true;
            if (sw.type === 'rotary' && sw.position > 2 && idx === i - 2)
                lit = true;
        });
        lights.push(lit);
    }
    return lights;
}
export function validateMechanicalSwitches(puzzle, action) {
    const view = puzzle.defuserView;
    const actionData = action;
    // Support both 'type' and 'action' field
    const actionType = actionData.type || actionData.action;
    // Support both 'switchId' and 'index'
    const switchIndex = actionData.switchId ?? actionData.index;
    // Support both 'newPosition' and 'position'
    const newPosition = actionData.newPosition ?? actionData.position;
    if (actionType === 'toggle' || actionType === 'toggle-switch') {
        // Support both switchId and array index (0-based)
        const switchObj = typeof switchIndex === 'number'
            ? view.switches.find(s => s.id === switchIndex + 1) || view.switches[switchIndex]
            : undefined;
        if (!switchObj) {
            return { correct: false, message: 'Invalid switch' };
        }
        // If position provided directly, use it
        if (newPosition !== undefined) {
            if (switchObj.type === 'two-position') {
                switchObj.position = newPosition === 1 || newPosition === 'up' ? 'up' : 'down';
            }
            else if (switchObj.type === 'three-position') {
                const positions = ['up', 'middle', 'down'];
                if (typeof newPosition === 'number') {
                    switchObj.position = positions[newPosition - 1] || positions[newPosition] || 'middle';
                }
                else {
                    switchObj.position = newPosition;
                }
            }
            else if (switchObj.type === 'rotary') {
                switchObj.position = (typeof newPosition === 'number' ? newPosition : 1);
            }
        }
        else {
            // Toggle to next position
            if (switchObj.type === 'two-position') {
                switchObj.position =
                    switchObj.position === 'up' ? 'down' : 'up';
            }
            else if (switchObj.type === 'three-position') {
                const positions = ['up', 'middle', 'down'];
                const currentIdx = positions.indexOf(switchObj.position);
                switchObj.position = positions[(currentIdx + 1) % 3];
            }
            else if (switchObj.type === 'rotary') {
                const current = switchObj.position;
                switchObj.position = ((current % 4) + 1);
            }
        }
        // Recalculate status lights
        view.statusLights = calculateStatusLights(view.switches);
        return { correct: false, message: 'Switch toggled' };
    }
    if (actionType === 'confirm' || actionType === 'submit-switches') {
        // Check if status lights match target pattern
        const matches = view.statusLights.every((light, i) => light === view.targetPattern[i]);
        if (!matches) {
            return { correct: false, message: 'Pattern does not match target!' };
        }
        // Check rules: switches with ★ must be same position
        const starSwitches = view.switches.filter(s => s.symbol === '★');
        if (starSwitches.length >= 2) {
            const positions = starSwitches.map(s => {
                if (s.type === 'two-position')
                    return s.position;
                if (s.type === 'three-position')
                    return s.position;
                return String(s.position);
            });
            if (new Set(positions).size > 1) {
                return { correct: false, message: '★ switches must be in same position!' };
            }
        }
        // Check: RED housing cannot be in position 1/up
        const redSwitch = view.switches.find(s => s.housing === 'red');
        if (redSwitch) {
            if (redSwitch.type === 'two-position' && redSwitch.position === 'up') {
                return { correct: false, message: 'RED housing switch cannot be UP!' };
            }
            if (redSwitch.type === 'rotary' && redSwitch.position === 1) {
                return { correct: false, message: 'RED housing switch cannot be in position 1!' };
            }
        }
        return { correct: true, message: 'Switches configured correctly!' };
    }
    return { correct: false, message: 'Invalid action' };
}
