import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const WIRE_COLORS: readonly ["red", "blue", "yellow", "white", "black", "green"];
type WireColor = typeof WIRE_COLORS[number];
declare const WIRE_SYMBOLS: readonly ["△", "○", "□", "☆", "◇", "♠", "♣", "♥", "♦"];
type WireSymbol = typeof WIRE_SYMBOLS[number];
export interface Wire {
    color: WireColor;
    symbol: WireSymbol;
    isStriped: boolean;
    stripeColor?: WireColor;
    position: number;
}
export interface WireArrayView {
    wires: Wire[];
    cutWires: number[];
}
interface WireArraySolution {
    correctCuts: number[];
}
interface WireArrayPuzzle {
    type: PuzzleType;
    defuserView: WireArrayView;
    solution: WireArraySolution;
}
declare const puzzleSolutions: Map<string, WireArraySolution>;
export declare function generateWireArray(difficulty: Difficulty, serialNumber: string, _indicators: IndicatorState[]): WireArrayPuzzle;
export declare function validateWireArray(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export { puzzleSolutions };
