import { test, expect } from '@playwright/test';
import { createGameHelper } from '../helpers';
import {
    solveIndicatorLights,
    expectVictory,
    type IndicatorLightsSolution,
    type IndicatorLightsView
} from './puzzle-test-helper';

test.describe('Indicator Lights Puzzle', () => {
    test('should solve indicator lights puzzle by meeting all rules', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('IndicatorDefuser');
        const reader = await helper.createReader(1, 'IndicatorReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-indicator-lights');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Verify we're on indicator-lights puzzle
        const puzzleType = await helper.getCurrentPuzzleType(defuser);
        expect(puzzleType).toBe('indicator-lights');

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
        const solution = solutionResponse.solution as IndicatorLightsSolution;
        const defuserView = solutionResponse.defuserView as IndicatorLightsView;
        expect(defuserView.indicators).toBeDefined();
        expect(defuserView.indicators.length).toBeGreaterThan(0);

        console.log('Indicator Lights Solution:', solution);
        console.log('Indicators:', defuserView.indicators);

        // Solve the puzzle
        await solveIndicatorLights(defuser.page, solution, defuserView);

        // Expect victory
        await expectVictory(defuser.page);

        await helper.cleanup();
    });

    test('should verify that all indicators are toggleable when needed', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('IndicatorDefuser');
        const reader = await helper.createReader(1, 'IndicatorReader');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test-indicator-lights');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Get solution and verify the puzzle is solvable
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

        const defuserView = solutionResponse.defuserView as IndicatorLightsView;
        const indicators = defuserView.indicators;

        // Check CAR/SIG rule - if CAR is lit and SIG is not, SIG must be toggleable
        const carIndicator = indicators.find(i => i.label === 'CAR');
        const sigIndicator = indicators.find(i => i.label === 'SIG');

        if (carIndicator?.isLit && sigIndicator && !sigIndicator.isLit) {
            console.log('CAR is lit, SIG is not lit - SIG should be toggleable');
            expect(sigIndicator.canToggle).toBe(true);
        }

        // Verify at least 3 indicators can be toggled
        const toggleableCount = indicators.filter(i => i.canToggle).length;
        expect(toggleableCount).toBeGreaterThanOrEqual(3);

        await helper.cleanup();
    });
});
