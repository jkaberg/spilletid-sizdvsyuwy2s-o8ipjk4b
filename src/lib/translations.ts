import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { interpolateT } from './utils';
type Language = 'nb' | 'en';
interface TranslationState {
  language: Language;
  setLanguage: (lang: Language) => void;
}
const useLanguageStore = create<TranslationState>()(
  persist(
    (set) => ({
      language: 'nb',
      setLanguage: (lang) => {
        set({ language: lang });
        document.documentElement.lang = lang;
      },
    }),
    {
      name: 'heimdal-language-storage',
    }
  )
);
const translations = {
  nb: {
    nav: {
      dashboard: 'Oversikt',
      tournaments: 'Turneringer',
      team: 'Lag',
      settings: 'Innstillinger',
      logout: 'Logg ut',
      title: 'Meny'
    },
    home: {
      heroTitle: 'Heimdal Fotball',
      subtitle: 'Spilletid & Bytte-verktøy',
      description: 'Kontroller og følg spilletid for hver spiller i sanntid. Fungerer offline, med smarte forslag til bytter.',
      createMatch: 'Ny Kamp',
      teamSize: 'Antall på Banen',
      duration: 'Varighet (minutter)',
      carryover: 'Bruk Tid fra Forrige Kamp?',
      startMatch: 'Start Kamp',
      startButton: 'Start Ny Kamp',
      lineupSelect: 'Velg startoppstilling (velg {{size}} spillere)',
      durationSlider: 'Kamp lengde (minutter)',
      startConfirm: 'Start!',
      standard3v3: 'Standard: 3v3',
      spilletid15min: 'Spilletid: 15 min',
      paaagaendeKamp: 'P��gående Kamp',
      fortsettKamp: 'Fortsett Kamp',
      activeMatch: 'Aktiv kamp',
      activeMatchDesc: 'En kamp er allerede i gang.',
      resume: 'Gjenoppta',
      invalidDuration: 'Varighet må være mellom 5 og 60 minutter.',
    },
    login: {
      title: 'Trener Innlogging',
      description: 'Få tilgang til lagets kampoversikt.',
      email: 'E-post',
      password: 'Passord',
      submit: 'Logg Inn',
      loading: 'Logger inn...',
      success: 'Vellykket innlogget!',
      error: 'Innlogging feilet. Sjekk brukernavn og passord.',
    },
    match: {
      liveTitle: 'Live Kamp',
      opponent: 'mot',
      substitute: 'Bytt',
      suggestionsTitle: 'Bytteforslag',
      onField: 'På Banen',
      onBench: 'På Benken',
      substitutionMade: 'Bytte utført!',
      loading: 'Laster kamp...',
      noSuggestions: 'Ingen forslag tilgjengelig.',
      deficit: 'Start-differanse: {{min}} min',
      teamSizeDisplay: '{{size}}v{{size}} Kamp',
      carryoverInfo: 'Spillere under snittet fra forrige kamp starter med en tids-differanse.',
      lineup: 'Oppstilling',
      deficitDisplay: 'Start-differanse: {{min}} min',
      notifyEven: 'Bytt nå: {{player}} har mest tid!',
      notifyDeficit: 'Deficit nullstilt for {{player}}!',
      start: 'Start',
      pause: 'Pause',
      resume: 'Gjenoppta',
      stop: 'Stopp',
      timePlayed: '{{time}} spilt',
    },
    team: {
      title: 'Lag & Spillere',
      description: 'Administrer lagets spillere.',
      addTitle: 'Legg Til Ny Spiller',
      editTitle: 'Rediger Spiller',
      searchPlaceholder: 'Søk spillere...',
      added: 'Spiller lagt til!',
      updated: 'Spiller oppdatert!',
      deleted: 'Spiller slettet!',
      name: 'Navn',
      number: 'Nummer',
      numberOptional: 'Nummer (valgfri)',
      position: 'Posisjon',
      age: 'Alder (valgfri)',
      uniqueNumber: 'Nummer må være unikt for laget.',
      deleteConfirmTitle: 'Er du sikker?',
      deleteConfirmDesc: 'Denne handlingen kan ikke angres. Spilleren vil bli permanent slettet.',
      cancel: 'Avbryt',
      delete: 'Slett',
      save: 'Lagre',
      numberRequired: 'Nummer er påkrevd.',
    },
    positions: {
      forward: 'Angriper',
      midfield: 'Midtbane',
      defense: 'Forsvar',
      goalkeeper: 'Keeper',
    },
    settings: {
      title: 'Innstillinger & Eksport',
      description: 'Tilpass appen og eksporter dataene dine.',
      general: 'Innstillinger',
      stats: 'Statistikk',
      exports: 'Eksport',
      autoSync: 'Automatisk Synkronisering',
      install: 'Installer App på Enhet',
      installInfo: 'Installasjonsdialog for PWA ville vist seg her.',
      exportCSV: 'Eksporter som CSV',
      exportJSON: 'Eksporter som JSON',
      exported: 'Data eksportert!',
      exporting: 'Eksporterer...',
      playerStats: 'Spillerstatistikk',
      playerStatsDesc: 'Totalt antall minutter spilt denne sesongen.',
      exportData: 'Eksporter Data',
      exportDataDesc: 'Last ned kamp- eller turneringsdata.',
    },
    tournament: {
      title: 'Turneringer & Kamper',
      createMatch: 'Opprett Ny Kamp',
      aggregateStats: 'Aggregerte Statistikk',
      totalMinutes: 'Total Minutter: {{min}} min',
      noMatches: 'Ingen kamper å vise. Opprett din første!',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      tournaments: 'Tournaments',
      team: 'Team',
      settings: 'Settings',
      logout: 'Logout',
      title: 'Menu'
    },
    home: {
      heroTitle: 'Heimdal Football',
      subtitle: 'Playtime & Substitution Tool',
      description: 'Control and track playing time for each player in real-time. Works offline, with smart substitution suggestions.',
      createMatch: 'New Match',
      teamSize: 'Players on Field',
      duration: 'Duration (minutes)',
      carryover: 'Carry Over Time From Last Match?',
      startMatch: 'Start Match',
      startButton: 'Start New Match',
      lineupSelect: 'Select Starting Lineup (choose {{size}} players)',
      durationSlider: 'Match Length (minutes)',
      startConfirm: 'Start!',
      standard3v3: 'Default: 3v3',
      spilletid15min: 'Playtime: 15 min',
      paaagaendeKamp: 'Active Match',
      fortsettKamp: 'Resume Match',
      activeMatch: 'Active Match',
      activeMatchDesc: 'A match is already in progress.',
      resume: 'Resume',
      invalidDuration: 'Duration must be between 5 and 60 minutes.',
    },
    login: {
      title: 'Coach Login',
      description: "Access your team's match dashboard.",
      email: 'Email',
      password: 'Password',
      submit: 'Log In',
      loading: 'Logging in...',
      success: 'Successfully logged in!',
      error: 'Login failed. Check username and password.',
    },
    match: {
      liveTitle: 'Live Match',
      opponent: 'vs.',
      substitute: 'Substitute',
      suggestionsTitle: 'Substitution Suggestions',
      onField: 'On Field',
      onBench: 'On Bench',
      substitutionMade: 'Substitution made!',
      loading: 'Loading match...',
      noSuggestions: 'No suggestions available.',
      deficit: 'Start Deficit: {{min}} min',
      teamSizeDisplay: '{{size}}v{{size}} Match',
      carryoverInfo: 'Players below average from the last match start with a time deficit.',
      lineup: 'Lineup',
      deficitDisplay: 'Start Deficit: {{min}} min',
      notifyEven: 'Substitute now: {{player}} has the most time!',
      notifyDeficit: 'Deficit cleared for {{player}}!',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      stop: 'Stop',
      timePlayed: '{{time}} played',
    },
    team: {
      title: 'Team & Players',
      description: 'Manage your team roster.',
      addTitle: 'Add New Player',
      editTitle: 'Edit Player',
      searchPlaceholder: 'Search players...',
      added: 'Player added!',
      updated: 'Player updated!',
      deleted: 'Player deleted!',
      name: 'Name',
      number: 'Number',
      numberOptional: 'Number (optional)',
      position: 'Position',
      age: 'Age (optional)',
      uniqueNumber: 'Number must be unique for the team.',
      deleteConfirmTitle: 'Are you sure?',
      deleteConfirmDesc: 'This action cannot be undone. The player will be permanently deleted.',
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save',
      numberRequired: 'Number is required.',
    },
    positions: {
      forward: 'Forward',
      midfield: 'Midfield',
      defense: 'Defense',
      goalkeeper: 'Goalkeeper',
    },
    settings: {
      title: 'Settings & Exports',
      description: 'Customize the app and export your data.',
      general: 'Settings',
      stats: 'Statistics',
      exports: 'Exports',
      autoSync: 'Automatic Synchronization',
      install: 'Install App on Device',
      installInfo: 'PWA installation prompt would appear here.',
      exportCSV: 'Export as CSV',
      exportJSON: 'Export as JSON',
      exported: 'Data exported!',
      exporting: 'Exporting...',
      playerStats: 'Player Statistics',
      playerStatsDesc: 'Total minutes played this season.',
      exportData: 'Export Data',
      exportDataDesc: 'Download match or tournament data.',
    },
    tournament: {
      title: 'Tournaments & Matches',
      createMatch: 'Create New Match',
      aggregateStats: 'Aggregate Stats',
      totalMinutes: 'Total Minutes: {{min}} min',
      noMatches: 'No matches to show. Create your first!',
    },
  },
};
export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = (key: string, vars?: Record<string, any>): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    return interpolateT(result, vars || {});
  };
  return { t, setLanguage, language };
}