/**
 * Lightweight local match machine hook
 *
 * Provides a minimal state-machine-like API compatible with MatchPage:
 * const [current, send] = useLocalMatchMachine();
 *
 * - current.matches('running') => boolean
 * - current.context => { onField: Set<string>, onBench: Set<string>, players: Player[], elapsedMs, durationMs, events }
 * - send(event) handles: START, PAUSE, RESUME, STOP, TICK, SUBSTITUTE, RESET
 *
 * This is intentionally small and synchronous (no xstate dependency).
 */
import { useCallback, useState, useRef } from 'react';
import type { Player } from '@shared/types';
type Status = 'idle' | 'running' | 'paused' | 'stopped';
interface LocalMatchContext {
  elapsedMs: number;
  durationMs: number;
  onField: Set<string>;
  onBench: Set<string>;
  players: Player[];
  events: any[]; // store emitted events locally if needed
}
type SendEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'TICK'; delta: number }
  | { type: 'SUBSTITUTE'; playerOutId: string; playerInId: string }
  | { type: 'RESET'; context?: Partial<{
      onField: Set<string> | string[];
      onBench: Set<string> | string[];
      players: Player[];
      durationMs: number;
      elapsedMs: number;
    }> };
interface CurrentShape {
  matches: (s: Status) => boolean;
  context: LocalMatchContext;
  state: Status;
}
/**
 * Normalize a Set|string[] into Set<string>
 */
function normalizeToSet(input?: Set<string> | string[]): Set<string> {
  if (!input) return new Set();
  if (input instanceof Set) return new Set(input);
  if (Array.isArray(input)) return new Set(input);
  return new Set();
}
/**
 * useLocalMatchMachine
 *
 * Returns [current, send]
 */
export function useLocalMatchMachine(): [CurrentShape, (evt: SendEvent) => void] {
  const [status, setStatus] = useState<Status>('idle');
  const [context, setContext] = useState<LocalMatchContext>(() => ({
    elapsedMs: 0,
    durationMs: 45 * 60 * 1000,
    onField: new Set<string>(),
    onBench: new Set<string>(),
    players: [],
    events: [],
  }));
  // Keep a ref to context for callbacks to read latest value synchronously
  const contextRef = useRef(context);
  contextRef.current = context;
  const matches = useCallback(
    (s: Status) => status === s,
    [status]
  );
  /**
   * send: accept events and mutate the local machine state
   */
  const send = useCallback((evt: SendEvent) => {
    setContext((prev) => {
      // Work on shallow clone, but preserve Set semantics by creating new Sets where needed
      let next = { ...prev, events: [...prev.events] };
      switch (evt.type) {
        case 'START': {
          setStatus('running');
          // Optionally emit START event into local events
          next.events.push({ type: 'START', ts: Date.now() });
          return next;
        }
        case 'PAUSE': {
          setStatus('paused');
          next.events.push({ type: 'PAUSE', ts: Date.now() });
          return next;
        }
        case 'RESUME': {
          setStatus('running');
          next.events.push({ type: 'RESUME', ts: Date.now() });
          return next;
        }
        case 'STOP': {
          setStatus('stopped');
          // cap elapsed to duration
          next.elapsedMs = Math.min(next.elapsedMs, next.durationMs);
          next.events.push({ type: 'STOP', ts: Date.now() });
          return next;
        }
        case 'TICK': {
          // Increase elapsedMs by delta but don't exceed duration
          const newElapsed = Math.min(next.elapsedMs + evt.delta, next.durationMs);
          next.elapsedMs = newElapsed;
          // If it reached duration, transition to stopped
          if (newElapsed >= next.durationMs) {
            setStatus('stopped');
            next.events.push({ type: 'STOP', ts: Date.now() });
          }
          return next;
        }
        case 'SUBSTITUTE': {
          const { playerOutId, playerInId } = evt;
          // Clone sets to avoid mutating previous state directly
          const newOnField = new Set(next.onField);
          const newOnBench = new Set(next.onBench);
          // Remove out, add in (idempotent)
          if (newOnField.has(playerOutId)) newOnField.delete(playerOutId);
          newOnField.add(playerInId);
          if (newOnBench.has(playerInId)) newOnBench.delete(playerInId);
          newOnBench.add(playerOutId);
          next.onField = newOnField;
          next.onBench = newOnBench;
          next.events.push({
            type: 'SUBSTITUTION',
            ts: Date.now(),
            payload: { playerOutId, playerInId },
          });
          return next;
        }
        case 'RESET': {
          // Reset machine to provided context (merge) or defaults
          const c = evt.context || {};
          const newOnField = normalizeToSet(c.onField ?? prev.onField);
          const newOnBench = normalizeToSet(c.onBench ?? prev.onBench);
          const newPlayers = c.players ?? prev.players;
          const newDurationMs = typeof c.durationMs === 'number' ? c.durationMs : prev.durationMs;
          const newElapsedMs = typeof c.elapsedMs === 'number' ? c.elapsedMs : 0;
          // Reset status to idle
          setStatus('idle');
          return {
            elapsedMs: newElapsedMs,
            durationMs: newDurationMs,
            onField: newOnField,
            onBench: newOnBench,
            players: newPlayers,
            events: [], // clear events on reset
          };
        }
        default:
          return prev;
      }
    });
  }, []);
  const current: CurrentShape = {
    matches,
    context,
    state: status,
  };
  return [current, send];
}
export default useLocalMatchMachine;