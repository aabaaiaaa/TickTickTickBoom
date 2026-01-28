import type { GameState, Difficulty, PuzzleInstance, IndicatorState } from '../../../shared/types.js';
import { generateSerialNumber, DIFFICULTY_PRESETS } from '../../../shared/types.js';
import { generateWireArray } from '../puzzles/WireArray.js';
import { generateButtonMatrix } from '../puzzles/ButtonMatrix.js';
import { generateKeypadCipher } from '../puzzles/KeypadCipher.js';
import { generateIndicatorLights } from '../puzzles/IndicatorLights.js';
import { generateFrequencyTuner } from '../puzzles/FrequencyTuner.js';
import { generateSimonSignals } from '../puzzles/SimonSignals.js';
import { generateSequenceMemory } from '../puzzles/SequenceMemory.js';
import { generateCountdownOverride } from '../puzzles/CountdownOverride.js';
import { generateCapacitorBank } from '../puzzles/CapacitorBank.js';
import { generatePressureEqualizer } from '../puzzles/PressureEqualizer.js';
import { generateMazeNavigator } from '../puzzles/MazeNavigator.js';
import { generateMechanicalSwitches } from '../puzzles/MechanicalSwitches.js';

// Enable/disable debug logging
const DEBUG_SOLUTIONS = true;

const PUZZLE_GENERATORS = [
    generateWireArray,
    generateButtonMatrix,
    generateKeypadCipher,
    generateIndicatorLights,
    generateFrequencyTuner,
    generateSimonSignals,
    generateSequenceMemory,
    generateCountdownOverride,
    generateCapacitorBank,
    generatePressureEqualizer,
    generateMazeNavigator,
    generateMechanicalSwitches,
];

export function generateGame(difficulty: Difficulty, puzzleCount: number): GameState {
    const serialNumber = generateSerialNumber();
    const indicators = generateIndicators();
    const settings = DIFFICULTY_PRESETS[difficulty];

    // Select puzzles based on difficulty
    const selectedPuzzles = selectPuzzles(difficulty, puzzleCount);

    const puzzles: PuzzleInstance[] = selectedPuzzles.map((generator, index) => {
        const puzzle = generator(difficulty, serialNumber, indicators);
        return {
            id: `puzzle-${index}`,
            type: puzzle.type,
            defuserView: puzzle.defuserView,
            solution: puzzle.solution, // Store solution for validation
            isCompleted: false,
            attempts: 0,
        };
    });

    // Debug: Log all puzzle solutions
    if (DEBUG_SOLUTIONS) {
        logPuzzleSolutions(puzzles, serialNumber, indicators);
    }

    return {
        timeRemaining: settings.timeSeconds,
        strikes: 0,
        maxStrikes: 3,
        puzzles,
        currentPuzzleIndex: 0,
        completedCount: 0,
        serialNumber,
        indicators,
        score: 0,
    };
}

function generateIndicators(): IndicatorState[] {
    const labels = ['FRK', 'CAR', 'BOB', 'NSA', 'SIG', 'MSA', 'CLR', 'IND'];
    const colors: IndicatorState['color'][] = ['red', 'green', 'blue', 'white', 'yellow'];

    // Randomly select 4-6 indicators
    const count = 4 + Math.floor(Math.random() * 3);
    const shuffled = [...labels].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count).map(label => ({
        label,
        isLit: Math.random() > 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
    }));
}

function selectPuzzles(difficulty: Difficulty, count: number): typeof PUZZLE_GENERATORS {
    // For easier difficulties, use simpler puzzles
    // For harder difficulties, include all puzzles

    let availableGenerators: typeof PUZZLE_GENERATORS;

    // Handle individual puzzle test modes
    const puzzleTestModes: Record<string, number> = {
        'test-wire-array': 0,
        'test-button-matrix': 1,
        'test-keypad-cipher': 2,
        'test-indicator-lights': 3,
        'test-frequency-tuner': 4,
        'test-simon-signals': 5,
        'test-sequence-memory': 6,
        'test-countdown-override': 7,
        'test-capacitor-bank': 8,
        'test-pressure-equalizer': 9,
        'test-maze-navigator': 10,
        'test-mechanical-switches': 11,
    };

    if (difficulty in puzzleTestModes) {
        const puzzleIndex = puzzleTestModes[difficulty];
        return [PUZZLE_GENERATORS[puzzleIndex]];
    }

    switch (difficulty) {
        case 'easy':
            // Use only the simpler puzzles (first 6)
            availableGenerators = PUZZLE_GENERATORS.slice(0, 6);
            break;
        case 'medium':
            // Use first 8 puzzles
            availableGenerators = PUZZLE_GENERATORS.slice(0, 8);
            break;
        case 'hard':
            // Use first 10 puzzles
            availableGenerators = PUZZLE_GENERATORS.slice(0, 10);
            break;
        case 'expert':
            // Use all puzzles
            availableGenerators = [...PUZZLE_GENERATORS];
            break;
        case 'test':
            // Test mode: use ALL 12 puzzles, each exactly once (no shuffle, predictable order)
            return [...PUZZLE_GENERATORS];
        case 'defeat-test':
            // Defeat test: just wire-array (first puzzle, reliable for testing)
            return [PUZZLE_GENERATORS[0]];
        default:
            availableGenerators = [...PUZZLE_GENERATORS];
    }

    // Shuffle and select required count
    const shuffled = [...availableGenerators].sort(() => Math.random() - 0.5);

    // If we need more puzzles than available types, repeat some
    const selected: typeof PUZZLE_GENERATORS = [];
    while (selected.length < count) {
        const remaining = count - selected.length;
        selected.push(...shuffled.slice(0, Math.min(remaining, shuffled.length)));
    }

    return selected;
}

