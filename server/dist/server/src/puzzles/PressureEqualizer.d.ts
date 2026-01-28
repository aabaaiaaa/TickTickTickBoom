import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
type SliderPosition = 'A' | 'B' | 'C' | 'D' | 'E';
type IndicatorStatus = 'red' | 'yellow' | 'green';
export interface Slider {
    id: number;
    position: SliderPosition;
    pressure: number;
    indicator: IndicatorStatus;
    isLocked: boolean;
}
export interface PressureEqualizerView {
    sliders: Slider[];
    systemPressure: number;
    targetPressure: {
        min: number;
        max: number;
    };
}
interface PressureEqualizerSolution {
    unlockConditions: Record<number, string>;
    targetConfig: Record<number, SliderPosition[]>;
}
interface PressureEqualizerPuzzle {
    type: PuzzleType;
    defuserView: PressureEqualizerView;
    solution: PressureEqualizerSolution;
}
export declare function generatePressureEqualizer(difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): PressureEqualizerPuzzle;
export declare function validatePressureEqualizer(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
