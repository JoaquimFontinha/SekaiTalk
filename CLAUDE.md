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
- **ElevenLabs API** — TTS par personnage (`eleven_multilingual_v2`), proxié via `/api/tts`
- **MapLibre GL JS v5** + **react-map-gl v8** — carte 3D Tokyo (tuiles OpenFreeMap, gratuit sans clé)
- **Three.js v0.184** + **GLTFLoader** — modèle GLB Tokyo Skytree rendu en custom layer MapLibre

## Variables d'environnement

Deux fichiers d'env :
- `.env` — contient `DATABASE_URL` (lu par Prisma)
- `.env.local` — contient toutes les variables (lu par Next.js) :
  - `ANTHROPIC_API_KEY` — sans guillemets
  - `GROQ_API_KEY`
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `ELEVENLABS_API_KEY` — clé ElevenLabs pour le TTS des personnages

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
- `Character` — personnage IA sans `poiId` (peut apparaître dans plusieurs lieux). Contient `id` stable (ex: `"char-kenji"`), `systemPrompt`, `greetingMessage`, `image`, `voiceId` (ElevenLabs), `isFriendable` (active la mémoire + outil `remember_fact`)
- `CharacterAppearance` — table de jonction many-to-many `Character ↔ POI`. Champs : `characterId`, `poiId`, `locationContext?` (injection supplémentaire dans le system prompt pour contextualiser le lieu). Contrainte `@@unique([characterId, poiId])`
- `Scene` — décor lié à un POI (`poiId @unique`). Champs : `backgroundImage?`, `entrySound?`, `ambientSound?`. Séparé du personnage car le même lieu peut avoir un autre personnage à l'avenir
- `CharacterMemory` — mémoire persistante par `(characterId, userId, key)`. Valeur mise à jour via upsert. Activée uniquement si `character.isFriendable = true` + utilisateur connecté. Contrainte `@@unique([characterId, userId, key])`
- `Quest` — quête liée à un POI (`poiId`). Plusieurs quêtes possibles par POI, ordonnées par `order`
- `QuestTask` — tâche ordonnée dans une quête. Contient `instruction` (affiché à l'utilisateur) et `aiContext` (injecté dans le system prompt pour guider l'IA)
- `TaskChoice` — choix QCM d'une tâche (`isCorrect` pour la bonne réponse)
- `UserQuestProgress` — progression d'un utilisateur sur une quête (`IN_PROGRESS` | `COMPLETED`)
- `UserTaskProgress` — progression par tâche (`PENDING` | `COMPLETED`)

### Seed

`prisma/seed.ts` — crée `Scene`, `Character`, `CharacterAppearance` et `Quest` avec des IDs stables.
- Personnages : upsert par `id` stable (`"char-kenji"`, `"char-hana"`, `"char-taro"`)
- Scènes : upsert par `poiId` (konbini-shinjuku, konbini-shibuya, konbini-kyoto) avec `entrySound: "/sounds/konbini_enter.mp3"`
- Apparitions : upsert par `@@unique([characterId, poiId])`
- Quêtes : `findUnique` + `create` — idempotentes, non recréées si l'ID existe déjà

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
| `/api/characters/[poiId]` | GET | Récupère le personnage via `CharacterAppearance` + `Scene` du POI ; retourne `{...character, locationContext, scene}` |
| `/api/chat` | POST | Envoie un message à Claude Haiku. Body : `{messages, systemPrompt, characterId}`. Retourne `{reply, translation, words, suggestions}`. Agentic loop (max 5 tours) avec outil `remember_fact` si personnage `isFriendable` |
| `/api/transcribe` | POST | Transcrit un audio via Groq Whisper |
| `/api/tts` | POST | TTS ElevenLabs server-side (`{text, voiceId}`), retourne `audio/mpeg` |
| `/api/user/stats` | GET | Stats XP/Yens/niveau de l'utilisateur connecté |
| `/api/quests/poi/[poiId]` | GET | Liste les quêtes d'un POI avec progression utilisateur |
| `/api/quests/[questId]/start` | POST | Crée un `UserQuestProgress` (auth requise) |
| `/api/quests/tasks/[taskId]/complete` | POST | Valide une tâche, débloque la suivante ou termine la quête |

### Carte 3D Tokyo (`GameMap3D`)

