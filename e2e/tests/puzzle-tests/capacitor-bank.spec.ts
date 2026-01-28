import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveCapacitorBank,
    expectVictory,
    type CapacitorBankSolution,
    type CapacitorBankView
} from './puzzle-test-helper';

test.describe('Capacitor Bank Puzzle', () => {
    test('should solve capacitor bank puzzle by setting correct voltages', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('CapacitorDefuser');
        const reader = await helper.createReader(1, 'CapacitorReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-capacitor-bank');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on capacitor-bank puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('capacitor-bank');

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
        const solution = solutionResponse.solution as CapacitorBankSolution;
        const defuserView = solutionResponse.defuserView as CapacitorBankView;
        expect(solution.targetVoltages).toBeDefined();

        console.log('Capacitor Bank Solution:', solution);
        console.log('Current voltages:', defuserView.capacitors);

        // Solve the puzzle
        await solveCapacitorBank(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
