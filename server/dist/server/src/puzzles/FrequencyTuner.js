export function generateFrequencyTuner(_difficulty, serialNumber, indicators) {
    // Base frequency from serial number first letter
    const firstLetter = serialNumber.charAt(0).toUpperCase();
    let baseFrequency;
    if (firstLetter >= 'A' && firstLetter <= 'F') {
        baseFrequency = 4.2;
    }
    else if (firstLetter >= 'G' && firstLetter <= 'L') {
        baseFrequency = 5.7;
    }
    else if (firstLetter >= 'M' && firstLetter <= 'R') {
        baseFrequency = 7.1;
    }
    else {
        baseFrequency = 8.8;
    }
    // Beep count adds to frequency
    const beepCount = 1 + Math.floor(Math.random() * 5);
    // Check for FRK indicator bonus
    const hasFRK = indicators.some(i => i.label === 'FRK' && i.isLit);
    const frkBonus = hasFRK ? 0.5 : 0;
    const targetFrequency = Math.round((baseFrequency + (beepCount * 0.3) + frkBonus) * 10) / 10;
    // Determine audio pattern
    const audioPatterns = ['morse', 'tones', 'numbers'];
    const audioPattern = audioPatterns[Math.floor(Math.random() * audioPatterns.length)];
    // Target AM/FM based on audio
    const targetAmFm = audioPattern === 'morse' ? 'AM' : 'FM';
    return {
        type: 'frequency-tuner',
        defuserView: {
            currentFrequency: 3.5 + Math.random() * 7, // Random starting position
            amFmSwitch: Math.random() > 0.5 ? 'AM' : 'FM',
            boostSwitch: false,
            filterSwitch: false,
            audioPattern: 'static',
            beepCount,
            transmitted: false,
        },
        solution: { targetFrequency, targetAmFm },
    };
}
export function validateFrequencyTuner(puzzle, action) {
    const view = puzzle.defuserView;
    const solution = puzzle.solution;
    const actionData = action;
    // Support both 'type' and 'action' field for action type
    const actionType = actionData.type || actionData.action;
    switch (actionType) {
        case 'tune':
            if (typeof actionData.frequency === 'number') {
                view.currentFrequency = Math.max(3.5, Math.min(10.5, actionData.frequency));
                // Update audio pattern based on frequency proximity to target
                const diff = Math.abs(view.currentFrequency - solution.targetFrequency);
                if (diff < 0.2) {
                    view.audioPattern = view.amFmSwitch === solution.targetAmFm ? 'tones' : 'static';
                }
                else if (diff < 1.0) {
                    view.audioPattern = view.filterSwitch ? 'morse' : 'static';
                }
                else {
                    view.audioPattern = 'static';
                }
            }
            return { correct: false, message: `Frequency: ${view.currentFrequency.toFixed(1)} MHz` };
        case 'switch':
            if (actionData.switchName === 'amfm') {
                view.amFmSwitch = actionData.value;
            }
            else if (actionData.switchName === 'boost') {
                view.boostSwitch = actionData.value;
            }
            else if (actionData.switchName === 'filter') {
                view.filterSwitch = actionData.value;
            }
            return { correct: false, message: 'Switch toggled' };
        case 'transmit': {
            // Client format: { type: 'transmit', frequency, mode }
            // Get frequency/mode from action or from current view state
            const submittedFrequency = actionData.frequency ?? view.currentFrequency;
            const submittedMode = actionData.mode ?? view.amFmSwitch;
            // Check if frequency is correct (within 0.2 MHz tolerance)
            const freqDiff = Math.abs(submittedFrequency - solution.targetFrequency);
            const modeCorrect = submittedMode === solution.targetAmFm;
            if (freqDiff > 0.2) {
                return { correct: false, message: `Wrong frequency! Off by ${freqDiff.toFixed(1)} MHz. STRIKE!`, strike: true };
            }
            if (!modeCorrect) {
                return { correct: false, message: `Wrong mode! Should be ${solution.targetAmFm}. STRIKE!`, strike: true };
            }
            view.transmitted = true;
            return { correct: true, message: 'Signal transmitted successfully!' };
        }
        default:
            return { correct: false, message: 'Invalid action' };
    }
}
