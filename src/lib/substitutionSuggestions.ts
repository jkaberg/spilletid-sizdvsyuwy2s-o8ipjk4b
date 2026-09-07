import type { Player } from '@shared/types';
type Strategy = 'even' | 'core' | 'refresh';
interface Suggestion {
  out: Player;
  in: Player;
  reason: string;
}
export function suggestSwaps(
  onFieldPlayers: Player[],
  onBenchPlayers: Player[],
  minutesPlayed: Record<string, number>,
  strategy: Strategy
): Suggestion[] {
  if (onBenchPlayers.length === 0) return [];
  switch (strategy) {
    case 'even': {
      // Suggest swapping the player who has played the most with the one who has played the least.
      const sortedField = [...onFieldPlayers].sort((a, b) => (minutesPlayed[b.id] || 0) - (minutesPlayed[a.id] || 0));
      const sortedBench = [...onBenchPlayers].sort((a, b) => (minutesPlayed[a.id] || 0) - (minutesPlayed[b.id] || 0));
      return sortedField.slice(0, 3).map((playerOut, i) => {
        const playerIn = sortedBench[i % sortedBench.length];
        if (!playerIn) return null;
        return {
          out: playerOut,
          in: playerIn,
          reason: `Even playing time. ${playerOut.name} has played ${Math.floor(minutesPlayed[playerOut.id] || 0)} min.`,
        };
      }).filter((s): s is Suggestion => s !== null);
    }
    case 'refresh': {
      // Suggest swapping players who have been on the longest in this stint (not implemented, using total time as proxy)
      const fieldByTime = [...onFieldPlayers].sort((a, b) => (minutesPlayed[b.id] || 0) - (minutesPlayed[a.id] || 0));
      const freshLegs = onBenchPlayers.filter(p => (minutesPlayed[p.id] || 0) < 10); // Example: less than 10 mins played
      return fieldByTime.slice(0, 2).map((playerOut, i) => {
        const playerIn = freshLegs[i % freshLegs.length];
        if (!playerIn) return null;
        return {
          out: playerOut,
          in: playerIn,
          reason: `Refresh with fresh legs.`,
        };
      }).filter((s): s is Suggestion => s !== null);
    }
    default:
      return [];
  }
}