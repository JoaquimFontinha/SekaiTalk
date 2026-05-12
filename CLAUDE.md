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
- **Mapbox GL JS** + **react-map-gl v8** — carte 3D Tokyo (style `mapbox://styles/mapbox/standard`, token `NEXT_PUBLIC_MAPBOX_TOKEN`)
- **Three.js v0.184** + **GLTFLoader** — modèle GLB Tokyo Skytree rendu en custom layer Mapbox

## Variables d'environnement

Deux fichiers d'env :
- `.env` — contient `DATABASE_URL` (lu par Prisma)
- `.env.local` — contient toutes les variables (lu par Next.js) :
  - `ANTHROPIC_API_KEY` — sans guillemets
  - `GROQ_API_KEY`
  - `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `ELEVENLABS_API_KEY` — clé ElevenLabs pour le TTS des personnages
  - `NEXT_PUBLIC_MAPBOX_TOKEN` — token Mapbox (plan gratuit, 50k Map Loads/mois)

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
- `Character` — personnage IA sans `poiId` (peut apparaître dans plusieurs lieux). Contient `id` stable (ex: `"char-kenji"`), `systemPrompt`, `greetingMessage`, `greetingTranslation`, `greetingWords` (Json — `Word[]` pré-calculé, évite un appel IA au chargement), `image`, `voiceId` (ElevenLabs), `isFriendable` (active la mémoire + outil `remember_fact`)
- `CharacterAppearance` — table de jonction many-to-many `Character ↔ POI`. Champs : `characterId`, `poiId`, `locationContext?` (injection supplémentaire dans le system prompt pour contextualiser le lieu). Contrainte `@@unique([characterId, poiId])`
- `Scene` — décor lié à un POI (`poiId @unique`). Champs : `backgroundImage?`, `entrySound?`, `ambientSound?`. Séparé du personnage car le même lieu peut avoir un autre personnage à l'avenir
- `CharacterMemory` — mémoire persistante par `(characterId, userId, key)`. Valeur mise à jour via upsert. Activée uniquement si `character.isFriendable = true` + utilisateur connecté. Contrainte `@@unique([characterId, userId, key])`
- `Quest` — quête liée à un POI (`poiId`). Plusieurs quêtes possibles par POI, ordonnées par `order`. Champ `vocab Json @default("[]")` — tableau de `VocabEntry[]` prédéfini pour la quête (voir `src/lib/mastery.ts`)
- `QuestTask` — tâche ordonnée dans une quête. Contient `instruction` (affiché à l'utilisateur) et `aiContext` (injecté dans le system prompt pour guider l'IA)
- `TaskChoice` — choix QCM d'une tâche (`isCorrect` pour la bonne réponse)
- `UserQuestProgress` — progression d'un utilisateur sur une quête (`IN_PROGRESS` | `COMPLETED`)
- `UserTaskProgress` — progression par tâche (`PENDING` | `COMPLETED`)
- `UserVocabProgress` — progression SRS par mot par utilisateur par quête. Clé `@@unique([userId, questId, wordJp])`. Champs : `encounters`, `correctCount`, `errorCount`, `lastSeenAt`
- `SessionRecord` — résumé d'une session complétée. Champs : `durationSeconds`, `errorCount`, `suggestionsUsed`, `practicedWords` (Json — string[] des `jp` prononcés)

### Seed

`prisma/seed.ts` — crée `Scene`, `Character`, `CharacterAppearance` et `Quest` avec des IDs stables.
- Personnages : upsert par `id` stable (`"char-kenji"`, `"char-hana"`, `"char-taro"`)
- `greetingWords` et `greetingTranslation` hardcodés dans le seed — pour un nouveau personnage, appeler `/api/analyze` une fois pour générer le breakdown puis le coller dans le seed
- Scènes : upsert par `poiId` (konbini-shinjuku, konbini-shibuya, konbini-kyoto) avec `entrySound: "/sounds/konbini_enter.mp3"`
- Apparitions : upsert par `@@unique([characterId, poiId])`
- Quêtes : `findUnique` + `create` — idempotentes, non recréées si l'ID existe déjà
- Vocab : `quest.update({ data: { vocab: VocabEntry[] } })` après le create — toujours upsertée pour rester à jour
- Quête de test : `quest-konbini-shinjuku-info-1` avec 10 mots (N5 : すみません, どこ, おにぎり, ありますか, いくら, ありがとうございます / N4 : 種類, 新鮮, 冷蔵庫, 今朝)

### Navigation et routes

```
/home                          → liste des villes (carte)
/home/[city]                   → carte 3D de la ville (CityClient)
/home/[city]/[poi]             → conversation IA avec le personnage (POIClient)
/home/[city]/[poi]?quest=<id>  → même page, démarre directement la quête
```

### Flux quête complet

1. L'utilisateur clique un POI sur la carte → **drawer POI** dans `CityClient` avec les quêtes disponibles
2. Il clique "▶ Faire la quête" ou "🔄 Refaire" → **modale de prévisualisation** (`questPreview`) : titre, récompenses, vocabulaire groupé par JLPT
3. Il clique "Commencer →" → navigue vers `/home/[city]/[poi]?quest=<questId>`
4. `POIClient` charge personnage + quêtes en parallèle. `sessionStartRef` est initialisé à `Date.now()`
5. Si `questId` présent : initialise `activeQuest` avec `vocab: VocabEntry[]`, appelle `POST /api/quests/[questId]/start`
6. En conversation : `aiContext` de la tâche courante injecté dans le system prompt. Les transcriptions Whisper sont scannées pour détecter les mots du vocab (`jp`/`kana` substring match) → `sessionPracticedVocab (Set)`
7. Clic "💬 Suggestions" → incrémente `sessionSuggestionsUsed`
8. Clic "🎯 Vérifier" → quiz QCM. Mauvaise réponse → incrémente `sessionErrors`
9. Dernière tâche validée → **modale quête terminée** (`showQuestComplete`) : récompenses + boutons "Continuer" / "Terminer la session →"
10. "Terminer la session →" → `handleEndSession` : POST `/api/session/complete` → **modale résumé de session** (`showSessionSummary`) : stats (erreurs, aides, mots) + vocab par JLPT avec niveau de maîtrise

### API routes

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/characters/[poiId]` | GET | Récupère le personnage via `CharacterAppearance` + `Scene` du POI ; retourne `{...character, locationContext, scene}` |
| `/api/chat` | POST | Envoie un message à Claude Haiku. Body : `{messages, systemPrompt, characterId}`. Retourne `{reply, translation, words, suggestions}`. Agentic loop (max 5 tours) avec outil `remember_fact` si personnage `isFriendable` |
| `/api/analyze` | POST | Analyse un texte japonais, retourne `{translation, words}`. Usage ponctuel (admin/seed) — ne pas appeler au runtime |
| `/api/transcribe` | POST | Transcrit un audio via Groq Whisper (`language: "ja"`, prompt japonais) |
| `/api/tts` | POST | TTS ElevenLabs server-side (`{text, voiceId}`), retourne `audio/mpeg` |
| `/api/user/stats` | GET | Stats XP/Yens/niveau de l'utilisateur connecté |
| `/api/contacts` | GET | Liste tous les personnages `isFriendable + isActive` avec `memoryCount` (groupBy CharacterMemory) et `locations` (POIs résolus depuis cities.ts) |
| `/api/quests/poi/[poiId]` | GET | Liste les quêtes d'un POI avec progression utilisateur (inclut `vocab`, `xpReward`, `yenReward`) |
| `/api/quests/[questId]/start` | POST | Crée un `UserQuestProgress` (auth requise) |
| `/api/quests/tasks/[taskId]/complete` | POST | Valide une tâche, débloque la suivante ou termine la quête |
| `/api/session/complete` | POST | Sauvegarde `SessionRecord` + upsert `UserVocabProgress` pour chaque mot pratiqué. Retourne `{ vocabWithMastery }` — chaque mot enrichi de `mastery`, `encounters`, `practiced` |

