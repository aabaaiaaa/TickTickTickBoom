import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const SWITCH_SYMBOLS: readonly ["★", "◆", "●", "▲", "■", "♦"];
type SwitchSymbol = typeof SWITCH_SYMBOLS[number];
declare const HOUSING_COLORS: readonly ["red", "yellow", "green", "blue", "white"];
type HousingColor = typeof HOUSING_COLORS[number];
type TwoPosition = 'up' | 'down';
type ThreePosition = 'up' | 'middle' | 'down';
type RotaryPosition = 1 | 2 | 3 | 4;
interface TwoPositionSwitch {
    type: 'two-position';
    id: number;
    symbol: SwitchSymbol;
    housing: HousingColor;
    position: TwoPosition;
}
interface ThreePositionSwitch {
    type: 'three-position';
    id: number;
    symbol: SwitchSymbol;
    housing: HousingColor;
    position: ThreePosition;
}
interface RotarySwitch {
    type: 'rotary';
    id: number;
    symbol: SwitchSymbol;
    housing: HousingColor;
    position: RotaryPosition;
}
type Switch = TwoPositionSwitch | ThreePositionSwitch | RotarySwitch;
export interface MechanicalSwitchesView {
    switches: Switch[];
    statusLights: boolean[];
    targetPattern: boolean[];
}
interface MechanicalSwitchesSolution {
    targetConfiguration: Record<number, string>;
}
interface MechanicalSwitchesPuzzle {
    type: PuzzleType;
    defuserView: MechanicalSwitchesView;
    solution: MechanicalSwitchesSolution;
}
export declare function generateMechanicalSwitches(_difficulty: Difficulty, _serialNumber: string, indicators: IndicatorState[]): MechanicalSwitchesPuzzle;
export declare function validateMechanicalSwitches(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
