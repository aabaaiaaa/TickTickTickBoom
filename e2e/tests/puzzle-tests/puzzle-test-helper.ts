import { Page, expect } from '@playwright/test';
import type { PuzzleSolutionResponse } from '../../../shared/types';

/**
 * Helper to get puzzle solution via socket
 */
export async function getPuzzleSolution(page: Page): Promise<PuzzleSolutionResponse> {
    return await page.evaluate(() => {
        return new Promise<PuzzleSolutionResponse>((resolve) => {
            // Access the socket through the window object
            const socket = (window as unknown as { __gameSocket?: { emit: (event: string, callback: (response: PuzzleSolutionResponse) => void) => void } }).__gameSocket;
            if (!socket) {
                resolve({ success: false, error: 'Socket not available' });
                return;
            }
            socket.emit('get-puzzle-solution', (response: PuzzleSolutionResponse) => {
                resolve(response);
            });
        });
    });
}

/**
 * Wait for puzzle to complete (success or strike)
 */
export async function waitForPuzzleResult(page: Page, timeout = 5000): Promise<{ correct: boolean }> {
    // Wait for the victory screen or puzzle change
    try {
        await page.waitForFunction(
            () => {
                const gameOver = document.querySelector('[data-testid="gameover-screen"]');
                return gameOver !== null;
            },
            { timeout }
        );
        const hasVictory = await page.locator('.gameover-screen.victory').isVisible();
        return { correct: hasVictory };
    } catch {
        return { correct: false };
    }
}

/**
 * Verify victory screen appears
 */
export async function expectVictory(page: Page) {
    await page.waitForSelector('[data-testid="gameover-screen"]', { timeout: 15000 });
    await expect(page.locator('.gameover-screen')).toContainText('BOMB DEFUSED');
}

/**
 * Verify defeat screen appears
 */
export async function expectDefeat(page: Page) {
    await page.waitForSelector('[data-testid="gameover-screen"]', { timeout: 15000 });
    await expect(page.locator('.gameover-screen')).toContainText('DETONATION');
}

// ============================================
// Puzzle-specific solvers
// ============================================

export interface WireArraySolution {
    correctCuts: number[];
}

export async function solveWireArray(page: Page, solution: WireArraySolution) {
    for (const wireIndex of solution.correctCuts) {
        await page.getByTestId(`wire-${wireIndex}`).click();
        await page.waitForTimeout(300);
    }
}

export interface ButtonMatrixSolution {
    targetButton: string; // "row-col"
    action: 'press' | 'hold';
    releaseDigit?: number;
}

export async function solveButtonMatrix(page: Page, solution: ButtonMatrixSolution) {
    const [row, col] = solution.targetButton.split('-').map(Number);
    const button = page.getByTestId(`button-${row}-${col}`);

    if (solution.action === 'press') {
        await button.click();
    } else {
        // Hold - need to use mouse.down() and mouse.up()
        const box = await button.boundingBox();
        if (box) {
            const centerX = box.x + box.width / 2;
            const centerY = box.y + box.height / 2;
            await page.mouse.move(centerX, centerY);
            await page.mouse.down();
            await page.waitForTimeout(2500); // Hold for 2.5 seconds
            await page.mouse.up();
        }
    }
    await page.waitForTimeout(500);
}

export interface KeypadCipherSolution {
    correctSequence: string[];
}

export async function solveKeypadCipher(page: Page, solution: KeypadCipherSolution, defuserView: { symbols: string[][] }) {
    // Find the position of each symbol and click in order
    for (const symbol of solution.correctSequence) {
        let found = false;
        for (let row = 0; row < defuserView.symbols.length && !found; row++) {
            for (let col = 0; col < defuserView.symbols[row].length && !found; col++) {
                if (defuserView.symbols[row][col] === symbol) {
                    await page.getByTestId(`key-${row}-${col}`).click();
                    found = true;
                }
            }
        }
        await page.waitForTimeout(200);
    }
}

export interface IndicatorLightsSolution {
    maxFlickering: number;
    requireCarSigBothLit: boolean;
    requireEvenLitCount: boolean;
}

export interface IndicatorLightsView {
    indicators: Array<{
        label: string;
        isLit: boolean;
        isFlickering: boolean;
        canToggle: boolean;
    }>;
}

