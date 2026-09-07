import { Hono } from "hono";
import { bearerAuth } from 'hono/bearer-auth';
import type { Env } from './core-utils';
import { UserEntity, MatchEntity, PlayerEntity } from "./entities";
import { MOCK_USERS } from "@shared/mock-data";
import { ok, bad, notFound, isStr } from './core-utils';
import type { MatchEvent, User, Player } from "@shared/types";
const DUMMY_TOKEN = "secret-token-for-dev";
const authMiddleware = bearerAuth({ token: DUMMY_TOKEN });
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  app.post('/api/seed', async (c) => {
    try {
      await UserEntity.ensureSeed(c.env);
      const existingUser = await UserEntity.findByEmail(c.env, 'trener@heimdal.no');
      if (!existingUser) {
        const user: User = {
          id: 'trener@heimdal.no',
          name: 'Trener Test',
          email: 'trener@heimdal.no',
          passwordHash: 'password123',
          role: 'trener',
        };
        await UserEntity.create(c.env, user);
      }
      await PlayerEntity.ensureSeed(c.env);
      await MatchEntity.ensureSeed(c.env);
      return ok(c, { seeded: true });
    } catch (e) {
      console.error('Seed error:', e);
      const detail = e instanceof Error ? e.message : String(e);
      return c.json({ success: false, error: 'Server error during seeding', detail }, 500);
    }
  });
  app.post('/api/auth/login', async (c) => {
    try {
      const { email, password } = await c.req.json<{ email?: string, password?: string }>();
      if (!isStr(email) || !isStr(password)) return bad(c, 'Email and password required');
      let userEntity: UserEntity | null = null;
      try {
        userEntity = await UserEntity.findByEmail(c.env, email);
      } catch (doFindErr) {
        console.error('UserEntity.findByEmail failed, falling back to MOCK_USERS:', doFindErr);
      }
      if (!userEntity) {
        const mock = MOCK_USERS.find(u => u.email === email);
        if (mock && mock.passwordHash === password) {
          const { passwordHash, ...userSafe } = mock;
          return ok(c, { token: DUMMY_TOKEN, user: userSafe });
        }
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
      const user = await userEntity.getState();
      if (user.passwordHash !== password) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }
      const { passwordHash, ...userSafe } = user;
      return ok(c, { token: DUMMY_TOKEN, user: userSafe });
    } catch (e) {
      console.error('Login error:', e);
      return c.json({ success: false, error: 'Server error during login' }, 500);
    }
  });
  app.use('/api/*', authMiddleware);
  const observerGuard = async (c: any, next: any) => {
    const userRole: User['role'] = (c.req.header('X-User-Role') || 'trener') as User['role'];
    if (userRole === 'observatør' && c.req.method !== 'GET') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    await next();
  };
  app.get('/api/matches', async (c) => {
    try {
      const page = await MatchEntity.list(c.env);
      return ok(c, page.items);
    } catch (e) {
      console.error('Get matches error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/matches/:id/sync', observerGuard, async (c) => {
    const matchId = c.req.param('id');
    try {
      const { events } = await c.req.json<{ events: MatchEvent[] }>();
      if (!events || !Array.isArray(events) || events.length === 0) return ok(c, { syncedIds: [], conflicts: 0 });
      const match = new MatchEntity(c.env, matchId);
      if (!await match.exists()) return notFound(c, 'Match not found');
      const { acknowledgedIds, conflicts } = await match.applyEvents(events);
      return ok(c, { syncedIds: acknowledgedIds, conflicts });
    } catch (e) {
      console.error(`Sync error for match ${matchId}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/matches/:id/pull', async (c) => {
    const matchId = c.req.param('id');
    try {
      const { clientTs } = await c.req.json<{ clientTs: number }>();
      const match = new MatchEntity(c.env, matchId);
      if (!await match.exists()) return notFound(c, 'Match not found');
      const state = await match.getState();
      const deltaEvents = state.events.filter(e => e.ts > clientTs);
      return ok(c, { events: deltaEvents, serverTs: Date.now() });
    } catch (e) {
      console.error(`Pull error for match ${matchId}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.get('/api/players', async (c) => {
    try {
      const list = await PlayerEntity.list(c.env);
      return ok(c, list.items);
    } catch (e) {
      console.error('Get players error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.post('/api/players', observerGuard, async (c) => {
    try {
      const player = await c.req.json<Player>();
      if (!isStr(player.name) || !player.teamId) return bad(c, 'Player name and teamId required');
      if (player.number !== undefined && player.number !== null) {
        if (typeof player.number !== 'number' || !Number.isFinite(player.number)) {
          return bad(c, 'Player number must be a valid number');
        }
        const allPlayers = await PlayerEntity.list(c.env);
        if (allPlayers.items.some(p => p.number === player.number && p.teamId === player.teamId)) {
          return bad(c, 'Player number must be unique for the team');
        }
      }
      const newPlayer = await PlayerEntity.create(c.env, { ...player, id: crypto.randomUUID() });
      return ok(c, newPlayer);
    } catch (e) {
      console.error('Create player error:', e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.put('/api/players/:id', observerGuard, async (c) => {
    const id = c.req.param('id');
    try {
      const partial = await c.req.json<Partial<Player>>();
      const player = new PlayerEntity(c.env, id);
      if (!await player.exists()) return notFound(c, 'Player not found');
      if (partial.number) {
        const existingState = await player.getState();
        const allPlayers = await PlayerEntity.list(c.env);
        if (allPlayers.items.some(p => p.number === partial.number && p.teamId === existingState.teamId && p.id !== id)) {
          return bad(c, 'Player number must be unique for the team');
        }
      }
      await player.update(partial);
      return ok(c, await player.getState());
    } catch (e) {
      console.error(`Player update error for ${id}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
  app.delete('/api/players/:id', observerGuard, async (c) => {
    const id = c.req.param('id');
    try {
      const deleted = await PlayerEntity.delete(c.env, id);
      return deleted ? ok(c, { deleted: true }) : notFound(c, 'Player not found');
    } catch (e) {
      console.error(`Player delete error for ${id}:`, e);
      return c.json({ success: false, error: 'Server error' }, 500);
    }
  });
}