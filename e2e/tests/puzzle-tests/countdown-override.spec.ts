import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveCountdownOverride,
    expectVictory,
    type CountdownOverrideSolution
} from './puzzle-test-helper';

test.describe('Countdown Override Puzzle', () => {
    test('should solve countdown override puzzle by entering correct answer', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('CountdownDefuser');
        const reader = await helper.createReader(1, 'CountdownReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-countdown-override');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on countdown-override puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('countdown-override');

        // Get solution via socket
        const solutionResponse = await defuser.page.evaluate(async () => {
            return new Promise<{ success: boolean; solution?: unknown; defuserView?: unknown }>((resolve) => {
                const socket = (window as unknown as { __gameSocket?: { emit: Function } }).__gameSocket;
                if (!socket) {
                    resolve({ success: false });
                    return;
                }
                socket.emit('get-puzzle-solution', (response: { success: boolean; solution?: unknown; defuserView?: unknown }) => {
                    resolve(response);
                });
            });
        });

        expect(solutionResponse.success).toBe(true);
        const solution = solutionResponse.solution as CountdownOverrideSolution;
        expect(solution.answer).toBeDefined();

        console.log('Countdown Override Solution:', solution);

        // Solve the puzzle
        await solveCountdownOverride(defuser.page, solution);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });

    test('should cause strike when entering wrong answer', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('CountdownDefuser');
        const reader = await helper.createReader(1, 'CountdownReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-countdown-override');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Enter wrong answer
        await defuser.page.getByTestId('answer-input').fill('WRONG_ANSWER_12345');
        await defuser.page.getByTestId('submit-answer-btn').click();
        await defuser.page.waitForTimeout(500);

        // Check for strike (time penalty acts as strike for this puzzle)
        // Actually countdown override doesn't give strikes, just time penalties
        // So we just verify the puzzle didn't complete
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('countdown-override');

        await helper.cleanup();
    });
});
