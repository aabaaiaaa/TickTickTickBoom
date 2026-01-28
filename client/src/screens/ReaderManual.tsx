import type { useGameState } from '../hooks/useGameState';
import { Timer } from '../components/Timer';
import { StrikeIndicator } from '../components/StrikeIndicator';
import { TakeoverModal } from '../components/TakeoverModal';
import './ReaderManual.css';

interface ReaderManualProps {
    gameState: ReturnType<typeof useGameState>;
}

export function ReaderManual({ gameState }: ReaderManualProps) {
    const { room, gameState: game } = gameState;

    if (!room || !game) {
        return <div className="loading">Loading...</div>;
    }

    const isPaused = room.phase === 'paused';

    return (
        <div className="reader-screen" data-testid="reader-screen">
            {/* Status Bar */}
            <div className="reader-status-bar">
                <div className="status-left">
                    <span className="role-badge">📖 READER</span>
                    <span className="room-info">Room: {room.code}</span>
                </div>
                <Timer timeRemaining={game.timeRemaining} isPaused={isPaused} compact />
                <StrikeIndicator strikes={game.strikes} maxStrikes={game.maxStrikes} compact />
            </div>

            {/* Manual Content */}
            <div className="manual-container">
                <div className="manual-sidebar">
                    <h3>📑 Contents</h3>
                    <nav className="toc">
                        <a href="#wire-array">1. Wire Array</a>
                        <a href="#button-matrix">2. Button Matrix</a>
                        <a href="#keypad-cipher">3. Keypad Cipher</a>
                        <a href="#indicator-lights">4. Indicator Lights</a>
                        <a href="#frequency-tuner">5. Frequency Tuner</a>
                        <a href="#simon-signals">6. Simon Signals</a>
                        <a href="#sequence-memory">7. Sequence Memory</a>
                        <a href="#countdown-override">8. Countdown Override</a>
                        <a href="#capacitor-bank">9. Capacitor Bank</a>
                        <a href="#pressure-equalizer">10. Pressure Equalizer</a>
                        <a href="#maze-navigator">11. Maze Navigator</a>
                        <a href="#mechanical-switches">12. Mechanical Switches</a>
                    </nav>
                </div>

                <div className="manual-content">
                    <div className="manual-header">
                        <h1>🔴 BOMB DEFUSAL MANUAL 🔴</h1>
                        <p className="manual-subtitle">CLASSIFIED - AUTHORIZED PERSONNEL ONLY</p>
                        <p className="manual-warning">⚠️ DO NOT SHOW TO DEFUSER ⚠️</p>
                    </div>

                    {/* Wire Array */}
                    <section id="wire-array" className="manual-section">
                        <h2>1. WIRE ARRAY</h2>
                        <p className="section-intro">A panel with colored wires. Cut the correct wire(s) based on colors, symbols, and serial number.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>How many wires are there?</li>
                                <li>What colors are the wires (in order)?</li>
                                <li>Are any wires striped (two colors)?</li>
                                <li>What symbols are on the wire tags? (△, ○, □, ☆, ◇)</li>
                                <li>Is the last digit of the serial number odd or even?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>4 WIRES:</h3>
                            <ul>
                                <li>If there are more than one red wire AND serial is even → Cut the LAST red wire</li>
                                <li>Otherwise, if there are no yellow wires → Cut the FIRST wire</li>
                                <li>Otherwise, if there is exactly one blue wire → Cut the FIRST blue wire</li>
                                <li>Otherwise → Cut the LAST wire</li>
                            </ul>

                            <h3>5 WIRES:</h3>
                            <ul>
                                <li>If there are more red than blue wires → Cut the wire with ☆ symbol</li>
                                <li>Otherwise, if there is a striped wire → Cut the LAST wire</li>
                                <li>Otherwise, if there is a wire with △ → Cut that wire</li>
                                <li>Otherwise → Cut the SECOND wire</li>
                            </ul>

                            <h3>6 WIRES:</h3>
                            <ul>
                                <li>If no yellow wires AND serial is odd → Cut the THIRD wire</li>
                                <li>Otherwise, if exactly one yellow AND more than one red → Cut the FIRST yellow wire</li>
                                <li>Otherwise, if no white wires → Cut the FOURTH wire</li>
                                <li>Otherwise → Cut the FIRST wire</li>
                            </ul>
                        </div>
                    </section>

                    {/* Button Matrix */}
                    <section id="button-matrix" className="manual-section">
                        <h2>2. BUTTON MATRIX</h2>
                        <p className="section-intro">A 3×3 grid of colored buttons with labels. Press or hold the correct button.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>Describe each button: position, color, label (PRESS/HOLD/ABORT/DETONATE/ARM), LED on or off?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Finding the correct button:</h3>
                            <ol>
                                <li>Locate the ABORT button first.</li>
                                <li>If ABORT is <strong>blue</strong> and its LED is ON → <strong>Press</strong> and release immediately</li>
                                <li>If ABORT is <strong>red</strong> → Find the DETONATE button and <strong>hold</strong> it</li>
                                <li>Otherwise → <strong>Hold</strong> the ABORT button</li>
                            </ol>

                            <h3>When holding a button:</h3>
                            <p>A colored indicator will light up. Release when the timer contains:</p>
                            <ul>
                                <li>Yellow indicator → Release when timer shows a "7"</li>
                                <li>White indicator → Release when timer shows a "1"</li>
                                <li>Blue indicator → Release when timer shows a "4"</li>
                                <li>Any other color → Release when timer shows a "5"</li>
                            </ul>
                        </div>
                    </section>

                    {/* Keypad Cipher */}
                    <section id="keypad-cipher" className="manual-section">
                        <h2>3. KEYPAD CIPHER</h2>
                        <p className="section-intro">A 4×4 grid of strange symbols. Enter 4 symbols in the correct order.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser to describe ALL 16 symbols on the keypad.</h3>
                            <p>Common symbols: Ω, ∂, Ψ, Ͼ, ★, ⊗, ☽, Ϙ, ⊕, ϗ, ⚡, ☆, ¥, ©, ¶, Ξ</p>
                        </div>

                        <div className="rule-table">
                            <h3>Find the matching column:</h3>
                            <p>Find the column below where ALL symbols from the keypad appear:</p>

                            <div className="columns-grid">
                                <div className="symbol-column">
                                    <h4>Column 1</h4>
                                    <p>Ω ∂ Ψ Ͼ ★ ⊗</p>
                                </div>
                                <div className="symbol-column">
                                    <h4>Column 2</h4>
                                    <p>☽ Ϙ ⊕ Ω ∂ ϗ</p>
                                </div>
                                <div className="symbol-column">
                                    <h4>Column 3</h4>
                                    <p>⚡ ☽ Ͼ ★ ⊗ Ψ</p>
                                </div>
                                <div className="symbol-column">
                                    <h4>Column 4</h4>
                                    <p>¥ © ¶ Ξ Ͽ ★</p>
                                </div>
                                <div className="symbol-column">
                                    <h4>Column 5</h4>
                                    <p>☀ ¥ Ԇ ⊕ © ✿</p>
                                </div>
                                <div className="symbol-column">
                                    <h4>Column 6</h4>
                                    <p>♠ ♣ ♥ ♦ ☢ ☣</p>
                                </div>
                            </div>

                            <p className="note">⚠️ If NSA indicator is present → Always use Column 6</p>
                            <p>Press symbols in the order they appear in your column (top to bottom).</p>
                        </div>
                    </section>

                    {/* Indicator Lights */}
                    <section id="indicator-lights" className="manual-section">
                        <h2>4. INDICATOR LIGHTS</h2>
                        <p className="section-intro">A panel with 6-8 labeled indicators. The defuser must configure indicators to meet all safety rules.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What indicators are present? (FRK, CAR, BOB, NSA, SIG, MSA, CLR, IND)</li>
                                <li>Which are lit, unlit, or flickering?</li>
                                <li>Which indicators are LOCKED (🔒)?</li>
                                <li>What are the current status values? (Lit count, Flickering count, CAR/SIG status)</li>
                            </ul>
                        </div>

                        <div className="rule-table important">
                            <h3>📝 RECORD THIS INFO - Used by other modules!</h3>
                            <ul>
                                <li>FRK lit → Affects Frequency Tuner (+0.5 MHz)</li>
                                <li>CAR lit (red) → Wire Array uses alternate rules</li>
                                <li>BOB flickering → Capacitor Bank needs extra margin</li>
                                <li>NSA present → Keypad uses Column 6</li>
                            </ul>

                            <h3>⚠️ ALL THREE Rules Must Be Met:</h3>
                            <ol>
                                <li><strong>FLICKERING:</strong> No more than 3 indicators can be flickering</li>
                                <li><strong>CAR/SIG:</strong> If CAR is lit, SIG MUST also be lit</li>
                                <li><strong>EVEN COUNT:</strong> Total lit indicators must be an EVEN number</li>
                            </ol>

                            <h3>Defuser Controls:</h3>
                            <ul>
                                <li><strong>Click indicator</strong> → Toggle ON/OFF (only unlocked ones)</li>
                                <li><strong>⚡ button</strong> → Toggle flickering (only on lit indicators)</li>
                            </ul>

                            <h3>Strategy:</h3>
                            <ol>
                                <li>First, fix CAR/SIG rule (turn on SIG if CAR is lit)</li>
                                <li>Then reduce flickering if more than 3</li>
                                <li>Finally, adjust lit count to be even</li>
                                <li>Press VERIFY when all three status indicators show ✓</li>
                            </ol>
                        </div>
                    </section>

                    {/* Frequency Tuner */}
                    <section id="frequency-tuner" className="manual-section">
                        <h2>5. FREQUENCY TUNER</h2>
                        <p className="section-intro">An analog radio with frequency dial and switches. Tune to the correct frequency.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What is the FIRST letter of the serial number?</li>
                                <li>With BOOST on, how many beeps do you hear?</li>
                                <li>Is the sound clearer with FILTER on or off?</li>
                                <li>Do you hear morse code, musical tones, or spoken numbers?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Step 1: Switch Configuration</h3>
                            <ul>
                                <li>Morse code → Set to AM mode</li>
                                <li>Musical tones or numbers → Set to FM mode</li>
                                <li>Keep FILTER in whichever position sounds clearer</li>
                            </ul>

                            <h3>Step 2: Calculate Frequency</h3>
                            <table>
                                <thead>
                                    <tr><th>First Letter</th><th>Base Frequency</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>A-F</td><td>4.2 MHz</td></tr>
                                    <tr><td>G-L</td><td>5.7 MHz</td></tr>
                                    <tr><td>M-R</td><td>7.1 MHz</td></tr>
                                    <tr><td>S-Z</td><td>8.8 MHz</td></tr>
                                </tbody>
                            </table>

                            <p><strong>Final Frequency = Base + (Beep Count × 0.3)</strong></p>
                            <p className="note">If FRK indicator is lit, add 0.5 MHz to the final frequency.</p>

                            <p>Tune to the calculated frequency and press TRANSMIT.</p>
                        </div>
                    </section>

                    {/* Simon Signals */}
                    <section id="simon-signals" className="manual-section">
                        <h2>6. SIMON SIGNALS</h2>
                        <p className="section-intro">Four colored buttons that flash in sequence. Repeat the TRANSLATED sequence.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>Does the serial number contain a vowel (A, E, I, O, U)?</li>
                                <li>How many strikes does the bomb currently have?</li>
                                <li>What colors flash? (in order)</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Translation Tables</h3>
                            <p>Translate each color the defuser sees to a different color to press:</p>

                            <div className="translation-tables">
                                <div className="trans-table">
                                    <h4>VOWEL in Serial, 0 Strikes</h4>
                                    <p>Red → Blue | Blue → Red | Green → Yellow | Yellow → Green</p>
                                </div>
                                <div className="trans-table">
                                    <h4>VOWEL in Serial, 1 Strike</h4>
                                    <p>Red → Yellow | Blue → Green | Green → Blue | Yellow → Red</p>
                                </div>
                                <div className="trans-table">
                                    <h4>VOWEL in Serial, 2 Strikes</h4>
                                    <p>Red → Green | Blue → Yellow | Green → Red | Yellow → Blue</p>
                                </div>
                                <div className="trans-table">
                                    <h4>NO Vowel, 0 Strikes</h4>
                                    <p>Red → Blue | Blue → Yellow | Green → Green | Yellow → Red</p>
                                </div>
                                <div className="trans-table">
                                    <h4>NO Vowel, 1 Strike</h4>
                                    <p>Red → Red | Blue → Blue | Green → Yellow | Yellow → Green</p>
                                </div>
                                <div className="trans-table">
                                    <h4>NO Vowel, 2 Strikes</h4>
                                    <p>Red → Yellow | Blue → Green | Green → Blue | Yellow → Red</p>
                                </div>
                            </div>

                            <p className="note">Each round adds one more color to the sequence. Complete 3-5 rounds based on difficulty.</p>
                        </div>
                    </section>

                    {/* Sequence Memory */}
                    <section id="sequence-memory" className="manual-section">
                        <h2>7. SEQUENCE MEMORY</h2>
                        <p className="section-intro">Four colored buttons with a display. Press buttons based on position AND color memory.</p>

                        <div className="rule-box warning">
                            <h3>⚠️ YOU MUST TRACK EACH STAGE!</h3>
                            <p>Write down what POSITION (1-4) and what COLOR was pressed each stage.</p>
                        </div>

                        <div className="rule-table">
                            <h3>STAGE 1:</h3>
                            <ul>
                                <li>Display shows "1" → Press position 2</li>
                                <li>Display shows "2" → Press position 2</li>
                                <li>Display shows "3" → Press position 3</li>
                                <li>Display shows "4" → Press position 4</li>
                                <li>Display shows "BLUE" → Press the blue button</li>
                                <li>Display shows "RED" → Press position 1</li>
                            </ul>

                            <h3>STAGE 2:</h3>
                            <ul>
                                <li>Display shows "1" → Press same COLOR as Stage 1</li>
                                <li>Display shows "2" → Press position 1</li>
                                <li>Display shows "YELLOW" → Press same POSITION as Stage 1</li>
                                <li>Display shows "GREEN" → Press position 1</li>
                            </ul>

                            <h3>STAGE 3+:</h3>
                            <ul>
                                <li>Display shows a number → Press same POSITION as that stage number</li>
                                <li>Display shows a color → Press same COLOR as previous stage</li>
                            </ul>
                        </div>
                    </section>

                    {/* Countdown Override */}
                    <section id="countdown-override" className="manual-section">
                        <h2>8. COUNTDOWN OVERRIDE</h2>
                        <p className="section-intro">Solve quick challenges to gain bonus time. Wrong answers cost time!</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What mode is displayed? (STANDARD, ACCELERATED, CRITICAL)</li>
                                <li>What type of challenge? (Math, Word, Pattern)</li>
                                <li>What is the challenge?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>MATH Challenges:</h3>
                            <p>Solve normally. Round down if decimal.</p>

                            <h3>WORD Challenges:</h3>
                            <ul>
                                <li>STANDARD mode → Shift each letter back 3 (D→A, E→B, etc.)</li>
                                <li>ACCELERATED mode → Reverse the word</li>
                                <li>CRITICAL mode → Swap first and last letters</li>
                            </ul>

                            <h3>PATTERN Challenges:</h3>
                            <ul>
                                <li>STANDARD/ACCELERATED → Find the NEXT number in sequence</li>
                                <li>CRITICAL mode → Find the PREVIOUS number!</li>
                            </ul>

                            <h3>Time Effects:</h3>
                            <table>
                                <thead>
                                    <tr><th>Mode</th><th>Correct</th><th>Wrong</th></tr>
                                </thead>
                                <tbody>
                                    <tr><td>STANDARD</td><td>+15 sec</td><td>-20 sec</td></tr>
                                    <tr><td>ACCELERATED</td><td>+10 sec</td><td>-20 sec</td></tr>
                                    <tr><td>CRITICAL</td><td>+30 sec</td><td>-20 sec</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Capacitor Bank */}
                    <section id="capacitor-bank" className="manual-section">
                        <h2>9. CAPACITOR BANK</h2>
                        <p className="section-intro">Five capacitors with voltage meters. Balance voltages before discharging.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What is each capacitor's voltage? (C1 through C5)</li>
                                <li>What color band is on each capacitor?</li>
                                <li>Which capacitors are blinking (critical)?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>⚠️ NEVER discharge if total voltage exceeds 300V!</h3>

                            <h3>Target Voltages:</h3>
                            <ul>
                                <li>Critical capacitor with RED band → Must be BELOW 50V</li>
                                <li>Critical capacitor with BLUE band → Must be EXACTLY 55-65V</li>
                                <li>All other capacitors → Must be between 30V and 80V</li>
                            </ul>

                            <h3>Valve Adjustments:</h3>
                            <ul>
                                <li>Turn LEFT → Decreases this capacitor, increases neighbors</li>
                                <li>Turn RIGHT → Increases this capacitor, decreases neighbors</li>
                            </ul>

                            <p className="note">If BOB indicator is flickering, add 10V safety margin to all limits.</p>

                            <p>When all voltages are safe, pull DISCHARGE.</p>
                        </div>
                    </section>

                    {/* Pressure Equalizer */}
                    <section id="pressure-equalizer" className="manual-section">
                        <h2>10. PRESSURE EQUALIZER</h2>
                        <p className="section-intro">Five sliders with pressure gauges. Balance the system pressure.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What position is each slider? (A through E, A=bottom)</li>
                                <li>What color is each indicator? (Red=locked, Yellow, Green)</li>
                                <li>What is the current system pressure?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Unlock Conditions:</h3>
                            <ul>
                                <li>Slider 1 unlocks when → Slider 3 is at C or higher</li>
                                <li>Slider 4 unlocks when → Slider 5's indicator is GREEN</li>
                            </ul>

                            <h3>Target Configuration:</h3>
                            <ul>
                                <li>Total system pressure must be 26-30</li>
                                <li>No slider can be at position A</li>
                                <li>Adjacent sliders cannot be more than 2 positions apart</li>
                            </ul>

                            <h3>Pressure per Position:</h3>
                            <p>A=2, B=4, C=6, D=8, E=10</p>

                            <p>Recommended order: Slider 3 → Slider 5 → Slider 1 → Slider 2 → Slider 4</p>
                        </div>
                    </section>

                    {/* Maze Navigator */}
                    <section id="maze-navigator" className="manual-section">
                        <h2>11. MAZE NAVIGATOR</h2>
                        <p className="section-intro">A 6×6 grid with invisible walls. Guide the defuser to the goal.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>Where are the two green circles (waypoints)? Use coordinates: Column (A-F), Row (1-6)</li>
                                <li>Where is the white marker (current position)?</li>
                                <li>Where is the red triangle (goal)?</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Identify the Maze:</h3>
                            <p>Match the waypoint positions to find which maze layout:</p>
                            <ul>
                                <li>Waypoints at B2 and E5 → Maze 1</li>
                                <li>Waypoints at A4 and D6 → Maze 2</li>
                                <li>Waypoints at C3 and F6 → Maze 3</li>
                                <li>Waypoints at A1 and D3 → Maze 4</li>
                            </ul>

                            <h3>Navigation Rules:</h3>
                            <ul>
                                <li>Must pass through BOTH waypoints before reaching goal</li>
                                <li>Hitting a wall causes a strike</li>
                                <li>Guide using: "Move up/down/left/right"</li>
                            </ul>

                            <p className="note">The defuser cannot see the walls - you must guide them!</p>
                        </div>
                    </section>

                    {/* Mechanical Switches */}
                    <section id="mechanical-switches" className="manual-section">
                        <h2>12. MECHANICAL SWITCHES</h2>
                        <p className="section-intro">Six switches of various types. Configure to match the target light pattern.</p>

                        <div className="rule-box">
                            <h3>Ask the defuser:</h3>
                            <ul>
                                <li>What type is each switch? (two-position, three-position, or rotary)</li>
                                <li>What symbol is on each switch? (★, ◆, ●, ▲, ■, ♦)</li>
                                <li>What color is each switch housing?</li>
                                <li>What is the current status light pattern? (5 lights)</li>
                            </ul>
                        </div>

                        <div className="rule-table">
                            <h3>Determine Target Pattern:</h3>
                            <p>Based on Indicator Lights module:</p>
                            <ul>
                                <li>FRK lit → Target: ●●○○●</li>
                                <li>CAR lit → Target: ○●●●○</li>
                                <li>Both lit → Target: ●○●○●</li>
                                <li>Neither → Target: ●●●○○</li>
                            </ul>

                            <h3>Switch Rules:</h3>
                            <ul>
                                <li>Switches with ★ symbol → Must be in SAME position as each other</li>
                                <li>Switches with ◆ symbol → Must be in OPPOSITE positions</li>
                                <li>RED housing → Cannot be in position 1 or UP</li>
                                <li>YELLOW housing → Position must match count of lit status lights</li>
                            </ul>

                            <h3>Order of Operations:</h3>
                            <ol>
                                <li>Set rotary switches first</li>
                                <li>Then toggle switches</li>
                                <li>GREEN housing switches must be set LAST</li>
                            </ol>
                        </div>
                    </section>

                    <div className="manual-footer">
                        <p>END OF MANUAL</p>
                        <p className="footer-warning">Remember: Communication is key. Stay calm. Beat the clock.</p>
                    </div>
                </div>
            </div>

            {/* Takeover Modal */}
            {isPaused && (
                <TakeoverModal
                    onTakeover={() => gameState.requestTakeover()}
                    isDefuser={false}
                />
            )}
        </div>
    );
}