export async function solveIndicatorLights(page: Page, _solution: IndicatorLightsSolution, defuserView: IndicatorLightsView) {
    // Clone indicators to track changes
    const indicators = defuserView.indicators.map(i => ({ ...i }));

    console.log('IndicatorLights: Starting state:', indicators.map((i, idx) =>
        `${idx}:${i.label}(${i.isLit ? 'lit' : 'off'}${i.isFlickering ? ',flick' : ''}${i.canToggle ? ',toggle' : ''})`
    ).join(', '));

    // Logic: Make sure all rules are satisfied
    // Rule 1: Max 3 flickering
    // Rule 2: Even number of lit indicators
    // Rule 3: If CAR is lit, SIG must be lit

    // First, reduce flickering if > 3
    let flickeringCount = indicators.filter(i => i.isFlickering).length;
    console.log(`IndicatorLights: Flickering count = ${flickeringCount}`);

    for (let i = 0; i < indicators.length && flickeringCount > 3; i++) {
        if (indicators[i].isFlickering && indicators[i].canToggle) {
            // Toggle off to remove flickering
            console.log(`IndicatorLights: Toggling off indicator ${i} (${indicators[i].label}) to reduce flickering`);
            await page.getByTestId(`indicator-${i}`).click();
            indicators[i].isLit = false;
            indicators[i].isFlickering = false;
            flickeringCount--;
            await page.waitForTimeout(200);
        }
    }

    // Fix CAR/SIG rule
    const carIdx = indicators.findIndex(i => i.label === 'CAR');
    const sigIdx = indicators.findIndex(i => i.label === 'SIG');
    console.log(`IndicatorLights: CAR at ${carIdx}, SIG at ${sigIdx}`);

    if (carIdx >= 0 && sigIdx >= 0) {
        if (indicators[carIdx].isLit && !indicators[sigIdx].isLit) {
            // Need to light SIG
            if (indicators[sigIdx].canToggle) {
                console.log(`IndicatorLights: Lighting SIG (idx ${sigIdx}) because CAR is lit`);
                await page.getByTestId(`indicator-${sigIdx}`).click();
                indicators[sigIdx].isLit = true;
                await page.waitForTimeout(200);
            } else {
                console.log(`IndicatorLights: WARNING - SIG cannot toggle but CAR is lit!`);
            }
        }
    }

    // Fix even count - recalculate after previous changes
    let litCount = indicators.filter(i => i.isLit).length;
    console.log(`IndicatorLights: Lit count = ${litCount}`);

    if (litCount % 2 !== 0) {
        // Toggle one toggleable indicator
        for (let i = 0; i < indicators.length; i++) {
            if (indicators[i].canToggle) {
                // Check that toggling won't break CAR/SIG rule
                if (indicators[i].label === 'SIG' && carIdx >= 0 && indicators[carIdx].isLit && indicators[sigIdx].isLit) {
                    continue; // Don't turn off SIG if CAR is lit
                }
                console.log(`IndicatorLights: Toggling indicator ${i} (${indicators[i].label}) to fix even count`);
                await page.getByTestId(`indicator-${i}`).click();
                indicators[i].isLit = !indicators[i].isLit;
                await page.waitForTimeout(200);
                break;
            }
        }
    }

    console.log('IndicatorLights: Final state:', indicators.map((i, idx) =>
        `${idx}:${i.label}(${i.isLit ? 'lit' : 'off'}${i.isFlickering ? ',flick' : ''})`
    ).join(', '));

    // Click verify
    await page.getByTestId('verify-btn').click();
}

export interface FrequencyTunerSolution {
    targetFrequency: number;
    targetAmFm: 'AM' | 'FM';
}

