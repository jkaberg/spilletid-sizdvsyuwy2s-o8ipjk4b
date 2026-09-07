import { api } from './api-client';
import db from './local-db';
import { auth } from './auth';
import type { MatchEvent } from '@shared/types';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
let isSyncing = false;
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
export async function runSync(isManual = false) {
  if (isSyncing) {
    if (isManual) toast.info('Sync already in progress.');
    return { success: false, reason: 'already_syncing' };
  }
  if (!navigator.onLine) {
    if (isManual) toast.info('You are offline. Sync will run when you are back online.');
    return { success: false, reason: 'offline' };
  }
  isSyncing = true;
  if (isManual) toast.loading('Syncing match data...');
  try {
    const unsyncedEvents = await db.getUnsyncedEvents();
    if (unsyncedEvents.length === 0) {
      if (isManual) toast.success('Everything is up to date!');
      retryCount = 0;
      return { success: true, synced: 0 };
    }
    const eventsByMatch = unsyncedEvents.reduce((acc, event) => {
      if (!acc[event.matchId]) acc[event.matchId] = [];
      acc[event.matchId].push(event);
      return acc;
    }, {} as Record<string, MatchEvent[]>);
    let totalSynced = 0;
    for (const matchId in eventsByMatch) {
      const response = await api<{ syncedIds: string[], conflicts: number }>(`/api/matches/${matchId}/sync`, {
        method: 'POST',
        headers: auth.getAuthHeader(),
        body: JSON.stringify({ events: eventsByMatch[matchId] }),
      });
      if (response.syncedIds.length > 0) {
        await db.markEventsAsSynced(response.syncedIds);
        totalSynced += response.syncedIds.length;
      }
      if (response.conflicts > 0) {
        toast.warning(`${response.conflicts} conflicts detected. Last-write-wins was applied.`);
      }
    }
    if (isManual) toast.success(`Successfully synced ${totalSynced} updates.`);
    await db.compactOplog(); // Call compaction after successful sync
    retryCount = 0;
    return { success: true, synced: totalSynced };
  } catch (error) {
    console.error('Sync process failed:', error);
    if (isManual) toast.error('Sync failed. Will retry in the background.');
    retryCount++;
    if (retryCount <= MAX_RETRIES) {
      setTimeout(() => runSync(), RETRY_DELAY_MS * Math.pow(2, retryCount));
    } else {
      console.error('Max sync retries reached.');
    }
    return { success: false, reason: 'api_error' };
  } finally {
    isSyncing = false;
    if (isManual) toast.dismiss();
  }
}
export async function pollMatch(matchId: string, lastSyncTs: number) {
  if (!navigator.onLine) return lastSyncTs;
  try {
    const { events, serverTs } = await api<{ events: MatchEvent[], serverTs: number }>(`/api/matches/${matchId}/pull`, {
      method: 'POST',
      headers: auth.getAuthHeader(),
      body: JSON.stringify({ clientTs: lastSyncTs }),
    });
    if (events.length > 0) {
      // In a real app, you would merge these events into the local state/oplog
      toast.info(`${events.length} new updates from other coaches.`);
    }
    return serverTs;
  } catch (error) {
    console.error('Polling failed:', error);
    return lastSyncTs;
  }
}
export function useLiveSync(matchId: string) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  useEffect(() => {
    if (matchId) {
      const interval = setInterval(async () => {
        setStatus('syncing');
        try {
          await pollMatch(matchId, Date.now() - 30000); // poll for last 30s of events
          setStatus('idle');
        } catch {
          setStatus('error');
        }
      }, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [matchId]);
  return status;
}
setInterval(runSync, 60 * 1000);
window.addEventListener('online', () => {
  retryCount = 0;
  runSync();
});