// Debug function to log puzzle solutions in human-readable format
function logPuzzleSolutions(puzzles: PuzzleInstance[], serialNumber: string, indicators: IndicatorState[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎮 GAME DEBUG - PUZZLE SOLUTIONS');
    console.log('='.repeat(60));
    console.log(`Serial Number: ${serialNumber}`);
    console.log(`Indicators: ${indicators.map(i => `${i.label}(${i.isLit ? 'LIT' : 'off'})`).join(', ')}`);
    console.log('-'.repeat(60));

    puzzles.forEach((puzzle, index) => {
        console.log(`\n📦 Puzzle ${index + 1}: ${puzzle.type.toUpperCase()}`);

        const view = puzzle.defuserView as Record<string, unknown>;
        const solution = puzzle.solution as Record<string, unknown>;

        switch (puzzle.type) {
            case 'wire-array': {
                const correctCuts = (solution?.correctCuts as number[]) || [];
                const wires = (view?.wires as Array<{ color: string; symbol: string; position: number }>) || [];
                console.log(`  Solution: Cut wire(s) at position(s): ${correctCuts.join(', ')}`);
                correctCuts.forEach(pos => {
                    const wire = wires.find(w => w.position === pos);
                    if (wire) console.log(`    - Position ${pos}: ${wire.color} wire with symbol ${wire.symbol}`);
                });
                break;
            }
            case 'button-matrix': {
                const sequence = (solution?.sequence as Array<{ row: number; col: number; action: string }>) || [];
                console.log(`  Solution sequence (${sequence.length} actions):`);
                sequence.forEach((step, i) => {
                    console.log(`    ${i + 1}. ${step.action} button at row ${step.row + 1}, col ${step.col + 1}`);
                });
                break;
            }
            case 'keypad-cipher': {
                const correctSequence = (solution?.correctSequence as string[]) || [];
                console.log(`  Solution: Press symbols in order: ${correctSequence.join(' → ')}`);
                break;
            }
            case 'indicator-lights': {
                const inds = (view?.indicators as Array<{ label: string; isLit: boolean; isFlickering: boolean; canToggle: boolean }>) || [];
                console.log(`  Current state:`);
                inds.forEach(ind => {
                    const status = ind.isLit ? (ind.isFlickering ? '🔴 LIT+FLICKER' : '🟢 LIT') : '⚫ OFF';
                    const toggleable = ind.canToggle ? '(can toggle)' : '(LOCKED)';
                    console.log(`    ${ind.label}: ${status} ${toggleable}`);
                });
                console.log(`  Rules to satisfy:`);
                console.log(`    - Max 3 flickering indicators`);
                console.log(`    - Lit count must be EVEN`);
                console.log(`    - If CAR is lit, SIG must also be lit`);
                break;
            }
            case 'frequency-tuner': {
                const targetFreq = solution?.targetFrequency;
                const targetAmFm = solution?.targetAmFm;
                console.log(`  Solution: Set to ${targetFreq} MHz, switch to ${targetAmFm}`);
                break;
            }
            case 'simon-signals': {
                const fullSequence = (solution?.fullSequence as string[]) || (view?.sequence as string[]) || [];
                const translationKey = solution?.translationKey as string;
                const hasVowel = (view as { hasVowelInSerial?: boolean })?.hasVowelInSerial;
                console.log(`  Serial has vowel: ${hasVowel ? 'YES' : 'NO'}`);
                console.log(`  Full sequence: ${fullSequence.join(' → ')}`);
                console.log(`  Translation key: ${translationKey}`);
                console.log(`  For each round, use table "${translationKey}-{strikeCount}" to translate colors`);
                break;
            }
            case 'sequence-memory': {
                const sequence = (solution?.sequence as string[]) || [];
                console.log(`  Solution: Press buttons in order: ${sequence.join(' → ')}`);
                break;
            }
            case 'countdown-override': {
                const answer = solution?.answer;
                console.log(`  Solution: Enter "${answer}"`);
                break;
            }
            case 'capacitor-bank': {
                const targetValues = (solution?.targetValues as number[]) || [];
                console.log(`  Solution: Set capacitors to values: ${targetValues.join(', ')}`);
                break;
            }
            case 'pressure-equalizer': {
                const targetPressure = solution?.targetPressure;
                const targetFlow = solution?.targetFlow;
                console.log(`  Solution: Set pressure to ${targetPressure}, flow to ${targetFlow}`);
                break;
            }
            case 'maze-navigator': {
                const path = (solution?.path as Array<{ x: number; y: number }>) || [];
                console.log(`  Solution path (${path.length} steps):`);
                console.log(`    ${path.map(p => `(${p.x},${p.y})`).join(' → ')}`);
                break;
            }
            case 'mechanical-switches': {
                const targetStates = (solution?.targetStates as boolean[]) || [];
                console.log(`  Solution: Set switches to: ${targetStates.map((s, i) => `SW${i + 1}=${s ? 'ON' : 'OFF'}`).join(', ')}`);
                break;
            }
            default:
                console.log(`  Solution data: ${JSON.stringify(solution)}`);
        }
    });

    console.log('\n' + '='.repeat(60) + '\n');
}