export async function solveFrequencyTuner(page: Page, solution: FrequencyTunerSolution) {
    console.log(`FrequencyTuner: Target frequency=${solution.targetFrequency}, mode=${solution.targetAmFm}`);

    // Set AM/FM mode using the toggle buttons
    const targetMode = solution.targetAmFm;
    const modeButton = page.locator(`button:has-text("${targetMode}")`).first();
    if (await modeButton.count() > 0) {
        await modeButton.click();
        await page.waitForTimeout(200);
    }

    // Read current frequency from display
    const freqDisplay = page.locator('.frequency-display');
    const freqText = await freqDisplay.textContent() || '5.0';
    let currentFreq = parseFloat(freqText.replace(' MHz', ''));
    console.log(`FrequencyTuner: Starting frequency=${currentFreq}`);

    // Find frequency control buttons
    const plusOneBtn = page.locator('button:has-text("+1.0")').first();
    const minusOneBtn = page.locator('button:has-text("-1.0")').first();
    const plusTenthBtn = page.locator('button:has-text("+0.1")').first();
    const minusTenthBtn = page.locator('button:has-text("-0.1")').first();

    // Adjust frequency
    let iterations = 0;
    while (Math.abs(currentFreq - solution.targetFrequency) > 0.05 && iterations < 100) {
        iterations++;
        const diff = solution.targetFrequency - currentFreq;

        if (Math.abs(diff) >= 1) {
            if (diff > 0) {
                await plusOneBtn.click();
                currentFreq += 1;
            } else {
                await minusOneBtn.click();
                currentFreq -= 1;
            }
        } else {
            if (diff > 0) {
                await plusTenthBtn.click();
                currentFreq += 0.1;
            } else {
                await minusTenthBtn.click();
                currentFreq -= 0.1;
            }
        }
        currentFreq = Math.round(currentFreq * 10) / 10; // Avoid floating point issues
        await page.waitForTimeout(50);
    }

    console.log(`FrequencyTuner: Final frequency=${currentFreq}`);

    // Transmit
    await page.getByTestId('transmit-btn').click();
}

export interface SimonSignalsSolution {
    sequences: string[][]; // sequences[round] = colors up to that round
    fullSequence?: string[];
    translationKey: string; // 'vowel' or 'novowel'
}

export interface SimonSignalsView {
    sequence: string[];
    playerInput: string[];
    currentRound: number;
    totalRounds: number;
    isShowingSequence: boolean;
    hasVowelInSerial: boolean;
}