### Système de maîtrise du vocabulaire (`src/lib/mastery.ts`)

Types et constantes partagés entre client et serveur :

- `VocabEntry` — `{ jp, kana, romaji, fr, jlpt }`. `jlpt` : 5=N5 (plus facile) → 1=N1 (plus difficile)
- `MasteryLevel` — `"never" | "new" | "learning" | "almost" | "acquired" | "perfect"`
- `MASTERY_CONFIG` — label, couleur, icône, description par niveau
- `JLPT_COLORS` — couleur hex par niveau JLPT (5=vert, 4=bleu, 3=ambre, 2=rouge, 1=violet)
- `computeMastery(encounters, correctCount, errorCount)` — calcule le niveau SRS :
  - 0 rencontre → `never` / 1 rencontre sans erreur → `new`
  - ≥3 erreurs ou ratio <40% → `learning` / ratio <65% ou <4 rencontres → `almost`
  - ratio <85% ou <8 rencontres → `acquired` / sinon → `perfect`

### Catégories POI (`POIType`)

`"transport" | "konbini" | "izakaya" | "site" | "market" | "loisir" | "shop" | "restaurant" | "cafe"`

- `transport` (ex-`station`), `site` (ex-`temple`+`landmark`), `loisir` (nouveau) — ces renommages sont définitifs dans `cities.ts`, `GameMap3D.tsx`, `CityClient.tsx`, `IllustratedMap.tsx`
- Logos de POI : `src/lib/poi-logos.ts` — `Record<poiId, string>` importé par `GameMap3D` et `CityClient`. Logos dans `public/images/pois/logos/`

