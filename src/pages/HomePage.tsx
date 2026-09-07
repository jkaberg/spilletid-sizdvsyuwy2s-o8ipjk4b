import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster, toast } from '@/components/ui/sonner';
import { Navigation } from '@/components/Navigation';
import { useTranslation } from '@/lib/translations';
import db from '@/lib/local-db';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import type { Player } from '@shared/types';
import { formatTime } from '@/lib/utils';
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
function ActiveMatchCard({ activeMatch }: { activeMatch: any }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [liveElapsed, setLiveElapsed] = useState(activeMatch.elapsedMs || 0);
  useEffect(() => {
    let intervalId: number | undefined;
    if (!activeMatch) return;
    const startTime = activeMatch.startTime || (Date.now() - (activeMatch.elapsedMs || 0));
    const maxMs = (activeMatch.duration || 45) * 60 * 1000;
    const computeElapsed = () => {
      if (activeMatch.status === 'running') {
        return Math.min(activeMatch.elapsedMs + (Date.now() - startTime), maxMs);
      }
      return activeMatch.elapsedMs;
    };
    setLiveElapsed(computeElapsed());
    if (activeMatch.status === 'running') {
      intervalId = window.setInterval(() => {
        setLiveElapsed(computeElapsed());
      }, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [activeMatch]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mb-8"
    >
      <Card className="bg-gradient-to-r from-heimdal-green/10 to-heimdal-red/10 border-heimdal-green/50" aria-label={`Active match timer: ${formatTime(liveElapsed)}`}>
        <CardHeader>
          <CardTitle>{t('home.paaagaendeKamp')}</CardTitle>
          <CardDescription>{t('home.activeMatchDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-5xl font-mono font-bold text-foreground" aria-live="polite" data-testid="live-time">
            {formatTime(liveElapsed)}
          </div>
          <Button onClick={() => navigate(`/match/${activeMatch.id}`)} className="bg-heimdal-green hover:bg-heimdal-red text-white h-12 px-8 text-lg">
            {t('home.fortsettKamp')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState(3);
  const [duration, setDuration] = useState(15);
  const [carryover, setCarryover] = useState(false);
  const [activeMatch, setActiveMatch] = useState<any | null>(null);
  useEffect(() => {
    const loadData = async () => {
      const playersData = await db.getPlayers('heimdal-g12');
      setPlayers(playersData);
      setSelectedPlayerIds(playersData.slice(0, teamSize).map(p => p.id));
      const am = await db.getActiveMatch();
      if (am && (am.status === 'running' || am.status === 'paused')) {
        setActiveMatch(am);
      } else {
        setActiveMatch(null);
      }
    };
    loadData();
  }, [teamSize]);
  const handleStartMatch = async () => {
    if (duration < 5 || duration > 60) {
      toast.error(t('home.invalidDuration'));
      return;
    }
    if (selectedPlayerIds.length < teamSize) {
      toast.error(t('home.lineupSelect', { size: teamSize }));
      return;
    }
    const matchId = uuidv4();
    const deficits = carryover ? calculateDeficits(players, await db.getPreviousMinutes()) : {};
    const matchConfig = {
      id: matchId,
      teamSize,
      duration,
      carryover,
      lineup: selectedPlayerIds.slice(0, teamSize),
      deficits,
    };
    await db.setMeta('newMatchConfig', matchConfig);
    navigate(`/match/${matchId}`);
  };
  return (
    <>
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <Navigation />
      <div className="md:pl-64">
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-testid="root-wrapper">
            <div className="py-16 md:py-24 lg:py-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center"
              >
                <svg width="80" height="80" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 mb-4 rounded-full shadow-lg floating" aria-label="Heimdal Fotball Logo">
                  <rect width="100" height="100" fill="#006400"/>
                  <text x="50" y="65" textAnchor="middle" fill="#DC143C" fontSize="40" fontWeight="bold" fontFamily="Inter, sans-serif">H-F</text>
                  <circle cx="50" cy="20" r="8" fill="#FFD700"/>
                </svg>
                <div className="relative inline-block">
                  <div className="absolute -inset-2 bg-gradient-to-r from-heimdal-green to-heimdal-red rounded-full blur-xl opacity-50" />
                  <h1 className="relative text-5xl md:text-7xl font-bold font-display tracking-tight text-pretty" lang="nb">
                    {t('home.heroTitle')}
                  </h1>
                </div>
                <h2 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight text-pretty bg-clip-text text-transparent bg-gradient-to-r from-foreground/90 to-foreground/60">
                  {t('home.subtitle')}
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground text-pretty">
                  {t('home.description')}
                </p>
              </motion.div>
              <div className="mt-16 md:mt-24 flex flex-col items-center">
                {activeMatch && <ActiveMatchCard activeMatch={activeMatch} />}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <Button size="lg" className="bg-heimdal-green hover:bg-heimdal-red text-white text-xl font-semibold px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 shadow-glow hover:shadow-glow-lg">
                        {t('home.startButton')}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-gradient-to-b from-heimdal-green/10 via-background to-heimdal-red/10">
                      <SheetHeader>
                        <SheetTitle className="text-2xl font-bold">{t('home.createMatch')}</SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6 py-6">
                        <div className="space-y-2">
                          <Label>{t('home.teamSize')}: {teamSize}v{teamSize}</Label>
                          <Slider defaultValue={[3]} min={3} max={11} step={1} onValueChange={(val) => setTeamSize(val[0])} />
                          <p className="text-sm text-muted-foreground">{t('home.standard3v3')}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="duration">{t('home.duration')}</Label>
                          <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10) || 15)} min="5" max="60" />
                          <p className="text-sm text-muted-foreground">{t('home.spilletid15min')}</p>
                        </div>
                        <div className="space-y-4">
                          <Label>{t('home.lineupSelect', { size: teamSize })}</Label>
                          <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                            {players.map(player => (
                              <div key={player.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`player-${player.id}`}
                                  checked={selectedPlayerIds.includes(player.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedPlayerIds(prev =>
                                      checked ? [...prev, player.id] : prev.filter(id => id !== player.id)
                                    );
                                  }}
                                />
                                <label htmlFor={`player-${player.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  {player.name}{player.number ? ` (#${player.number})` : ''}
                                </label>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedPlayerIds.length} / {players.length} selected</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="carryover" checked={carryover} onCheckedChange={setCarryover} />
                          <Label htmlFor="carryover">{t('home.carryover')}</Label>
                        </div>
                        <Button onClick={handleStartMatch} size="lg" className="w-full bg-heimdal-green hover:bg-heimdal-red text-white text-lg font-semibold">
                          {t('home.startConfirm')}
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
        <footer className="text-center py-8 text-muted-foreground/80">
          <p>Built with ��️ at Cloudflare</p>
        </footer>
      </div>
      <Toaster richColors />
    </>
  );
}