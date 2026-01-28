import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';

const SWITCH_SYMBOLS = ['★', '◆', '●', '▲', '■', '♦'] as const;
type SwitchSymbol = typeof SWITCH_SYMBOLS[number];

const HOUSING_COLORS = ['red', 'yellow', 'green', 'blue', 'white'] as const;
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
    statusLights: boolean[]; // 5 status lights
    targetPattern: boolean[]; // Target light pattern
}

interface MechanicalSwitchesSolution {
    targetConfiguration: Record<number, string>;
}

interface MechanicalSwitchesPuzzle {
    type: PuzzleType;
    defuserView: MechanicalSwitchesView;
    solution: MechanicalSwitchesSolution;
}

export function generateMechanicalSwitches(
    _difficulty: Difficulty,
    _serialNumber: string,
    indicators: IndicatorState[]
): MechanicalSwitchesPuzzle {
    const switches: Switch[] = [];
    const usedSymbols = new Set<SwitchSymbol>();

    // Generate 2 two-position switches
    for (let i = 0; i < 2; i++) {
        let symbol: SwitchSymbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);

        switches.push({
            type: 'two-position',
            id: i + 1,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: Math.random() > 0.5 ? 'up' : 'down',
        });
    }

    // Generate 2 three-position switches
    for (let i = 0; i < 2; i++) {
        let symbol: SwitchSymbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);

        const positions: ThreePosition[] = ['up', 'middle', 'down'];
        switches.push({
            type: 'three-position',
            id: i + 3,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: positions[Math.floor(Math.random() * 3)],
        });
    }

    // Generate 2 rotary switches
    for (let i = 0; i < 2; i++) {
        let symbol: SwitchSymbol;
        do {
            symbol = SWITCH_SYMBOLS[Math.floor(Math.random() * SWITCH_SYMBOLS.length)];
        } while (usedSymbols.has(symbol));
        usedSymbols.add(symbol);

        switches.push({
            type: 'rotary',
            id: i + 5,
            symbol,
            housing: HOUSING_COLORS[Math.floor(Math.random() * HOUSING_COLORS.length)],
            position: (1 + Math.floor(Math.random() * 4)) as RotaryPosition,
        });
    }

    // Determine target pattern based on indicators
    const hasFRK = indicators.some(i => i.label === 'FRK' && i.isLit);
    const hasCAR = indicators.some(i => i.label === 'CAR' && i.isLit);

    let targetPattern: boolean[];
    if (hasFRK && hasCAR) {
        targetPattern = [true, false, true, false, true];
    } else if (hasFRK) {
        targetPattern = [true, true, false, false, true];
    } else if (hasCAR) {
        targetPattern = [false, true, true, true, false];
    } else {
        targetPattern = [true, true, true, false, false];
    }

    // Calculate initial status lights based on switch positions
    const statusLights = calculateStatusLights(switches);

    // Compute a target configuration that would achieve the target pattern
    // We'll search for a valid configuration
    const targetConfiguration = findTargetConfiguration(switches, targetPattern);

    return {
        type: 'mechanical-switches',
        defuserView: {
            switches,
            statusLights,
            targetPattern,
        },
        solution: {
            targetConfiguration,
        },
    };
}

// Find a switch configuration that produces the target light pattern AND passes all validation rules
function findTargetConfiguration(switches: Switch[], targetPattern: boolean[]): Record<number, string> {
    // Brute force search through all possible configurations
    const twoPositions: TwoPosition[] = ['up', 'down'];
    const threePositions: ThreePosition[] = ['up', 'middle', 'down'];
    const rotaryPositions: RotaryPosition[] = [1, 2, 3, 4];

    function* generateConfigs(idx: number, current: Switch[]): Generator<Switch[]> {
        if (idx >= switches.length) {
            yield [...current];
            return;
        }

        const sw = switches[idx];
        if (sw.type === 'two-position') {
            for (const pos of twoPositions) {
                current[idx] = { ...sw, position: pos };
                yield* generateConfigs(idx + 1, current);
            }
        } else if (sw.type === 'three-position') {
            for (const pos of threePositions) {
                current[idx] = { ...sw, position: pos };
                yield* generateConfigs(idx + 1, current);
            }
        } else {
            for (const pos of rotaryPositions) {
                current[idx] = { ...sw, position: pos };
                yield* generateConfigs(idx + 1, current);
            }
        }
    }

    // Check if a configuration passes all validation rules
    function passesRules(config: Switch[]): boolean {
        // Rule 1: ★ switches must be in the same position
        const starSwitches = config.filter(s => s.symbol === '★');
        if (starSwitches.length >= 2) {
            const positions = starSwitches.map(s => {
                if (s.type === 'two-position') return s.position;
                if (s.type === 'three-position') return s.position;
                return String(s.position);
            });
            if (new Set(positions).size > 1) {
                return false;
            }
        }

        // Rule 2: RED housing cannot be in position 1/up
        const redSwitch = config.find(s => s.housing === 'red');
        if (redSwitch) {
            if (redSwitch.type === 'two-position' && redSwitch.position === 'up') {
                return false;
            }
            if (redSwitch.type === 'rotary' && redSwitch.position === 1) {
                return false;
            }
        }

        return true;
    }

    for (const config of generateConfigs(0, [...switches])) {
        const lights = calculateStatusLights(config);
        if (lights.every((l, i) => l === targetPattern[i]) && passesRules(config)) {
            // Found a valid configuration
            const result: Record<number, string> = {};
            config.forEach((sw, idx) => {
                result[idx] = String(sw.position);
            });
            return result;
        }
    }

    // No valid configuration found - return empty (shouldn't happen with proper logic)
    return {};
}

