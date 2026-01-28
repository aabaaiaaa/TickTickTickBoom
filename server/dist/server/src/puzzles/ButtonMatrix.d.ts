import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const BUTTON_COLORS: readonly ["red", "blue", "yellow", "green", "white"];
type ButtonColor = typeof BUTTON_COLORS[number];
declare const BUTTON_LABELS: readonly ["PRESS", "HOLD", "ABORT", "DETONATE", "ARM"];
type ButtonLabel = typeof BUTTON_LABELS[number];
export interface Button {
    color: ButtonColor;
    label: ButtonLabel;
    ledOn: boolean;
    position: {
        row: number;
        col: number;
    };
}
export interface ButtonMatrixView {
    buttons: Button[][];
    pressedButtons: string[];
    heldButton: string | null;
    indicatorColor: ButtonColor | null;
}
interface ButtonMatrixSolution {
    targetButton: string;
    action: 'press' | 'hold';
    releaseDigit?: number;
}
interface ButtonMatrixPuzzle {
    type: PuzzleType;
    defuserView: ButtonMatrixView;
    solution: ButtonMatrixSolution;
}
export declare function generateButtonMatrix(difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): ButtonMatrixPuzzle;
export declare function validateButtonMatrix(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
