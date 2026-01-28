import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction, GameIndicator } from '../../../../shared/types';
import './puzzles.css';

interface KeypadCipherPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    indicators: GameIndicator[];
}

export function KeypadCipherPuzzle({ puzzle, onAction, indicators }: KeypadCipherPuzzleProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Sync selected with enteredSymbols from server
    useEffect(() => {
        if (puzzle.defuserView && !initialized) {
            const { enteredSymbols } = puzzle.defuserView as { enteredSymbols: string[] };
            setSelected(enteredSymbols || []);
            setInitialized(true);
        }
    }, [puzzle.defuserView, initialized]);

    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { symbols } = puzzle.defuserView as {
        symbols: string[][];
        enteredSymbols: string[];
    };

    const hasNSA = indicators.some(ind => ind.label === 'NSA');

    const handleSymbolPress = (symbol: string) => {
        const newSelected = [...selected, symbol];
        setSelected(newSelected);
        onAction({ type: 'enter-symbol', symbol, sequence: newSelected });
    };

    const handleClear = () => {
        setSelected([]);
        onAction({ type: 'clear-symbols' });
    };

    return (
        <div className="keypad-cipher-puzzle">
            {hasNSA && (
                <div className="nsa-warning">⚠️ NSA indicator present!</div>
            )}

            <div className="entered-symbols">
                {[0, 1, 2, 3].map(idx => (
                    <div key={idx} className={`symbol-slot ${selected[idx] ? 'filled' : ''}`}>
                        {selected[idx] || '?'}
                    </div>
                ))}
            </div>

            <div className="keypad-grid">
                {symbols.map((row, rowIdx) => (
                    <div key={rowIdx} className="keypad-row">
                        {row.map((symbol, colIdx) => (
                            <button
                                key={colIdx}
                                className={`keypad-key ${selected.includes(symbol) ? 'selected' : ''}`}
                                onClick={() => !selected.includes(symbol) && handleSymbolPress(symbol)}
                                disabled={selected.includes(symbol) || selected.length >= 4}
                                data-testid={`key-${rowIdx}-${colIdx}`}
                            >
                                {symbol}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            <button className="btn btn-secondary clear-btn" onClick={handleClear}>
                Clear
            </button>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Describe <strong>all 16 symbols</strong> on the keypad to the reader</li>
                    <li>Reader will identify which symbols to press and <strong>in what order</strong></li>
                    <li><strong>Click symbols</strong> in the exact order the reader specifies</li>
                    <li>If you make a mistake, press <strong>Clear</strong> to reset</li>
                </ol>
                <p className="note">⚠️ Order matters! Wrong order = strike</p>
            </div>
        </div>
    );
}
