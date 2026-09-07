import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLocalMatchMachine } from '@/lib/matchMachineLocal';
import { loadInitialContext } from '@/lib/matchMachine';
import { ArrowLeft, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster, toast } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MatchClock } from '@/components/MatchClock';
import { DragDropLineup } from '@/components/DragDropLineup';
import type { Player, Match } from '@shared/types';
import { suggestSwaps } from '@/lib/substitutionSuggestions';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
import { useDebounce } from 'react-use';
import { runSync, useLiveSync } from '@/lib/sync';
export function MatchPage() {
  const { t } = useTranslation();
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Partial<Match> & { teamSize: number; carryover: boolean } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [minutesPlayed, setMinutesPlayed] = useState<Record<string, number>>({});
  const [current, send] = useLocalMatchMachine();
  const syncStatus = useLiveSync(matchId!);
  useEffect(() => {
    if (syncStatus === 'error') {
      toast.warning('Live sync connection issue.');
    }
  }, [syncStatus]);
  useDebounce(runSync, 5000, [minutesPlayed]);
  const [onFieldPlayers, onBenchPlayers] = useMemo(() => {
    const onFieldSet = (current.context?.onField as Set<string>) ?? new Set<string>();
    const onBenchSet = (current.context?.onBench as Set<string>) ?? new Set<string>();
    const onField = players.filter(p => onFieldSet.has(p.id));
    const onBench = players.filter(p => onBenchSet.has(p.id));
    return [onField, onBench];
  }, [players, current.context?.onField, current.context?.onBench]);
  useEffect(() => {
    async function loadData() {
      if (!matchId) return;
      let matchConfig = await db.getMeta('newMatchConfig');
      if (!matchConfig || matchConfig.id !== matchId) {
        const activeMatchMeta = await db.getMeta('activeMatch');
        if (activeMatchMeta && activeMatchMeta.id === matchId) {
          matchConfig = {
            id: activeMatchMeta.id,
            duration: activeMatchMeta.duration,
            teamSize: activeMatchMeta.teamSize,
            carryover: false,
            lineup: [],
          };
        }
      }
      if (!matchConfig || matchConfig.id !== matchId) {
        const persisted = await db.getMatch(matchId);
        if (persisted) {
          matchConfig = {
            id: persisted.id,
            duration: persisted.duration_minutes,
            teamSize: persisted.teamSize ?? 11,
            carryover: false,
            lineup: [],
            deficits: {},
          };
        }
      }
      if (!matchConfig || matchConfig.id !== matchId) {
        toast.error("Match configuration not found.");
        navigate('/');
        return;
      }
      const savedClock = await db.getMeta(`activeMatchClock_${matchId}`) || { elapsedMs: 0, status: 'stopped' };
      const cfg = matchConfig as any;
      setMatch({
        id: matchId,
        duration_minutes: cfg.duration,
        teamSize: cfg.teamSize,
        carryover: cfg.carryover,
        status: 'Klar',
        teamId: 'heimdal-g12'
      });
      const playersData = await db.getPlayers('heimdal-g12');
      setPlayers(playersData);
      setMinutesPlayed(cfg.deficits || {});
      const initialContext = await loadInitialContext(matchId);
      const initialOnField = initialContext.onField.size > 0 ? initialContext.onField : new Set<string>(cfg.lineup || []);
      const initialOnBench = initialContext.onBench.size > 0 ? initialContext.onBench : new Set<string>(playersData.filter(p => !initialOnField.has(p.id)).map(p => p.id));
      lastElapsedRef.current = savedClock.elapsedMs || 0;
      send({
        type: 'RESET',
        context: {
          onField: initialOnField,
          onBench: initialOnBench,
          players: playersData,
          durationMs: (cfg.duration || 45) * 60 * 1000,
          elapsedMs: savedClock.elapsedMs || 0,
        }
      });
      if (savedClock.status === 'running') {
        send({ type: 'RESUME' });
      } else if (savedClock.status === 'paused') {
        send({ type: 'PAUSE' });
      }
      await db.setMeta('newMatchConfig', null);
    }
    loadData();
  }, [matchId, send, navigate]);
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    const timer = setInterval(async () => {
      if (current.matches('running') && Notification.permission === 'granted') {
        const strategy = await db.getMeta('matchStrategy') || 'even';
        const suggestions = suggestSwaps(onFieldPlayers, onBenchPlayers, minutesPlayed, strategy);
        if (suggestions.length > 0) {
          const { out } = suggestions[0];
          const notification = new Notification(t('match.suggestionsTitle'), {
            body: t('match.notifyEven', { player: out.name }),
            tag: 'heimdal-sub-suggestion',
          });
          notification.onclick = () => window.focus();
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(timer);
  }, [current, minutesPlayed, onBenchPlayers, onFieldPlayers, t]);
  const lastElapsedRef = useRef<number>(0);
  const handleTick = useCallback((elapsedMs: number) => {
    const prevElapsed = lastElapsedRef.current || 0;
    const deltaMs = Math.max(0, (elapsedMs || 0) - prevElapsed);
    const deltaMinutes = deltaMs / 60000;
    if (deltaMinutes > 0) {
      setMinutesPlayed(prev => {
        const newMinutes = { ...prev };
        (current.context?.onField ?? new Set()).forEach((playerId: string) => {
          newMinutes[playerId] = (newMinutes[playerId] || 0) + deltaMinutes;
        });
        return newMinutes;
      });
    }
    lastElapsedRef.current = elapsedMs || 0;
  }, [current.context?.onField]);
  const handleLineupChange = (playerOutId: string, playerInId: string) => {
    send({ type: 'SUBSTITUTE', playerOutId, playerInId });
    toast.success(t('match.substitutionMade'));
  };
  const suggestions = useMemo(() => suggestSwaps(onFieldPlayers, onBenchPlayers, minutesPlayed, 'even'), [onFieldPlayers, onBenchPlayers, minutesPlayed]);
  if (!match || !matchId) {
    return (
      <div className="center h-screen"><p aria-live="polite">{t('match.loading')}</p></div>
    );
  }
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="root-wrapper">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" size="icon" onClick={() => navigate('/')} aria-label="Back to dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{t('match.liveTitle')}</h1>
                <p className="text-muted-foreground">{t('match.teamSizeDisplay', { size: match.teamSize })}</p>
              </div>
              {syncStatus === 'syncing' && <Loader2 className="h-6 w-6 animate-spin text-heimdal-orange" />}
            </div>
            <div className="space-y-8">
              <MatchClock
                matchId={matchId}
                durationMinutes={match.duration_minutes || 45}
                onTick={handleTick}
                onStatusChange={async (status, elapsedMs) => {
                  if (status === 'running' && !current.matches('running')) {
                    send({ type: 'START' });
                    db.addEvent({ type: 'START', matchId: matchId!, payload: { initialLineup: Array.from(current.context?.onField ?? new Set()) } });
                    await db.setMeta('activeMatch', {
                      id: matchId,
                      status,
                      teamSize: match?.teamSize,
                      duration: match?.duration_minutes || 45,
                      updatedAt: Date.now(),
                    });
                  } else if (status === 'paused' && !current.matches('paused')) {
                    send({ type: 'PAUSE' });
                    await db.setMeta('activeMatch', {
                      id: matchId,
                      status,
                      teamSize: match?.teamSize,
                      duration: match?.duration_minutes || 45,
                      updatedAt: Date.now(),
                    });
                  } else if (status === 'running' && current.matches('paused')) {
                    send({ type: 'RESUME' });
                    await db.setMeta('activeMatch', {
                      id: matchId,
                      status,
                      teamSize: match?.teamSize,
                      duration: match?.duration_minutes || 45,
                      updatedAt: Date.now(),
                    });
                  } else if (status === 'stopped' && !current.matches('stopped')) {
                    send({ type: 'STOP' });
                    db.setMeta('lastSessionMinutes', minutesPlayed);
                    await db.setMeta('activeMatch', null);
                  }
                }}
              />
              <DragDropLineup
                onFieldPlayers={onFieldPlayers}
                onBenchPlayers={onBenchPlayers}
                minutesPlayed={minutesPlayed}
                onLineupChange={handleLineupChange}
                teamSize={match.teamSize}
                matchId={matchId}
              />
              <Card className="bg-gradient-to-r from-heimdal-orange/5 to-heimdal-navy/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lightbulb /> {t('match.suggestionsTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {suggestions.length > 0 ? (
                    <motion.ul initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ stiffness: 300 }} className="space-y-2">
                      {suggestions.map((s, i) => (
                        <li key={i} className="text-sm p-2 border rounded-md flex justify-between items-center bg-background/50">
                          <span><strong>Ut:</strong> {s.out.name}, <strong>Inn:</strong> {s.in.name} ({s.reason})</span>
                          <Button size="sm" className="bg-heimdal-orange hover:bg-heimdal-navy text-white focus:ring-heimdal-orange" onClick={() => handleLineupChange(s.out.id, s.in.id)}>{t('match.substitute')}</Button>
                        </li>
                      ))}
                    </motion.ul>
                  ) : <p className="text-sm text-muted-foreground">{t('match.noSuggestions')}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors />
    </>
  );
}