import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
declare const CAPACITOR_COLORS: readonly ["red", "yellow", "blue", "green", "purple"];
type CapacitorColor = typeof CAPACITOR_COLORS[number];
export interface Capacitor {
    id: string;
    voltage: number;
    colorBand: CapacitorColor;
    isCritical: boolean;
}
export interface CapacitorBankView {
    capacitors: Capacitor[];
    systemVoltage: number;
    discharged: boolean;
}
interface CapacitorBankSolution {
    targetVoltages: Record<string, {
        min: number;
        max: number;
    }>;
    maxSystemVoltage: number;
}
interface CapacitorBankPuzzle {
    type: PuzzleType;
    defuserView: CapacitorBankView;
    solution: CapacitorBankSolution;
}
export declare function generateCapacitorBank(difficulty: Difficulty, _serialNumber: string, indicators: IndicatorState[]): CapacitorBankPuzzle;
export declare function validateCapacitorBank(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