// Translation tables from server
const TRANSLATION_TABLES: Record<string, Record<string, string>> = {
    'vowel-0': { red: 'blue', blue: 'red', green: 'yellow', yellow: 'green' },
    'vowel-1': { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
    'vowel-2': { red: 'green', blue: 'yellow', green: 'red', yellow: 'blue' },
    'novowel-0': { red: 'blue', blue: 'yellow', green: 'green', yellow: 'red' },
    'novowel-1': { red: 'red', blue: 'blue', green: 'yellow', yellow: 'green' },
    'novowel-2': { red: 'yellow', blue: 'green', green: 'blue', yellow: 'red' },
};

export async function solveSimonSignals(page: Page, solution: SimonSignalsSolution, defuserView: SimonSignalsView, strikes: number) {
    const tableKey = `${solution.translationKey}-${Math.min(strikes, 2)}`;
    const table = TRANSLATION_TABLES[tableKey];

    // Use sequences array which has cumulative sequences for each round
    for (let round = 0; round < defuserView.totalRounds; round++) {
        // Wait for sequence to finish showing
        await page.waitForTimeout(1000 + round * 500);

        // Get the sequence for this round
        const roundSequence = solution.sequences[round] || solution.fullSequence?.slice(0, round + 1) || defuserView.sequence.slice(0, round + 1);

        // Translate and press each color
        for (const color of roundSequence) {
            const translatedColor = table[color] || color;
            await page.getByTestId(`simon-${translatedColor}`).click();
            await page.waitForTimeout(300);
        }

        // Wait for round completion
        await page.waitForTimeout(500);
    }
}

export interface SequenceMemorySolution {
    stages: Array<{
        display: string;
        displayType: 'number' | 'color';
        correctPosition: number;
    }>;
}

export interface SequenceMemoryView {
    display: string;
    displayType: 'number' | 'color';
    buttons: string[]; // ['red', 'blue', 'green', 'yellow']
    currentStage: number;
    totalStages: number;
    stageHistory: Array<{ position: number; color: string }>;
}

export async function solveSequenceMemory(page: Page, solution: SequenceMemorySolution, defuserView: SequenceMemoryView) {
    // The validator uses complex stage-dependent rules to determine the correct button
    // We must replicate those rules here
    const buttons = defuserView.buttons; // ['red', 'blue', 'green', 'yellow']
    const stageHistory: Array<{ position: number; color: string }> = [];

    for (let stageNum = 1; stageNum <= solution.stages.length; stageNum++) {
        const stage = solution.stages[stageNum - 1];
        let correctPosition: number;

        if (stage.displayType === 'number') {
            const displayNum = parseInt(stage.display);
            if (stageNum === 1) {
                // Stage 1 number rules
                if (displayNum === 1) correctPosition = 1; // Press position 2
                else if (displayNum === 2) correctPosition = 1; // Press position 2
                else if (displayNum === 3) correctPosition = 2; // Press position 3
                else correctPosition = 3; // Press position 4
            } else if (stageNum === 2) {
                // Stage 2: "1" = same COLOR as stage 1, "2" = position 1
                if (displayNum === 1 && stageHistory.length > 0) {
                    const stage1Color = stageHistory[0].color;
                    correctPosition = buttons.indexOf(stage1Color);
                } else if (displayNum === 2) {
                    correctPosition = 0; // Press position 1
                } else {
                    correctPosition = displayNum - 1;
                }
            } else {
                // Stage 3+: press same POSITION as that stage number
                const refStage = Math.min(displayNum, stageHistory.length);
                correctPosition = stageHistory[refStage - 1]?.position ?? (displayNum - 1);
            }
        } else {
            // Color display rules
            const displayColor = stage.display.toLowerCase();
            if (stageNum === 1) {
                // Press the button with that color
                correctPosition = buttons.indexOf(displayColor);
            } else if (stageNum === 2) {
                // "YELLOW" = same POSITION as stage 1, "GREEN" = position 1
                if (displayColor === 'yellow' && stageHistory.length > 0) {
                    correctPosition = stageHistory[0].position;
                } else if (displayColor === 'green') {
                    correctPosition = 0;
                } else {
                    correctPosition = buttons.indexOf(displayColor);
                }
            } else {
                // Stage 3+: color = same COLOR as previous stage
                const prevColor = stageHistory[stageHistory.length - 1]?.color;
                correctPosition = prevColor ? buttons.indexOf(prevColor) : buttons.indexOf(displayColor);
            }
        }

        // Ensure valid position
        if (correctPosition < 0) correctPosition = 0;
        if (correctPosition > 3) correctPosition = 3;

        // Record what we're pressing (like the validator does)
        const pressedColor = buttons[correctPosition];
        stageHistory.push({ position: correctPosition, color: pressedColor });

        // Button test IDs are memory-btn-1 through memory-btn-4 (1-indexed)
        const buttonIndex = correctPosition + 1;
        console.log(`SequenceMemory: stage ${stageNum}, display=${stage.display}, correctPosition=${correctPosition}, clicking memory-btn-${buttonIndex}`);
        await page.getByTestId(`memory-btn-${buttonIndex}`).click();
        await page.waitForTimeout(800); // Wait for stage transition
    }
}

export interface CountdownOverrideSolution {
    answer: string;
}

export async function solveCountdownOverride(page: Page, solution: CountdownOverrideSolution) {
    await page.getByTestId('answer-input').fill(solution.answer);
    await page.getByTestId('submit-answer-btn').click();
}

export interface CapacitorBankSolution {
    targetVoltages: Record<string, { min: number; max: number }>;
    maxSystemVoltage: number;
}

export interface CapacitorBankView {
    capacitors: Array<{
        id: string;
        voltage: number;
        colorBand: string;
        isCritical: boolean;
    }>;
    systemVoltage: number;
}

export async function solveCapacitorBank(page: Page, solution: CapacitorBankSolution, defuserView: CapacitorBankView) {
    // The challenge: adjusting one capacitor affects neighbors (inverse effect)
    // Strategy: reduce all voltages to safe levels, handling the complex interactions

    console.log(`CapacitorBank: Starting voltages:`, defuserView.capacitors.map(c => `${c.id}:${c.voltage}V`).join(', '));
    console.log(`CapacitorBank: Target ranges:`, solution.targetVoltages);

    // Helper to get current total from the UI
    async function readTotalVoltage(): Promise<number> {
        const totalText = await page.locator('.total-voltage span').first().textContent();
        return parseInt(totalText?.replace('V', '') || '0');
    }

    // First pass: aggressively reduce if total is above 300
    let attempts = 0;
    while (attempts < 50) {
        const total = await readTotalVoltage();
        if (total <= 300) break;

        // Click decrease on each capacitor in turn
        for (let i = 0; i < 5; i++) {
            const capEl = page.locator(`[data-testid="capacitor-${i}"]`);
            const decBtn = capEl.locator('button').first();
            if (await decBtn.count() > 0 && !await decBtn.isDisabled()) {
                await decBtn.click();
                await page.waitForTimeout(30);
            }
        }
        attempts++;
    }

    // Second pass: adjust each capacitor to be within its valid range
    // Critical red capacitors need voltage <= 50
    // Critical blue capacitors need voltage 55-65
    // All others need voltage 30-80
    for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < defuserView.capacitors.length; i++) {
            const cap = defuserView.capacitors[i];
            const target = solution.targetVoltages[cap.id];
            if (!target) continue;

            const capEl = page.locator(`[data-testid="capacitor-${i}"]`);
            const voltageText = await capEl.locator('.voltage-text').textContent();
            const currentVoltage = parseInt(voltageText?.replace('V', '') || '0');

            // Calculate needed adjustment
            let targetVoltage = Math.round((target.min + target.max) / 2);
            // Clamp to be safe
            targetVoltage = Math.max(target.min, Math.min(target.max, targetVoltage));

            const diff = targetVoltage - currentVoltage;
            const clicks = Math.min(Math.abs(Math.round(diff / 5)), 8); // Limit clicks per pass

            for (let c = 0; c < clicks; c++) {
                const btn = capEl.locator('button').nth(diff > 0 ? 1 : 0);
                if (await btn.count() > 0 && !await btn.isDisabled()) {
                    await btn.click();
                    await page.waitForTimeout(30);
                }
            }
        }
    }

    // Final check: make sure total is under 300
    const dischargeBtn = page.getByTestId('discharge-btn');
    await dischargeBtn.waitFor({ state: 'visible', timeout: 5000 });

    // If still disabled, keep reducing
    for (let attempt = 0; attempt < 30 && await dischargeBtn.isDisabled(); attempt++) {
        for (let i = 0; i < 5; i++) {
            const capEl = page.locator(`[data-testid="capacitor-${i}"]`);
            const decBtn = capEl.locator('button').first();
            if (await decBtn.count() > 0 && !await decBtn.isDisabled()) {
                await decBtn.click();
                await page.waitForTimeout(30);
            }
        }
    }

    const finalTotal = await readTotalVoltage();
    console.log(`CapacitorBank: Final total voltage: ${finalTotal}`);

    await dischargeBtn.click({ force: true });
}

