import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { Player, Match, MatchEvent } from '@shared/types';
const DB_NAME = 'heimdal-spilletid-db';
const DB_VERSION = 2;
interface HeimdalDB extends DBSchema {
  matches: { key: string; value: Match; };
  players: { key: string; value: Player; indexes: { teamId: string }; };
  oplog: { key: string; value: MatchEvent; indexes: { matchId: string; synced: 'true' | 'false' }; };
  meta: { key: string; value: any; };
}
let dbPromise: Promise<IDBPDatabase<HeimdalDB>> | null = null;
const getDb = (): Promise<IDBPDatabase<HeimdalDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<HeimdalDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('matches')) {
            db.createObjectStore('matches', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('players')) {
            const playersStore = db.createObjectStore('players', { keyPath: 'id' });
            playersStore.createIndex('teamId', 'teamId');
          }
          if (!db.objectStoreNames.contains('oplog')) {
            const oplogStore = db.createObjectStore('oplog', { keyPath: 'id' });
            oplogStore.createIndex('matchId', 'matchId');
            oplogStore.createIndex('synced', 'synced');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        }
      },
    });
  }
  return dbPromise;
};
export const db = {
  async getMatch(matchId: string): Promise<Match | undefined> {
    return (await getDb()).get('matches', matchId);
  },
  async getAllMatches(): Promise<Match[]> {
    return (await getDb()).getAll('matches');
  },
  async saveMatch(match: Match): Promise<void> {
    const tx = (await getDb()).transaction('matches', 'readwrite');
    await Promise.all([tx.store.put(match), tx.done]);
  },
  async saveAllMatches(matches: Match[]): Promise<void> {
    const tx = (await getDb()).transaction('matches', 'readwrite');
    await Promise.all([...matches.map(m => tx.store.put(m)), tx.done]);
  },
  async getPlayers(teamId: string): Promise<Player[]> {
    return (await getDb()).getAllFromIndex('players', 'teamId', teamId);
  },
  async savePlayer(player: Player): Promise<void> {
    const tx = (await getDb()).transaction('players', 'readwrite');
    await Promise.all([tx.store.put(player), tx.done]);
  },
  async savePlayers(players: Player[]): Promise<void> {
    const tx = (await getDb()).transaction('players', 'readwrite');
    await Promise.all([...players.map(p => tx.store.put(p)), tx.done]);
  },
  async deletePlayer(playerId: string): Promise<void> {
    const tx = (await getDb()).transaction('players', 'readwrite');
    await Promise.all([tx.store.delete(playerId), tx.done]);
  },
  async addEvent(eventPayload: Omit<MatchEvent, 'id' | 'ts' | 'synced'>): Promise<MatchEvent> {
    const db = await getDb();
    const event: MatchEvent = {
      ...eventPayload,
      id: uuidv4(),
      ts: Date.now(),
      synced: false,
    };
    const tx = db.transaction('oplog', 'readwrite');
    await Promise.all([tx.store.add(event), tx.done]);
    return event;
  },
  async getUnsyncedEvents(): Promise<MatchEvent[]> {
    return (await getDb()).getAllFromIndex('oplog', 'synced', 'false');
  },
  async markEventsAsSynced(eventIds: string[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('oplog', 'readwrite');
    const eventsToUpdate = await Promise.all(eventIds.map(id => tx.store.get(id)));
    const updates = eventsToUpdate
      .filter((event): event is MatchEvent => !!event)
      .map(event => tx.store.put({ ...event, synced: true }));
    await Promise.all([...updates, tx.done]);
  },
  async compactOplog(): Promise<void> {
    try {
      const db = await getDb();
      const allEvents = await db.getAll('oplog');
      if (allEvents.length < 1000) return; // Only compact if oplog is large
      const eventsToKeep = allEvents.filter(e => !e.synced);
      const tx = db.transaction('oplog', 'readwrite');
      await tx.store.clear();
      await Promise.all([...eventsToKeep.map(e => tx.store.put(e)), tx.done]);
      console.log(`Oplog compacted. Kept ${eventsToKeep.length} unsynced events.`);
    } catch (error) {
      console.error("Failed to compact oplog:", error);
    }
  },
  async getMeta(key: string): Promise<any> {
    const result = await (await getDb()).get('meta', key);
    return result ? result.value : undefined;
  },
  async setMeta(key: string, value: any): Promise<void> {
    if (value && typeof value === 'object') {
      const safeValue = { ...value };
      if ('elapsedMs' in safeValue && !Number.isFinite(safeValue.elapsedMs)) {
        safeValue.elapsedMs = 0;
      }
      if ('startTime' in safeValue && !Number.isFinite(safeValue.startTime)) {
        safeValue.startTime = Date.now();
      }
      const tx = (await getDb()).transaction('meta', 'readwrite');
      await Promise.all([tx.store.put({ key, value: safeValue }), tx.done]);
    } else {
      const tx = (await getDb()).transaction('meta', 'readwrite');
      await Promise.all([tx.store.put({ key, value }), tx.done]);
    }
  },
  async getActiveMatch(): Promise<any> {
    const result = await this.getMeta('activeMatch');
    if (!result) return null;
    return {
      ...result,
      elapsedMs: Number.isFinite(result.elapsedMs) ? result.elapsedMs : 0,
      startTime: Number.isFinite(result.startTime) ? result.startTime : Date.now(),
      lineup: Array.isArray(result.lineup) ? new Set(result.lineup) : new Set(),
    };
  },
  async getPreviousMinutes(): Promise<Record<string, number>> {
    return (await this.getMeta('lastSessionMinutes')) || {};
  },
  async getTournamentMinutes(): Promise<Record<string, number>> {
    return (await this.getMeta('tournamentLastMinutes')) || {};
  },
  async setTournamentMinutes(minutes: Record<string, number>): Promise<void> {
    await this.setMeta('tournamentLastMinutes', minutes);
  },
};
export default db;