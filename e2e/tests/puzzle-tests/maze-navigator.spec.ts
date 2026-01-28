import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveMazeNavigator,
    expectVictory,
    type MazeNavigatorSolution,
    type MazeNavigatorView
} from './puzzle-test-helper';

test.describe('Maze Navigator Puzzle', () => {
    test('should solve maze navigator puzzle by following correct path', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('MazeDefuser');
        const reader = await helper.createReader(1, 'MazeReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-maze-navigator');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on maze-navigator puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('maze-navigator');

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
        const solution = solutionResponse.solution as MazeNavigatorSolution;
        const defuserView = solutionResponse.defuserView as MazeNavigatorView;
        expect(solution.walls).toBeDefined();

        console.log('Maze Navigator Solution:', solution);
        console.log('Current position:', defuserView.currentPosition);
        console.log('Goal position:', defuserView.goalPosition);

        // Solve the puzzle
        await solveMazeNavigator(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });
});
