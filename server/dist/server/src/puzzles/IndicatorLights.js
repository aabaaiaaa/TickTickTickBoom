const INDICATOR_LABELS = ['FRK', 'CAR', 'BOB', 'NSA', 'SIG', 'MSA', 'CLR', 'IND'];
const INDICATOR_COLORS = ['red', 'green', 'blue', 'white', 'yellow'];
export function generateIndicatorLights(_difficulty, _serialNumber, _indicators) {
    // Select 6-8 indicators
    const count = 6 + Math.floor(Math.random() * 3);
    const shuffledLabels = [...INDICATOR_LABELS].sort(() => Math.random() - 0.5);
    const selectedLabels = shuffledLabels.slice(0, count);
    const indicators = selectedLabels.map(label => ({
        label,
        isLit: Math.random() > 0.5,
        isFlickering: Math.random() < 0.2,
        color: INDICATOR_COLORS[Math.floor(Math.random() * INDICATOR_COLORS.length)],
        canToggle: Math.random() > 0.3, // Most indicators can be toggled
    }));
    // Make sure at least 3 indicators can be toggled
    const toggleable = indicators.filter(i => i.canToggle);
    if (toggleable.length < 3) {
        indicators.filter(i => !i.canToggle).slice(0, 3 - toggleable.length).forEach(i => i.canToggle = true);
    }
    // Intentionally create an INVALID starting state that needs fixing
    // This ensures the defuser has to actually do something
    // Add extra flickering to violate the rule
    const nonFlickering = indicators.filter(i => !i.isFlickering && i.canToggle);
    if (nonFlickering.length > 0 && Math.random() > 0.5) {
        nonFlickering[0].isFlickering = true;
    }
    // Make lit count odd to violate the rule
    const litCount = indicators.filter(i => i.isLit).length;
    if (litCount % 2 === 0) {
        // Toggle one to make it odd
        const toggleableForLit = indicators.filter(i => i.canToggle);
        if (toggleableForLit.length > 0) {
            toggleableForLit[0].isLit = !toggleableForLit[0].isLit;
        }
    }
    // Maybe violate CAR/SIG rule
    const hasCar = indicators.find(i => i.label === 'CAR');
    const hasSig = indicators.find(i => i.label === 'SIG');
    if (hasCar && hasSig && Math.random() > 0.5) {
        hasCar.isLit = true;
        hasSig.isLit = false;
        // CRITICAL: Ensure SIG can be toggled to fix the violation!
        // The rule is "CAR lit requires SIG lit", so SIG must be toggleable
        if (!hasSig.canToggle) {
            hasSig.canToggle = true;
        }
    }
    const solution = {
        maxFlickering: 3,
        requireCarSigBothLit: true,
        requireEvenLitCount: true,
    };
    return {
        type: 'indicator-lights',
        defuserView: { indicators, verified: false },
        solution,
    };
}
export function validateIndicatorLights(puzzle, action) {
    const view = puzzle.defuserView;
    const actionData = action;
    // Handle toggle action
    if (actionData.type === 'toggle' && typeof actionData.index === 'number') {
        const indicator = view.indicators[actionData.index];
        if (!indicator) {
            return { correct: false, message: 'Invalid indicator' };
        }
        if (!indicator.canToggle) {
            return { correct: false, message: 'This indicator is locked!' };
        }
        // Toggle the lit state
        indicator.isLit = !indicator.isLit;
        // If it was flickering and we turn it off, stop flickering
        if (!indicator.isLit && indicator.isFlickering) {
            indicator.isFlickering = false;
        }
        return { correct: false, message: `Toggled ${indicator.label}` };
    }
    // Handle toggle-flicker action
    if (actionData.type === 'toggle-flicker' && typeof actionData.index === 'number') {
        const indicator = view.indicators[actionData.index];
        if (!indicator) {
            return { correct: false, message: 'Invalid indicator' };
        }
        if (!indicator.canToggle) {
            return { correct: false, message: 'This indicator is locked!' };
        }
        if (!indicator.isLit) {
            return { correct: false, message: 'Indicator must be lit to set flickering!' };
        }
        indicator.isFlickering = !indicator.isFlickering;
        return { correct: false, message: `${indicator.label} ${indicator.isFlickering ? 'now flickering' : 'stabilized'}` };
    }
    // Handle verify action
    if (actionData.type !== 'verify') {
        return { correct: false, message: 'Invalid action' };
    }
    // Check verification rules
    const flickeringCount = view.indicators.filter(i => i.isFlickering).length;
    if (flickeringCount > 3) {
        return { correct: false, message: 'Too many flickering indicators!' };
    }
    const litCount = view.indicators.filter(i => i.isLit).length;
    if (litCount % 2 !== 0) {
        return { correct: false, message: 'Lit count must be even!' };
    }
    const carIndicator = view.indicators.find(i => i.label === 'CAR');
    const sigIndicator = view.indicators.find(i => i.label === 'SIG');
    if (carIndicator?.isLit && !sigIndicator?.isLit) {
        return { correct: false, message: 'CAR lit requires SIG lit!' };
    }
    view.verified = true;
    return { correct: true, message: 'Indicators verified!' };
}
