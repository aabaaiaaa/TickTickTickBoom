import type { PuzzleInstance } from '../../../shared/types.js';
export interface ValidationResult {
    correct: boolean;
    message?: string;
    strike?: boolean;
}
export declare function registerValidator(puzzleType: string, validator: (puzzle: PuzzleInstance, action: unknown) => ValidationResult): void;
export declare function validatePuzzleAction(puzzle: PuzzleInstance, action: unknown): ValidationResult;
