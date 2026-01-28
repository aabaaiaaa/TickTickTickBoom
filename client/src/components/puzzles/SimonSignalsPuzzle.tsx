import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface SimonSignalsPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    serialNumber: string;
}

const COLORS = ['red', 'blue', 'green', 'yellow'];
const COLOR_MAP: Record<string, string> = {
    red: '#ff4444',
    blue: '#4444ff',
    green: '#44ff44',
    yellow: '#ffff44'
};

export function SimonSignalsPuzzle({ puzzle, onAction, serialNumber }: SimonSignalsPuzzleProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeColor, setActiveColor] = useState<string | null>(null);
    const [userInput, setUserInput] = useState<string[]>([]);

    // Extract with defaults for hooks to work correctly
    const defuserView = puzzle.defuserView as { sequence: string[]; currentRound: number } | undefined;
    const sequence = defuserView?.sequence ?? [];
    const currentRound = defuserView?.currentRound ?? 0;

    const hasVowel = /[AEIOU]/i.test(serialNumber);

    // Play the sequence - must be before early return
    useEffect(() => {
        if (isPlaying && sequence.length > 0 && currentRound > 0) {
            const roundSequence = sequence.slice(0, currentRound);
            let idx = 0;

            const interval = setInterval(() => {
                if (idx < roundSequence.length) {
                    setActiveColor(roundSequence[idx]);
                    setTimeout(() => setActiveColor(null), 400);
                    idx++;
                } else {
                    setIsPlaying(false);
                    clearInterval(interval);
                }
            }, 800);

            return () => clearInterval(interval);
        }
    }, [isPlaying, sequence, currentRound]);

    // Early return AFTER all hooks
    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }

    const handlePlaySequence = () => {
        setUserInput([]);
        setIsPlaying(true);
    };

    const handleColorPress = (color: string) => {
        if (isPlaying) return;

        const newInput = [...userInput, color];
        setUserInput(newInput);

        // Flash the button
        setActiveColor(color);
        setTimeout(() => setActiveColor(null), 200);

        // Check if sequence is complete
        if (newInput.length === currentRound) {
            onAction({ type: 'submit-sequence', sequence: newInput });
            setUserInput([]);
        }
    };

    return (
        <div className="simon-signals-puzzle">
            <div className="simon-info">
                <span>Round {currentRound}</span>
                <span>Serial has vowel: <strong>{hasVowel ? 'YES' : 'NO'}</strong></span>
            </div>

            <div className="simon-grid">
                {COLORS.map(color => (
                    <button
                        key={color}
                        className={`simon-button ${activeColor === color ? 'active' : ''}`}
                        style={{
                            backgroundColor: COLOR_MAP[color],
                            opacity: activeColor === color ? 1 : 0.6
                        }}
                        onClick={() => handleColorPress(color)}
                        disabled={isPlaying}
                        data-testid={`simon-${color}`}
                    />
                ))}
            </div>

            <div className="simon-controls">
                <button
                    className="btn btn-secondary"
                    onClick={handlePlaySequence}
                    disabled={isPlaying}
                >
                    ▶ Play Sequence
                </button>
                <span className="input-count">
                    Input: {userInput.length} / {currentRound}
                </span>
            </div>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader: Serial {hasVowel ? 'HAS' : 'has NO'} vowel, and current strike count</li>
                    <li>Press <strong>Play Sequence</strong> to watch the colors flash</li>
                    <li>Tell reader the <strong>colors in order</strong> (e.g., "Red, Blue, Green")</li>
                    <li>Reader will give you <strong>TRANSLATED</strong> colors to press</li>
                    <li><strong>Click the translated colors</strong> in order (NOT what you saw!)</li>
                    <li>Each round adds one more color to remember</li>
                </ol>
                <p className="note">⚠️ Don't press what you see - press the TRANSLATED colors!</p>
            </div>
        </div>
    );
}
