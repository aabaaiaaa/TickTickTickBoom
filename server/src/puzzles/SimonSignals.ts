import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';

const SIMON_COLORS = ['red', 'blue', 'green', 'yellow'] as const;
type SimonColor = typeof SIMON_COLORS[number];

// Translation tables based on vowel presence and strike count
const TRANSLATION_TABLES: Record<string, Record<SimonColor, SimonColor>> = {
    'vowel-0': { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' },
    'vowel-1': { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
    'vowel-2': { red: 'green', blue: 'yellow', green: 'red', yellow: 'blue' },
    'novowel-0': { red: 'blue', blue: 'yellow', green: 'green', yellow: 'red' },
    'novowel-1': { red: 'red', blue: 'blue', green: 'yellow', yellow: 'green' },
    'novowel-2': { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
};

export interface SimonSignalsView {
    sequence: SimonColor[];       // Full sequence for all rounds
    playerInput: SimonColor[];
    currentRound: number;          // Current round (1-indexed, sequence to play is sequence.slice(0, currentRound))
    totalRounds: number;
    isShowingSequence: boolean;
    hasVowelInSerial: boolean;
}

interface SimonSignalsSolution {
    sequences: SimonColor[][];
    fullSequence?: SimonColor[];
    translationKey: string;
}

interface SimonSignalsPuzzle {
    type: PuzzleType;
    defuserView: SimonSignalsView;
    solution: SimonSignalsSolution;
}

export function generateSimonSignals(
    difficulty: Difficulty,
    serialNumber: string,
    _indicators: IndicatorState[]
): SimonSignalsPuzzle {
    // Check for vowel in serial number
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    const hasVowel = serialNumber.split('').some(c => vowels.includes(c.toUpperCase()));

    // Number of rounds based on difficulty
    const totalRounds = difficulty === 'easy' ? 3 :
        difficulty === 'medium' ? 4 : 5;

    // Generate sequences for each round
    const sequences: SimonColor[][] = [];
    let sequence: SimonColor[] = [];

    for (let round = 0; round < totalRounds; round++) {
        // Add one more color to sequence each round
        const newColor = SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)];
        sequence = [...sequence, newColor];
        sequences.push([...sequence]);
    }

    // Build the full sequence (final round has all colors)
    const fullSequence = sequences[sequences.length - 1];

    return {
        type: 'simon-signals',
        defuserView: {
            sequence: fullSequence,  // Full sequence, currentRound determines how many to show
            playerInput: [],
            currentRound: 1,
            totalRounds,
            isShowingSequence: true,
            hasVowelInSerial: hasVowel,
        },
        solution: {
            sequences,
            fullSequence,
            translationKey: hasVowel ? 'vowel' : 'novowel',
        },
    };
}

export function validateSimonSignals(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const view = puzzle.defuserView as SimonSignalsView;
    const actionData = action as {
        type?: string;
        color?: SimonColor;
        sequence?: SimonColor[];
        strikeCount?: number;
    };

    // Support submit-sequence action (submits all colors at once)
    if (actionData.type === 'submit-sequence' && actionData.sequence) {
        // Get translation table
        const strikeCount = Math.min(actionData.strikeCount || 0, 2);
        const tableKey = `${view.hasVowelInSerial ? 'vowel' : 'novowel'}-${strikeCount}`;
        const table = TRANSLATION_TABLES[tableKey];

        // Check if sequence matches expected translated sequence
        const roundSequence = view.sequence.slice(0, view.currentRound);
        const expectedSequence = roundSequence.map(c => table[c]);

        if (actionData.sequence.length !== expectedSequence.length) {
            view.playerInput = [];
            return { correct: false, message: 'Wrong sequence length!', strike: true };
        }

        for (let i = 0; i < expectedSequence.length; i++) {
            if (actionData.sequence[i] !== expectedSequence[i]) {
                view.playerInput = [];
                return { correct: false, message: 'Wrong color!', strike: true };
            }
        }

        // Sequence correct - check if all rounds complete
        if (view.currentRound >= view.totalRounds) {
            return { correct: true, message: 'Simon says: SUCCESS!' };
        }

        // Advance to next round
        view.currentRound++;
        view.playerInput = [];
        view.isShowingSequence = true;

        return { correct: false, message: `Round ${view.currentRound - 1} complete! Watch the next sequence.` };
    }

    // Single color input
    const color = actionData.color;
    if (!color || !SIMON_COLORS.includes(color)) {
        return { correct: false, message: 'Invalid color' };
    }

    // Get translation table
    const strikeCount = Math.min(actionData.strikeCount || 0, 2);
    const tableKey = `${view.hasVowelInSerial ? 'vowel' : 'novowel'}-${strikeCount}`;
    const table = TRANSLATION_TABLES[tableKey];

    // The player should press the TRANSLATED color
    view.playerInput.push(color);

    // Check if input matches translated sequence so far
    const inputIndex = view.playerInput.length - 1;
    const roundSequence = view.sequence.slice(0, view.currentRound);
    const originalColor = roundSequence[inputIndex];
    const expectedColor = table[originalColor];

    if (color !== expectedColor) {
        // Wrong! Reset input
        view.playerInput = [];
        return { correct: false, message: 'Wrong color!', strike: true };
    }

    // Check if round complete
    if (view.playerInput.length === view.currentRound) {
        view.playerInput = [];

        // Check if all rounds complete
        if (view.currentRound >= view.totalRounds) {
            return { correct: true, message: 'Simon says: SUCCESS!' };
        }

        // Advance to next round
        view.currentRound++;
        // Sequence already contains all colors, currentRound determines how many to show
        view.isShowingSequence = true;

        return { correct: false, message: `Round ${view.currentRound - 1} complete! Watch the next sequence.` };
    }

    return { correct: false, message: `${view.playerInput.length}/${view.currentRound}` };
}
