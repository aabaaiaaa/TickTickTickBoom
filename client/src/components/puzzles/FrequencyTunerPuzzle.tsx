import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction, GameIndicator } from '../../../../shared/types';
import './puzzles.css';

interface FrequencyTunerPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    serialNumber: string;
    indicators: GameIndicator[];
}

export function FrequencyTunerPuzzle({ puzzle, onAction, serialNumber, indicators }: FrequencyTunerPuzzleProps) {
    const [frequency, setFrequency] = useState(5.0);
    const [amFm, setAmFm] = useState<'AM' | 'FM'>('AM');
    const [boostOn, setBoostOn] = useState(false);
    const [filterOn, setFilterOn] = useState(false);
    const [initialized, setInitialized] = useState(false);

    // Initialize from defuserView
    useEffect(() => {
        if (puzzle.defuserView && !initialized) {
            const { mode } = puzzle.defuserView as { mode: 'AM' | 'FM' };
            setAmFm(mode || 'AM');
            setInitialized(true);
        }
    }, [puzzle.defuserView, initialized]);

    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { audioType } = puzzle.defuserView as {
        targetFrequency: number;
        audioType: 'morse' | 'musical' | 'numbers';
        mode: 'AM' | 'FM';
    };

    const hasFRK = indicators.some(ind => ind.label === 'FRK' && ind.isLit);

    const handleFrequencyChange = (delta: number) => {
        const newFreq = Math.round((frequency + delta) * 10) / 10;
        if (newFreq >= 3.0 && newFreq <= 10.0) {
            setFrequency(newFreq);
        }
    };

    const handleTransmit = () => {
        onAction({
            type: 'transmit',
            frequency,
            mode: amFm,
            boost: boostOn,
            filter: filterOn
        });
    };

    return (
        <div className="frequency-tuner-puzzle">
            <div className="tuner-info">
                <span>Serial starts with: <strong>{serialNumber[0]}</strong></span>
                {hasFRK && <span className="frk-warning">FRK lit (+0.5 MHz)</span>}
            </div>

            <div className="tuner-display">
                <div className="frequency-display">
                    {frequency.toFixed(1)} MHz
                </div>
                <div className="audio-indicator">
                    Audio: {audioType}
                </div>
            </div>

            <div className="frequency-controls">
                <button className="freq-btn" onClick={() => handleFrequencyChange(-1)}>-1.0</button>
                <button className="freq-btn" onClick={() => handleFrequencyChange(-0.1)}>-0.1</button>
                <button className="freq-btn" onClick={() => handleFrequencyChange(0.1)}>+0.1</button>
                <button className="freq-btn" onClick={() => handleFrequencyChange(1)}>+1.0</button>
            </div>

            <div className="switch-panel">
                <div className="switch-group">
                    <label>Mode</label>
                    <div className="toggle-switch">
                        <button
                            className={`toggle-option ${amFm === 'AM' ? 'active' : ''}`}
                            onClick={() => setAmFm('AM')}
                        >
                            AM
                        </button>
                        <button
                            className={`toggle-option ${amFm === 'FM' ? 'active' : ''}`}
                            onClick={() => setAmFm('FM')}
                        >
                            FM
                        </button>
                    </div>
                </div>

                <div className="switch-group">
                    <label>BOOST</label>
                    <button
                        className={`toggle-btn ${boostOn ? 'on' : ''}`}
                        onClick={() => setBoostOn(!boostOn)}
                    >
                        {boostOn ? 'ON' : 'OFF'}
                    </button>
                </div>

                <div className="switch-group">
                    <label>FILTER</label>
                    <button
                        className={`toggle-btn ${filterOn ? 'on' : ''}`}
                        onClick={() => setFilterOn(!filterOn)}
                    >
                        {filterOn ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            <button
                className="btn btn-primary transmit-btn"
                onClick={handleTransmit}
                data-testid="transmit-btn"
            >
                📡 TRANSMIT
            </button>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader the <strong>first letter</strong> of serial number ({serialNumber[0]})</li>
                    <li>Toggle <strong>BOOST</strong> on and count the <strong>beeps</strong> you hear</li>
                    <li>Try <strong>FILTER</strong> on/off - tell reader which sounds clearer</li>
                    <li>Report <strong>audio type</strong>: morse code, musical tones, or spoken numbers</li>
                    <li>Set <strong>AM/FM</strong> mode as reader instructs</li>
                    <li>Use <strong>+/- buttons</strong> to tune to the frequency reader calculates</li>
                    <li>Press <strong>TRANSMIT</strong> when at correct frequency</li>
                </ol>
            </div>
        </div>
    );
}
