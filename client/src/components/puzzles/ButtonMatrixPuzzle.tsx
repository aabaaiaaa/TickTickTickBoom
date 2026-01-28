import { useState, useEffect, useCallback } from 'react';
import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface ButtonMatrixPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

interface Button {
    color: string;
    label: string;
    ledOn: boolean;
}

export function ButtonMatrixPuzzle({ puzzle, onAction }: ButtonMatrixPuzzleProps) {
    const [holdingButton, setHoldingButton] = useState<{ row: number; col: number } | null>(null);
    const [holdTimer, setHoldTimer] = useState<number>(0);

    const handleHoldEnd = useCallback(() => {
        if (holdingButton) {
            onAction({ type: 'release-button', row: holdingButton.row, col: holdingButton.col, heldDuration: holdTimer });
            setHoldingButton(null);
            setHoldTimer(0);
        }
    }, [holdingButton, holdTimer, onAction]);

    useEffect(() => {
        if (holdingButton) {
            const interval = setInterval(() => {
                setHoldTimer(t => t + 100);
            }, 100);
            return () => clearInterval(interval);
        }
    }, [holdingButton]);

    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { buttons, holdIndicator } = puzzle.defuserView as {
        buttons: Button[][];
        holdIndicator?: string;
    };

    const handlePress = (row: number, col: number) => {
        onAction({ type: 'press-button', row, col });
    };

    const handleHoldStart = (row: number, col: number) => {
        setHoldingButton({ row, col });
    };

    return (
        <div className="button-matrix-puzzle">
            {holdIndicator && (
                <div className="hold-indicator" style={{ color: holdIndicator }}>
                    Indicator: {holdIndicator.toUpperCase()}
                </div>
            )}

            <div className="button-grid">
                {buttons.map((row, rowIdx) => (
                    <div key={rowIdx} className="button-row">
                        {row.map((btn, colIdx) => (
                            <div
                                key={colIdx}
                                className={`matrix-button ${holdingButton?.row === rowIdx && holdingButton?.col === colIdx ? 'holding' : ''}`}
                                style={{ backgroundColor: btn.color }}
                                onMouseDown={() => handleHoldStart(rowIdx, colIdx)}
                                onMouseUp={handleHoldEnd}
                                onMouseLeave={() => holdingButton && handleHoldEnd()}
                                onClick={() => handlePress(rowIdx, colIdx)}
                                data-testid={`button-${rowIdx}-${colIdx}`}
                            >
                                <span className="button-label">{btn.label}</span>
                                <div className={`button-led ${btn.ledOn ? 'on' : ''}`} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {holdingButton && (
                <div className="hold-status">
                    Holding... ({(holdTimer / 1000).toFixed(1)}s)
                </div>
            )}

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Describe each button: <strong>position</strong>, <strong>color</strong>, <strong>label</strong> (PRESS/HOLD/ABORT/DETONATE/ARM)</li>
                    <li>Report which buttons have their <strong>LED lit</strong></li>
                    <li>Reader will tell you to <strong>press</strong> (quick click) or <strong>hold</strong> a button</li>
                    <li>When <strong>holding</strong>: watch for the colored indicator that appears</li>
                    <li>Tell reader the indicator color, then <strong>release when told</strong> (based on timer digit)</li>
                </ol>
                <p className="note">💡 Quick press = click • Hold = press and hold mouse down</p>
            </div>
        </div>
    );
}
