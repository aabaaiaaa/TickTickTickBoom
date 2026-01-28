import { useState } from 'react';
import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface SequenceMemoryPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

const COLOR_MAP: Record<string, string> = {
    red: '#ff4444',
    blue: '#4444ff',
    green: '#44ff44',
    yellow: '#ffff44'
};

export function SequenceMemoryPuzzle({ puzzle, onAction }: SequenceMemoryPuzzleProps) {
    const [pressedButton, setPressedButton] = useState<number | null>(null);

    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { display, buttons, currentStage, totalStages, stageHistory } = puzzle.defuserView as {
        display: string;
        buttons: string[];
        currentStage: number;
        totalStages: number;
        stageHistory: Array<{ position: number; color: string }>;
    };

    const handleButtonPress = (position: number) => {
        setPressedButton(position);
        setTimeout(() => setPressedButton(null), 200);

        onAction({
            type: 'press-memory-button',
            position,
            color: buttons[position - 1]
        });
    };

    return (
        <div className="sequence-memory-puzzle">
            <div className="stage-indicator">
                Stage {currentStage} / {totalStages}
            </div>

            <div className="memory-display">
                <span className="display-value">{display}</span>
            </div>

            <div className="memory-buttons">
                {buttons.map((color, idx) => (
                    <button
                        key={idx}
                        className={`memory-button ${pressedButton === idx + 1 ? 'pressed' : ''}`}
                        style={{ backgroundColor: COLOR_MAP[color.toLowerCase()] || color }}
                        onClick={() => handleButtonPress(idx + 1)}
                        data-testid={`memory-btn-${idx + 1}`}
                    >
                        {idx + 1}
                    </button>
                ))}
            </div>

            {stageHistory && stageHistory.length > 0 && (
                <div className="stage-history">
                    <h4>Previous Stages:</h4>
                    {stageHistory.map((h, idx) => (
                        <span key={idx} className="history-item">
                            S{idx + 1}: Pos {h.position}, {h.color}
                        </span>
                    ))}
                </div>
            )}

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader the <strong>display value</strong> (number or color word)</li>
                    <li>Tell reader the <strong>colors</strong> of buttons 1-4 (left to right)</li>
                    <li>Reader will say which <strong>position OR color</strong> to press</li>
                    <li><strong>Remember</strong> what you pressed each stage (shown in history below)</li>
                    <li>Later stages may reference <strong>previous stage</strong> choices!</li>
                </ol>
                <p className="note">📝 Keep notes! Reader needs stage history for later stages.</p>
            </div>
        </div>
    );
}