export interface PressureEqualizerSolution {
    unlockConditions: Record<number, string>;
    targetConfig: Record<number, string[]>;
}

export interface PressureEqualizerView {
    sliders: Array<{
        id: number;
        position: string;
        pressure: number;
        indicator: string;
        isLocked: boolean;
    }>;
    systemPressure: number;
    targetPressure: { min: number; max: number };
}

export async function solvePressureEqualizer(page: Page, solution: PressureEqualizerSolution, defuserView: PressureEqualizerView) {
    const POSITIONS = ['A', 'B', 'C', 'D', 'E'];
    const PRESSURE_MAP: Record<string, number> = { 'A': 2, 'B': 4, 'C': 6, 'D': 8, 'E': 10 };

    console.log(`PressureEqualizer: Starting, sliders:`, defuserView.sliders.map(s => `${s.id}:${s.position}${s.isLocked ? '(locked)' : ''}`).join(', '));
    console.log(`PressureEqualizer: Target config:`, solution.targetConfig);

    // Helper to read current positions from UI
    async function readCurrentPositions(): Promise<string[]> {
        const positions: string[] = [];
        for (let i = 0; i < 5; i++) {
            const sliderEl = page.locator(`[data-testid="slider-${i}"]`);
            const activePos = sliderEl.locator('.slider-position.active');
            const posText = await activePos.textContent() || 'C';
            positions.push(posText.trim());
        }
        return positions;
    }

    // Helper to attempt moving a slider - returns true if successful
    async function tryMoveSlider(idx: number, direction: 'up' | 'down'): Promise<boolean> {
        const sliderEl = page.locator(`[data-testid="slider-${idx}"]`);
        if (await sliderEl.count() === 0) return false;

        const btnIdx = direction === 'up' ? 0 : 1;
        const btn = sliderEl.locator('button').nth(btnIdx);
        if (await btn.count() > 0 && !await btn.isDisabled()) {
            await btn.click();
            await page.waitForTimeout(100);
            return true;
        }
        return false;
    }

    // Helper to set slider to a specific position
    async function setSliderToPosition(idx: number, targetPos: string): Promise<void> {
        const targetIdx = POSITIONS.indexOf(targetPos);
        for (let attempt = 0; attempt < 8; attempt++) {
            const positions = await readCurrentPositions();
            const curIdx = POSITIONS.indexOf(positions[idx]);
            if (curIdx === targetIdx) break;

            const moved = await tryMoveSlider(idx, curIdx < targetIdx ? 'up' : 'down');
            if (!moved) break; // Slider is locked or at limit
        }
    }

    // Step 1: Unlock slider 1 by moving slider 3 (idx=2) to C or higher
    // Each move sends an action to server which triggers unlock check
    console.log('PressureEqualizer: Step 1 - Moving slider 3 to C or higher to unlock slider 1');
    await setSliderToPosition(2, 'D');
    await page.waitForTimeout(300);

    // Step 2: Unlock slider 4 by getting slider 5's indicator to green
    // Slider 5 needs pressure 4-8 (positions B, C, or D) for green indicator
    console.log('PressureEqualizer: Step 2 - Moving slider 5 to position C for green indicator');
    await setSliderToPosition(4, 'C');
    await page.waitForTimeout(300);

    // Step 3: Now that sliders are unlocked, set all to position C
    // We need to do this in multiple passes because unlock happens after action
    console.log('PressureEqualizer: Step 3 - Positioning all sliders to C');

    for (let pass = 0; pass < 5; pass++) {
        // Try to set each slider to C
        for (let i = 0; i < 5; i++) {
            await setSliderToPosition(i, 'C');
        }
        await page.waitForTimeout(150);

        // Check if all sliders are at C now
        const positions = await readCurrentPositions();
        if (positions.every(p => p === 'C')) {
            console.log(`PressureEqualizer: All sliders at C after pass ${pass + 1}`);
            break;
        }
    }

    // Read positions and calculate pressure
    let positions = await readCurrentPositions();
    console.log(`PressureEqualizer: Final positions: ${positions.join(', ')}`);
    let totalPressure = positions.reduce((sum, pos) => sum + (PRESSURE_MAP[pos] || 6), 0);
    console.log(`PressureEqualizer: Calculated pressure: ${totalPressure}`);

    // Adjust to get pressure in 26-30 range (5 sliders at C = 30)
    // If any slider is still at A, move it up
    for (let i = 0; i < 5; i++) {
        if (positions[i] === 'A') {
            await tryMoveSlider(i, 'up');
            console.log(`PressureEqualizer: Moved slider ${i} away from A`);
        }
    }

    // Reduce if over 30
    positions = await readCurrentPositions();
    totalPressure = positions.reduce((sum, pos) => sum + (PRESSURE_MAP[pos] || 6), 0);
    for (let attempt = 0; attempt < 5 && totalPressure > 30; attempt++) {
        for (let i = 0; i < 5; i++) {
            if (positions[i] !== 'B' && positions[i] !== 'A') {
                if (await tryMoveSlider(i, 'down')) {
                    positions = await readCurrentPositions();
                    totalPressure = positions.reduce((sum, pos) => sum + (PRESSURE_MAP[pos] || 6), 0);
                    console.log(`PressureEqualizer: Reduced slider ${i}, now ${totalPressure}`);
                    break;
                }
            }
        }
    }

    // Increase if under 26
    for (let attempt = 0; attempt < 5 && totalPressure < 26; attempt++) {
        for (let i = 0; i < 5; i++) {
            if (positions[i] !== 'E') {
                if (await tryMoveSlider(i, 'up')) {
                    positions = await readCurrentPositions();
                    totalPressure = positions.reduce((sum, pos) => sum + (PRESSURE_MAP[pos] || 6), 0);
                    console.log(`PressureEqualizer: Increased slider ${i}, now ${totalPressure}`);
                    break;
                }
            }
        }
    }

    // Read final pressure from UI
    const pressureDisplay = page.locator('.pressure-display span').first();
    let pressureText = await pressureDisplay.textContent() || '0';
    let pressure = parseInt(pressureText);
    console.log(`PressureEqualizer: Final pressure from UI: ${pressure}`);

    await page.waitForTimeout(200);

    // Submit
    const confirmBtn = page.getByTestId('confirm-pressure-btn');
    if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
    }
}

