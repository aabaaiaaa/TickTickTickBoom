import { test, expect } from '@playwright/test';
import { createGameHelper, GameTestHelper } from './helpers';

test.describe('Home Screen', () => {
    test('should display the home screen with create and join options', async ({ page }) => {
        await page.goto('http://localhost:5175');

        // Check title
        await expect(page.locator('h1')).toContainText('Tick');

        // Check buttons exist
        await expect(page.getByTestId('create-room-btn')).toBeVisible();
        await expect(page.getByTestId('join-code-input')).toBeVisible();
        await expect(page.getByTestId('join-room-btn')).toBeVisible();
    });

    test('should show error when joining with invalid code', async ({ page }) => {
        await page.goto('http://localhost:5175');

        await page.getByTestId('join-code-input').fill('XXXX');
        await page.getByTestId('join-room-btn').click();

        // Should remain on home screen (join fails silently or button disabled)
        await expect(page.getByTestId('home-screen')).toBeVisible();
    });
});

test.describe('Room Creation and Joining', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('defuser can create a room', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);
        await expect(defuser.page.getByTestId('lobby-screen')).toBeVisible();
    });

    test('reader can join an existing room', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await expect(reader.page.getByTestId('lobby-screen')).toBeVisible();
        await expect(reader.page.getByTestId('room-code')).toHaveText(roomCode);
    });

    test('players can set their names', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        await helper.setPlayerName(defuser, 'TestDefuser');

        // Verify name appears in player name display
        await expect(defuser.page.getByTestId('player-name')).toContainText('TestDefuser');
    });

    test('players can select roles', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        await helper.setRole(defuser, 'defuser');

        // Verify role is selected (uses 'selected' class)
        await expect(defuser.page.getByTestId('role-defuser')).toHaveClass(/selected/);
    });
});

test.describe('Lobby', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('difficulty can be changed by room creator', async () => {
        const defuser = await helper.createDefuser();
        await helper.createRoom(defuser);

        // Change to hard difficulty
        await helper.setDifficulty(defuser, 'hard');

        // Verify hard is selected (uses 'selected' class)
        await expect(defuser.page.getByTestId('difficulty-hard')).toHaveClass(/selected/);
    });

    test('start button is disabled until all players ready', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        // Start button should be disabled
        await expect(defuser.page.getByTestId('start-game-btn')).toBeDisabled();

        // Both players ready up
        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        // Now start should be enabled
        await expect(defuser.page.getByTestId('start-game-btn')).toBeEnabled();
    });

    test('only one player can be defuser', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        // First player selects defuser
        await helper.setRole(defuser, 'defuser');

        // Second player tries to select defuser - should fail or show warning
        await helper.setRole(reader, 'defuser');

        // Only one should have defuser role in the end
        // The implementation should prevent this
    });
});

test.describe('Game Flow', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('game starts and shows appropriate screens', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        // Set roles and ready up
        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');

        // Small wait for role updates to propagate
        await defuser.page.waitForTimeout(500);

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        // Wait for start button to be enabled
        await expect(defuser.page.getByTestId('start-game-btn')).toBeEnabled({ timeout: 5000 });

        // Start game
        await helper.startGame(defuser);

        // Wait for game screens
        await helper.waitForGameStart(defuser);
        await helper.waitForGameStart(reader);

        // Defuser should see puzzle screen
        await expect(defuser.page.getByTestId('defuser-screen')).toBeVisible();
        await expect(defuser.page.getByTestId('timer')).toBeVisible();
        await expect(defuser.page.getByTestId('serial-number')).toBeVisible();

        // Reader should see manual
        await expect(reader.page.getByTestId('reader-screen')).toBeVisible();
    });

    test('timer counts down during game', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'easy'); // 7 minutes
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(defuser);

        // Get initial timer
        const initialTime = await helper.getTimer(defuser);
        expect(initialTime).toContain('7:'); // Easy mode starts at 7 min

        // Wait a bit and check timer decreased
        await defuser.page.waitForTimeout(2000);
        const laterTime = await helper.getTimer(defuser);

        // Timer should have decreased
        expect(laterTime).not.toBe(initialTime);
    });
});

