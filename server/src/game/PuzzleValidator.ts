import type { PuzzleInstance } from '../../../shared/types.js';

export interface ValidationResult {
    correct: boolean;
    message?: string;
    strike?: boolean;  // If true, this action causes a strike. If omitted/false, no strike.
}

// This will be expanded as each puzzle type is implemented
const validators: Record<string, (puzzle: PuzzleInstance, action: unknown) => ValidationResult> = {};

export function registerValidator(
    puzzleType: string,
    validator: (puzzle: PuzzleInstance, action: unknown) => ValidationResult
): void {
    validators[puzzleType] = validator;
}

export function validatePuzzleAction(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const validator = validators[puzzle.type];
    if (!validator) {
        console.warn(`No validator registered for puzzle type: ${puzzle.type}`);
        return { correct: false, message: 'Unknown puzzle type' };
    }
    return validator(puzzle, action);
}

// Import and register all puzzle validators
import { validateWireArray } from '../puzzles/WireArray.js';
import { validateButtonMatrix } from '../puzzles/ButtonMatrix.js';
import { validateKeypadCipher } from '../puzzles/KeypadCipher.js';
import { validateIndicatorLights } from '../puzzles/IndicatorLights.js';
import { validateFrequencyTuner } from '../puzzles/FrequencyTuner.js';
import { validateSimonSignals } from '../puzzles/SimonSignals.js';
import { validateSequenceMemory } from '../puzzles/SequenceMemory.js';
import { validateCountdownOverride } from '../puzzles/CountdownOverride.js';
import { validateCapacitorBank } from '../puzzles/CapacitorBank.js';
import { validatePressureEqualizer } from '../puzzles/PressureEqualizer.js';
import { validateMazeNavigator } from '../puzzles/MazeNavigator.js';
import { validateMechanicalSwitches } from '../puzzles/MechanicalSwitches.js';

registerValidator('wire-array', validateWireArray);
registerValidator('button-matrix', validateButtonMatrix);
registerValidator('keypad-cipher', validateKeypadCipher);
registerValidator('indicator-lights', validateIndicatorLights);
registerValidator('frequency-tuner', validateFrequencyTuner);
registerValidator('simon-signals', validateSimonSignals);
registerValidator('sequence-memory', validateSequenceMemory);
registerValidator('countdown-override', validateCountdownOverride);
registerValidator('capacitor-bank', validateCapacitorBank);
registerValidator('pressure-equalizer', validatePressureEqualizer);
registerValidator('maze-navigator', validateMazeNavigator);
registerValidator('mechanical-switches', validateMechanicalSwitches);
