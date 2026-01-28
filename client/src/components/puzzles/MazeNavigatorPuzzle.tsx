import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface MazeNavigatorPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

interface Position {
    row: number;
    col: number;
}

export function MazeNavigatorPuzzle({ puzzle, onAction }: MazeNavigatorPuzzleProps) {
    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { gridSize, currentPosition, goalPosition, waypoints, visitedWaypoints, hitWall } = puzzle.defuserView as {
        gridSize: number;
        currentPosition: Position;
        goalPosition: Position;
        waypoints: Position[];
        visitedWaypoints: number[];
        hitWall: boolean;
    };

    const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
        onAction({ type: 'move', direction });
    };

    const getCellClass = (row: number, col: number) => {
        const classes = ['maze-cell'];

        if (currentPosition.row === row && currentPosition.col === col) {
            classes.push('current');
        }
        if (goalPosition.row === row && goalPosition.col === col) {
            classes.push('goal');
        }

        const waypointIdx = waypoints.findIndex(w => w.row === row && w.col === col);
        if (waypointIdx !== -1) {
            classes.push('waypoint');
            if (visitedWaypoints.includes(waypointIdx)) {
                classes.push('visited');
            }
        }

        return classes.join(' ');
    };

    const getCellLabel = (row: number, col: number) => {
        if (currentPosition.row === row && currentPosition.col === col) return '●';
        if (goalPosition.row === row && goalPosition.col === col) return '▲';
        const waypointIdx = waypoints.findIndex(w => w.row === row && w.col === col);
        if (waypointIdx !== -1) return '○';
        return '';
    };

    // Create a grid array based on gridSize
    const grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => false));

    return (
        <div className="maze-navigator-puzzle">
            <div className="maze-legend">
                <span className="legend-item"><span className="symbol current">●</span> You</span>
                <span className="legend-item"><span className="symbol waypoint">○</span> Waypoint</span>
                <span className="legend-item"><span className="symbol goal">▲</span> Goal</span>
            </div>

            <div className="waypoint-status">
                Waypoints: {visitedWaypoints.length} / {waypoints.length}
            </div>

            {hitWall && (
                <div className="hit-wall-warning">⚠️ Hit a wall!</div>
            )}

            <div className="maze-grid">
                {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="maze-row">
                        {row.map((_, colIdx) => (
                            <div
                                key={colIdx}
                                className={getCellClass(rowIdx, colIdx)}
                                data-testid={`cell-${rowIdx}-${colIdx}`}
                            >
                                {getCellLabel(rowIdx, colIdx)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="direction-controls">
                <button
                    className="direction-btn up"
                    onClick={() => handleMove('up')}
                    data-testid="move-up"
                >
                    ▲
                </button>
                <div className="direction-row">
                    <button
                        className="direction-btn left"
                        onClick={() => handleMove('left')}
                        data-testid="move-left"
                    >
                        ◀
                    </button>
                    <button
                        className="direction-btn right"
                        onClick={() => handleMove('right')}
                        data-testid="move-right"
                    >
                        ▶
                    </button>
                </div>
                <button
                    className="direction-btn down"
                    onClick={() => handleMove('down')}
                    data-testid="move-down"
                >
                    ▼
                </button>
            </div>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader the <strong>green circle (○) positions</strong> using Column (A-F) + Row (1-6)</li>
                    <li>Tell reader your <strong>current position (●)</strong></li>
                    <li>Tell reader the <strong>goal position (▲)</strong></li>
                    <li>Reader has the maze map - <strong>follow their directions exactly!</strong></li>
                    <li>Use <strong>arrow buttons</strong> to move (▲▼◀▶)</li>
                    <li>Must visit <strong>BOTH waypoints</strong> before reaching the goal</li>
                </ol>
                <p className="note">⚠️ You can't see walls! Hitting a wall = strike. Trust the reader!</p>
            </div>
        </div>
    );
}
