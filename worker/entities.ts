import { IndexedEntity, Env } from "./core-utils";
import type { User, Player, Match, MatchEvent } from "@shared/types";
import { MOCK_USERS, MOCK_PLAYERS, MOCK_MATCHES } from "@shared/mock-data";
// USER ENTITY for authentication
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", passwordHash: "", role: "observatør" };
  static seedData = MOCK_USERS;
  static override keyOf<T>(state: T): string {
    const s = state as unknown as User;
    return s.email ?? s.id;
  }
  static async findByEmail(env: Env, email: string): Promise<UserEntity | null> {
    const user = new UserEntity(env, email);
    if (await user.exists()) {
      return user;
    }
    return null;
  }
}
// PLAYER ENTITY
export class PlayerEntity extends IndexedEntity<Player> {
  static readonly entityName = "player";
  static readonly indexName = "players";
  static readonly initialState: Player = { id: "", teamId: "", name: "", position: "Midfield" };
  static seedData = MOCK_PLAYERS;
  async update(partial: Partial<Player>) {
    await this.patch(partial);
  }
}
// MATCH ENTITY
export class MatchEntity extends IndexedEntity<Match> {
  static readonly entityName = "match";
  static readonly indexName = "matches";
  static readonly initialState: Match = { id: "", teamId: "", opponent: "", duration_minutes: 0, status: 'Klar', events: [] };
  static seedData = MOCK_MATCHES;
  async applyEvents(events: MatchEvent[]): Promise<{ acknowledgedIds: string[], conflicts: number }> {
    const acknowledgedIds: string[] = [];
    let conflicts = 0;
    try {
      await this.mutate(s => {
        const existingEventIds = new Set(s.events.map(e => e.id));
        const newEvents: MatchEvent[] = [];
        for (const event of events) {
          if (!existingEventIds.has(event.id)) {
            newEvents.push(event);
            acknowledgedIds.push(event.id);
          } else {
            conflicts++;
          }
        }
        if (newEvents.length > 0) {
          const allEvents = [...s.events, ...newEvents].sort((a, b) => a.ts - b.ts);
          return { ...s, events: allEvents };
        }
        return s;
      });
    } catch (e) {
      console.error('Event apply failed:', e);
      throw new Error('Concurrent update failed');
    }
    return { acknowledgedIds, conflicts };
  }
}