import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlayerCard } from './PlayerCard';
import type { Player } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useTranslation } from '@/lib/translations';
import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import db from '@/lib/local-db';
function SortablePlayerItem({ id, player, minutesPlayed, isOnField, onSwapRequest }: { id: string; player: Player; minutesPlayed: number; isOnField: boolean; onSwapRequest: (id: string) => void; }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PlayerCard player={player} minutesPlayed={minutesPlayed} onSwapRequest={onSwapRequest} isOnField={isOnField} />
    </div>
  );
}
export function DragDropLineup({ onFieldPlayers, onBenchPlayers, minutesPlayed, onLineupChange, teamSize, matchId }: { onFieldPlayers: Player[]; onBenchPlayers: Player[]; minutesPlayed: Record<string, number>; onLineupChange: (playerOutId: string, playerInId: string) => void; teamSize: number; matchId: string; }) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );
  const { onFieldIds, onBenchIds, allPlayersMap } = useMemo(() => {
    const onFieldIds = onFieldPlayers.map(p => p.id);
    const onBenchIds = onBenchPlayers.map(p => p.id);
    const allPlayersMap = new Map([...onFieldPlayers, ...onBenchPlayers].map(p => [p.id, p]));
    return { onFieldIds, onBenchIds, allPlayersMap };
  }, [onFieldPlayers, onBenchPlayers]);
  const handleDragStart = useCallback((event: any) => {
    setActiveId(event.active.id);
  }, []);
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeContainer = onFieldIds.includes(active.id as string) ? 'field' : 'bench';
    const overContainer = onFieldIds.includes(over.id as string) ? 'field' : 'bench';
    if (activeContainer !== overContainer) {
      let playerOutId: string, playerInId: string;
      if (activeContainer === 'bench' && overContainer === 'field') {
        playerOutId = over.id as string;
        playerInId = active.id as string;
      } else if (activeContainer === 'field' && overContainer === 'bench') {
        playerOutId = active.id as string;
        playerInId = over.id as string;
      } else {
        return;
      }
      onLineupChange(playerOutId, playerInId);
      db.addEvent({
        type: 'SUBSTITUTION',
        matchId,
        payload: { playerOutId, playerInId, minute: Date.now() / 60000 }
      });
    }
  }, [onFieldIds, onLineupChange, matchId]);
  const activePlayer = activeId ? allPlayersMap.get(activeId) : null;
  const activeIsOnField = activeId ? onFieldIds.includes(activeId) : false;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 focus-within:ring-2 focus-within:ring-heimdal-orange/50 transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> {t('match.onField')} ({onFieldPlayers.length}/{teamSize})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-[120px]">
            <SortableContext items={onFieldIds} strategy={rectSortingStrategy}>
              {onFieldPlayers.map((player) => (
                <SortablePlayerItem key={player.id} id={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={true} onSwapRequest={() => {}} />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
        <Card className="focus-within:ring-2 focus-within:ring-heimdal-orange/50 transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> {t('match.onBench')} ({onBenchPlayers.length})</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 min-h-[120px]">
            <SortableContext items={onBenchIds} strategy={rectSortingStrategy}>
              {onBenchPlayers.map((player) => (
                <SortablePlayerItem key={player.id} id={player.id} player={player} minutesPlayed={minutesPlayed[player.id] || 0} isOnField={false} onSwapRequest={() => {}} />
              ))}
            </SortableContext>
          </CardContent>
        </Card>
      </div>
      {createPortal(
        <DragOverlay>
          {activePlayer ? (
            <PlayerCard player={activePlayer} minutesPlayed={minutesPlayed[activePlayer.id] || 0} onSwapRequest={() => {}} isOnField={activeIsOnField} />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}