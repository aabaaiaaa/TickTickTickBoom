import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';

const BUTTON_COLORS = ['red', 'blue', 'yellow', 'green', 'white'] as const;
type ButtonColor = typeof BUTTON_COLORS[number];

const BUTTON_LABELS = ['PRESS', 'HOLD', 'ABORT', 'DETONATE', 'ARM'] as const;
type ButtonLabel = typeof BUTTON_LABELS[number];

export interface Button {
    color: ButtonColor;
    label: ButtonLabel;
    ledOn: boolean;
    position: { row: number; col: number };
}

export interface ButtonMatrixView {
    buttons: Button[][]; // 3x3 grid
    pressedButtons: string[]; // "row-col" format
    heldButton: string | null; // Currently held button
    indicatorColor: ButtonColor | null; // Color shown when holding
}

interface ButtonMatrixSolution {
    targetButton: string; // "row-col"
    action: 'press' | 'hold';
    releaseDigit?: number; // If holding, release when timer contains this digit
}

interface ButtonMatrixPuzzle {
    type: PuzzleType;
    defuserView: ButtonMatrixView;
    solution: ButtonMatrixSolution;
}

export function generateButtonMatrix(
    difficulty: Difficulty,
    _serialNumber: string,
    _indicators: IndicatorState[]
): ButtonMatrixPuzzle {
    // Generate 3x3 button grid
    const buttons: Button[][] = [];
    const usedLabels = new Set<ButtonLabel>();

    for (let row = 0; row < 3; row++) {
        const rowButtons: Button[] = [];
        for (let col = 0; col < 3; col++) {
            const color = BUTTON_COLORS[Math.floor(Math.random() * BUTTON_COLORS.length)];

            // Try to get unique label, but allow duplicates if needed
            let label: ButtonLabel;
            const availableLabels = BUTTON_LABELS.filter(l => !usedLabels.has(l));
            if (availableLabels.length > 0 && Math.random() > 0.3) {
                label = availableLabels[Math.floor(Math.random() * availableLabels.length)];
                usedLabels.add(label);
            } else {
                label = BUTTON_LABELS[Math.floor(Math.random() * BUTTON_LABELS.length)];
            }

            rowButtons.push({
                color,
                label,
                ledOn: Math.random() > 0.5,
                position: { row, col },
            });
        }
        buttons.push(rowButtons);
    }

    // Determine solution
    const solution = determineSolution(buttons, difficulty);

    return {
        type: 'button-matrix',
        defuserView: {
            buttons,
            pressedButtons: [],
            heldButton: null,
            indicatorColor: null
        },
        solution,
    };
}

function determineSolution(buttons: Button[][], difficulty: Difficulty): ButtonMatrixSolution {
    // Find ABORT button
    let abortButton: Button | null = null;
    let abortPos = '';

    for (const row of buttons) {
        for (const btn of row) {
            if (btn.label === 'ABORT') {
                abortButton = btn;
                abortPos = `${btn.position.row}-${btn.position.col}`;
                break;
            }
        }
        if (abortButton) break;
    }

    // Rules based on ABORT button
    if (abortButton) {
        if (abortButton.color === 'blue' && abortButton.ledOn) {
            return { targetButton: abortPos, action: 'press' };
        }
        if (abortButton.color === 'red') {
            // Need to find different button
            const detonateBtn = findButtonByLabel(buttons, 'DETONATE');
            if (detonateBtn) {
                return {
                    targetButton: `${detonateBtn.position.row}-${detonateBtn.position.col}`,
                    action: 'hold',
                    releaseDigit: 5
                };
            }
        }
        // Default: hold ABORT
        return {
            targetButton: abortPos,
            action: 'hold',
            releaseDigit: abortButton.color === 'yellow' ? 7 : 1
        };
    }

    // No ABORT button - find any blue button
    const blueBtn = findButtonByColor(buttons, 'blue');
    if (blueBtn) {
        return {
            targetButton: `${blueBtn.position.row}-${blueBtn.position.col}`,
            action: 'press'
        };
    }

    // Fallback: press center button
    return { targetButton: '1-1', action: 'press' };
}

function findButtonByLabel(buttons: Button[][], label: ButtonLabel): Button | null {
    for (const row of buttons) {
        for (const btn of row) {
            if (btn.label === label) return btn;
        }
    }
    return null;
}

