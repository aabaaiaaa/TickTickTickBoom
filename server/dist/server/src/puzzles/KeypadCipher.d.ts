import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const SYMBOL_POOL: readonly ["Ω", "∂", "Ψ", "Ͼ", "★", "⊗", "☽", "Ϙ", "⊕", "ϗ", "⚡", "☆", "¥", "©", "¶", "Ξ", "Ͽ", "☀", "Ԇ", "✿", "♠", "♣", "♥", "♦", "☢", "☣", "⚙", "⚛"];
type KeypadSymbol = typeof SYMBOL_POOL[number];
export interface KeypadCipherView {
    symbols: KeypadSymbol[][];
    pressedSymbols: KeypadSymbol[];
    displaySlots: (KeypadSymbol | null)[];
}
interface KeypadCipherSolution {
    correctSequence: KeypadSymbol[];
}
interface KeypadCipherPuzzle {
    type: PuzzleType;
    defuserView: KeypadCipherView;
    solution: KeypadCipherSolution;
}
export declare function generateKeypadCipher(difficulty: Difficulty, _serialNumber: string, indicators: IndicatorState[]): KeypadCipherPuzzle;
export declare function validateKeypadCipher(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