export interface MazeNavigatorSolution {
    mazeIndex: number;
    walls: number[][];
}

export interface MazeNavigatorView {
    gridSize: number;
    currentPosition: { row: number; col: number };
    goalPosition: { row: number; col: number };
    waypoints: Array<{ row: number; col: number }>;
    visitedWaypoints: number[];
}

// Simple BFS pathfinding with better debugging
function findPath(
    walls: number[][],
    start: { row: number; col: number },
    goal: { row: number; col: number }
): Array<{ row: number; col: number }> {
    const size = walls.length;
    const visited = new Set<string>();
    const queue: Array<{ pos: { row: number; col: number }; path: Array<{ row: number; col: number }> }> = [];

    // Check if start or goal is on a wall
    if (walls[start.row]?.[start.col] === 1) {
        console.log(`MazeNavigator BFS: Start position (${start.row},${start.col}) is on a wall!`);
        return [];
    }
    if (walls[goal.row]?.[goal.col] === 1) {
        console.log(`MazeNavigator BFS: Goal position (${goal.row},${goal.col}) is on a wall!`);
        return [];
    }

    queue.push({ pos: start, path: [start] });
    visited.add(`${start.row}-${start.col}`);

    const directions = [
        { dr: -1, dc: 0, name: 'up' },
        { dr: 1, dc: 0, name: 'down' },
        { dr: 0, dc: -1, name: 'left' },
        { dr: 0, dc: 1, name: 'right' }
    ];

    while (queue.length > 0) {
        const { pos, path } = queue.shift()!;

        if (pos.row === goal.row && pos.col === goal.col) {
            console.log(`MazeNavigator BFS: Found path of length ${path.length}`);
            return path;
        }

        for (const { dr, dc } of directions) {
            const nr = pos.row + dr;
            const nc = pos.col + dc;
            const key = `${nr}-${nc}`;

            if (nr >= 0 && nr < size && nc >= 0 && nc < size &&
                !visited.has(key) && walls[nr]?.[nc] === 0) {
                visited.add(key);
                queue.push({ pos: { row: nr, col: nc }, path: [...path, { row: nr, col: nc }] });
            }
        }
    }

    console.log(`MazeNavigator BFS: No path found from (${start.row},${start.col}) to (${goal.row},${goal.col})`);
    return []; // No path found
}

