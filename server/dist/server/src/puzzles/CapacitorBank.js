const CAPACITOR_COLORS = ['red', 'yellow', 'blue', 'green', 'purple'];
export function generateCapacitorBank(difficulty, _serialNumber, indicators) {
    // Check for BOB indicator (requires extra safety margin)
    const hasBOB = indicators.some(i => i.label === 'BOB' && i.isFlickering);
    const safetyMargin = hasBOB ? 10 : 0;
    // Generate 5 capacitors
    const capacitors = [];
    const targetVoltages = {};
    for (let i = 0; i < 5; i++) {
        const id = `C${i + 1}`;
        const colorBand = CAPACITOR_COLORS[Math.floor(Math.random() * CAPACITOR_COLORS.length)];
        const isCritical = Math.random() < 0.3;
        const voltage = 30 + Math.floor(Math.random() * 50);
        capacitors.push({ id, voltage, colorBand, isCritical });
        // Set target based on color and critical status
        if (isCritical) {
            if (colorBand === 'red') {
                targetVoltages[id] = { min: 0, max: 50 - safetyMargin };
            }
            else if (colorBand === 'blue') {
                targetVoltages[id] = { min: 55, max: 65 }; // Exactly ~60
            }
            else {
                targetVoltages[id] = { min: 30, max: 80 };
            }
        }
        else {
            targetVoltages[id] = { min: 30, max: 80 };
        }
    }
    const systemVoltage = capacitors.reduce((sum, c) => sum + c.voltage, 0);
    return {
        type: 'capacitor-bank',
        defuserView: {
            capacitors,
            systemVoltage,
            discharged: false,
        },
        solution: {
            targetVoltages,
            maxSystemVoltage: 300 + safetyMargin,
        },
    };
}
export function validateCapacitorBank(puzzle, action) {
    const view = puzzle.defuserView;
    const actionData = action;
    // Support both 'type' and 'action' field for action type
    const actionType = actionData.type || actionData.action;
    if (actionType === 'adjust' || actionType === 'adjust-capacitor') {
        // Support both capacitorId and index
        const capacitor = actionData.capacitorId
            ? view.capacitors.find(c => c.id === actionData.capacitorId)
            : view.capacitors[actionData.index ?? -1];
        if (!capacitor) {
            return { correct: false, message: 'Invalid capacitor' };
        }
        // If client sent newState (with final voltages), use those
        if (actionData.newState) {
            for (let i = 0; i < view.capacitors.length && i < actionData.newState.length; i++) {
                view.capacitors[i].voltage = Math.max(0, Math.min(100, Math.round(actionData.newState[i].voltage)));
            }
        }
        else {
            // Adjust voltage - left decreases, right increases
            const change = actionData.direction === 'left' ? -5 : 5;
            const oldVoltage = capacitor.voltage;
            capacitor.voltage = Math.max(0, Math.min(100, capacitor.voltage + change));
            // Redistribute to neighbors
            const index = view.capacitors.findIndex(c => c.id === capacitor.id);
            const voltageDiff = oldVoltage - capacitor.voltage;
            if (index > 0) {
                view.capacitors[index - 1].voltage = Math.min(100, view.capacitors[index - 1].voltage + voltageDiff / 2);
            }
            if (index < view.capacitors.length - 1) {
                view.capacitors[index + 1].voltage = Math.min(100, view.capacitors[index + 1].voltage + voltageDiff / 2);
            }
        }
        // Recalculate system voltage
        view.systemVoltage = view.capacitors.reduce((sum, c) => sum + Math.round(c.voltage), 0);
        return { correct: false, message: `System: ${view.systemVoltage}V` };
    }
    if (actionType === 'discharge') {
        // Client may send final voltages - apply them
        if (actionData.voltages) {
            for (let i = 0; i < view.capacitors.length && i < actionData.voltages.length; i++) {
                view.capacitors[i].voltage = Math.max(0, Math.min(100, Math.round(actionData.voltages[i])));
            }
            view.systemVoltage = view.capacitors.reduce((sum, c) => sum + Math.round(c.voltage), 0);
        }
        // Check if safe to discharge
        if (view.systemVoltage > 300) {
            return { correct: false, message: 'System voltage too high! Cannot discharge safely.' };
        }
        // Check individual capacitor ranges (simplified)
        const hasUnsafe = view.capacitors.some(c => {
            if (c.isCritical && c.colorBand === 'red' && c.voltage > 50)
                return true;
            if (c.isCritical && c.colorBand === 'blue' && (c.voltage < 55 || c.voltage > 65))
                return true;
            if (c.voltage < 30 || c.voltage > 80)
                return true;
            return false;
        });
        if (hasUnsafe) {
            return { correct: false, message: 'Unsafe voltage levels detected!' };
        }
        view.discharged = true;
        return { correct: true, message: 'Capacitors discharged safely!' };
    }
    return { correct: false, message: 'Invalid action' };
}