function calculateStatusLights(switches: Switch[]): boolean[] {
    // Each switch contributes to certain lights
    // Switch 0 (two-pos): affects light 0
    // Switch 1 (two-pos): affects light 1
    // Switch 2 (three-pos): affects light 2
    // Switch 3 (three-pos): affects light 3
    // Switch 4 (rotary): affects light 4
    // Switch 5 (rotary): affects all lights when position is 4

    const lights: boolean[] = [false, false, false, false, false];

    switches.forEach((sw, idx) => {
        if (idx === 0 && sw.type === 'two-position' && sw.position === 'up') {
            lights[0] = true;
        }
        if (idx === 1 && sw.type === 'two-position' && sw.position === 'up') {
            lights[1] = true;
        }
        if (idx === 2 && sw.type === 'three-position') {
            if (sw.position === 'up') lights[2] = true;
            if (sw.position === 'middle') lights[1] = !lights[1]; // Toggle
        }
        if (idx === 3 && sw.type === 'three-position') {
            if (sw.position === 'up') lights[3] = true;
            if (sw.position === 'middle') lights[2] = !lights[2]; // Toggle
        }
        if (idx === 4 && sw.type === 'rotary') {
            if (sw.position >= 3) lights[4] = true;
            if (sw.position === 2) lights[3] = !lights[3]; // Toggle
        }
        if (idx === 5 && sw.type === 'rotary') {
            if (sw.position === 4) {
                // Position 4 on switch 5 lights up light 0
                lights[0] = true;
            }
            if (sw.position === 1) lights[4] = !lights[4]; // Toggle
        }
    });

    return lights;
}

export function validateMechanicalSwitches(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const view = puzzle.defuserView as MechanicalSwitchesView;
    const actionData = action as {
        type?: string;
        action?: string;
        switchId?: number;
        index?: number;
        newPosition?: string | number;
        position?: string | number;
    };

    // Support both 'type' and 'action' field
    const actionType = actionData.type || actionData.action;
    // Support both 'switchId' and 'index'
    const switchIndex = actionData.switchId ?? actionData.index;
    // Support both 'newPosition' and 'position'
    const newPosition = actionData.newPosition ?? actionData.position;

    if (actionType === 'toggle' || actionType === 'toggle-switch') {
        // Support both switchId and array index (0-based)
        const switchObj = typeof switchIndex === 'number'
            ? view.switches.find(s => s.id === switchIndex + 1) || view.switches[switchIndex]
            : undefined;
        if (!switchObj) {
            return { correct: false, message: 'Invalid switch' };
        }

        // If position provided directly, use it
        if (newPosition !== undefined) {
            if (switchObj.type === 'two-position') {
                (switchObj as TwoPositionSwitch).position = newPosition === 1 || newPosition === 'up' ? 'up' : 'down';
            } else if (switchObj.type === 'three-position') {
                const positions: ThreePosition[] = ['up', 'middle', 'down'];
                if (typeof newPosition === 'number') {
                    (switchObj as ThreePositionSwitch).position = positions[newPosition - 1] || positions[newPosition] || 'middle';
                } else {
                    (switchObj as ThreePositionSwitch).position = newPosition as ThreePosition;
                }
            } else if (switchObj.type === 'rotary') {
                (switchObj as RotarySwitch).position = (typeof newPosition === 'number' ? newPosition : 1) as RotaryPosition;
            }
        } else {
            // Toggle to next position
            if (switchObj.type === 'two-position') {
                (switchObj as TwoPositionSwitch).position =
                    (switchObj as TwoPositionSwitch).position === 'up' ? 'down' : 'up';
            } else if (switchObj.type === 'three-position') {
                const positions: ThreePosition[] = ['up', 'middle', 'down'];
                const currentIdx = positions.indexOf((switchObj as ThreePositionSwitch).position);
                (switchObj as ThreePositionSwitch).position = positions[(currentIdx + 1) % 3];
            } else if (switchObj.type === 'rotary') {
                const current = (switchObj as RotarySwitch).position;
                (switchObj as RotarySwitch).position = ((current % 4) + 1) as RotaryPosition;
            }
        }

        // Recalculate status lights
        view.statusLights = calculateStatusLights(view.switches);

        return { correct: false, message: 'Switch toggled' };
    }

    if (actionType === 'confirm' || actionType === 'submit-switches' || actionType === 'confirm-switches') {
        // Check if status lights match target pattern
        const matches = view.statusLights.every((light, i) => light === view.targetPattern[i]);

        if (!matches) {
            return { correct: false, message: 'Pattern does not match target!' };
        }

        // Check rules: switches with ★ must be same position
        const starSwitches = view.switches.filter(s => s.symbol === '★');
        if (starSwitches.length >= 2) {
            const positions = starSwitches.map(s => {
                if (s.type === 'two-position') return s.position;
                if (s.type === 'three-position') return s.position;
                return String(s.position);
            });
            if (new Set(positions).size > 1) {
                return { correct: false, message: '★ switches must be in same position!' };
            }
        }

        // Check: RED housing cannot be in position 1/up
        const redSwitch = view.switches.find(s => s.housing === 'red');
        if (redSwitch) {
            if (redSwitch.type === 'two-position' && redSwitch.position === 'up') {
                return { correct: false, message: 'RED housing switch cannot be UP!' };
            }
            if (redSwitch.type === 'rotary' && redSwitch.position === 1) {
                return { correct: false, message: 'RED housing switch cannot be in position 1!' };
            }
        }

        return { correct: true, message: 'Switches configured correctly!' };
    }

    return { correct: false, message: 'Invalid action' };
}
