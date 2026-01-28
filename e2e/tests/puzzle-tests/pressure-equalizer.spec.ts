import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solvePressureEqualizer,
    expectVictory,
    type PressureEqualizerSolution,
    type PressureEqualizerView
} from './puzzle-test-helper';

test.describe('Pressure Equalizer Puzzle', () => {
    test('should solve pressure equalizer puzzle by setting correct positions', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('PressureDefuser');
        const reader = await helper.createReader(1, 'PressureReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-pressure-equalizer');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on pressure-equalizer puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('pressure-equalizer');

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
        const solution = solutionResponse.solution as PressureEqualizerSolution;
        const defuserView = solutionResponse.defuserView as PressureEqualizerView;
        expect(solution.targetConfig).toBeDefined();

        console.log('Pressure Equalizer Solution:', solution);
        console.log('Current positions:', defuserView.sliders);

        // Solve the puzzle
        await solvePressureEqualizer(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
