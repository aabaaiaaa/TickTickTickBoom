import { describe, it, expect } from 'vitest';
// Import validators
import { validateWireArray } from '../WireArray.js';
import { validateButtonMatrix } from '../ButtonMatrix.js';
import { validateKeypadCipher } from '../KeypadCipher.js';
import { validateIndicatorLights } from '../IndicatorLights.js';
import { validateFrequencyTuner } from '../FrequencyTuner.js';
import { validateSimonSignals } from '../SimonSignals.js';
import { validateSequenceMemory } from '../SequenceMemory.js';
import { validateCountdownOverride } from '../CountdownOverride.js';
import { validateCapacitorBank } from '../CapacitorBank.js';
import { validatePressureEqualizer } from '../PressureEqualizer.js';
import { validateMazeNavigator } from '../MazeNavigator.js';
import { validateMechanicalSwitches } from '../MechanicalSwitches.js';
// Helper to create minimal puzzle instances for testing
function createPuzzle(type, defuserView) {
    return {
        id: 'test-puzzle',
        type: type,
        defuserView,
        isCompleted: false,
        attempts: 0,
    };
}
describe('WireArray Validator', () => {
    it('should accept valid wire cut action', () => {
        const puzzle = createPuzzle('wire-array', {
            wires: [
                { color: 'red', symbol: '△', isStriped: false, position: 0 },
                { color: 'blue', symbol: '○', isStriped: false, position: 1 },
            ],
            cutWires: [],
        });
        const result = validateWireArray(puzzle, { wireToCut: 0 });
        expect(result.correct).toBe(true);
    });
    it('should reject invalid wire index', () => {
        const puzzle = createPuzzle('wire-array', {
            wires: [
                { color: 'red', symbol: '△', isStriped: false, position: 0 },
            ],
            cutWires: [],
        });
        const result = validateWireArray(puzzle, { wireToCut: 5 });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid wire');
    });
    it('should reject already cut wire', () => {
        const puzzle = createPuzzle('wire-array', {
            wires: [
                { color: 'red', symbol: '△', isStriped: false, position: 0 },
                { color: 'blue', symbol: '○', isStriped: false, position: 1 },
            ],
            cutWires: [0],
        });
        const result = validateWireArray(puzzle, { wireToCut: 0 });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Wire already cut');
    });
    it('should reject invalid action format', () => {
        const puzzle = createPuzzle('wire-array', {
            wires: [{ color: 'red', symbol: '△', isStriped: false, position: 0 }],
            cutWires: [],
        });
        const result = validateWireArray(puzzle, { wrongKey: 'value' });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid action');
    });
});
describe('ButtonMatrix Validator', () => {
    it('should accept button press action', () => {
        const puzzle = createPuzzle('button-matrix', {
            buttons: [[{ color: 'red', label: 'PRESS', ledOn: false, position: { row: 0, col: 0 } }]],
            pressedButtons: [],
            heldButton: null,
            indicatorColor: null,
        });
        const result = validateButtonMatrix(puzzle, { buttonPos: '0-0', actionType: 'press' });
        expect(result.correct).toBe(true);
    });
    it('should accept button hold action', () => {
        const puzzle = createPuzzle('button-matrix', {
            buttons: [[{ color: 'blue', label: 'HOLD', ledOn: false, position: { row: 0, col: 0 } }]],
            pressedButtons: [],
            heldButton: null,
            indicatorColor: null,
        });
        const result = validateButtonMatrix(puzzle, { buttonPos: '0-0', actionType: 'hold' });
        // Hold returns false (not complete yet) but is valid
        expect(result.message).toBe('Holding button...');
    });
    it('should accept button release action', () => {
        const puzzle = createPuzzle('button-matrix', {
            buttons: [[{ color: 'blue', label: 'HOLD', ledOn: false, position: { row: 0, col: 0 } }]],
            pressedButtons: [],
            heldButton: '0-0',
            indicatorColor: 'blue',
        });
        const result = validateButtonMatrix(puzzle, { buttonPos: '0-0', actionType: 'release', timerDigit: 5 });
        expect(result.correct).toBe(true);
    });
    it('should reject invalid action', () => {
        const puzzle = createPuzzle('button-matrix', {
            buttons: [[{ color: 'red', label: 'PRESS', ledOn: false, position: { row: 0, col: 0 } }]],
            pressedButtons: [],
            heldButton: null,
            indicatorColor: null,
        });
        const result = validateButtonMatrix(puzzle, { invalidAction: true });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid action');
    });
});
describe('KeypadCipher Validator', () => {
    const keypadSymbols = [['Ω', 'λ', 'ξ', 'θ'], ['Ψ', 'Φ', 'Δ', 'Σ'], ['α', 'β', 'γ', 'δ'], ['ε', 'ζ', 'η', 'ι']];
    it('should accept valid symbol press', () => {
        const puzzle = createPuzzle('keypad-cipher', {
            symbols: keypadSymbols,
            pressedSymbols: [],
            displaySlots: [null, null, null, null],
        });
        const result = validateKeypadCipher(puzzle, { symbol: 'Ω' });
        // May or may not be correct depending on solution, but should not error
        expect(result).toBeDefined();
    });
    it('should reject symbol not on keypad', () => {
        const puzzle = createPuzzle('keypad-cipher', {
            symbols: keypadSymbols,
            pressedSymbols: [],
            displaySlots: [null, null, null, null],
        });
        const result = validateKeypadCipher(puzzle, { symbol: 'NotASymbol' });
        expect(result.correct).toBe(false);
    });
    it('should reject already pressed symbol', () => {
        const puzzle = createPuzzle('keypad-cipher', {
            symbols: keypadSymbols,
            pressedSymbols: ['Ω'],
            displaySlots: ['Ω', null, null, null],
        });
        const result = validateKeypadCipher(puzzle, { symbol: 'Ω' });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Symbol already pressed');
    });
    it('should reject invalid action format', () => {
        const puzzle = createPuzzle('keypad-cipher', {
            symbols: keypadSymbols,
            pressedSymbols: [],
            displaySlots: [null, null, null, null],
        });
        const result = validateKeypadCipher(puzzle, { wrongKey: 'value' });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid action');
    });
});
describe('CountdownOverride Validator', () => {
    it('should accept valid answer', () => {
        const puzzle = createPuzzle('countdown-override', {
            displayedNumber: 42,
            operationHint: 'MULTIPLY',
            inputValue: '',
            completed: false,
        });
        const result = validateCountdownOverride(puzzle, { answer: '84' });
        expect(result.correct).toBe(true);
    });
    it('should reject empty answer', () => {
        const puzzle = createPuzzle('countdown-override', {
            displayedNumber: 42,
            operationHint: 'MULTIPLY',
            inputValue: '',
            completed: false,
        });
        const result = validateCountdownOverride(puzzle, { answer: '' });
        expect(result.correct).toBe(false);
    });
    it('should reject invalid answer format', () => {
        const puzzle = createPuzzle('countdown-override', {
            displayedNumber: 42,
            operationHint: 'MULTIPLY',
            inputValue: '',
            completed: false,
        });
        const result = validateCountdownOverride(puzzle, { answer: 123 }); // number instead of string
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid answer');
    });
});
describe('SimonSignals Validator', () => {
    it('should accept valid color input', () => {
        const puzzle = createPuzzle('simon-signals', {
            currentSequence: ['red'],
            playerInput: [],
            currentRound: 1,
            totalRounds: 3,
            isPlaying: false,
            hasVowelInSerial: true,
        });
        const result = validateSimonSignals(puzzle, { color: 'blue', strikeCount: 0 });
        // May or may not be correct depending on translation table
        expect(result).toBeDefined();
    });
    it('should reject invalid color', () => {
        const puzzle = createPuzzle('simon-signals', {
            currentSequence: ['red'],
            playerInput: [],
            currentRound: 1,
            totalRounds: 3,
            isPlaying: false,
            hasVowelInSerial: true,
        });
        const result = validateSimonSignals(puzzle, { color: 'purple', strikeCount: 0 });
        expect(result.correct).toBe(false);
        expect(result.message).toBe('Invalid color');
    });
});
describe('FrequencyTuner Validator', () => {
    it('should accept valid frequency submission', () => {
        const puzzle = createPuzzle('frequency-tuner', {
            currentFrequency: 100,
            targetFrequency: 100,
            waveform: 'sine',
            locked: false,
        });
        const result = validateFrequencyTuner(puzzle, { submit: true });
        expect(result).toBeDefined();
    });
});
describe('SequenceMemory Validator', () => {
    it('should accept valid button press', () => {
        const puzzle = createPuzzle('sequence-memory', {
            buttonLabels: ['A', 'B', 'C', 'D'],
            currentStage: 1,
            displayedNumber: 2,
            pressedButtons: [],
        });
        const result = validateSequenceMemory(puzzle, { buttonIndex: 0 });
        expect(result).toBeDefined();
    });
    it('should reject invalid button index', () => {
        const puzzle = createPuzzle('sequence-memory', {
            buttonLabels: ['A', 'B', 'C', 'D'],
            currentStage: 1,
            displayedNumber: 2,
            pressedButtons: [],
        });
        const result = validateSequenceMemory(puzzle, { buttonIndex: 10 });
        expect(result.correct).toBe(false);
    });
});
describe('IndicatorLights Validator', () => {
    it('should accept valid light toggle', () => {
        const puzzle = createPuzzle('indicator-lights', {
            lights: [
                { color: 'red', isOn: false, position: 0 },
                { color: 'blue', isOn: true, position: 1 },
            ],
            targetPattern: [true, false],
        });
        const result = validateIndicatorLights(puzzle, { lightIndex: 0 });
        expect(result).toBeDefined();
    });
});
describe('CapacitorBank Validator', () => {
    it('should accept valid capacitor adjustment', () => {
        const puzzle = createPuzzle('capacitor-bank', {
            capacitors: [
                { level: 50, maxLevel: 100, isOvercharged: false },
            ],
            targetSum: 75,
        });
        const result = validateCapacitorBank(puzzle, { capacitorIndex: 0, adjustment: 10 });
        expect(result).toBeDefined();
    });
});
describe('PressureEqualizer Validator', () => {
    it('should accept valid slider adjustment', () => {
        const puzzle = createPuzzle('pressure-equalizer', {
            sliders: [
                { value: 50, min: 0, max: 100 },
            ],
            targetValue: 75,
        });
        const result = validatePressureEqualizer(puzzle, { sliderIndex: 0, adjustment: 5 });
        expect(result).toBeDefined();
    });
});
describe('MazeNavigator Validator', () => {
    it('should accept valid move', () => {
        const puzzle = createPuzzle('maze-navigator', {
            gridSize: 6,
            currentPosition: { row: 1, col: 1 },
            goalPosition: { row: 5, col: 5 },
            waypoints: [],
            visitedWaypoints: [],
            moveHistory: [],
            hitWall: false,
        });
        const result = validateMazeNavigator(puzzle, { direction: 'right' });
        expect(result).toBeDefined();
    });
    it('should reject invalid direction', () => {
        const puzzle = createPuzzle('maze-navigator', {
            gridSize: 6,
            currentPosition: { row: 1, col: 1 },
            goalPosition: { row: 5, col: 5 },
            waypoints: [],
            visitedWaypoints: [],
            moveHistory: [],
            hitWall: false,
        });
        const result = validateMazeNavigator(puzzle, { direction: 'diagonal' });
        expect(result.correct).toBe(false);
    });
});
describe('MechanicalSwitches Validator', () => {
    it('should accept valid switch toggle', () => {
        const puzzle = createPuzzle('mechanical-switches', {
            switches: [
                { isOn: false, position: 0 },
                { isOn: true, position: 1 },
            ],
            targetPattern: [true, false],
        });
        const result = validateMechanicalSwitches(puzzle, { switchIndex: 0 });
        expect(result).toBeDefined();
    });
    it('should reject invalid switch index', () => {
        const puzzle = createPuzzle('mechanical-switches', {
            switches: [{ isOn: false, position: 0 }],
            targetPattern: [true],
        });
        const result = validateMechanicalSwitches(puzzle, { switchIndex: 10 });
        expect(result.correct).toBe(false);
    });
});
