export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'trener' | 'assistent' | 'observatør';
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}
// Heimdal Fotball Types
export interface Player {
  id: string;
  teamId: string;
  name: string;
  number?: number;
  position: 'Goalkeeper' | 'Defense' | 'Midfield' | 'Forward';
  age?: number;
}
export interface Match {
  id: string;
  teamId: string;
  opponent: string;
  duration_minutes: number;
  status: 'Klar' | 'P��gående' | 'Fullført';
  events: MatchEvent[];
  teamSize?: number;
}
export type MatchEventType = 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'SUBSTITUTION';
export interface MatchEvent {
  id: string;
  matchId: string;
  type: MatchEventType;
  ts: number; // epoch millis
  payload?: Record<string, any>;
  synced: boolean;
}
export interface SubstitutionPayload {
  playerOutId: string;
  playerInId: string;
  minute: number;
  teamSize?: number;
}