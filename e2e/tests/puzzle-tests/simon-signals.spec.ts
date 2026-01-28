import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveSimonSignals,
    expectVictory,
    type SimonSignalsSolution,
    type SimonSignalsView
} from './puzzle-test-helper';

test.describe('Simon Signals Puzzle', () => {
    test('should solve simon signals puzzle by pressing translated colors', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('SimonDefuser');
        const reader = await helper.createReader(1, 'SimonReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-simon-signals');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on simon-signals puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('simon-signals');

        // Get solution via socket
        const solutionResponse = await defuser.page.evaluate(async () => {
            return new Promise<{ success: boolean; solution?: unknown; defuserView?: unknown; strikes?: number }>((resolve) => {
                const socket = (window as unknown as { __gameSocket?: { emit: Function } }).__gameSocket;
                if (!socket) {
                    resolve({ success: false });
                    return;
                }
                socket.emit('get-puzzle-solution', (response: { success: boolean; solution?: unknown; defuserView?: unknown; strikes?: number }) => {
                    resolve(response);
                });
            });
        });

        expect(solutionResponse.success).toBe(true);
        const solution = solutionResponse.solution as SimonSignalsSolution;
        const defuserView = solutionResponse.defuserView as SimonSignalsView;
        const strikes = solutionResponse.strikes ?? 0;

        expect(solution.sequences).toBeDefined();
        expect(solution.sequences.length).toBeGreaterThan(0);
        expect(defuserView.sequence).toBeDefined();
        expect(defuserView.totalRounds).toBeGreaterThan(0);

        console.log('Simon Signals Solution:', solution);
        console.log('Defuser View:', defuserView);
        console.log('Strikes:', strikes);

        // Solve the puzzle
        await solveSimonSignals(defuser.page, solution, defuserView, strikes);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });

    test('should have valid sequence data', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('SimonDefuser');
        const reader = await helper.createReader(1, 'SimonReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-simon-signals');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Get solution and verify structure
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

        const solution = solutionResponse.solution as SimonSignalsSolution;
        const defuserView = solutionResponse.defuserView as SimonSignalsView;

        // Verify sequences exist and contain valid colors
        const validColors = ['red', 'blue', 'green', 'yellow'];
        expect(solution.sequences).toBeDefined();
        expect(solution.sequences.length).toBeGreaterThan(0);

        for (const seq of solution.sequences) {
            for (const color of seq) {
                expect(validColors).toContain(color);
            }
        }

        // Verify translation key is valid
        expect(['vowel', 'novowel']).toContain(solution.translationKey);

        // Verify hasVowelInSerial matches translation key
        if (solution.translationKey === 'vowel') {
            expect(defuserView.hasVowelInSerial).toBe(true);
        } else {
            expect(defuserView.hasVowelInSerial).toBe(false);
        }

        await helper.cleanup();
    });
});
