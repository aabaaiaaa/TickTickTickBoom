import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveFrequencyTuner,
    expectVictory,
    type FrequencyTunerSolution
} from './puzzle-test-helper';

test.describe('Frequency Tuner Puzzle', () => {
    test('should solve frequency tuner puzzle by setting correct frequency and mode', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('FreqDefuser');
        const reader = await helper.createReader(1, 'FreqReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-frequency-tuner');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on frequency-tuner puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('frequency-tuner');

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
        const solution = solutionResponse.solution as FrequencyTunerSolution;
        expect(solution.targetFrequency).toBeDefined();
        expect(solution.targetAmFm).toBeDefined();

        console.log('Frequency Tuner Solution:', solution);

        // Solve the puzzle
        await solveFrequencyTuner(defuser.page, solution);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
