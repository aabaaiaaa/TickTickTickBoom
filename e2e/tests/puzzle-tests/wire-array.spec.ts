import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveWireArray,
    expectVictory,
    type WireArraySolution
} from './puzzle-test-helper';

test.describe('Wire Array Puzzle', () => {
    test('should solve wire array puzzle by cutting correct wire', async ({ context }) => {
        const helper = createGameHelper(context, true);

        // Setup game with wire-array only
        const defuser = await helper.createDefuser('WireDefuser');
        const reader = await helper.createReader(1, 'WireReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-wire-array');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on wire-array puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('wire-array');

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
        const solution = solutionResponse.solution as WireArraySolution;
        expect(solution.correctCuts).toBeDefined();
        expect(solution.correctCuts.length).toBeGreaterThan(0);

        console.log('Wire Array Solution:', solution);

        // Solve the puzzle
        await solveWireArray(defuser.page, solution);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });

    test('should cause strike when cutting wrong wire', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('WireDefuser');
        const reader = await helper.createReader(1, 'WireReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-wire-array');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Get solution
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

        const solution = solutionResponse.solution as WireArraySolution;

        // Find a wrong wire (one that's not in correctCuts)
        const wrongWireIndex = [0, 1, 2, 3, 4, 5].find(i => !solution.correctCuts.includes(i));
        expect(wrongWireIndex).toBeDefined();

        // Cut wrong wire
        await defuser.page.getByTestId(`wire-${wrongWireIndex}`).click();
        await defuser.page.waitForTimeout(500);

        // Check for strike
        const strikes = await helper.getStrikes(defuser);
        expect(strikes).toBeGreaterThan(0);

        await helper.cleanup();
    });
});