`src/app/home/[city]/GameMap3D.tsx` — carte 3D interactive pour les villes avec `use3DMap: true` dans `cities.ts`.
- **Rendu** : MapLibre GL JS v5 + react-map-gl v8, tuiles gratuites OpenFreeMap (`bright`)
- **Import SSR** : `dynamic(() => import("./GameMap3D"), { ssr: false })` dans `CityClient`
- **Bâtiments 3D** : layer `fill-extrusion` sur source `openmaptiles`, palette couleur japonaise (crème→bleu→indigo selon hauteur), bâtiments Skytree exclus par filtre géographique `within`
- **Modèle Skytree** : `public/models/tokyo_skytree.glb` rendu via custom Three.js layer. Transform : `projMatrix × T(mercator) × Scale(1,−1,1) × RotX(+π/2)`. Scale model : `mpu = meterInMercatorCoordinateUnits()`. API MapLibre v3+ : `args.defaultProjectionData.mainMatrix` (pas `matrix` directement)
- **Animations canvas** : eau (`fill-pattern` "water-anim" 128×128) et herbe (`fill-pattern` "grass-anim" 32×32) via `map.addImage()` avec `render()` + `triggerRepaint()`
- **Style routes** : routes sombres (`#1c1c2e`→`#505062`), chemins piétons terracotta (`#d4956a`), rails acier avec tirets traverses
- **Contraintes caméra** : `minZoom=14`, `maxPitch=58`, `minPitch=35`, `maxBounds` Tokyo centre, bearing clampé ±25° autour de −20° via `map.on('rotate',...)`
- **Fog + Sky** : `setFog({range:[0.3,5]})` + layer `sky` type `atmosphere` pour cacher les tuiles plates à l'horizon en vue inclinée

### Carte illustrée (`IllustratedMap`)

`src/app/home/[city]/IllustratedMap.tsx` — affiche une image de carte custom avec pan/zoom.
- L'image est chargée à taille naturelle, le scale initial est calculé via `onLoad` pour tout faire tenir dans le viewport
- Les marqueurs POI sont positionnés en `%` via `latLngToPercent(lat, lng, bounds)` et contre-scalés (`1/transform.scale`) pour rester à taille constante à l'écran
- `mapImage` + `mapBounds` dans `src/lib/cities.ts` activent la carte illustrée (sinon fallback Leaflet)
- `use3DMap: true` dans `cities.ts` active `GameMap3D` à la place

### Système XP / Yens / Niveau

- `User.xp` et `User.yens` en DB, incrémentés à la complétion de quête (`firstCompletedAt`)
- `getLevelInfo(xp)` dans `src/lib/level.ts` — calcule `{level, xpInLevel, xpNeeded, percent}`
- Les récompenses s'affichent dans la modale quête (`CityClient`) et en toast post-quête (`POIClient`)
- Replay d'une quête : `isReplay = status === "IN_PROGRESS" && !!firstCompletedAt` → pas de récompense

### Système de mémoire (`CharacterMemory`)

- Activé uniquement si `character.isFriendable = true` ET utilisateur connecté (`userId` via `getServerSession`)
- `POST /api/chat` charge les souvenirs existants et les injecte dans le system prompt : `[MÉMOIRE]\nkey: value`
- Claude reçoit l'outil `remember_fact(key, value)` via tool_choice `auto`. Il l'appelle discrètement quand l'utilisateur mentionne son nom, métier, goûts, événements notables
- **Agentic loop** : si `stop_reason === "tool_use"` → upsert `CharacterMemory` en DB → ajoute `tool_result "Mémorisé."` → continue (max 5 tours) → réponse texte finale

### Système sonore (POIClient)

- **Entry sound** : `new Audio(c.scene.entrySound).play()` au chargement du personnage, volume 0.7
- **Ambient sound** : audio en loop (volume 0.25) stocké dans `ambientRef` — stoppé proprement à l'unmount
- Les sons sont dans `public/sounds/` (ex: `konbini_enter.mp3`)
- `navigator.mediaDevices` est `undefined` sur mobile HTTP (contexte non sécurisé) → guard `if (navigator.mediaDevices)` obligatoire avant `getUserMedia`

### TTS ElevenLabs

- `Character.voiceId` stocke l'ID de voix ElevenLabs (ex: `TX3LPaxmHKxFdv7VOQHJ`)
- `speak()` dans `POIClient` : ElevenLabs si `voiceId` présent, fallback `speechSynthesis` browser
- React StrictMode double-invoke : flag `let cancelled = false` dans le `useEffect` de chargement
- Voix seed : Kenji=Liam (`TX3LPaxmHKxFdv7VOQHJ`), Hana=Matilda (`XrExE9yKIg1WjnnlVkGX`), Taro=Daniel (`onwK4e9ZLuTAKqWW03F9`)

### SessionProvider
`src/app/providers.tsx` wrappe l'app avec le `SessionProvider` NextAuth, inclus dans `src/app/layout.tsx`.
