import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction, GameIndicator } from '../../../../shared/types';
import './puzzles.css';

interface MechanicalSwitchesPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    indicators: GameIndicator[];
}

interface Switch {
    type: 'two-position' | 'three-position' | 'rotary';
    symbol: string;
    housing: string;
    position: number;
}

export function MechanicalSwitchesPuzzle({ puzzle, onAction, indicators }: MechanicalSwitchesPuzzleProps) {
    const [switches, setSwitches] = useState<Switch[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Initialize switches from defuserView
    useEffect(() => {
        if (puzzle.defuserView && !initialized) {
            const { switches: initialSwitches } = puzzle.defuserView as { switches: Switch[] };
            setSwitches(initialSwitches);
            setInitialized(true);
        }
    }, [puzzle.defuserView, initialized]);

    if (!puzzle.defuserView || switches.length === 0) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }

    const { statusLights } = puzzle.defuserView as {
        switches: Switch[];
        statusLights: boolean[];
        targetPattern: boolean[];
    };

    const hasFRK = indicators.some(ind => ind.label === 'FRK' && ind.isLit);
    const hasCAR = indicators.some(ind => ind.label === 'CAR' && ind.isLit);

    const handleSwitchToggle = (index: number, newPosition: number) => {
        const newSwitches = [...switches];
        newSwitches[index] = {
            ...newSwitches[index],
            position: newPosition
        };
        setSwitches(newSwitches);
        onAction({ type: 'toggle-switch', index, position: newPosition });
    };

    const getTargetPatternInfo = () => {
        if (hasFRK && hasCAR) return '●○●○●';
        if (hasFRK) return '●●○○●';
        if (hasCAR) return '○●●●○';
        return '●●●○○';
    };

    return (
        <div className="mechanical-switches-puzzle">
            <div className="pattern-display">
                <div className="pattern-label">Target:</div>
                <div className="pattern-lights target">
                    {getTargetPatternInfo().split('').map((char, idx) => (
                        <div key={idx} className={`pattern-light ${char === '●' ? 'on' : ''}`} />
                    ))}
                </div>
            </div>

            <div className="pattern-display">
                <div className="pattern-label">Current:</div>
                <div className="pattern-lights current">
                    {statusLights.map((lit, idx) => (
                        <div key={idx} className={`pattern-light ${lit ? 'on' : ''}`} />
                    ))}
                </div>
            </div>

            <div className="switches-grid">
                {switches.map((sw, idx) => (
                    <div
                        key={idx}
                        className={`switch-unit ${sw.housing}`}
                        data-testid={`switch-${idx}`}
                    >
                        <div className="switch-symbol">{sw.symbol}</div>
                        <div className="switch-type">{sw.type}</div>

                        {sw.type === 'two-position' && (
                            <div className="toggle-switch-control">
                                <button
                                    className={`toggle-pos ${sw.position === 1 ? 'active' : ''}`}
                                    onClick={() => handleSwitchToggle(idx, 1)}
                                >
                                    UP
                                </button>
                                <button
                                    className={`toggle-pos ${sw.position === 2 ? 'active' : ''}`}
                                    onClick={() => handleSwitchToggle(idx, 2)}
                                >
                                    DOWN
                                </button>
                            </div>
                        )}

                        {sw.type === 'three-position' && (
                            <div className="three-pos-control">
                                {[1, 2, 3].map(pos => (
                                    <button
                                        key={pos}
                                        className={`three-pos ${sw.position === pos ? 'active' : ''}`}
                                        onClick={() => handleSwitchToggle(idx, pos)}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        )}

                        {sw.type === 'rotary' && (
                            <div className="rotary-control">
                                <div
                                    className="rotary-dial"
                                    style={{ transform: `rotate(${(sw.position - 1) * 90}deg)` }}
                                >
                                    ▲
                                </div>
                                <div className="rotary-buttons">
                                    <button onClick={() => handleSwitchToggle(idx, sw.position > 1 ? sw.position - 1 : 4)}>↺</button>
                                    <button onClick={() => handleSwitchToggle(idx, sw.position < 4 ? sw.position + 1 : 1)}>↻</button>
                                </div>
                            </div>
                        )}

                        <div className={`switch-housing-color ${sw.housing}`}>
                            {sw.housing}
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary confirm-btn"
                onClick={() => onAction({ type: 'confirm-switches', positions: switches.map(s => s.position) })}
                data-testid="confirm-switches-btn"
            >
                ✓ CONFIRM
            </button>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader each switch's <strong>type</strong> (two-position, three-position, rotary)</li>
                    <li>Tell reader each switch's <strong>symbol</strong> (★, ◆, ●, ▲, ■, ♦)</li>
                    <li>Tell reader each switch's <strong>housing color</strong></li>
                    <li>Report the current <strong>status light pattern</strong> (5 lights, ● or ○)</li>
                    <li>Reader will tell you the <strong>target pattern</strong> and switch order</li>
                    <li>Adjust switches: <strong>UP/DOWN</strong> for toggles, <strong>1/2/3</strong> for three-position, <strong>↺/↻</strong> for rotary</li>
                    <li>Press <strong>CONFIRM</strong> when pattern matches target</li>
                </ol>
                <p className="note">📋 Follow switch order rules! (Rotary first, GREEN housing last)</p>
            </div>
        </div>
    );
}
