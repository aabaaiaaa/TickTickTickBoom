import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const INDICATOR_LABELS: readonly ["FRK", "CAR", "BOB", "NSA", "SIG", "MSA", "CLR", "IND"];
type IndicatorLabel = typeof INDICATOR_LABELS[number];
declare const INDICATOR_COLORS: readonly ["red", "green", "blue", "white", "yellow"];
type IndicatorColor = typeof INDICATOR_COLORS[number];
export interface Indicator {
    label: IndicatorLabel;
    isLit: boolean;
    isFlickering: boolean;
    color: IndicatorColor;
    canToggle: boolean;
}
export interface IndicatorLightsView {
    indicators: Indicator[];
    verified: boolean;
}
interface IndicatorLightsSolution {
    maxFlickering: number;
    requireCarSigBothLit: boolean;
    requireEvenLitCount: boolean;
}
interface IndicatorLightsPuzzle {
    type: PuzzleType;
    defuserView: IndicatorLightsView;
    solution: IndicatorLightsSolution;
}
export declare function generateIndicatorLights(_difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): IndicatorLightsPuzzle;
export declare function validateIndicatorLights(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