export async function solveMazeNavigator(page: Page, solution: MazeNavigatorSolution, defuserView: MazeNavigatorView) {
    const walls = solution.walls;
    let current = { ...defuserView.currentPosition };

    console.log(`MazeNavigator: Starting at (${current.row}, ${current.col})`);
    console.log(`MazeNavigator: Goal at (${defuserView.goalPosition.row}, ${defuserView.goalPosition.col})`);
    console.log(`MazeNavigator: Waypoints:`, defuserView.waypoints);
    console.log(`MazeNavigator: Walls:`, walls);

    // Visit all waypoints then go to goal
    const targets = [...defuserView.waypoints, defuserView.goalPosition];

    for (const target of targets) {
        console.log(`MazeNavigator: Finding path from (${current.row},${current.col}) to (${target.row},${target.col})`);
        const path = findPath(walls, current, target);

        if (path.length === 0) {
            console.log(`MazeNavigator: No path found! Skipping target.`);
            continue;
        }

        // Navigate path (skip first element which is current position)
        for (let i = 1; i < path.length; i++) {
            const next = path[i];
            let direction: string;

            if (next.row < current.row) direction = 'up';
            else if (next.row > current.row) direction = 'down';
            else if (next.col < current.col) direction = 'left';
            else direction = 'right';

            const moveBtn = page.getByTestId(`move-${direction}`);
            if (await moveBtn.count() > 0) {
                await moveBtn.click();
                await page.waitForTimeout(150);
                current = next;
            } else {
                console.log(`MazeNavigator: move-${direction} button not found!`);
            }
        }

        // Small delay between waypoints
        await page.waitForTimeout(100);
    }

    console.log(`MazeNavigator: Final position (${current.row}, ${current.col})`);
}

