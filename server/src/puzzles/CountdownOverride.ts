import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';

type OverrideMode = 'STANDARD' | 'ACCELERATED' | 'CRITICAL';
type ChallengeType = 'math' | 'word' | 'pattern';

export interface CountdownOverrideView {
    mode: OverrideMode;
    challenge: {
        type: ChallengeType;
        question: string;
        answer: string; // Hidden from client, but needed for validation
    };
    inputValue: string;
    completed: boolean;
}

interface CountdownOverrideSolution {
    answer: string;
}

interface CountdownOverridePuzzle {
    type: PuzzleType;
    defuserView: CountdownOverrideView;
    solution: CountdownOverrideSolution;
}

export function generateCountdownOverride(
    difficulty: Difficulty,
    _serialNumber: string,
    _indicators: IndicatorState[]
): CountdownOverridePuzzle {
    // Mode based on difficulty
    const mode: OverrideMode = difficulty === 'easy' ? 'STANDARD' :
        difficulty === 'medium' ? 'STANDARD' :
            difficulty === 'hard' ? 'ACCELERATED' : 'CRITICAL';

    // Generate challenge
    const challenge = generateChallenge(mode, difficulty);

    return {
        type: 'countdown-override',
        defuserView: {
            mode,
            challenge: {
                type: challenge.type,
                question: challenge.question,
                answer: '', // Don't expose answer
            },
            inputValue: '',
            completed: false,
        },
        solution: { answer: challenge.answer },
    };
}

function generateChallenge(mode: OverrideMode, difficulty: Difficulty): { type: ChallengeType; question: string; answer: string } {
    const types: ChallengeType[] = ['math', 'word', 'pattern'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
        case 'math': {
            const a = 10 + Math.floor(Math.random() * 90);
            const b = 10 + Math.floor(Math.random() * 90);
            const ops = ['+', '-', '*'];
            const op = ops[Math.floor(Math.random() * (difficulty === 'easy' ? 2 : 3))];
            let result: number;
            switch (op) {
                case '+': result = a + b; break;
                case '-': result = a - b; break;
                case '*': result = a * b; break;
                default: result = a + b;
            }
            return {
                type: 'math',
                question: `${a} ${op} ${b} = ?`,
                answer: String(Math.floor(result)),
            };
        }

        case 'word': {
            const words = ['DEFUSE', 'BOMB', 'WIRE', 'ABORT', 'TIMER', 'SIGNAL'];
            const word = words[Math.floor(Math.random() * words.length)];
            let transformedWord: string;
            let question: string;

            if (mode === 'STANDARD') {
                // Caesar cipher +3
                transformedWord = word.split('').map(c =>
                    String.fromCharCode(((c.charCodeAt(0) - 65 + 3) % 26) + 65)
                ).join('');
                question = `Decrypt (shift -3): ${transformedWord}`;
            } else if (mode === 'ACCELERATED') {
                // Reverse
                transformedWord = word.split('').reverse().join('');
                question = `Reverse: ${transformedWord}`;
            } else {
                // Swap first and last
                transformedWord = word[word.length - 1] + word.slice(1, -1) + word[0];
                question = `Swap first/last: ${transformedWord}`;
            }

            return { type: 'word', question, answer: word };
        }

        case 'pattern': {
            const patterns = [
                { seq: [2, 4, 6, 8], next: '10', hint: '2, 4, 6, 8, ?' },
                { seq: [1, 1, 2, 3, 5], next: '8', hint: '1, 1, 2, 3, 5, ?' },
                { seq: [3, 6, 9, 12], next: '15', hint: '3, 6, 9, 12, ?' },
                { seq: [1, 4, 9, 16], next: '25', hint: '1, 4, 9, 16, ?' },
            ];
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];

            let question = pattern.hint;
            let answer = pattern.next;

            // In CRITICAL mode, ask for previous instead
            if (mode === 'CRITICAL') {
                question = `Previous: ?, ${pattern.seq.join(', ')}`;
                answer = String(pattern.seq[0] - (pattern.seq[1] - pattern.seq[0]));
            }

            return { type: 'pattern', question, answer };
        }
    }
}

export function validateCountdownOverride(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const view = puzzle.defuserView as CountdownOverrideView;
    const solution = puzzle.solution as CountdownOverrideSolution;
    const actionData = action as { answer: string };

    if (typeof actionData.answer !== 'string') {
        return { correct: false, message: 'Invalid answer' };
    }

    view.inputValue = actionData.answer.toUpperCase().trim();

    if (view.inputValue.length === 0) {
        return { correct: false, message: 'Enter an answer' };
    }

    // Check if answer matches solution
    const expectedAnswer = solution.answer.toUpperCase().trim();

    if (view.inputValue === expectedAnswer) {
        view.completed = true;
        return { correct: true, message: 'Override accepted! Time bonus granted!' };
    } else {
        // Wrong answer - still allow another try but indicate failure
        return { correct: false, message: `Wrong answer! Expected "${expectedAnswer}". Time penalty!` };
    }
}
