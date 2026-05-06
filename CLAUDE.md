# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio    # Visual DB browser (localhost:5555)
npx prisma migrate dev --name <name>  # Create and apply a migration
npx prisma generate  # Regenerate Prisma client after schema changes
npx tsx prisma/seed.ts  # Run the seed (preferred)
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts  # Alternative seed
```

PostgreSQL service (requires admin PowerShell):
```powershell
net start "postgresql-x64-17"
net stop "postgresql-x64-17"
```

> ⚠️ Always stop `npm run dev` before running migrations — the dev server locks the Prisma DLL.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **NextAuth v4** — authentication (JWT strategy), `session.user.id` disponible via callback JWT
- **Prisma v6** + **PostgreSQL 17** (local, port 5432)
- **@anthropic-ai/sdk** — Claude Haiku (`claude-haiku-4-5-20251001`) pour les conversations IA
- **Groq API** — Whisper `whisper-large-v3-turbo` pour la transcription vocale (micro)

## Variables d'environnement

Deux fichiers d'env :
- `.env` — contient `DATABASE_URL` (lu par Prisma)
- `.env.local` — contient toutes les variables (lu par Next.js) :
  - `ANTHROPIC_API_KEY` — sans guillemets
  - `GROQ_API_KEY`
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Architecture

### Auth flow
`src/lib/auth.ts` centralise la config NextAuth (Google OAuth + Credentials email/mdp). L'adapter `@next-auth/prisma-adapter` gère la création des `User` et `Account` en DB. Les sessions sont JWT (cookie httpOnly), la table `Session` reste vide.

- Route handler NextAuth : `src/app/api/auth/[...nextauth]/route.ts`
- Inscription manuelle : `POST /api/register` → `src/app/api/register/route.ts`
- Pages auth : `src/app/(auth)/login/` et `src/app/(auth)/register/`
- Après connexion/inscription → redirect vers `/home`

### Database — modèles Prisma

- `User` — profil central (email, pseudo unique, firstName, lastName, birthDate, image, password haché bcrypt)
- `Account` — méthode de connexion liée à un User (géré par NextAuth)
- `Session` — toujours vide (JWT strategy)
- `Character` — personnage IA lié à un POI (`poiId` unique). Contient `systemPrompt`, `greetingMessage`, `image`, `backgroundImage`
- `Quest` — quête liée à un POI (`poiId`). Plusieurs quêtes possibles par POI, ordonnées par `order`
- `QuestTask` — tâche ordonnée dans une quête. Contient `instruction` (affiché à l'utilisateur) et `aiContext` (injecté dans le system prompt pour guider l'IA)
- `TaskChoice` — choix QCM d'une tâche (`isCorrect` pour la bonne réponse)
- `UserQuestProgress` — progression d'un utilisateur sur une quête (`IN_PROGRESS` | `COMPLETED`)
- `UserTaskProgress` — progression par tâche (`PENDING` | `COMPLETED`)

### Seed

`prisma/seed.ts` — crée les `Character` et les `Quest` avec des IDs stables (upsert pour les personnages, findUnique + create pour les quêtes). Les quêtes sont idempotentes : si l'ID existe déjà, on ne recrée pas.

### Navigation et routes

```
/home                          → liste des villes (carte)
/home/[city]                   → carte illustrée de la ville (CityClient)
/home/[city]/[poi]             → conversation IA avec le personnage (POIClient)
/home/[city]/[poi]?quest=<id>  → même page, mais démarre directement la quête
```

### Flux quête

1. L'utilisateur clique un POI sur la carte → modale dans `CityClient` avec les quêtes disponibles
2. Il clique "Faire la quête" → navigue vers `/home/[city]/[poi]?quest=<questId>`
3. `POIClient` reçoit `questId` via `searchParams`, charge le personnage + les quêtes en parallèle
4. Si `questId` présent : initialise `activeQuest` (état local), appelle `POST /api/quests/[questId]/start` en arrière-plan pour créer le `UserQuestProgress` en DB
5. En conversation : le `aiContext` de la tâche courante est injecté dans le system prompt à chaque message
6. L'utilisateur clique "🎯 Vérifier" → quiz QCM. Bonne réponse → `POST /api/quests/tasks/[taskId]/complete` → tâche suivante ou quête terminée

### API routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/characters/[poiId]` | GET | Récupère le personnage d'un POI |
| `/api/chat` | POST | Envoie un message à Claude Haiku, retourne `{reply, translation, words, suggestions}` |
| `/api/transcribe` | POST | Transcrit un audio via Groq Whisper |
| `/api/quests/poi/[poiId]` | GET | Liste les quêtes d'un POI avec progression utilisateur |
| `/api/quests/[questId]/start` | POST | Crée un `UserQuestProgress` (auth requise) |
| `/api/quests/tasks/[taskId]/complete` | POST | Valide une tâche, débloque la suivante ou termine la quête |

### Carte illustrée (`IllustratedMap`)

`src/app/home/[city]/IllustratedMap.tsx` — affiche une image de carte custom avec pan/zoom.
- L'image est chargée à taille naturelle, le scale initial est calculé via `onLoad` pour tout faire tenir dans le viewport
- Les marqueurs POI sont positionnés en `%` via `latLngToPercent(lat, lng, bounds)` et contre-scalés (`1/transform.scale`) pour rester à taille constante à l'écran
- `mapImage` + `mapBounds` dans `src/lib/cities.ts` activent la carte illustrée (sinon fallback Leaflet)

### SessionProvider
`src/app/providers.tsx` wrappe l'app avec le `SessionProvider` NextAuth, inclus dans `src/app/layout.tsx`.