### Sidebar CityClient (`src/app/home/[city]/CityClient.tsx`)

La sidebar (88px collapsée, 208px étendue) contient des boutons qui togglent des panneaux overlay sur la carte 3D (`z-[1000]`).

**Panneau Lieux** (`sidebarPanel === "lieux"`, 380px)
- Colonne gauche (148px) : sélecteur de type POI (Tous + par type) avec compteur. Filtre `lieuxType`.
- Colonne droite : liste scrollable des POIs. Chaque ligne affiche nom + `done/total quêtes` (fetchés en parallèle à l'ouverture du panneau, cachés dans `poiQuestData`).
- Clic sur la ligne → `map.flyTo({ center, zoom:17, pitch:60, duration:1500 })`.
- Bouton `→` au hover → ferme le panneau + ouvre le drawer POI.

**Panneau Contacts** (`sidebarPanel === "contacts"`, 380px)
- Fetche `GET /api/contacts` une seule fois. Carte par personnage avec niveau d'amitié (0=Étranger, 1-2=Connaissance, 3-5=Ami, 6+=Proche).
- Bouton "📍 RDV" → toggle `rdvOpenId` → liste des lieux (bouton "Inviter →" désactivé).

**Panneau Révision** — désactivé (`enabled: false`), à implémenter.

**Drawer POI** (420px, `right-0`, slide-in)
- Hero image ou gradient par type. Titre, description, quêtes avec barre de progression.
- Bouton "▶ Faire la quête" / "🔄 Refaire" → ouvre `questPreview` (état local) au lieu de naviguer directement.

**Modale prévisualisation quête** (`questPreview` state)
- Overlay `fixed inset-0 overflow-y-auto` (pattern scrollable-outer) → carte blanche centrée.
- Affiche : nom du POI + titre + description + récompenses (XP/Yens) + nombre de tâches.
- Vocabulaire groupé par JLPT : kanji, kana, romaji, traduction FR, badge couleur JLPT.
- Boutons "Annuler" / "Commencer →" (navigue vers la quête).
- **Important** : ne pas utiliser `flex flex-col max-height flex-1` pour les modales — utilise toujours le pattern `fixed inset-0 overflow-y-auto` + `flex min-h-full items-center justify-center` + carte en `block` naturel pour éviter le bug de collapse CSS.

### Carte 3D Tokyo (`GameMap3D`)

`src/app/home/[city]/GameMap3D.tsx` — carte 3D interactive pour les villes avec `use3DMap: true` dans `cities.ts`.
- **Rendu** : Mapbox GL JS + react-map-gl v8 (`react-map-gl/mapbox`), style `mapbox://styles/mapbox/standard`
- **Architecture persistante** : la map est montée une seule fois dans `src/app/home/layout.tsx` (jamais démontée) → 1 seul Map Load par session. CSS `visibility` toggle pour afficher/masquer. État partagé via `src/app/home/MapContext.tsx` (`mapRef`, `activeType`, `poiClickRef`)
- **Import SSR** : `dynamic(() => import("./[city]/GameMap3D"), { ssr: false })` dans `home/layout.tsx`
- **Style** : `setConfigProperty("basemap", "lightPreset", "dusk")` + tous les labels masqués
- **Modèle Skytree + Tokyo Tower** : `public/models/tokyo_skytree.glb` + `public/models/tokyo_tower.glb` rendus via custom Three.js layer
- **Animations canvas** : eau ("water-anim" 128×128) et herbe ("grass-anim" 32×32) via `map.addImage()` avec `render()` + `triggerRepaint()`
- **Contraintes caméra** : `minZoom=14`, `maxPitch=85`, `minPitch=20`, `maxBounds` Tokyo + Haneda (`[139.58, 35.52]` → `[139.85, 35.75]`), bearing clampé ±25° autour de −20°
- **Pins** : classe CSS `gm3d-poi` avec `--pc` (couleur par type). Logo POI via `POI_LOGOS[poi.id]` → `<img>` sinon emoji. Hover expand via `max-width` transition

### Écrans de chargement

- **Chargement ville** (`CityClient`) : overlay blanc `z-[2000]`, fondu 400ms. Déclenché sur `map.once("idle", ...)` + fallback 3000ms. `mapLoading` / `mapFading` states.
- **Chargement conversation** (`POIClient`) : affiché quand `!character` — fond blanc, nom du POI, 3 points animés (`dot-pulse`).
- **Sortie conversation** (`POIClient`) : `leaving` state → overlay blanc `leaving-in 450ms`, puis `router.push`.
- **Keyframes CSS** (`globals.css`) : `loadbar-slide`, `dot-pulse`, `leaving-in`, `screen-fadein`.

### Session de quête (`POIClient`)

**Timer** : 15 min par quête (`questTimeLeft`), décrémenté toutes les secondes hors pause. À 0 → `sessionExpired`.

**Tracking session** (réinitialisé à chaque nouvelle quête) :
- `sessionStartRef` — timestamp `Date.now()` au lancement
- `sessionErrors` — incrémenté à chaque mauvaise réponse au quiz
- `sessionSuggestionsUsed` — incrémenté à chaque ouverture du panneau suggestions
- `sessionPracticedVocab (Set<string>)` — mots `jp` détectés dans les transcriptions Whisper

**Modales post-quête** (toutes en `fixed inset-0 overflow-y-auto` — pattern scrollable-outer) :
- `showQuestComplete` + `completedQuestInfo` → modale sombre (fond glassmorphism). Récompenses XP/Yens + aperçu vocab. Boutons : "Continuer la conversation" / "Terminer la session →"
- `showSessionSummary` + `summaryVocabProgress` → modale blanche (fond noir/75). Stats (erreurs, aides, mots pratiqués) + vocab groupé par JLPT avec icône de maîtrise. Bouton "Terminer" → `handleBack`.

**`handleEndSession(info, practiced, errors, suggestions)`** :
- POST `/api/session/complete` → reçoit `vocabWithMastery[]`
- En cas d'erreur réseau → calcul local avec `computeMastery`
- `setSummaryVocabProgress` + `setShowSessionSummary(true)`

**`shouldListenRef`** bloqué si : `isPaused || isSpeaking || isLoading || isTranscribing || showSuggestions || sessionExpired || showQuestComplete || showSessionSummary`

### Carte illustrée (`IllustratedMap`)

`src/app/home/[city]/IllustratedMap.tsx` — affiche une image de carte custom avec pan/zoom.
- L'image est chargée à taille naturelle, le scale initial est calculé via `onLoad` pour tout faire tenir dans le viewport
- Les marqueurs POI sont positionnés en `%` via `latLngToPercent(lat, lng, bounds)` et contre-scalés (`1/transform.scale`) pour rester à taille constante à l'écran
- `mapImage` + `mapBounds` dans `src/lib/cities.ts` activent la carte illustrée (sinon fallback Leaflet)
- `use3DMap: true` dans `cities.ts` active `GameMap3D` à la place

### Système XP / Yens / Niveau

- `User.xp` et `User.yens` en DB, incrémentés à la complétion de quête (`firstCompletedAt`)
- `getLevelInfo(xp)` dans `src/lib/level.ts` — calcule `{level, xpInLevel, xpNeeded, percent}`
- Replay d'une quête : `isReplay = status === "IN_PROGRESS" && !!firstCompletedAt` → pas de récompense
- Les récompenses s'affichent dans la modale `showQuestComplete` de `POIClient`

### Système de mémoire (`CharacterMemory`)

- Activé uniquement si `character.isFriendable = true` ET utilisateur connecté (`userId` via `getServerSession`)
- `POST /api/chat` charge les souvenirs existants et les injecte dans le system prompt : `[MÉMOIRE]\nkey: value`
- Claude reçoit l'outil `remember_fact(key, value)` via tool_choice `auto`. Il l'appelle discrètement quand l'utilisateur mentionne son nom, métier, goûts, événements notables
- **Agentic loop** : si `stop_reason === "tool_use"` → upsert `CharacterMemory` en DB → ajoute `tool_result "Mémorisé."` → continue (max 5 tours) → réponse texte finale

### VAD — Voice Activity Detection (POIClient)

Remplace le push-to-talk. Le micro est ouvert en permanence après le chargement du personnage.

- **Démarrage** : `startVAD()` appelé dans le `useEffect` de chargement. Crée un `AudioContext` + `AnalyserNode` (fftSize 512). Stream micro gardé ouvert toute la session
- **Détection** : boucle `requestAnimationFrame` calcule le RMS sur chaque frame. Si `rms > VAD_THRESHOLD (0.025)` et `shouldListenRef.current = true` → démarre un `MediaRecorder` frais
- **Fin d'énoncé** : silence > `SILENCE_DELAY (1200ms)` → stoppe le recorder → envoie à `/api/transcribe`
- **Détection vocab** : dans le callback `transcribe`, le texte Whisper est scanné par substring match contre `aq.vocab[].jp` et `aq.vocab[].kana` → `setSessionPracticedVocab`
- **Filtre bruit court** : enregistrement ignoré si durée < `MIN_RECORD_MS (400ms)`
- **shouldListenRef** : `false` si `isPaused || isSpeaking || isLoading || isTranscribing || showSuggestions || sessionExpired || showQuestComplete || showSessionSummary`
- **Mobile HTTP** : guard `if (navigator.mediaDevices)` obligatoire
- **Cleanup** : `audioCtxRef.current?.close()` + `streamRef.current?.getTracks().forEach(t => t.stop())` à l'unmount

### Bouton Pause (POIClient)

- Bouton centré dans la top bar (`z-50`), icône `Pause` / `Play`
- **Pause** : coupe ambient sound, TTS en cours (`audioRef`), `speechSynthesis`, force `isSpeaking = false`
- **Reprise** : relance ambient, appelle `audioCtxRef.current?.resume()`
- **Overlay** : z-40, cliquable (onClick = togglePause) pour reprendre en tapant n'importe où

### Système sonore (POIClient)

- **Entry sound** : `new Audio(c.scene.entrySound).play()` au chargement du personnage, volume 0.7
- **Ambient sound** : audio en loop (volume 0.25) stocké dans `ambientRef` — stoppé proprement à l'unmount
- Les sons sont dans `public/sounds/` (ex: `konbini_enter.mp3`)

### TTS ElevenLabs

- `Character.voiceId` stocke l'ID de voix ElevenLabs (ex: `TX3LPaxmHKxFdv7VOQHJ`)
- `speak()` dans `POIClient` : ElevenLabs si `voiceId` présent, fallback `speechSynthesis` browser
- **Double-speak (React StrictMode)** : `speak()` crée un `AbortController` à chaque appel (`speakAbortRef`) et annule le précédent
- Voix seed : Kenji=Liam (`TX3LPaxmHKxFdv7VOQHJ`), Hana=Matilda (`XrExE9yKIg1WjnnlVkGX`), Taro=Daniel (`onwK4e9ZLuTAKqWW03F9`)

### SessionProvider
`src/app/providers.tsx` wrappe l'app avec le `SessionProvider` NextAuth, inclus dans `src/app/layout.tsx`.

### Pièges CSS connus

- **Modale flex collapse** : ne jamais utiliser `flex flex-col` + `max-height` + enfant `flex-1 overflow-y-auto` sans `min-h-0` — le contenu collapse et devient invisible. Utiliser le pattern "scrollable outer" : `fixed inset-0 overflow-y-auto` → `flex min-h-full items-center justify-center` → carte en bloc naturel.
- **Fixed + overflow-hidden parent** : les éléments `fixed` ne sont pas clippés par `overflow-hidden` des parents (sauf si le parent a `transform`/`filter`/`perspective`). Le `pointer-events-none` du root CityClient est hérité CSS — toujours mettre `pointer-events-auto` sur les modales fixes.
