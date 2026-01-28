import { useState } from 'react';
import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface CountdownOverridePuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

export function CountdownOverridePuzzle({ puzzle, onAction }: CountdownOverridePuzzleProps) {
    const [input, setInput] = useState('');

    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { mode, challenge } = puzzle.defuserView as {
        mode: 'STANDARD' | 'ACCELERATED' | 'CRITICAL';
        challenge: {
            type: 'math' | 'word' | 'pattern';
            question: string;
        };
    };

    const handleSubmit = () => {
        onAction({ type: 'submit-answer', answer: input });
        setInput('');
    };

    const getModeColor = () => {
        switch (mode) {
            case 'STANDARD': return 'var(--accent-green)';
            case 'ACCELERATED': return 'var(--accent-yellow)';
            case 'CRITICAL': return 'var(--accent-red)';
        }
    };

    return (
        <div className="countdown-override-puzzle">
            <div
                className="mode-display"
                style={{ borderColor: getModeColor(), color: getModeColor() }}
            >
                {mode} MODE
            </div>

            <div className="challenge-type">
                Type: {challenge.type.toUpperCase()}
            </div>

            <div className="challenge-display">
                {challenge.question}
            </div>

            <div className="answer-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter answer..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    data-testid="answer-input"
                />
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    data-testid="submit-answer-btn"
                >
                    Submit
                </button>
            </div>

            <div className="reward-info">
                <span className="reward positive">Correct: +{mode === 'CRITICAL' ? 30 : mode === 'ACCELERATED' ? 10 : 15}s</span>
                <span className="reward negative">Wrong: -20s</span>
            </div>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader the <strong>MODE</strong> ({mode})</li>
                    <li>Tell reader the <strong>challenge type</strong> ({challenge.type.toUpperCase()})</li>
                    <li>Read the <strong>challenge</strong> to the reader</li>
                    <li>Reader will decode/solve it based on mode rules</li>
                    <li><strong>Type the answer</strong> and press Submit</li>
                </ol>
                <p className="note">💡 Math: answer directly • Word/Pattern: reader decodes first!</p>
            </div>
        </div>
    );
}
