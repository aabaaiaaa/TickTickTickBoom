const POSITIONS = ['A', 'B', 'C', 'D', 'E'];
function positionToPressure(pos) {
    return (POSITIONS.indexOf(pos) + 1) * 2;
}
function calculateIndicator(slider, systemPressure) {
    if (slider.isLocked)
        return 'red';
    if (slider.pressure >= 4 && slider.pressure <= 8)
        return 'green';
    return 'yellow';
}
export function generatePressureEqualizer(difficulty, _serialNumber, _indicators) {
    // Generate 5 sliders with random starting positions
    const sliders = [];
    for (let i = 0; i < 5; i++) {
        const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
        const pressure = positionToPressure(position);
        const isLocked = i === 0 || i === 3; // Sliders 1 and 4 start locked
        sliders.push({
            id: i + 1,
            position,
            pressure,
            indicator: 'yellow',
            isLocked,
        });
    }
    // Calculate system pressure
    const systemPressure = sliders.reduce((sum, s) => sum + s.pressure, 0);
    // Update indicators
    sliders.forEach(s => {
        s.indicator = calculateIndicator(s, systemPressure);
    });
    // Target: 26-30 total pressure
    const targetPressure = { min: 26, max: 30 };
    return {
        type: 'pressure-equalizer',
        defuserView: {
            sliders,
            systemPressure,
            targetPressure,
        },
        solution: {
            unlockConditions: {
                1: 'Slider 3 at C or higher',
                4: 'Slider 5 indicator is green',
            },
            targetConfig: {
                1: ['C', 'D'],
                2: ['B', 'C', 'D'],
                3: ['C', 'D', 'E'],
                4: ['C', 'D'],
                5: ['B', 'C', 'D'],
            },
        },
    };
}
export function validatePressureEqualizer(puzzle, action) {
    const view = puzzle.defuserView;
    const actionData = action;
    // Support both 'type' and 'action' field
    const actionType = actionData.type || actionData.action;
    if (actionType === 'move' || actionType === 'adjust-slider') {
        // Support both sliderId and index (0-based)
        const sliderIndex = actionData.sliderId !== undefined
            ? actionData.sliderId - 1
            : actionData.index;
        const slider = sliderIndex !== undefined ? view.sliders[sliderIndex] : undefined;
        if (!slider) {
            return { correct: false, message: 'Invalid slider' };
        }
        if (slider.isLocked) {
            return { correct: false, message: 'Slider is locked!' };
        }
        // Support direct position or direction
        if (actionData.position && POSITIONS.includes(actionData.position)) {
            slider.position = actionData.position;
            slider.pressure = positionToPressure(slider.position);
        }
        else if (actionData.direction) {
            const currentIndex = POSITIONS.indexOf(slider.position);
            const newIndex = actionData.direction === 'up'
                ? Math.min(currentIndex + 1, POSITIONS.length - 1)
                : Math.max(currentIndex - 1, 0);
            slider.position = POSITIONS[newIndex];
            slider.pressure = positionToPressure(slider.position);
        }
        // Recalculate system pressure
        view.systemPressure = view.sliders.reduce((sum, s) => sum + s.pressure, 0);
        // Check unlock conditions
        // Slider 1 unlocks when Slider 3 is C or higher
        const slider1 = view.sliders.find(s => s.id === 1);
        const slider3 = view.sliders.find(s => s.id === 3);
        if (slider1 && slider3 && POSITIONS.indexOf(slider3.position) >= 2) {
            slider1.isLocked = false;
        }
        // Slider 4 unlocks when Slider 5 indicator is green
        const slider4 = view.sliders.find(s => s.id === 4);
        const slider5 = view.sliders.find(s => s.id === 5);
        if (slider4 && slider5 && slider5.indicator === 'green') {
            slider4.isLocked = false;
        }
        // Update all indicators
        view.sliders.forEach(s => {
            s.indicator = calculateIndicator(s, view.systemPressure);
        });
        return { correct: false, message: `System pressure: ${view.systemPressure}` };
    }
    if (actionType === 'confirm' || actionType === 'confirm-pressure') {
        // If positions sent directly, apply them first
        if (actionData.positions) {
            for (let i = 0; i < view.sliders.length && i < actionData.positions.length; i++) {
                const pos = actionData.positions[i];
                if (POSITIONS.includes(pos)) {
                    view.sliders[i].position = pos;
                    view.sliders[i].pressure = positionToPressure(pos);
                }
            }
            view.systemPressure = view.sliders.reduce((sum, s) => sum + s.pressure, 0);
        }
        // Check if system pressure is in target range
        if (view.systemPressure < view.targetPressure.min || view.systemPressure > view.targetPressure.max) {
            return { correct: false, message: `System pressure must be ${view.targetPressure.min}-${view.targetPressure.max}` };
        }
        // Check no slider at position A
        if (view.sliders.some(s => s.position === 'A')) {
            return { correct: false, message: 'No slider can be at position A!' };
        }
        // Check adjacent sliders aren't more than 2 apart
        for (let i = 0; i < view.sliders.length - 1; i++) {
            const diff = Math.abs(POSITIONS.indexOf(view.sliders[i].position) -
                POSITIONS.indexOf(view.sliders[i + 1].position));
            if (diff > 2) {
                return { correct: false, message: 'Adjacent sliders too far apart!' };
            }
        }
        return { correct: true, message: 'Pressure equalized!' };
    }
    return { correct: false, message: 'Invalid action' };
}
