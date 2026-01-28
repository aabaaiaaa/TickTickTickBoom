import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveMechanicalSwitches,
    expectVictory,
    type MechanicalSwitchesSolution,
    type MechanicalSwitchesView
} from './puzzle-test-helper';

test.describe('Mechanical Switches Puzzle', () => {
    test('should solve mechanical switches puzzle by setting correct switch states', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('SwitchDefuser');
        const reader = await helper.createReader(1, 'SwitchReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-mechanical-switches');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on mechanical-switches puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('mechanical-switches');

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
        const solution = solutionResponse.solution as MechanicalSwitchesSolution;
        const defuserView = solutionResponse.defuserView as MechanicalSwitchesView;
        expect(solution.targetConfiguration).toBeDefined();

        console.log('Mechanical Switches Solution:', solution);
        console.log('Current switch positions:', defuserView.switches);

        // Solve the puzzle
        await solveMechanicalSwitches(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
