import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveKeypadCipher,
    expectVictory,
    type KeypadCipherSolution
} from './puzzle-test-helper';

test.describe('Keypad Cipher Puzzle', () => {
    test('should solve keypad cipher puzzle by pressing symbols in correct order', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('KeypadDefuser');
        const reader = await helper.createReader(1, 'KeypadReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-keypad-cipher');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on keypad-cipher puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('keypad-cipher');

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
        const solution = solutionResponse.solution as KeypadCipherSolution;
        const defuserView = solutionResponse.defuserView as { symbols: string[][] };
        expect(solution.correctSequence).toBeDefined();
        expect(solution.correctSequence.length).toBe(4);

        console.log('Keypad Cipher Solution:', solution);
        console.log('Symbols grid:', defuserView.symbols);

        // Solve the puzzle
        await solveKeypadCipher(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