export interface MechanicalSwitchesSolution {
    targetConfiguration: Record<number, string>;
}

export interface MechanicalSwitchesView {
    switches: Array<{
        type: 'two-position' | 'three-position' | 'rotary';
        id: number;
        symbol: string;
        housing: string;
        position: string | number;
    }>;
    statusLights: boolean[];
    targetPattern: boolean[];
}

export async function solveMechanicalSwitches(page: Page, solution: MechanicalSwitchesSolution, defuserView: MechanicalSwitchesView) {
    // The solution.targetConfiguration now contains the positions that achieve the target pattern
    const switches = defuserView.switches;

    console.log('MechanicalSwitches targetConfiguration:', solution.targetConfiguration);
    console.log('MechanicalSwitches initial positions:', switches.map((s, i) => `${i}:${s.position}`).join(', '));

    // Helper to click a switch to a specific position
    async function setSwitch(idx: number, targetPos: string) {
        const sw = switches[idx];
        const switchEl = page.locator(`[data-testid="switch-${idx}"]`);
        if (await switchEl.count() === 0) {
            console.log(`MechanicalSwitches: Switch ${idx} not found`);
            return;
        }

        console.log(`MechanicalSwitches: Setting switch ${idx} (${sw.type}) from ${sw.position} to ${targetPos}`);

        if (sw.type === 'two-position') {
            // Click UP or DOWN button based on target
            const btnText = targetPos === 'up' || targetPos === '1' ? 'UP' : 'DOWN';
            const btn = switchEl.locator(`button:has-text("${btnText}")`);
            if (await btn.count() > 0) {
                await btn.click();
                console.log(`MechanicalSwitches: Clicked ${btnText} on switch ${idx}`);
            }
        } else if (sw.type === 'three-position') {
            // Convert position to number if needed
            let posNum: number;
            if (targetPos === 'up') posNum = 1;
            else if (targetPos === 'middle') posNum = 2;
            else if (targetPos === 'down') posNum = 3;
            else posNum = parseInt(targetPos) || 1;

            const btn = switchEl.locator(`button:has-text("${posNum}")`);
            if (await btn.count() > 0) {
                await btn.click();
                console.log(`MechanicalSwitches: Clicked position ${posNum} on switch ${idx}`);
            }
        } else if (sw.type === 'rotary') {
            // Click rotate buttons to reach target
            const targetNum = parseInt(targetPos) || 1;
            const currentPos = typeof sw.position === 'number' ? sw.position :
                typeof sw.position === 'string' ? parseInt(sw.position) || 1 : 1;

            // Calculate clicks needed (forward rotation)
            let clicks = (targetNum - currentPos + 4) % 4;
            console.log(`MechanicalSwitches: Rotary switch ${idx} needs ${clicks} clicks from ${currentPos} to ${targetNum}`);
            const rotateBtn = switchEl.locator('button:has-text("↻")');
            for (let i = 0; i < clicks; i++) {
                if (await rotateBtn.count() > 0) {
                    await rotateBtn.click();
                    await page.waitForTimeout(50);
                }
            }
        }
        await page.waitForTimeout(100);
    }

    // Set each switch to the target configuration
    for (const [idxStr, targetPos] of Object.entries(solution.targetConfiguration)) {
        const idx = parseInt(idxStr);
        await setSwitch(idx, targetPos);
    }

    // Submit
    console.log('MechanicalSwitches: Clicking confirm button');
    const confirmBtn = page.getByTestId('confirm-switches-btn');
    if (await confirmBtn.count() > 0) {
        await confirmBtn.click();
    } else {
        console.log('MechanicalSwitches: Confirm button not found');
    }
}
