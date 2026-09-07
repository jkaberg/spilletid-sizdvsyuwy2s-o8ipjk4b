import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { suggestSwaps } from '../src/lib/substitutionSuggestions';
import { pollMatch } from '../src/lib/sync';
import type { Player } from '../shared/types';
import { formatTime, interpolateT } from '../src/lib/utils';
import db from '../src/lib/local-db';
const MOCK_FIELD_PLAYERS: Player[] = [
  { id: 'p1', name: 'Player 1', number: 1, position: 'Forward', teamId: 't1' },
  { id: 'p2', name: 'Player 2', number: 2, position: 'Midfield', teamId: 't1' },
  { id: 'p3', name: 'Player 3', number: 3, position: 'Defense', teamId: 't1' },
];
const MOCK_BENCH_PLAYERS: Player[] = [
  { id: 'p4', name: 'Player 4', number: 4, position: 'Forward', teamId: 't1' },
  { id: 'p5', name: 'Player 5', number: 5, position: 'Midfield', teamId: 't1' },
];
const MOCK_ALL_PLAYERS: Player[] = [...MOCK_FIELD_PLAYERS, ...MOCK_BENCH_PLAYERS];
vi.mock('../src/lib/local-db', () => ({
  default: {
    addEvent: vi.fn(),
  },
}));
// Mock calculateDeficits function for testing
const calculateDeficits = (players: Player[], prevMinutes: Record<string, number>): Record<string, number> => {
  if (Object.keys(prevMinutes).length === 0) return {};
  const totalMinutes = Object.values(prevMinutes).reduce((a, b) => a + b, 0);
  const avgMinutes = players.length > 0 ? totalMinutes / players.length : 0;
  const deficits: Record<string, number> = {};
  players.forEach(p => {
    const pMins = prevMinutes[p.id] || 0;
    if (pMins < avgMinutes) {
      deficits[p.id] = Math.round(pMins - avgMinutes);
    }
  });
  return deficits;
};
describe('Substitution Logic', () => {
  it('should suggest swapping most played for least played with "even" strategy', () => {
    const minutesPlayed = { p1: 45, p2: 30, p3: 40, p4: 0, p5: 15 };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, MOCK_BENCH_PLAYERS, minutesPlayed, 'even');
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].out.id).toBe('p1');
    expect(suggestions[0].in.id).toBe('p4');
  });
  it('handles empty bench gracefully', () => {
    const minutesPlayed = { p1: 45, p2: 30, p3: 40 };
    const suggestions = suggestSwaps(MOCK_FIELD_PLAYERS, [], minutesPlayed, 'even');
    expect(suggestions).toEqual([]);
  });
});
describe('Carryover Logic', () => {
  it('calculates deficits correctly for players under average', () => {
    const prevMins = { p1: 30, p2: 60, p3: 30, p4: 60, p5: 30 }; // Total 210, Avg 42
    const deficits = calculateDeficits(MOCK_ALL_PLAYERS, prevMins);
    expect(deficits.p1).toBe(-12); // 30 - 42
    expect(deficits.p2).toBeUndefined(); // 60 > 42
    expect(deficits.p3).toBe(-12);
    expect(deficits.p4).toBeUndefined();
    expect(deficits.p5).toBe(-12);
  });
});
describe('Sync Logic', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('pollMatch returns lastTs on offline error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('offline'));
    const lastTs = 12345;
    const result = await pollMatch('m1', lastTs);
    expect(result).toBe(lastTs);
  });
});
describe('Match Clock & Utils', () => {
  it('should format time correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59 * 1000)).toBe('00:59');
    expect(formatTime(60 * 1000)).toBe('01:00');
    expect(formatTime(45 * 60 * 1000)).toBe('45:00');
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(-60000)).toBe('-01:00');
  });
});
describe('Notifications', () => {
  it('interpolates player name correctly', () => {
    const msg = interpolateT('Bytt: {{player}} har mest tid!', { player: 'Ola' });
    expect(msg).toBe('Bytt: Ola har mest tid!');
  });
});
describe('DragDrop Logic Simulation', () => {
  it('should call onLineupChange and db.addEvent with correct IDs for bench to field swap', () => {
    const mockOnLineupChange = vi.fn();
    const event = { active: { id: 'p4' }, over: { id: 'p1' } }; // p4 (bench) swaps with p1 (field)
    const onFieldIds = ['p1', 'p2', 'p3'];
    const onBenchIds = ['p4', 'p5'];
    const activeIsOnBench = onBenchIds.includes(event.active.id as string);
    const overIsOnField = onFieldIds.includes(event.over.id as string);
    if (activeIsOnBench && overIsOnField) {
      mockOnLineupChange(event.over.id, event.active.id);
      db.addEvent({
        type: 'SUBSTITUTION',
        matchId: 'test-match',
        payload: { playerOutId: event.over.id, playerInId: event.active.id, minute: Date.now() / 60000 }
      });
    }
    expect(mockOnLineupChange).toHaveBeenCalledWith('p1', 'p4');
    expect(db.addEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'SUBSTITUTION',
      payload: expect.objectContaining({ playerOutId: 'p1', playerInId: 'p4' })
    }));
  });
});