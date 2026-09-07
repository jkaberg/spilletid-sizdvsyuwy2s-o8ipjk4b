# Heimdal Fotball — Spilletid & Bytte-verktøy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/erlendsellie/heimdal-fotball-spilletid)

## Overview

Heimdal Spilletid er en Progressive Web App (PWA) designet for fotballtrenere i Heimdal Fotball-klubben. Appen lar deg kontrollere og følge spilletid for spillere i sanntid, håndtere bytter, og spore statistikk per kamp og turnering. Den fungerer fullstendig offline med lokal lagring via IndexedDB, og synkroniserer data trygt når nettverket er tilgjengelig. Backend er bygget med Cloudflare Workers for skalerbarhet og sanntidskoordinering.

Denne appen prioriterer en touch-vennlig, mobil-first brukeropplevelse med klubbfarger (#E55A1B, #0B3D91, #FFFFFF) og profesjonell visuell polish.

## Nøkkelfunksjoner

- **Kampstyring**: Start, pause og stopp kampklokken med fleksibel varighet. Spor akkumulert spilletid per spiller i sanntid.
- **Byttehåndtering**: Enkel flytting av spillere mellom bane og benk. Logg bytter med tidsstempel og umiddelbar oppdatering av statistikk.
- **Turneringsstøtte**: Opprett og administrer flere kamper i en turnering/serie. Konfigurer carryover-regler for tapt tid (f.eks. skader).
- **Smarte forslag**: Algoritme som foreslår bytter basert på spilletid, posisjon, tretthet og strategier (jevnt fordelt, behold kjerne, etc.).
- **Statistikk og eksport**: Vis totalt spilletid, gjennomsnitt og prosentdekning per spiller. Eksporter data som CSV/JSON.
- **Offline-first**: Full funksjonalitet uten internett; bakgrunnsynkronisering med konfliktløsning (siste-tidsstempel vinner).
- **Autentisering og roller**: Enkel innlogging for trenere, assistenter og observatører (lese-only).
- **PWA-funksjoner**: Installerbar app med service worker for offline-støtte.

## Teknologistakk

- **Frontend**: React 18 + TypeScript, Vite (byggeverktøy), Tailwind CSS v3, shadcn/ui (komponenter), framer-motion (animasjoner), lucide-react (ikoner), react-router-dom (routing), @tanstack/react-query (datahåndtering og synk), zustand (state management).
- **Lokal lagring**: IndexedDB via idb-wrapper for offline data og operasjonslogg (oplog).
- **Backend**: Cloudflare Workers med Hono (routing), Cloudflare D1 (SQL-persistens), Durable Objects (sanntidskoordinering).
- **Andre verktøy**: Zod (validering), PapaParse (CSV-eksport), Sonner (notifikasjoner), Workbox (service worker for PWA).
- **Testing**: Vitest/Jest for enhetstester, Testing Library for E2E-tester.
- **Deploy**: Cloudflare Pages (frontend) + Workers (backend), via build.cloudflare.dev.

## Installasjon og oppsett

Appen bruker Bun som pakke- og kjøremanager for rask utvikling.

### Forutsetninger
- Node.js 18+ (Bun erstatter npm/yarn).
- Cloudflare-konto (gratis tier støttes).
- Wrangler CLI installert: `bunx wrangler@latest install`.

### Lokal utvikling
1. Klon repositoryet:
   ```
   git clone <repository-url>
   cd heimdal-spilletid
   ```

2. Installer avhengigheter:
   ```
   bun install
   ```

3. Kjør utviklingsserveren:
   ```
   bun dev
   ```
   Appen starter på `http://localhost:3000` (eller `$PORT` hvis definert).

4. Bygg for produksjon:
   ```
   bun run build
   ```

5. For Workers-backend (lokal testing):
   ```
   bunx wrangler@latest dev
   ```
   Dette simulerer Cloudflare-miljøet med Durable Objects og D1 (krever `wrangler.toml` konfigurasjon).

### Miljøvariabler
- Sett `VITE_API_URL` for API-base (standard: `/api` for Workers).
- For backend: Bruk Wrangler secrets for D1-databaser (`wrangler secret put D1_DB`).

## Bruk

### Brukerflyt
1. **Dashboard**: Velg lag/turnering, opprett ny kamp eller vis statistikk.
2. **Match View**: Konfigurer startoppstilling (drag/drop eller tap). Start klokken, håndter bytter via spillerkort. Få forslag til innbyttere.
3. **Turnering**: Administrer flere kamper, sett regler for tidskompensasjon.
4. **Lag og spillere**: Legg til spillere med navn, nummer, posisjon. Importer/eksporter CSV.
5. **Innstillinger**: Tilpass klubbfarger, synk-policy, og eksporter statistikk.

Appen er PWA-installerbar – legg til på startskjermen for offline-bruk.

### Eksempler
- Start en kamp: Naviger til Dashboard > "Ny kamp" > Sett varighet (f.eks. 45 min) og antall på bane (7v7).
- Gjør et bytte: I Match View, trykk på en spiller på banen > Velg innbytter fra benk > Bekreft (oppdaterer tid umiddelbart).
- Synk offline-endringer: Appen synkroniserer automatisk ved nettverk; sjekk status i Innstillinger.

## Utvikling

### Kodeorganisering
- **Frontend** (`src/`): `pages/` for ruter, `components/ui/` for shadcn-komponenter, `hooks/` for custom hooks.
- **Shared** (`shared/`): Typer og mock-data delt mellom frontend/backend.
- **Backend** (`worker/`): Hono-ruter i `user-routes.ts`, entiteter i `entities.ts`. Bruk `core-utils.ts` for Durable Object-abstraksjon (ikke modifiser).

### Legge til ruter
I `worker/user-routes.ts`:
```ts
app.post('/api/matches', async (c) => {
  // Bruk IndexedEntity for persistens
  const match = await MatchEntity.create(c.env, { id: crypto.randomUUID(), /* data */ });
  return ok(c, match);
});
```

### Legge til sider
Oppdater `src/main.tsx` for nye ruter:
```tsx
{ path: "/match/:id", element: <MatchPage />, errorElement: <RouteErrorBoundary /> },
```

### Testing
- Kjør tester: `bun test` (Vitest for enhet, E2E med Testing Library).
- Offline-synk-tester: Mock nettverk med MSW eller Vitest for å simulere offline→online flyter.

### Bidrag
1. Fork repositoryet og lag en feature-branch.
2. Installer avhengigheter med `bun install`.
3. Implementer endringer, legg til tester.
4. Push og åpne en Pull Request.

Følg luftighet: Bruk TypeScript-streng typing, shadcn-komponenter, og Tailwind for styling.

## Deploy

### Cloudflare Deploy
Appen er optimalisert for Cloudflare – deploy med ett klikk:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/erlendsellie/heimdal-fotball-spilletid)

### Manuell deploy
1. Bygg frontend: `bun run build`.
2. Deploy Workers-backend: `bunx wrangler@latest deploy` (krever autentisering: `wrangler login`).
3. For D1-database: Opprett via `wrangler d1 create heimdal-db` og bind i `wrangler.toml`.
4. Deploy Pages (frontend): Koble til GitHub-repo via Cloudflare Dashboard > Pages > Connect to Git.
5. PWA-manifest og service worker: Automatisk via Vite-plugin; test installasjon i Chrome DevTools.

### CI/CD
- Bruk GitHub Actions eller Cloudflare Build (build.cloudflare.dev) for automatisk deploy.
- Konfigurer `wrangler.toml` for miljøer (dev/prod).

For mer info, se [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/) og [Pages Docs](https://developers.cloudflare.com/pages/).

## Lisens
MIT License. Se `LICENSE` for detaljer.

## Kontakt
For spørsmål, åpne en issue eller kontakt Heimdal Fotball-utviklingsteamet.