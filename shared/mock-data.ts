import type { User, Chat, ChatMessage, Player, Match } from './types';
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Trener Test', email: 'trener@heimdal.no', passwordHash: 'password123', role: 'trener' },
  { id: 'u2', name: 'Assistent Test', email: 'assistent@heimdal.no', passwordHash: 'password123', role: 'assistent' }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
// Heimdal Fotball Data - Includes ÆØÅ for font testing
export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', teamId: 'heimdal-g12', name: 'Ola Nordmann', number: 10, position: 'Forward' },
  { id: 'p2', teamId: 'heimdal-g12', name: 'Kari Svensson', number: 7, position: 'Midfield' },
  { id: 'p3', teamId: 'heimdal-g12', name: 'Aksel Lund', number: 4, position: 'Defense' },
  { id: 'p4', teamId: 'heimdal-g12', name: 'Ingrid Johansen', number: 1, position: 'Goalkeeper' },
  { id: 'p5', teamId: 'heimdal-g12', name: 'Sven Olsen', number: 11, position: 'Forward' },
  { id: 'p6', teamId: 'heimdal-g12', name: 'Maja Kristiansen', number: 8, position: 'Midfield' },
  { id: 'p7', teamId: 'heimdal-g12', name: 'Lars Berg', number: 5, position: 'Defense' },
  { id: 'p8', teamId: 'heimdal-g12', name: 'Hanna Larsen', number: 2, position: 'Defense' },
  { id: 'p9', teamId: 'heimdal-g12', name: 'Emil Eriksen', number: 9, position: 'Forward' },
  { id: 'p10', teamId: 'heimdal-g12', name: 'Nora Andersen', number: 6, position: 'Midfield' },
  { id: 'p11', teamId: 'heimdal-g12', name: 'Jakob Nilsen', number: 3, position: 'Defense' },
  { id: 'p12', teamId: 'heimdal-g12', name: 'Frida Pettersen', number: 12, position: 'Midfield' },
  { id: 'p13', teamId: 'heimdal-g12', name: 'Ævar Ødegaard', number: 13, position: 'Forward' },
  { id: 'p14', teamId: 'heimdal-g12', name: 'Åse Lunde', number: 14, position: 'Midfield' },
];
export const MOCK_MATCHES: Match[] = [
  { id: 'm1', teamId: 'heimdal-g12', opponent: 'Ranheim IL', duration_minutes: 45, status: 'Klar', events: [] },
  { id: 'm2', teamId: 'heimdal-g12', opponent: 'Strindheim TF', duration_minutes: 45, status: 'Klar', events: [] },
  { id: 'm3', teamId: 'heimdal-g12', opponent: 'Byåsen Toppfotball', duration_minutes: 45, status: 'Klar', events: [] },
];