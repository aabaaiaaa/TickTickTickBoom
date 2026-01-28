import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
type SwitchPosition = 'AM' | 'FM';
type ToggleState = boolean;
export interface FrequencyTunerView {
    currentFrequency: number;
    amFmSwitch: SwitchPosition;
    boostSwitch: ToggleState;
    filterSwitch: ToggleState;
    audioPattern: 'static' | 'morse' | 'tones' | 'numbers';
    beepCount: number;
    transmitted: boolean;
}
interface FrequencyTunerSolution {
    targetFrequency: number;
    targetAmFm: SwitchPosition;
}
interface FrequencyTunerPuzzle {
    type: PuzzleType;
    defuserView: FrequencyTunerView;
    solution: FrequencyTunerSolution;
}
export declare function generateFrequencyTuner(_difficulty: Difficulty, serialNumber: string, indicators: IndicatorState[]): FrequencyTunerPuzzle;
export declare function validateFrequencyTuner(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
