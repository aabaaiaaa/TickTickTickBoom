import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const SIMON_COLORS: readonly ["red", "blue", "green", "yellow"];
type SimonColor = typeof SIMON_COLORS[number];
export interface SimonSignalsView {
    sequence: SimonColor[];
    playerInput: SimonColor[];
    currentRound: number;
    totalRounds: number;
    isShowingSequence: boolean;
    hasVowelInSerial: boolean;
}
interface SimonSignalsSolution {
    sequences: SimonColor[][];
    fullSequence?: SimonColor[];
    translationKey: string;
}
interface SimonSignalsPuzzle {
    type: PuzzleType;
    defuserView: SimonSignalsView;
    solution: SimonSignalsSolution;
}
export declare function generateSimonSignals(difficulty: Difficulty, serialNumber: string, _indicators: IndicatorState[]): SimonSignalsPuzzle;
export declare function validateSimonSignals(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