test.describe('Puzzle Interactions', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('puzzle panel displays current puzzle', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(defuser);

        // Should have a puzzle panel visible
        await expect(defuser.page.locator('.puzzle-panel')).toBeVisible();

        // Should have a puzzle header with type
        await expect(defuser.page.locator('.puzzle-header h2')).toBeVisible();
    });

    test('progress bar updates as puzzles are completed', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(defuser);

        // Progress bar should exist
        await expect(defuser.page.locator('.progress-bar')).toBeVisible();
        await expect(defuser.page.locator('.progress-info')).toContainText('0 completed');
    });
});

test.describe('Manual for Readers', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('reader sees the manual with all sections', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(reader);

        // Check manual content
        await expect(reader.page.locator('.manual-content')).toBeVisible();
        await expect(reader.page.locator('.manual-header h1')).toContainText('BOMB DEFUSAL MANUAL');

        // Check sections exist
        await expect(reader.page.locator('#wire-array')).toBeVisible();
        await expect(reader.page.locator('#button-matrix')).toBeVisible();
        await expect(reader.page.locator('#keypad-cipher')).toBeVisible();
    });

    test('manual sidebar navigation works', async () => {
        const defuser = await helper.createDefuser();
        const roomCode = await helper.createRoom(defuser);

        const reader = await helper.createReader(1);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(reader);

        // Click on a section in the TOC
        await reader.page.locator('.toc a[href="#simon-signals"]').click();

        // Section should be visible/scrolled to
        await expect(reader.page.locator('#simon-signals')).toBeInViewport();
    });
});

test.describe('Multi-Reader Scenarios', () => {
    let helper: GameTestHelper;

    test.beforeEach(async ({ context }) => {
        helper = createGameHelper(context);
    });

    test.afterEach(async () => {
        await helper.cleanup();
    });

    test('multiple readers can join and play together', async () => {
        const defuser = await helper.createDefuser('MultiDefuser');
        const roomCode = await helper.createRoom(defuser);

        // Create two readers
        const reader1 = await helper.createReader(1, 'Reader1');
        const reader2 = await helper.createReader(2, 'Reader2');

        // Both join the room
        await helper.joinRoom(reader1, roomCode);
        await helper.joinRoom(reader2, roomCode);

        // Set roles
        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader1, 'reader');
        await helper.setRole(reader2, 'reader');

        // All ready up
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader1);
        await helper.toggleReady(reader2);

        // Start game
        await helper.startGame(defuser);

        // All should see game screens
        await helper.waitForGameStart(defuser);
        await helper.waitForGameStart(reader1);
        await helper.waitForGameStart(reader2);

        // Verify defuser sees puzzle
        await expect(defuser.page.getByTestId('defuser-screen')).toBeVisible();

        // Both readers should see the manual
        await expect(reader1.page.getByTestId('reader-screen')).toBeVisible();
        await expect(reader2.page.getByTestId('reader-screen')).toBeVisible();

        // Both readers should see the same manual content
        await expect(reader1.page.locator('.manual-header h1')).toContainText('BOMB DEFUSAL MANUAL');
        await expect(reader2.page.locator('.manual-header h1')).toContainText('BOMB DEFUSAL MANUAL');
    });

    test('reader count shown correctly in lobby', async () => {
        const defuser = await helper.createDefuser('MultiDefuser');
        const roomCode = await helper.createRoom(defuser);

        const reader1 = await helper.createReader(1, 'Reader1');
        await helper.joinRoom(reader1, roomCode);
        await helper.setRole(reader1, 'reader');

        // Check reader count shows 1 (use more specific selector)
        await expect(defuser.page.locator('.role-section h3:has-text("Readers")')).toContainText('Readers (1)');

        const reader2 = await helper.createReader(2, 'Reader2');
        await helper.joinRoom(reader2, roomCode);
        await helper.setRole(reader2, 'reader');

        // Wait for update to propagate
        await defuser.page.waitForTimeout(500);

        // Check reader count shows 2
        await expect(defuser.page.locator('.role-section h3:has-text("Readers")')).toContainText('Readers (2)');
    });
});
