import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
type OverrideMode = 'STANDARD' | 'ACCELERATED' | 'CRITICAL';
type ChallengeType = 'math' | 'word' | 'pattern';
export interface CountdownOverrideView {
    mode: OverrideMode;
    challenge: {
        type: ChallengeType;
        question: string;
        answer: string;
    };
    inputValue: string;
    completed: boolean;
}
interface CountdownOverrideSolution {
    answer: string;
}
interface CountdownOverridePuzzle {
    type: PuzzleType;
    defuserView: CountdownOverrideView;
    solution: CountdownOverrideSolution;
}
export declare function generateCountdownOverride(difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): CountdownOverridePuzzle;
export declare function validateCountdownOverride(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
