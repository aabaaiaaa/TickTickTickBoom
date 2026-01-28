import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const DISPLAY_TYPES: readonly ["number", "color"];
type DisplayType = typeof DISPLAY_TYPES[number];
declare const BUTTON_COLORS: readonly ["red", "blue", "green", "yellow"];
type ButtonColor = typeof BUTTON_COLORS[number];
export interface SequenceMemoryView {
    display: string;
    displayType: DisplayType;
    buttons: ButtonColor[];
    currentStage: number;
    totalStages: number;
    stageHistory: Array<{
        position: number;
        color: ButtonColor;
    }>;
}
interface SequenceMemorySolution {
    stages: Array<{
        display: string;
        displayType: DisplayType;
        correctPosition: number;
    }>;
}
interface SequenceMemoryPuzzle {
    type: PuzzleType;
    defuserView: SequenceMemoryView;
    solution: SequenceMemorySolution;
}
export declare function generateSequenceMemory(difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): SequenceMemoryPuzzle;
export declare function validateSequenceMemory(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
