import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface WireArrayPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    serialNumber: string;
}

export function WireArrayPuzzle({ puzzle, onAction, serialNumber }: WireArrayPuzzleProps) {
    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { wires } = puzzle.defuserView as { wires: Array<{ color: string; stripe?: string; symbol: string; cut: boolean }> };

    const handleCut = (index: number) => {
        onAction({ type: 'cut-wire', wireIndex: index });
    };

    return (
        <div className="wire-array-puzzle">
            <div className="wire-info">
                <span className="info-label">Serial:</span>
                <span className="info-value">{serialNumber}</span>
                <span className="info-hint">(Last digit: {serialNumber.slice(-1)})</span>
            </div>

            <div className="wires-container">
                {wires.map((wire, idx) => (
                    <div
                        key={idx}
                        className={`wire ${wire.cut ? 'cut' : ''}`}
                        onClick={() => !wire.cut && handleCut(idx)}
                        data-testid={`wire-${idx}`}
                    >
                        <div className="wire-connector left" />
                        <div
                            className="wire-body"
                            style={{
                                background: wire.stripe
                                    ? `repeating-linear-gradient(90deg, ${wire.color}, ${wire.color} 10px, ${wire.stripe} 10px, ${wire.stripe} 20px)`
                                    : wire.color
                            }}
                        >
                            {wire.cut && <div className="wire-cut-mark" />}
                        </div>
                        <div className="wire-tag">
                            <span className="wire-symbol">{wire.symbol}</span>
                        </div>
                        <div className="wire-connector right" />
                    </div>
                ))}
            </div>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader: <strong>How many wires</strong> you see ({wires.length})</li>
                    <li>Describe each wire's <strong>color</strong> from top to bottom</li>
                    <li>Mention any <strong>striped wires</strong> (two colors)</li>
                    <li>Read the <strong>symbol</strong> on each wire tag (△, ○, □, ☆, ◇)</li>
                    <li>Confirm if serial's last digit ({serialNumber.slice(-1)}) is <strong>odd or even</strong></li>
                    <li><strong>Click</strong> the wire the reader tells you to cut</li>
                </ol>
                <p className="note">⚠️ Cutting the wrong wire causes a strike!</p>
            </div>
        </div>
    );
}
