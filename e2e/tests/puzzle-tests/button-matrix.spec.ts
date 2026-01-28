import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveButtonMatrix,
    expectVictory,
    type ButtonMatrixSolution
} from './puzzle-test-helper';

test.describe('Button Matrix Puzzle', () => {
    test('should solve button matrix puzzle by pressing correct sequence', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('ButtonDefuser');
        const reader = await helper.createReader(1, 'ButtonReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-button-matrix');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on button-matrix puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('button-matrix');

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
        const solution = solutionResponse.solution as ButtonMatrixSolution;
        expect(solution.targetButton).toBeDefined();
        expect(solution.action).toBeDefined();

        console.log('Button Matrix Solution:', solution);

        // Solve the puzzle
        await solveButtonMatrix(defuser.page, solution);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
