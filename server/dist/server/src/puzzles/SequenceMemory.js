const DISPLAY_TYPES = ['number', 'color'];
const BUTTON_COLORS = ['red', 'blue', 'green', 'yellow'];
// Fixed button positions
const BUTTON_POSITIONS = ['red', 'blue', 'green', 'yellow'];
export function generateSequenceMemory(difficulty, _serialNumber, _indicators) {
    const totalStages = difficulty === 'easy' ? 3 :
        difficulty === 'medium' ? 4 : 5;
    // Generate stages
    const stages = [];
    for (let i = 0; i < totalStages; i++) {
        const displayType = Math.random() > 0.5 ? 'number' : 'color';
        let display;
        let correctPosition;
        if (displayType === 'number') {
            display = String(1 + Math.floor(Math.random() * 4));
            // Rules for numbers vary by stage (simplified)
            correctPosition = (parseInt(display) - 1) % 4;
        }
        else {
            const colorWord = BUTTON_COLORS[Math.floor(Math.random() * BUTTON_COLORS.length)];
            display = colorWord.toUpperCase();
            // For colors, press that color
            correctPosition = BUTTON_POSITIONS.indexOf(colorWord);
        }
        stages.push({ display, displayType, correctPosition });
    }
    return {
        type: 'sequence-memory',
        defuserView: {
            display: stages[0].display,
            displayType: stages[0].displayType,
            buttons: [...BUTTON_POSITIONS],
            currentStage: 1,
            totalStages,
            stageHistory: [],
        },
        solution: { stages },
    };
}
export function validateSequenceMemory(puzzle, action) {
    const view = puzzle.defuserView;
    const solution = puzzle.solution;
    const actionData = action;
    // Client sends 1-indexed position (1-4), convert to 0-indexed for internal logic
    const clientPosition = actionData.position;
    if (typeof clientPosition !== 'number' || clientPosition < 1 || clientPosition > 4) {
        return { correct: false, message: 'Invalid position' };
    }
    const position = clientPosition - 1; // Convert to 0-indexed
    // Get the current stage solution
    const stageIndex = view.currentStage - 1;
    const stageSolution = solution.stages[stageIndex];
    if (!stageSolution) {
        return { correct: false, message: 'Invalid stage' };
    }
    // Determine correct position based on display and stage rules
    let correctPosition;
    if (stageSolution.displayType === 'number') {
        // Number display rules
        const displayNum = parseInt(stageSolution.display);
        if (view.currentStage === 1) {
            // Stage 1 number rules
            if (displayNum === 1)
                correctPosition = 1; // Press position 2
            else if (displayNum === 2)
                correctPosition = 1; // Press position 2
            else if (displayNum === 3)
                correctPosition = 2; // Press position 3
            else
                correctPosition = 3; // Press position 4
        }
        else if (view.currentStage === 2) {
            // Stage 2: "1" = same COLOR as stage 1, "2" = position 1
            if (displayNum === 1 && view.stageHistory.length > 0) {
                // Find button with same color as stage 1
                const stage1Color = view.stageHistory[0].color;
                correctPosition = view.buttons.indexOf(stage1Color);
            }
            else if (displayNum === 2) {
                correctPosition = 0; // Press position 1
            }
            else {
                correctPosition = displayNum - 1;
            }
        }
        else {
            // Stage 3+: press same POSITION as that stage number
            const refStage = Math.min(displayNum, view.stageHistory.length);
            correctPosition = view.stageHistory[refStage - 1]?.position ?? (displayNum - 1);
        }
    }
    else {
        // Color display rules
        const displayColor = stageSolution.display.toLowerCase();
        if (view.currentStage === 1) {
            // Press the button with that color
            correctPosition = view.buttons.indexOf(displayColor);
        }
        else if (view.currentStage === 2) {
            // "YELLOW" = same POSITION as stage 1, "GREEN" = position 1
            if (displayColor === 'yellow' && view.stageHistory.length > 0) {
                correctPosition = view.stageHistory[0].position;
            }
            else if (displayColor === 'green') {
                correctPosition = 0;
            }
            else {
                correctPosition = view.buttons.indexOf(displayColor);
            }
        }
        else {
            // Stage 3+: color = same COLOR as previous stage
            const prevColor = view.stageHistory[view.stageHistory.length - 1]?.color;
            correctPosition = prevColor ? view.buttons.indexOf(prevColor) : view.buttons.indexOf(displayColor);
        }
    }
    // Check if pressed position is correct
    if (position !== correctPosition) {
        return { correct: false, message: `Wrong! Should have pressed position ${correctPosition + 1}. STRIKE!`, strike: true };
    }
    // Record what was pressed
    const pressedColor = view.buttons[position];
    view.stageHistory.push({ position: position, color: pressedColor });
    // Check if this is the last stage
    if (view.currentStage >= view.totalStages) {
        return { correct: true, message: 'Memory sequence complete!' };
    }
    // Advance to next stage
    view.currentStage++;
    // Load next stage display
    const nextStage = solution.stages[view.currentStage - 1];
    if (nextStage) {
        view.display = nextStage.display;
        view.displayType = nextStage.displayType;
    }
    return { correct: false, message: `Stage ${view.currentStage - 1} complete! Stage ${view.currentStage}/${view.totalStages}` };
}
