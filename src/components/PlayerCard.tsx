import { motion } from 'framer-motion';
import { Shirt, ArrowRightLeft, Clock, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatTime } from '@/lib/utils';
import type { Player } from '@shared/types';
import { useTranslation } from '@/lib/translations';
interface PlayerCardProps {
  player: Player;
  minutesPlayed: number;
  onSwapRequest: (playerId: string) => void;
  isOnField: boolean;
}
export function PlayerCard({ player, minutesPlayed, onSwapRequest, isOnField }: PlayerCardProps) {
  const { t } = useTranslation();
  const isDeficit = minutesPlayed < 0;
  const formattedTime = formatTime(Math.max(0, minutesPlayed) * 60000);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      aria-label={`Spiller: ${player.name}, Tid: ${formattedTime}`}
    >
      <Card className={cn(
        "min-h-40 p-4 space-y-4 flex flex-col justify-between transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1 rounded-xl shadow-md",
        isOnField ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-card",
        isDeficit && "border-yellow-400 dark:border-yellow-700"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-2">
          <CardTitle className="text-lg font-bold text-pretty">{player.name}</CardTitle>
          {player.number !== undefined && player.number !== null ? (
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-base">
              {player.number}
            </div>
          ) : (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground font-medium text-sm">
              -
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2 pt-0 pb-2 space-y-3">
          <div className="flex items-center">
            <Shirt className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="text-base font-medium">{t(`positions.${player.position.toLowerCase()}`)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            <span className="text-xl font-mono font-bold text-foreground">{formattedTime || "00:00"}</span>
          </div>
          {isDeficit && (
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
              <TrendingDown className="mr-2 h-4 w-4" />
              <span>{t('match.deficitDisplay', { min: formatTime(Math.abs(minutesPlayed) * 60000) })}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-2 pt-0 flex justify-between items-center">
          <Badge className={cn("h-10 px-4", isOnField ? "border-green-500 text-green-600" : "border-secondary")}>
            {isOnField ? 'On Field' : 'On Bench'}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => onSwapRequest(player.id)} className="h-12 px-6">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Substitute
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}