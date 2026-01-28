import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveSequenceMemory,
    expectVictory,
    type SequenceMemorySolution,
    type SequenceMemoryView
} from './puzzle-test-helper';

test.describe('Sequence Memory Puzzle', () => {
    test('should solve sequence memory puzzle by pressing buttons in correct order', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('MemoryDefuser');
        const reader = await helper.createReader(1, 'MemoryReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-sequence-memory');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on sequence-memory puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('sequence-memory');

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
        const solution = solutionResponse.solution as SequenceMemorySolution;
        const defuserView = solutionResponse.defuserView as SequenceMemoryView;
        expect(solution.stages).toBeDefined();
        expect(solution.stages.length).toBeGreaterThan(0);

        console.log('Sequence Memory Solution:', solution);
        console.log('Buttons:', defuserView.buttons);

        // Solve the puzzle
        await solveSequenceMemory(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
