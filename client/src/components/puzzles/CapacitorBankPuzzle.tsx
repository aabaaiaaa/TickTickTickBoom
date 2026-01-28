import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction, GameIndicator } from '../../../../shared/types';
import './puzzles.css';

interface CapacitorBankPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    indicators: GameIndicator[];
}

interface Capacitor {
    id: string;
    voltage: number;
    colorBand: string;
    isCritical: boolean;
}

export function CapacitorBankPuzzle({ puzzle, onAction, indicators }: CapacitorBankPuzzleProps) {
    const [capacitors, setCapacitors] = useState<Capacitor[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Initialize capacitors from defuserView
    useEffect(() => {
        if (puzzle.defuserView && !initialized) {
            const { capacitors: initialCapacitors } = puzzle.defuserView as { capacitors: Capacitor[] };
            setCapacitors(initialCapacitors);
            setInitialized(true);
        }
    }, [puzzle.defuserView, initialized]);

    if (!puzzle.defuserView || capacitors.length === 0) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }

    const hasBOB = indicators.some(ind => ind.label === 'BOB' && ind.isFlickering);
    const totalVoltage = capacitors.reduce((sum, c) => sum + c.voltage, 0);

    const handleAdjust = (index: number, direction: 'left' | 'right') => {
        const newCapacitors = [...capacitors];
        const delta = direction === 'left' ? -5 : 5;

        // Adjust this capacitor
        newCapacitors[index] = {
            ...newCapacitors[index],
            voltage: Math.max(0, Math.min(100, newCapacitors[index].voltage + delta))
        };

        // Adjust neighbors inversely
        if (index > 0) {
            newCapacitors[index - 1] = {
                ...newCapacitors[index - 1],
                voltage: Math.max(0, Math.min(100, newCapacitors[index - 1].voltage - delta / 2))
            };
        }
        if (index < newCapacitors.length - 1) {
            newCapacitors[index + 1] = {
                ...newCapacitors[index + 1],
                voltage: Math.max(0, Math.min(100, newCapacitors[index + 1].voltage - delta / 2))
            };
        }

        setCapacitors(newCapacitors);
        onAction({ type: 'adjust-capacitor', index, direction, newState: newCapacitors });
    };

    const handleDischarge = () => {
        onAction({ type: 'discharge', voltages: capacitors.map(c => c.voltage) });
    };

    return (
        <div className="capacitor-bank-puzzle">
            <div className="total-voltage">
                Total: <span className={totalVoltage > 300 ? 'danger' : ''}>{totalVoltage}V</span>
                {totalVoltage > 300 && <span className="warning">⚠️ DANGER!</span>}
            </div>

            {hasBOB && (
                <div className="bob-warning">BOB flickering: +10V safety margin</div>
            )}

            <div className="capacitor-row">
                {capacitors.map((cap, idx) => (
                    <div key={idx} className={`capacitor ${cap.isCritical ? 'critical' : ''}`} data-testid={`capacitor-${idx}`}>
                        <div className="capacitor-label">C{idx + 1}</div>
                        <div
                            className="capacitor-body"
                            style={{ borderColor: cap.colorBand }}
                        >
                            <div
                                className="voltage-fill"
                                style={{ height: `${cap.voltage}%` }}
                            />
                            <span className="voltage-text">{cap.voltage}V</span>
                        </div>
                        <div className="capacitor-controls">
                            <button
                                className="valve-btn"
                                onClick={() => handleAdjust(idx, 'left')}
                            >
                                ↺
                            </button>
                            <button
                                className="valve-btn"
                                onClick={() => handleAdjust(idx, 'right')}
                            >
                                ↻
                            </button>
                        </div>
                        {cap.isCritical && <span className="critical-badge">!</span>}
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary discharge-btn"
                onClick={handleDischarge}
                disabled={totalVoltage > 300}
                data-testid="discharge-btn"
            >
                ⚡ DISCHARGE
            </button>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader each capacitor's <strong>voltage</strong> (C1-C5)</li>
                    <li>Tell reader the <strong>color band</strong> on each capacitor</li>
                    <li>Report which capacitors are <strong>blinking (!)</strong> = critical</li>
                    <li>Use <strong>↺/↻ buttons</strong> to adjust voltages (affects neighbors too!)</li>
                    <li>Reader will guide you to safe voltage ranges</li>
                    <li>Press <strong>DISCHARGE</strong> when all voltages are safe</li>
                </ol>
                <p className="note">⚠️ NEVER discharge if total exceeds 300V!</p>
            </div>
        </div>
    );
}
