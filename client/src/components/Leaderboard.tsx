import type { LeaderboardEntry } from '../../../shared/types';
import './Leaderboard.css';

interface LeaderboardProps {
    entries: LeaderboardEntry[];
    compact?: boolean;
}

export function Leaderboard({ entries, compact = false }: LeaderboardProps) {
    const sortedEntries = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);

    return (
        <div className={`leaderboard ${compact ? 'compact' : ''}`} data-testid="leaderboard">
            <h3>🏆 Leaderboard</h3>

            {sortedEntries.length === 0 ? (
                <p className="no-entries">No entries yet. Be the first!</p>
            ) : (
                <ol className="leaderboard-list">
                    {sortedEntries.map((entry, idx) => (
                        <li key={entry.id} className={`leaderboard-entry ${idx < 3 ? 'top-three' : ''}`}>
                            <span className="rank">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                            </span>
                            <span className="entry-info">
                                <span className="entry-name">{entry.defuserName}</span>
                                <span className="entry-details">
                                    {entry.difficulty} • {entry.puzzleCount} puzzles
                                </span>
                            </span>
                            <span className="entry-score">{entry.score}</span>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