function findButtonByColor(buttons: Button[][], color: ButtonColor): Button | null {
    for (const row of buttons) {
        for (const btn of row) {
            if (btn.color === color) return btn;
        }
    }
    return null;
}

export function validateButtonMatrix(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const view = puzzle.defuserView as ButtonMatrixView;
    const solution = puzzle.solution as ButtonMatrixSolution;
    const actionData = action as {
        type?: string;
        row?: number;
        col?: number;
        heldDuration?: number;
        // Legacy fields
        buttonPos?: string;
        actionType?: 'press' | 'hold' | 'release';
        timerDigit?: number;
    };

    // Support both action formats
    let buttonPos: string;
    let actionType: 'press' | 'hold' | 'release';
    let heldDuration = actionData.heldDuration || 0;

    if (actionData.type === 'press-button' && actionData.row !== undefined && actionData.col !== undefined) {
        buttonPos = `${actionData.row}-${actionData.col}`;
        actionType = 'press';
    } else if (actionData.type === 'release-button' && actionData.row !== undefined && actionData.col !== undefined) {
        buttonPos = `${actionData.row}-${actionData.col}`;
        // If held for more than 500ms, treat as a hold+release action
        actionType = heldDuration > 500 ? 'release' : 'press';
    } else if (actionData.buttonPos && actionData.actionType) {
        buttonPos = actionData.buttonPos;
        actionType = actionData.actionType;
    } else {
        return { correct: false, message: 'Invalid action' };
    }

    const isCorrectButton = buttonPos === solution.targetButton;

    if (actionType === 'press') {
        view.pressedButtons.push(buttonPos);

        // Check if this is the correct button and action
        if (solution.action === 'press' && isCorrectButton) {
            return { correct: true, message: 'Button pressed correctly!' };
        } else if (solution.action === 'press' && !isCorrectButton) {
            return { correct: false, message: 'Wrong button! STRIKE!', strike: true };
        } else if (solution.action === 'hold') {
            return { correct: false, message: 'This button should be held, not pressed! STRIKE!', strike: true };
        }
        return { correct: false, message: 'Wrong action!' };
    }

    if (actionType === 'hold') {
        view.heldButton = buttonPos;
        // Assign indicator color based on the button being held
        const [row, col] = buttonPos.split('-').map(Number);
        const button = view.buttons[row]?.[col];
        view.indicatorColor = button?.color || BUTTON_COLORS[Math.floor(Math.random() * BUTTON_COLORS.length)];

        if (!isCorrectButton && solution.action === 'hold') {
            // Wrong button to hold
            return { correct: false, message: 'Wrong button to hold!' };
        }
        return { correct: false, message: `Holding... Release when timer shows ${solution.releaseDigit || 'correct digit'}` };
    }

    if (actionType === 'release') {
        // For combined hold+release from release-button with heldDuration
        const isValidHold = heldDuration > 500;

        if (!isValidHold && !view.heldButton) {
            return { correct: false, message: 'Not holding any button' };
        }

        const wasHolding = view.heldButton || buttonPos; // Use buttonPos for combined action
        view.heldButton = null;

        // Get button color for indicator rules
        const [row, col] = buttonPos.split('-').map(Number);
        const button = view.buttons[row]?.[col];
        const indicatorColor = view.indicatorColor || button?.color;
        view.indicatorColor = null;

        // Check if correct button was held
        if (wasHolding !== solution.targetButton) {
            return { correct: false, message: 'Released wrong button! STRIKE!', strike: true };
        }

        if (solution.action !== 'hold') {
            return { correct: false, message: 'This button should be pressed, not held! STRIKE!', strike: true };
        }

        // Check release timing based on indicator color
        const timerDigit = actionData.timerDigit;
        let expectedDigit = solution.releaseDigit || 5;

        // Indicator color rules
        if (indicatorColor === 'yellow') expectedDigit = 7;
        else if (indicatorColor === 'white') expectedDigit = 1;
        else if (indicatorColor === 'blue') expectedDigit = 4;
        else expectedDigit = 5;

        if (timerDigit !== undefined && String(timerDigit).includes(String(expectedDigit))) {
            return { correct: true, message: 'Button released at correct time!' };
        } else if (timerDigit !== undefined) {
            return { correct: false, message: `Wrong timing! Should release when timer shows ${expectedDigit}. STRIKE!`, strike: true };
        }

        // If no timer digit provided, accept it (simplified for testing)
        return { correct: true, message: 'Button released!' };
    }

    return { correct: false, message: 'Unknown action' };
}
