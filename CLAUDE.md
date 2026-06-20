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

## Déploiement VPS (Production)

**Infra** : OVH VPS Ubuntu 24.04 — IP `51.91.127.2`, domaine `sekaitalk.com`

**Process manager** : PM2 — SekaiTalk tourne sur le port **3001** (port 3000 occupé par `pokemon-tcg`)

```bash
# Démarrage (déjà configuré, ne pas relancer sauf après un reboot)
pm2 start npm --name "sekaitalk" -- start -- -p 3001
pm2 save   # persiste la config PM2

# Commandes courantes sur le VPS
pm2 status
pm2 logs sekaitalk --lines 50
pm2 restart sekaitalk
pm2 flush sekaitalk   # vider les logs
```

**Nginx** : reverse proxy HTTPS → port 3001. Config dans `/etc/nginx/sites-available/sekaitalk`.
```bash
sudo nginx -t && sudo systemctl reload nginx
```

**SSL** : Let's Encrypt via Certbot standalone. Certificat dans `/etc/letsencrypt/live/sekaitalk.com/`.

**Base de données** : PostgreSQL 17, user `sekaiuser`, DB `sekaitalk`.
```bash
# Sur le VPS, se connecter
psql -U sekaiuser -d sekaitalk
```

**Fichiers d'env sur le VPS** (`/home/ubuntu/SekaiTalk/`) :
- `.env` → `DATABASE_URL="postgresql://sekaiuser:Joaquim123@localhost:5432/sekaitalk"`
- `.env.local` → toutes les autres variables (ANTHROPIC_API_KEY, GROQ_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL=https://sekaitalk.com, GOOGLE_CLIENT_ID/SECRET, ELEVENLABS_API_KEY, NEXT_PUBLIC_MAPBOX_TOKEN). **Ne pas mettre DATABASE_URL dans `.env.local`** — il écrase `.env` et pointe vers la DB locale.

**CI/CD automatique** : GitHub Actions déclenche le déploiement à chaque push sur `dev/first`. Workflow : `.github/workflows/deploy.yml`.

Secrets GitHub requis (Settings → Secrets → Actions) :
- `VPS_HOST` → `51.91.127.2`
- `VPS_USER` → `ubuntu`
- `VPS_SSH_KEY` → clé privée SSH **encodée en base64** (voir ci-dessous)

Génération de la clé SSH dédiée (sur le VPS, une seule fois) :
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
base64 -w 0 ~/.ssh/github_actions   # → coller dans le secret VPS_SSH_KEY
```

**Workflow deploy manuel** (si CI/CD contourné) :
```bash
# 1. Commit + push sur dev/first
git add . && git commit -m "feat: ..." && git push origin dev/first

# 2. Sur le VPS (normalement automatique)
cd ~/SekaiTalk && git pull && npm run build && pm2 restart sekaitalk
```

**Après une migration Prisma** (sur le VPS) :
```bash
cd ~/SekaiTalk
npx prisma migrate deploy   # applique les migrations
npx prisma db push          # sync schema si db push utilisé en dev
npx tsx prisma/seed.ts      # re-seed si nécessaire
npm run build && pm2 restart sekaitalk
```

**Google OAuth** : ajouter `https://sekaitalk.com/api/auth/callback/google` dans les Authorized redirect URIs sur [console.cloud.google.com](https://console.cloud.google.com).

**Gate "bientôt disponible"** (temporaire — à supprimer avant lancement public) :

Le site est actuellement verrouillé par un gate mot de passe. Fichiers concernés :
- `src/middleware.ts` — remplace l'ancien `withAuth`, ajoute le gate check avant la protection admin
- `src/app/coming-soon/` — page "Bientôt disponible" avec champ mot de passe caché (bouton `···` en bas à droite)
- `src/app/api/auth/gate/route.ts` — vérifie le mot de passe (SHA-256 côté serveur), pose un cookie httpOnly 30 jours

Pour retirer le gate : supprimer `src/app/coming-soon/`, `src/app/api/auth/gate/`, et remplacer `src/middleware.ts` par :
```ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    if (req.nextUrl.pathname.startsWith("/admin") && !token?.isAdmin)
      return NextResponse.redirect(new URL("/home", req.url));
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);
export const config = { matcher: ["/admin/:path*"] };
```

**Pièges connus** :
- Le `catch {}` vide dans `src/app/api/register/route.ts` masque les erreurs — ajouter `console.error(e)` pour déboguer
- `npm run build` doit être relancé après chaque modification de code côté serveur
- `prisma db push` régénère le client Prisma automatiquement, mais le build Next.js doit être relancé
- **Ne jamais mettre `DATABASE_URL` dans `.env.local`** — il écrase `.env` et pointe vers la DB locale (localhost) au lieu de la DB VPS
- La clé SSH pour GitHub Actions doit être encodée en **base64** (`base64 -w 0 ~/.ssh/github_actions`) avant d'être collée dans le secret GitHub — sinon les sauts de ligne sont perdus et l'auth SSH échoue silencieusement
- Le CI/CD utilise `npm ci` (pas `npm ci --omit=dev`) — `tailwindcss` est une devDependency nécessaire au build Next.js

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **NextAuth v4** — authentication (JWT strategy), `session.user.id` disponible via callback JWT
- **Prisma v6** + **PostgreSQL 17** (local, port 5432)
- **@anthropic-ai/sdk** — Claude Haiku (`claude-haiku-4-5-20251001`) pour les conversations IA
- **Groq API** — Whisper `whisper-large-v3-turbo` pour la transcription vocale (micro)
- **ElevenLabs API** — TTS par personnage (`eleven_multilingual_v2`), proxié via `/api/tts`
- **Mapbox GL JS** + **react-map-gl v8** — carte 3D Tokyo (`mapbox://styles/mapbox/standard`) ET carte Japon overview (style JSON inline sans URL, token `NEXT_PUBLIC_MAPBOX_TOKEN`)
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
- Middleware admin : `src/middleware.ts` (withAuth) — bloque `/admin/*` si `token.isAdmin !== true`, redirige vers `/home`

### Database — modèles Prisma

- `User` — profil central (email, pseudo unique, firstName, lastName, birthDate, image, password haché bcrypt). Champ `isAdmin: Boolean @default(false)` — accès interface admin. Note: `yens` supprimé — seul `xp` subsiste comme récompense.
- `Account` — méthode de connexion liée à un User (géré par NextAuth)
- `Session` — toujours vide (JWT strategy)
- `CityRecord` — ville gérée via admin (id=slug ex: `"tokyo"`, name, nameJp, centerLat, centerLng, zoom, pitch, bearing, levelRequired, use3DMap, mapImage, mapBoundsJson, isActive). Source de vérité pour le jeu via `getCityFromDB()` — remplace `cities.ts` au runtime
- `POIRecord` — POI géré via admin (id ex: `"tokyo-station-shinkansen"`, cityId FK vers CityRecord, name, type, lat, lng, description, logoPath, isActive). Le jeu lit depuis cette table via `getCityFromDB()`, plus depuis `cities.ts`
- `Character` — personnage IA sans `poiId` (peut apparaître dans plusieurs lieux). Contient `id` stable (ex: `"char-kenji"`), `systemPrompt`, `greetingMessage`, `greetingTranslation`, `greetingWords` (Json — `Word[]` pré-calculé, évite un appel IA au chargement), `image`, `voiceId` (ElevenLabs), `isFriendable` (active la mémoire + outil `remember_fact`)
- `CharacterAppearance` — table de jonction many-to-many `Character ↔ POI`. Champs : `characterId`, `poiId`, `locationContext?` (injection supplémentaire dans le system prompt pour contextualiser le lieu). Contrainte `@@unique([characterId, poiId])`
- `Scene` — décor lié à un POI (`poiId @unique`). Champs : `backgroundImage?`, `entrySound?`, `ambientSound?`. Séparé du personnage car le même lieu peut avoir un autre personnage à l'avenir
- `CharacterMemory` — mémoire persistante par `(characterId, userId, key)`. Valeur mise à jour via upsert. Activée uniquement si `character.isFriendable = true` + utilisateur connecté. Contrainte `@@unique([characterId, userId, key])`
- `Quest` — quête liée à un POI (`poiId`). Plusieurs quêtes possibles par POI, ordonnées par `order`. Champ `vocab Json @default("[]")` — tableau de `VocabEntry[]` prédéfini pour la quête (voir `src/lib/mastery.ts`). Note: `yenReward` supprimé — seul `xpReward` subsiste.
- `QuestTask` — tâche ordonnée dans une quête. Contient `instruction` (affiché à l'utilisateur) et `aiContext` (injecté dans le system prompt pour guider l'IA)
- `TaskChoice` — choix QCM d'une tâche (`isCorrect` pour la bonne réponse)
- `UserQuestProgress` — progression d'un utilisateur sur une quête (`IN_PROGRESS` | `COMPLETED`)
- `UserTaskProgress` — progression par tâche (`PENDING` | `COMPLETED`)
- `UserVocabProgress` — progression SRS par mot par utilisateur. Clé `@@unique([userId, wordJp])` — **un seul enregistrement par mot par utilisateur**, quelle que soit la source. Champs : `questId?` (source quête, nullable), `lessonId?` (source leçon, nullable), `wordJp`, `kana`, `romaji`, `fr`, `jlpt` (champs auto-portants, pas besoin de jointure), `encounters`, `correctCount`, `errorCount`, `lastSeenAt`. Alimenté par `/api/session/complete` (quêtes) et `/api/lessons/[lessonId]/complete` (steps INTRO). Schema migré via `prisma db push --accept-data-loss` (changement de contrainte unique)
- `SessionRecord` — résumé d'une session complétée. Champs : `durationSeconds`, `errorCount`, `suggestionsUsed`, `practicedWords` (Json — string[] des `jp` prononcés)
- `Lesson` — leçon liée à un POI (`poiId @unique`). Champs : `title`, `description?`. Relation `steps: LessonStep[]`
- `LessonStep` — étape d'une leçon, ordonnée par `order`. Champs : `type: StepType` (enum), `data: Json` (shape selon le type). Cascade delete depuis `Lesson`
- `UserLessonProgress` — progression utilisateur sur une leçon. Clé `@@unique([userId, lessonId])`. Champs : `score`, `validated` (bool), `completedAt?`, `firstValidatedAt?`. Ne repasse pas `validated` à `false` si une nouvelle tentative échoue
- `SnsConversation` — conversation SNS/texto simulée pour un POI. Champs : `id` stable (ex: `"sns-konbini-shinjuku"`), `poiId`, `title`, `context` (affiché à l'intro), `xpReward`, `contact` (Json — `{ name, handle, avatar, image?, relation }`), `steps` (Json — `SnsStep[]` avec choix embarqués), `isActive`. Types TypeScript dans `src/lib/sns-conversations.ts` (fichier types uniquement, plus de données statiques). Géré via admin `/admin/sns`, lu par le jeu via `GET /api/sns/poi/[poiId]`.
- `Event` — évènement lié à un POI dédié. Enum `EventType` : `SEASONAL` (plage mensuelle récurrente), `DAILY_TEMPLATE` (template pour génération quotidienne), `DAILY_INSTANCE` (instance générée, dure 24h). Champs saisonniers : `startMonth`, `startDay`, `endMonth`, `endDay` (null pour daily). Champs daily : `startAt`, `endAt` (null pour seasonal). Champs communs : `poiId` (POI dédié décalé de ~80-100m par rapport aux POIs existants pour éviter le chevauchement), `emoji`, `color`, `xpReward`, `questId?`, `lessonId?`, `isActive`, `templateId?` (DAILY_INSTANCE → DAILY_TEMPLATE.id). Types partagés dans `src/lib/events.ts` (`ActiveEvent`, `EventsResponse`, `formatExpiry`).

### Seed

`prisma/seed.ts` — crée `Scene`, `Character`, `CharacterAppearance`, `Quest`, `Lesson`, `CityRecord` et `POIRecord` avec des IDs stables.
- Personnages : upsert par `id` stable (`"char-kenji"`, `"char-hana"`, `"char-taro"`)
- `greetingWords` et `greetingTranslation` hardcodés dans le seed — pour un nouveau personnage, appeler `/api/analyze` une fois pour générer le breakdown puis le coller dans le seed
- **Scènes** : deux blocs dans le seed —
  1. Trois konbinis historiques (konbini-shinjuku, konbini-shibuya, konbini-kyoto) upsertés individuellement avec `update` explicite (plus de `update: {}`).
  2. `TOKYO_SCENES: { poiId, bg?, entry?, ambient? }[]` — 29 POIs Tokyo + 2 events (sakura-ueno, halloween-shibuya). Chaque entrée peut porter `bg` (backgroundImage), `entry` (entrySound) et `ambient` (ambientSound). Le loop upsert met à jour les trois champs à chaque seed.
- `CharSeed` type inclut un champ optionnel `image?: string`. Le loop upsert inclut `image` dans l'objet `update` (permet de rafraîchir les images via seed). Fallback `"/characters/default.png"` si absent.
- Apparitions : upsert par `@@unique([characterId, poiId])`
- Quêtes : `findUnique` + `create` — idempotentes, non recréées si l'ID existe déjà
- Vocab : `quest.update({ data: { vocab: VocabEntry[] } })` après le create — toujours upsertée pour rester à jour
- Quête de test : `quest-konbini-shinjuku-info-1` avec 10 mots (N5 : すみません, どこ, おにぎり, ありますか, いくら, ありがとうございます / N4 : 種類, 新鮮, 冷蔵庫, 今朝)
- **Leçons** : `findUnique` + `create` pour la `Lesson`, puis `deleteMany` + `createMany` pour les `LessonStep` (idempotent, les étapes sont recréées à chaque seed pour rester à jour). **28 leçons** au total — tous les POIs Tokyo (27) + konbini-shinjuku. Chaque leçon a 7 steps : 2 INTRO → PRONUNCIATION → TRUE_FALSE ou CHOOSE_ANSWER → CULTURE_NOTE → MATCH_PAIRS → CHOOSE_ANSWER.
- **CityRecord + POIRecord** : upsert de toutes les villes et POIs depuis `cities.ts` à la fin du seed. 10 villes (tokyo, osaka, kyoto + 7 coming-soon) et 44 POIs Tokyo. Idempotent via `upsert({ where: { id }, create, update })`. Ces enregistrements servent de source de vérité pour le jeu via `getCityFromDB()`.
- **SnsConversation** : upsert des 7 conversations SNS à la fin du seed (`upsert({ where: { id }, update, create })`). IDs stables : `sns-konbini-shinjuku`, `sns-familymart-shibuya`, `sns-donquijote-shibuya`, `sns-starbucks-shibuya`, `sns-jr-shinjuku`, `sns-at-home-cafe-akihabara`, `sns-tokyo-skytree`.
- **Events** : 5 events seedés (2 saisonniers + 3 daily templates), chacun avec un POI dédié (upsert coordonnées décalées ~80-100m), 1 quête 2 tâches et 1 leçon 4 steps. IDs : `event-sakura-ueno`, `event-halloween-shibuya`, `event-daily-lost-tourist`, `event-daily-lost-wallet`, `event-daily-photo`. Helpers internes : `upsertEventQuest(id, poiId, title, xpReward, tasks, vocab)` et `upsertEventLesson(poiId, title, steps)` → `findFirst` + `create` + `deleteMany/createMany` pour les steps.

### Navigation et routes

```
/home                          → liste des villes (carte)
/home/[city]                   → carte 3D de la ville (CityClient)
/home/[city]/school            → page École (SchoolClient) — route statique, priorité sur [poi]
/home/[city]/[poi]             → conversation IA avec le personnage (POIClient)
/home/[city]/[poi]?quest=<id>  → même page, démarre directement la quête
/home/[city]/[poi]/lesson      → leçon interactive du POI (LessonClient)
```

### Validation des tâches de quête — deux types

**QCM** (`task.choices.length > 0`) : comportement historique — bouton "J'ai compris ✓" → quiz à choix multiples.

**IA auto-validée** (`task.choices.length === 0`) : la tâche se valide automatiquement quand l'IA détecte que le joueur a dit la bonne chose en japonais.
- Règle de contenu : **affirmations** → IA (Dis, Explique, Présente, Confirme, Réponds, Donne) ; **questions/demandes** → QCM (Demande, Commande, Achète, Paye, Réserve)
- Dans POIClient : si `isAiTask`, ajoute `[VALIDATION AUTOMATIQUE]` au system prompt + passe `aiTask: true` à `/api/chat`
- `/api/chat` expose `"taskValidated": false` dans le schéma JSON quand `aiTask: true` — l'IA le met à `true` si critère satisfait
- Côté client : `d.taskValidated === true` → `taskValidatedBanner` (bandeau vert 2,2s) → `handleCompleteTask()` auto
- Le `[CRITÈRE DE VALIDATION]` est embarqué dans le champ `aiContext` de la tâche en DB
- Scripts de maintenance : `scripts/update-ai-tasks.js`, `scripts/apply-ai-tasks-all.js`, `scripts/restore-qcm-tasks.js`
- 15 tâches IA sur 84 total (~18%) — tous les POIs Tokyo concernés

### Flux quête complet

1. L'utilisateur clique un POI sur la carte → **drawer POI** dans `CityClient` avec les quêtes disponibles
2. Il clique "Faire la quête" ou "Refaire" → **modale de prévisualisation** (`questPreview`) : titre, récompenses, vocabulaire groupé par JLPT
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
| `/api/chat` | POST | Envoie un message à Claude Haiku. Body : `{messages, systemPrompt, characterId}`. Retourne `{reply, translation, words, suggestions}`. Agentic loop (max 5 tours) avec outil `remember_fact` si personnage `isFriendable`. Parsing JSON en 3 niveaux (strip fences → regex extract → fallback texte brut) |
| `/api/analyze` | POST | Analyse un texte japonais, retourne `{translation, words}`. Usage ponctuel (admin/seed) — ne pas appeler au runtime |
| `/api/transcribe` | POST | Transcrit un audio via Groq Whisper (`language: "ja"`, prompt court `"日本語"`, filtres qualité segments + filtre hallucination) |
| `/api/tts` | POST | TTS ElevenLabs server-side (`{text, voiceId}`), retourne `audio/mpeg` |
| `/api/user/stats` | GET | Stats XP/niveau de l'utilisateur connecté |
| `/api/contacts` | GET | Liste tous les personnages `isFriendable + isActive` avec `memoryCount` (groupBy CharacterMemory) et `locations` (POIs résolus depuis cities.ts) |
| `/api/quests/poi/[poiId]` | GET | Liste les quêtes d'un POI avec progression utilisateur (inclut `vocab`, `xpReward`) |
| `/api/quests/[questId]/start` | POST | Crée un `UserQuestProgress` (auth requise) |
| `/api/quests/tasks/[taskId]/complete` | POST | Valide une tâche, débloque la suivante ou termine la quête |
| `/api/session/complete` | POST | Sauvegarde `SessionRecord` + upsert `UserVocabProgress` pour **tous** les mots du vocab de la quête (pas uniquement les mots prononcés). Mots pratiqués : `encounters+1, correctCount+1`. Mots non pratiqués existants : inchangés. Nouveaux mots non pratiqués : `encounters:1, correctCount:0`. Retourne `{ vocabWithMastery }` — chaque mot enrichi de `mastery`, `encounters`, `practiced` |
| `/api/lessons/poi/[poiId]` | GET | Récupère la leçon d'un POI avec ses steps ordonnés et la progression de l'utilisateur connecté (`userProgress` ou `null`) |
| `/api/lessons/[lessonId]/complete` | POST | Reçoit `{ score }`, calcule `validated = score >= 80`, upsert `UserLessonProgress` (ne repasse pas `validated` à `false`), **puis upsert `UserVocabProgress`** pour chaque step INTRO de la leçon (`update: {}` préserve la progression existante, `create` avec `encounters:1, correctCount:0`), retourne `{ validated, score }` |
| `/api/daily-goals` | GET | Public. Retourne `{ date, goals: GoalResult[] }`. Si non authentifié : goals avec `done: false`. Si auth : vérifie depuis minuit UTC — `UserQuestProgress.completedAt`, `UserLessonProgress.completedAt+validated`, `UserVocabProgress.lastSeenAt`, `UserSnsProgress.completedAt`, `SessionRecord.createdAt`. 3 objectifs déterministes depuis `src/lib/daily-goals.ts` (même goals pour tous les utilisateurs le même jour). |
| `/api/revision/vocab` | GET | Retourne `{ words: RevisionWord[], stats: { toWork, toReview, acquired } }` — tous les mots de l'utilisateur (`encounters > 0`), triés par `lastSeenAt desc`, enrichis du niveau `mastery`. `toWork` = never/new/learning, `toReview` = almost/acquired, `acquired` = perfect |
| `/api/revision/result` | POST | Reçoit `{ results: [{ wordJp, correct }] }`, incrémente `encounters` + `correctCount`/`errorCount` + `lastSeenAt` via la clé `userId_wordJp` |
| `/api/content/cities` | GET | Public (pas d'auth). Retourne `Record<string, CityData>` depuis la DB via `getAllCitiesFromDB()`. `revalidate = 0` (toujours frais). Utilisé par `layout.tsx` et `JapanMap.tsx` pour afficher les villes admin |
| `/api/sns/poi/[poiId]` | GET | Public. Retourne la `SnsConversation` active pour un POI (`isActive: true`), ou `null`. Appelé par `CityClient` à chaque sélection de POI. |
| `/api/scenes/poi/[poiId]` | GET | Public. Retourne `{ backgroundImage: string | null }` — background de scène du POI. Appelé par `CityClient` à chaque sélection de POI pour alimenter le hero image du drawer. |
| `/api/admin/export` | GET | Admin uniquement. Exporte tout le contenu DB (cityRecords, poiRecords, scenes, characters, appearances, quests+tasks+choices, lessons+steps, **snsConversations**) en JSON avec `Content-Disposition: attachment` |
| `/api/admin/import` | POST | Admin uniquement. Importe un JSON exporté, upsert idempotent de toutes les entités (incluant `snsConversations`). Retourne `{ imported: { cities, pois, …, sns } }`. Stratégie de sync dev→prod |
| `/api/admin/upload` | POST | Admin uniquement. Multipart form-data. Sauvegarde le fichier dans `public/uploads/{type}/{timestamp-filename}`. Retourne `{ url }` |
| `/api/admin/cities` | GET/POST | CRUD villes (CityRecord) |
| `/api/admin/cities/[id]` | PUT/DELETE | Mise à jour / suppression d'une ville |
| `/api/admin/pois` | GET/POST | CRUD POIs (POIRecord) |
| `/api/admin/pois/[id]` | PUT/DELETE | Mise à jour / suppression d'un POI |
| `/api/admin/lessons` | GET/POST | CRUD leçons |
| `/api/admin/lessons/[id]` | GET/PUT/DELETE | Détail, mise à jour, suppression leçon |
| `/api/admin/lessons/[id]/steps` | POST | Crée un LessonStep |
| `/api/admin/lessons/[id]/steps/[stepId]` | PUT/DELETE | Mise à jour / suppression step |
| `/api/admin/sns` | GET/POST | CRUD conversations SNS (SnsConversation) |
| `/api/admin/sns/[id]` | GET/PUT/DELETE | Détail, mise à jour, suppression conversation SNS |
| `/api/events` | GET | Public. Retourne `{ seasonal: ActiveEvent[], daily: ActiveEvent[] }`. Génère lazily 1-2 instances daily depuis les DAILY_TEMPLATE si `endAt > now` count < 2 (upsert idempotent clé `daily-{templateId}-{YYYY-MM-DD}`). Filtre les SEASONAL par date courante (comparaison mois×100+jour). Enrichit chaque event avec `poiName` (depuis `getAllCitiesFromDB()`), `expiresAt` ISO. |
| `/api/admin/events` | GET/POST | Admin. Liste tous les events (orderBy type+createdAt) / crée un event. |
| `/api/admin/events/[id]` | GET/PUT/DELETE | Admin. Détail, mise à jour partielle, suppression event. |
| `/api/admin/users` | GET | Liste des utilisateurs (admin) |
| `/api/admin/users/[id]` | GET/PATCH | Détail utilisateur, modification `isAdmin` |

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

### `src/lib/cities.ts` — structure (fallback statique)

`CityData` : `{ name, center: [lat, lng], zoom, pois: POI[], levelRequired, use3DMap?, mapImage?, mapBounds? }`

**Rôle** : fallback statique uniquement. La source de vérité au runtime est la DB (`CityRecord` + `POIRecord`) lue via `src/lib/cities-db.ts`. `cities.ts` est utilisé comme valeur initiale avant que la DB réponde, et comme fallback si un slug est absent de la DB.

**Villes actives** (avec POIs) : `tokyo` (nv.1), `osaka` (nv.2), `kyoto` (nv.3)

**Villes coming soon** (`levelRequired: 99`, `pois: []`) : `nara`, `hiroshima`, `sapporo`, `nikko`, `nagoya`, `fukuoka`, `beppu` — affichées sur la carte Japon en état verrouillé, jamais navigables car `levelRequired > userStats.level` pour tout utilisateur réel.

### `src/lib/cities-db.ts` — lecture DB des villes

Helper server-side (uniquement `import` côté serveur / route handlers / `page.tsx` async).

- `getCityFromDB(slug)` → `Promise<CityData | null>` : lit `CityRecord` + ses `POIRecord[]`, mappe vers le format `CityData`. Fallback vers `staticCities[slug]` si absent de la DB.
- `getAllCitiesFromDB()` → `Promise<Record<string, CityData>>` : toutes les villes DB + fallback des villes `cities.ts` absentes de la DB.
- La fonction `dbToCity(cr, pois)` interne convertit les champs DB (centerLat/Lng, mapBoundsJson…) vers `CityData`.
- Utilisé par : `src/app/home/[city]/page.tsx` (server component), `src/app/api/content/cities/route.ts`.

### Catégories POI (`POIType`)

`"transport" | "konbini" | "izakaya" | "site" | "market" | "loisir" | "shop" | "restaurant" | "cafe" | "hotel" | "pharmacie" | "medecin" | "poste"`

- `transport`, `site`, `loisir`, `shop`, `restaurant`, `cafe`, `konbini`, `izakaya`, `market` — types historiques
- `hotel` (#0891b2 cyan), `pharmacie` (#059669 vert), `medecin` (#ef4444 rouge), `poste` (#d97706 ambre) — ajoutés pour Tokyo v2
- Chaque nouveau type a ses entrées dans `POI_COLORS` + `POI_ICONS` (GameMap3D) et `POI_META` (CityClient)
- Logos de POI : `src/lib/poi-logos.ts` — `Record<poiId, string>` importé par `GameMap3D` et `CityClient`. Logos dans `public/images/pois/logos/`. **23 logos** présents pour tous les POIs Tokyo (formats : .svg, .png, .webp, .jpg). Nommage : `{poi-id}.{ext}` (ex: `jr-shinjuku.svg`, `familymart.webp`).

### Sidebar CityClient (`src/app/home/[city]/CityClient.tsx`)

La sidebar est **rétractable** : état `sidebarExpanded` (défaut `true`), largeur 448px étendue / 60px collapsée. Transition CSS `transition-all duration-200`. `position: fixed, left: 20px, top: 50%, translateY(-50%)`, hauteur `calc(100vh - 40px)`, `rounded-2xl bg-white`.

**État étendu (448px)** :
- Header : logo `h-[72px] w-[72px]` + texte `"SekaiTalk"` en `#1e3fad` (`text-2xl font-black tracking-tight`), `gap-0` entre logo et texte + bouton `ChevronLeft` (collapse + `setSidebarPanel(null)`) — même visuel que HomeClient
- **Mon Objectif** : `<MonObjectif />` en haut juste après le header (avant les objectifs du jour)
- Objectifs du jour : 3 objectifs dynamiques via hook `useDailyGoals()` (`src/hooks/useDailyGoals.ts`). Icône emoji + label + compteur `X/Y` pour les objectifs multi-étapes. Fond `bg-indigo-50` quand terminé. Compteur `doneCount / 3` en haut.
- Navigation : `SIDEBAR_BUTTONS` = [Guidage, Lieux, Contacts, Évènements, **Étudier**] — **tous enabled: true**. Icônes SVG colorées inline (pas de lucide-react). Type `{ panel, label, enabled, color, svg: React.ReactNode }`. Section `flex-1`. Le bouton **Étudier** (anciennement "Révision", icône mortarboard) → `router.push(`/home/${citySlug}/school`)` au lieu d'ouvrir `RevisionOverlay`.
- Paramètres : footer fonctionnel → `router.push("/home/settings")`, hover avec `ChevronRight`

**État collapsé (60px)** :
- 4 icônes nav colorées (fond coloré si actif, grayscale sinon)
- `ChevronRight` en bas (expand)

**Panneaux flottants** (`z-[1000]`, `left: 484`, `top: 20`, `height: calc(100vh - 40px)`, `rounded-2xl bg-white`, même shadow que la sidebar). Toujours affichés avec la sidebar étendue (collapse ferme le panneau).

**Panneau Lieux** (`sidebarPanel === "lieux"`, 380px)
- Colonne gauche (148px) : sélecteur de type POI (Tous + par type) avec compteur. Filtre `lieuxType`.
- Colonne droite : liste scrollable des POIs. Chaque ligne affiche nom + `done/total quêtes` (fetchés en parallèle à l'ouverture du panneau, cachés dans `poiQuestData`).
- Clic sur la ligne → `map.flyTo({ center, zoom:19, pitch:75, duration:1800 })` — zoom très proche au sol.
- Bouton `→` au hover → ferme le panneau + ouvre le drawer POI.

**Panneau Contacts** (`sidebarPanel === "contacts"`, 380px)
- Fetche `GET /api/contacts` une seule fois. Carte par personnage avec niveau d'amitié (0=Étranger, 1-2=Connaissance, 3-5=Ami, 6+=Proche).
- Bouton "📍 RDV" → toggle `rdvOpenId` → liste des lieux (bouton "Inviter →" désactivé).

**Panneau Évènements** (`sidebarPanel === "evenements"`, 380px) — peuplé depuis `GET /api/events` (fetch au mount de CityClient, résultat stocké dans `events` local + context `activeEvents`).
- Deux sections : "Saisonniers" et "Aujourd'hui" (daily instances). Composant `EventCard` (défini dans CityClient avant le `export default`).
- `EventCard` : badge emoji coloré, description tronquée 2 lignes, countdown `⏱ encore Xh Ymin` (daily) ou `📅 jusqu'au DD mois` (seasonal) via `formatExpiry()`, badge XP, POI name. `tick` prop (`eventsTick` state incrémenté chaque minute) force le re-render du countdown.
- Clic carte → `handleEventClick(ev)` : ferme le panneau (`setSidebarPanel(null)`) + `handlePoiClick(ev.poiId)` → fly map + ouvre drawer du POI event.

**Panneau Thèmes** (`sidebarPanel === "guidage"`, 380px) — premier item de navigation (libellé "Thèmes"). Affiche le système de guidage contextuel (`src/lib/guidage.ts`).
- Sélecteur de niveau en haut du panneau : **Tous | N5 | N4 | N3**. State `themesLevel` dans CityClient.
- `POI_JLPT_LEVEL: Record<string, 5 | 4 | 3>` dans `src/lib/guidage.ts` — un niveau par POI.
- Filtrage : `filteredPoiIds = theme.poiIds.filter(id => themesLevel === null || POI_JLPT_LEVEL[id] === themesLevel)` — thème caché si aucun POI au niveau sélectionné.
- Badge N5/N4/N3 coloré sur chaque ligne POI (vert=N5, bleu=N4, rouge=N3).
- Règle d'affectation : N5=konbinis/McDonald's/Starbucks, N4=transport/shopping/loisirs, N3=hôpital/poste/musées/hôtels luxe.

**Bouton Étudier** — remplace l'ancien bouton "Révision" dans CityClient et HomeClient. Icône mortarboard SVG. Clic → `router.push(`/home/${citySlug}/school`)`. Depuis HomeClient, navigue vers `/home/tokyo/school?from=home` (param `from=home` pour que le bouton retour de l'école renvoie vers `/home` et affiche "← Accueil" au lieu de "← Tokyo").

**HUD top-right** — identique à `HomeClient` (voir section ci-dessous). Positionnement : `right: selectedPoi ? 440 : 20`.

**Titre ville** : `position: absolute, top: 20`, `left: sidebarPanel ? 864 : sidebarExpanded ? 488 : 96` — se décale dynamiquement selon l'état sidebar/panneau.

**Flèches navigation POI** (← / →, desktop uniquement) : `position: fixed, bottom: 80px`. Position horizontale calculée dynamiquement pour être centrée dans la zone de carte visible :
```ts
const leftPx  = sidebarPanel ? 864 : sidebarExpanded ? 468 : 80;
const rightPx = selectedPoi ? 420 : 0;
{ left: `calc(50% + ${(leftPx - rightPx) / 2}px)`, transform: "translateX(-50%)" }
```
Clic flèche → `pinPoiRef.current?.(poi.id)` (pin le marker destination) **puis** `handlePoiClick(poi.id)`.

**Drawer POI** (420px, `right-0`, slide-in, fond `bg-gray-950/96`)
- **Hero image** : state `poiBackground: string | null` — fetché via `GET /api/scenes/poi/${poiId}` à chaque sélection de POI (réinitialisé à `null` à chaque changement). Affiche `poiBackground` si non-null, sinon fallback `"/background_placeholder.png"`. Deux drawers utilisent ce state : desktop (h-52) et mobile sheet (h-24). Titre, description, leçon (si disponible) puis quêtes avec barre de progression.
- **Section Leçon** : fetche `GET /api/lessons/poi/${poiId}` en parallèle avec les quêtes. État `lessonData` : `null` (chargement) | `"none"` (aucune leçon) | `{ id, title, validated, score }`. Affiche un spinner puis une carte avec icône graduation (SVG gradient bleu→indigo via `<linearGradient>` inline, fond `bg-gray-100`), titre en `text-base`, statut (score si > 0, rien si validé — pas de texte "Validée ✓" redondant), badge `<CheckCircle>` uniquement (sans texte "OK"). Boutons "Commencer la leçon" / "Réessayer" / "Refaire la leçon" (sans emoji). Navigue vers `/home/${citySlug}/${poi.id}/lesson`.
- Bouton "Faire la quête" / "Refaire" → ouvre `questPreview` (état local). Le bouton "Faire la quête" a un fond gradient `linear-gradient(135deg, #3b82f6, #4f46e5)` appliqué via `style` inline (pas de classe Tailwind — gradient conditionnel). Texte sans emoji. Refaire/Réessayer : `border border-gray-200 bg-white text-gray-400`.
- **Section SNS** : si `snsConversation` (state, fetchée via `GET /api/sns/poi/[poiId]` à la sélection du POI) est non-null, affiche une carte verte "Discussion SNS" avec l'avatar/nom du contact, le contexte et les XP. Badge **"Beta"** amber affiché à côté du label "Discussion SNS" (`text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full`). Clic → `setShowSns(true)` → `SnsOverlay`. State `snsConversation` réinitialisée à `null` à chaque changement de POI.
- Pas de bouton "Conversation libre" — toute navigation vers un POI requiert un `questId`.

**Modale prévisualisation quête** (`questPreview` state)
- Overlay `fixed inset-0 overflow-y-auto` (pattern scrollable-outer) → carte `max-w-2xl` centrée.
- Affiche : nom du POI + titre + description + récompenses (XP) + nombre de tâches.
- Vocabulaire groupé par JLPT en **grille 2 colonnes** : kanji + kana inline, romaji en petit, traduction. Section scrollable `max-h-[52vh] overflow-y-auto` — header et CTA toujours visibles.
- Uniquement le vocab de la quête affichée (pas de mélange inter-quêtes).
- Boutons "Annuler" / "Commencer →" (navigue vers la quête).
- **Important** : ne pas utiliser `flex flex-col max-height flex-1` pour les modales — utilise toujours le pattern `fixed inset-0 overflow-y-auto` + `flex min-h-full items-center justify-center` + carte en `block` naturel pour éviter le bug de collapse CSS.

### Carte Japon (`/home`) — `JapanMap.tsx`

`src/app/home/JapanMap.tsx` — carte overview **interactive** du Japon, montée une seule fois dans `layout.tsx` (jamais démontée, `visibility` toggle).

**Style Mapbox** : style JSON inline (pas d'URL Mapbox) avec 4 layers + 3 sources :
- Sources : `country-boundaries` (v1), `terrain-dem`, `japan-regions` (GeoJSON hardcodé)
- `japan-fill` — polygone Japon, couleur `#b8a07a`
- `japan-hillshade` — relief, exaggeration 0.45, lumière 335°
- `non-japan-mask` — recouvre tous les autres pays en `#1a3568`
- `japan-region-labels` — labels des 9 grandes régions (`JAPAN_REGIONS_GEOJSON`) : Hokkaidō, Tōhoku, Kantō, Chūbu, Kansai, Chūgoku, Shikoku, Kyūshū, Okinawa. GeoJSON hardcodé (source `japan-regions`). `minzoom: 5.8`, fade-in entre 5.8 et 6.5. Texte blanc semi-transparent (`rgba(255,255,255,0.55)`), `DIN Offc Pro Bold`, letter-spacing 0.18.

**Interactivité** : `dragPan`, `scrollZoom`, `touchZoomRotate` activés. `minZoom=5.8` (zoom initial = minimum), `maxZoom=9`, `maxBounds=[[122,23],[155,47]]`. Plus de navigation hors du Japon.

**Centrage avec sidebar** : `onLoad` → `map.setPadding({ left: 468 })` + `map.jumpTo({ center: [136.5, 36.8], zoom: 5.8 })`. Le `setPadding` décale le centre optique de Mapbox pour compenser la sidebar. `initialViewState` seul ne suffit pas car la map est persistante (montée une fois). `CENTER_LNG=136.5`, `CENTER_LAT=36.8`, `INIT_ZOOM=5.8`, `SIDEBAR_PX=468`.

**`japanFlyToRef`** : enregistré dans `onLoad` → `japanFlyToRef.current = (lng, lat, zoom=7) => map.flyTo(...)`. Appelé par `HomeClient` (panneau Lieux) pour zoomer sur une ville.

**Canvas transparent** : override CSS dans `globals.css` :
```css
.mapboxgl-map, .mapboxgl-canvas-container, .mapboxgl-canvas { background: transparent !important; }
.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
```

**Gradient** : `background: radial-gradient(ellipse farthest-corner at 54% 50%, #3a5fa0, #1a3568)` sur le container.

**Pins** : classe `gm3d-poi japan-poi` (double classe — `japan-poi` applique des overrides CSS plus grands : badge 36×36px, icône 30px, texte 12px). `CITY_LOGOS: Record<string, string> = { tokyo: "/images/cities/tokyo_home.svg" }` — affiche le SVG de la tour si disponible, sinon emoji 🗾. Icône cadenas pour les villes verrouillées : SVG Material Design filled `#9ca3af` (pas d'emoji). Fond de l'icon-wrap forcé `transparent` sur `.japan-poi` (tous états) pour éviter le cercle coloré derrière l'icône. Bordure sobre sur les villes débloquées : `.japan-poi:not(.gm3d-poi--locked) .gm3d-badge` → `border-color: rgba(210,210,220,0.7)` + ombre douce (pas de glow coloré).

**`gm3d-city-label`** : pill sombre `background: rgba(0,0,0,0.48)`, `padding: 3px 7px`, `border-radius: 4px` — assure la lisibilité sur le fond beige/terre.

**Lock logic** : `city.levelRequired > (userStats?.level ?? 0)` — `?? 0` garantit que les villes `levelRequired: 99` restent verrouillées même sans session.

**Cities coming soon** (`levelRequired: 99`) : Nara, Hiroshima, Sapporo, Nikkō, Nagoya, Fukuoka, Beppu.

**Architecture persistante** — `PersistentJapanMap` dans `src/app/home/layout.tsx` :
```tsx
// zIndex:1 → couvre GameMap3D (zIndex:0) sur /home
// visibility:hidden sur les pages non-home → bloque aussi l'écran de chargement Japon (position:fixed hérite visibility)
<div style={{ position:"fixed", inset:0, zIndex:1,
  visibility: isOnHomePage ? "visible" : "hidden",
  pointerEvents: isOnHomePage ? "auto" : "none" }}>
  <JapanMap />
</div>
```

**Footer links — comportement par page** :
- Sur `/home` : footer dans `HomeShell` (`right: 20`), tous les liens visibles.
- Sur `/home/[city]` : `HomeShell` masque son footer (`!isOnCityPage`). `CityClient` rend son propre footer avec `right: selectedPoi ? 440 : 20` (recule quand le drawer est ouvert, transition CSS).
- Sur `/home/[city]/[poi]` : seul "Signaler un bug" visible (`!isOnPoiPage` masque les autres liens).

### Page `/home` — `HomeClient.tsx`

`src/app/home/HomeClient.tsx` — UI overlay de la page d'accueil (carte Japon). Deux éléments principaux :

**Sidebar flottante** (`position: fixed, left: 20px, top: 50%, translateY(-50%)`)
- Toujours déployée (pas de toggle), largeur 448px, hauteur `calc(100vh - 40px)`
- `overflow-y: auto` pour les petits écrans
- Sections :
  1. **Header** — logo `h-[72px] w-[72px]` + texte `"SekaiTalk"` en `#1e3fad` (`text-2xl font-black tracking-tight`), `gap-0`, `border-b border-gray-200`
  2. **Objectifs du jour** (`id="tut-home-daily"`) — 3 objectifs dynamiques via `useDailyGoals()`. Icône emoji + label + compteur `X/Y` pour objectifs multi-étapes. Fond indigo quand terminé.
  3. **Navigation** (`id="tut-home-nav"`) — icônes SVG colorées inline. **Lieux** enabled → ouvre panneau flottant `showLieux`. Contacts/Évènements disabled. **Étudier** enabled → `router.push("/home/tokyo/school?from=home")`. Section `flex-1`.
  4. **Mon Objectif** (`id="tut-home-objectif"`) — `<MonObjectif />`
  5. **Paramètres** (`id="tut-home-settings"`) — fonctionnel → `router.push("/home/settings")`, hover `ChevronRight`
- `pointer-events-auto` explicite

**Panneau Lieux** (floating, `left: 488px`, même hauteur/shadow que sidebar, 380px) — s'ouvre quand `showLieux`. Liste toutes les villes depuis `/api/content/cities` (fetchées dans `dbCities`). Logo city (`CITY_LOGOS[slug]`) ou emoji 🗾. Clic → `japanFlyToRef.current?.(lng, lat, 9)`.

**Paramètres** : navigates vers `/home/settings` (page dans le layout home — pas de rechargement de carte).

**HUD top-right** (`position: absolute, top: 20px, right: 20px, z-20`) — structure en 3 clusters séparés par `w-px h-12 bg-gray-100` :
- **Cluster 1 — Tickets** (`id="tut-home-tickets"`) : label "TICKETS" + 5 SVG ticket path indigo (`fill="#6366f1"`, viewBox `0 0 1792 1792`) + bouton `+` pointillé + timer `⏱ 10h 28min`
- **Cluster 2 — Streak** (`id="tut-home-flame"`) : `Flame h-8 w-8` + chiffre `text-3xl font-black` — gris (`text-gray-300`) si streak = 0, orange sinon. Clic → `showStreakPopover`. Popover : Meilleure série (Flame gris + 0) + Freeze restants (🧊 + 0). Arrow CSS avec `rotate-45 border-l border-t`
- **Cluster 3 — Bell + Avatar** (`id="tut-home-xp"`) :
  - Bell `h-6 w-6` cliquable → `showNotifPopover` → "Aucune nouvelle notification"
  - Avatar XP ring : SVG 60px, `r=26`, stroke `#6366f1`, `strokeDashoffset` sur `userStats.percent`. **Cliquable** → `showProfilePopover` → menu : **Modifier le profil** (→ settings), **Passer au forfait supérieur** (étoile indigo), **Se déconnecter** (`signOut({ callbackUrl: "/login" })`)
- `px-6 py-4`, gap `gap-5`

**`signOut`** : importé de `next-auth/react`.

**Tutorial** : `<TutorialLayer onAdvance={(step) => { if (step === "pricing") setShowPricing(true); }} />` monté directement. `showPricing` state — ouvert aussi si `getTutoStep() === "pricing"` au mount. `PricingModal` close → `storeTutoStep("complete")`.

### Page `/home/settings` — `SettingsClient.tsx`

`src/app/home/settings/` — page paramètres dans le layout home (pas de rechargement de la carte persistante). Route : `page.tsx` (server) + `SettingsClient.tsx` (client).

- Header : bouton retour (`router.back()`) + titre "Paramètres"
- 3 sections : **Compte** (Profil + Sécurité, disabled), **Préférences** (3 items, disabled), **Session** (Se déconnecter → `signOut({ callbackUrl: "/login" })`, fonctionnel)
- Accessible depuis le bouton Paramètres dans HomeClient et CityClient

### Système tutorial / onboarding (`src/lib/tutorial.ts` + `src/components/TutorialLayer.tsx`)

**State machine** persistée en `localStorage` (clé `sekai_tuto_step`). `getTutoStep()` / `setTutoStep()` / `initTuto(force?)`.

**Flux complet** :
```
city_intro_0 → city_intro_1 → city_intro_2
  → map_konbini (ring: ouvre panneau Lieux)
  → lieux_filter_konbini (ring: filtre konbini)
  → lieux_select_poi (ring: konbini-shinjuku spécifique)
  → pre_lesson_guide → drawer_lesson (ring: bouton leçon)
  → lesson_active [leçon en cours]
  → pre_quest_guide → drawer_quest (ring: bouton quête)
  → quest_active [quête en cours]
  → quest_done_0 → quest_done_1
  → sidebar_lieux → sidebar_contacts → sidebar_revision → sidebar_guidage
  → guide_free_0 → guide_free_1
  → [router.push("/home")] → home_map_0 → home_map_1
  → home_tickets → home_flame → home_xp → home_daily → home_nav → home_objectif → home_settings
  → pricing → complete
```

**Démarrage** : `?tuto=start` dans l'URL de la page city → `initOnMount={true}` → `initTuto(force=true)` → reset à `city_intro_0`.

**TutorialLayer** (`src/components/TutorialLayer.tsx`) — composant client rendu dans `CityClient` et `HomeClient`. Props : `citySlug?`, `selectedPoiId?`, `sidebarPanel?`, `lieuxType?`, `initOnMount?`, `onAdvance?`, `onClose?`.

**Deux types d'overlay** :
- `GuideDialogue` (step in `CITY_INTRO_LINES`) : personnage + bulle de dialogue. `zIndex: 1005`. `pointerEvents: "auto"` explicite (override du `pointer-events: none` hérité de HomeShell/CityClient).
- `HighlightTooltip` (step in `HIGHLIGHTS`) : anneau lumineux + tooltip. Ring : `boxShadow: "0 0 0 4px #a78bfa, 0 0 0 9999px rgba(0,0,0,0.45)"` → effet spotlight. `zIndex: 1002` (anneau) / `1003` (tooltip). `showDismiss: false` = action requise (pas de bouton "Compris!") ; `showDismiss: true` = info avec bouton.

**Z-index hiérarchie** : sidebar `z-1001` → ring `z-1002` → tooltip `z-1003` → guide dialogue `z-1005` → quest drawer `z-1000`.

**Auto-avance au mount** : useEffect `[]` unique lit localStorage. Si `lesson_active` → avance à `pre_quest_guide`. Si `quest_active` → avance à `quest_done_0`. Évite le bug de double `[]` useEffect (stale closure : le second effet voit `step = null` avant re-render).

**Restrictions tutoriel dans CityClient** : `tutoRestrictFilters` state — quand `lieux_filter_konbini` ou `lieux_select_poi`, les filtres non-konbini sont `opacity: 0.3, pointerEvents: "none"`. `onAdvance` callback sync cet état.

**IDs requis** :
| ID | Élément |
|---|---|
| `tut-sidebar-lieux` | Bouton Lieux dans la sidebar CityClient |
| `tut-lieux-filter-konbini` | Bouton filtre konbini dans panneau Lieux |
| `tut-poi-konbini-shinjuku` | Ligne POI FamilyMart Shinjuku dans la liste |
| `tut-lesson-btn` | Bouton "Commencer la leçon" dans le drawer |
| `tut-quest-btn` | Bouton "Faire la quête" dans le drawer |
| `tut-sidebar-contacts` / `tut-sidebar-revision` / `tut-sidebar-guidage` | Boutons nav sidebar |
| `tut-home-tickets` / `tut-home-flame` / `tut-home-xp` | Éléments HUD HomeClient |
| `tut-home-daily` / `tut-home-nav` / `tut-home-objectif` / `tut-home-settings` | Sections sidebar HomeClient |

### PhoneOverlay (`src/components/PhoneOverlay.tsx`)

Composant iPhone japonais standalone (plus utilisé depuis la sidebar — le bouton Téléphone a été supprimé). Sert de **référence / base visuelle** pour `SnsOverlay` qui en réutilise tous les éléments de frame.

**Dimensions** : 292×600px (ratio 37:76), `BR=50`, `HUE=284` (violet profond).

**Frame** :
- Fond `#040404`, anneau métallique via `boxShadow` multicouche
- Bande centrale métallique : div absolu `borderTop/Bottom: "3px solid hsl(284,14%,26%)"`
- 3 boutons gauche + 1 bouton droit via helper `btnStyle(flip?)` — inset shadows 3D

**Écran** :
- Background deux sections (`sectionBg(bottom)`) : top 62% + bottom 45% `scaleY(-1)`, gradients radiaux superposés
- Dynamic island : pill statique `44% width × 34px`, dot caméra inclus
- Status bar : heure Tokyo (`Asia/Tokyo`, mise à jour chaque seconde) + icônes signal/wifi/batterie SVG
- Horloge : grande police `fontWeight: 200`, sous-titre "Tokyo · 東京"
- Grille apps : 4 colonnes, 12 apps avec gradients uniques (`AppIcon` — squircles purs, pas de texte dans l'icône)
- Dock glass : `backdropFilter: blur(28px)`, 4 apps
- Home indicator : pill `130×5px rgba(255,255,255,0.28)`

**`AppIcon`** : `borderRadius: "22%"` + gradient `170deg` + highlight spéculaire + inset box-shadow. Hover `scale-110`, active `scale-95`.

**Animation d'entrée** : état `visible` déclenché via `requestAnimationFrame` après le mount. `transform: scale(0.88) translateY(32px) → scale(1) translateY(0)`, easing spring `cubic-bezier(0.34,1.56,0.64,1)` 0.55s. Backdrop opacity 0→1 en 0.3s.

**Fermeture** : clic sur le fond noir ou bouton `X` en haut à droite.

**Usage futur** : les apps (LINE, Amazon, Rakuten, Maps, PayPay, Suica…) serviront de points d'entrée vers des fonctionnalités d'immersion Japon.

### SnsOverlay (`src/components/SnsOverlay.tsx`)

Modal de conversation SNS simulée, rendu dans un **frame iPhone** réutilisant les constantes de `PhoneOverlay` (`PH=720`, `PW=351`, `BR=50`, `HUE=284`, `btnStyle`, `sectionBg`, `DynamicIsland`, `StatusIcons`). Déclenché par le bouton SNS dans le drawer POI de `CityClient`. Données lues depuis la DB (`SnsConversation`).

**3 phases** (machine à états `phase: "intro" | "chat" | "result"`) :
- **Intro** : écran d'accueil iPhone (gradient violet + DynamicIsland + status bar) avec une notification LINE simulée (avatar du contact + premier message) + carte contexte + bouton "Ouvrir →".
- **Chat** : fond blanc + status bar sombre + header LINE (avatar + nom + handle) + zone messages scrollable (`bg: #e8ecf1`) + panel choix. Messages "them" = bulles blanches `border-radius 14px 14px 14px 3px` + miniature avatar ; messages "you" correct = `#07C160` (vert LINE), incorrect = `#f87171` (rouge) + feedback.
- **Result** : fond gris clair + score + barre de progression verte + `+XP` + bouton "Terminer".

**`ContactAvatar`** : composant interne. Affiche `contact.image` avec `<img onError>` fallback vers div emoji + gradient vert LINE.

**Step machine** : `useEffect([phase, idx, steps])` — steps "them" = typing indicator (800–1300ms) puis rendu ; steps "you" = `awaitingChoice(true)`. `pick(choice)` → enregistre dans `rendered`, met à jour score, `idx++`.

**Types** (`src/lib/sns-conversations.ts`) : `SnsChoice`, `SnsStep`, `SnsContact`, `SnsConversation` — types uniquement, données en DB. `getSnsConversation()` supprimé (plus utilisé).

**`pointer-events-auto`** obligatoire sur le backdrop (le wrapper `children` de `HomeShell` est `pointer-events-none` sur les pages city).

### RevisionOverlay (`src/components/RevisionOverlay.tsx`)

Composant de révision style Busuu. Utilisé en deux modes :
- **Overlay plein-écran** (mode par défaut) : `fixed inset-0 z-[2000] bg-white`. N'est plus déclenché depuis les sidebars — uniquement disponible si invoqué directement.
- **Inline** (`inline={true}`) : pas de `fixed`, pas de header "Révision" (masqué), `flex-col` naturel dans le scroll de la page parente. Utilisé dans l'onglet **Pratique** de `SchoolClient`. Les vues session et summary s'adaptent aussi (pas de fixed). `KanaPanel` accepte aussi `inline` et adapte sa vue session.

**Prop** : `{ onClose: () => void; inline?: boolean }`. En mode inline, `onClose` n'est pas affiché mais reste requis (utilisé si 0 mots).

**Deux onglets** : `"vocab"` (défaut) et `"kana"`.

#### Onglet Vocabulaire

Fetche `GET /api/revision/vocab` au montage. Affiche les stats (`toWork`, `toReview`, `acquired`) puis lance une session de 10 exercices.

**Types d'exercice (`ExerciseType`)** :
- `JP_TO_FR` — affiche le mot japonais (kanji + kana + romaji), 4 choix français → sélection
- `FR_TO_JP` — affiche la traduction française, 4 choix japonais → sélection
- `WRITE_JP` — affiche la traduction française, champ texte libre → l'élève écrit en japonais (hiragana, katakana, kanji ou romaji acceptés)

**Distribution** : ~1/3 WRITE_JP, ~1/3 JP_TO_FR, ~1/3 FR_TO_JP (aléatoire via `Math.random()`).

**Bouton "Je ne sais pas"** : présent sur tous les types. Envoie la valeur sentinelle `"__skip__"` via `handleAnswer`, toujours comptée incorrecte. La feedback bar affiche la bonne réponse.

**`checkWrittenAnswer(input, word)`** : normalise (trim + lowercase + collapse espaces), accepte `word.jp`, `word.kana`, ou `word.romaji`.

**Feedback bar** (`FeedbackBar`) : fixe en bas, verte (correct) ou rouge (incorrect). Pour WRITE_JP incorrect : affiche toutes les formes acceptées (`jp · kana · romaji`). Bouton "Continuer →".

**Session** : 10 mots tirés aléatoirement, priorité aux mots `toWork`. En fin de session : POST `/api/revision/result` avec `{ results: [{ wordJp, correct }] }`.

#### Onglet Kana (`KanaPanel`)

Intégré dans `RevisionOverlay`. Vue table + vue session flash cards. Mastery persistée en **localStorage** (clé `sekai-kana-mastery`) — aucune API ni DB.

**Scripts** : Hiragana / Katakana / Les deux. **Groupes** : Basiques / Dakuten / Combinaisons (checkboxes).

**Modes** : Kana→Rōmaji / Rōmaji→Kana / Aléatoire.

**Table** (`KanaTableSection`) : collapsible par groupe, cellules colorées selon la maîtrise :
- Sans fond : non vu (mastery `none`)
- `bg-orange-50` : en cours (`learning` — < 3 essais ou ratio < 70 %)
- `bg-emerald-50` : bien (`good` — ≥ 3 essais, ratio ≥ 70 %)
- `bg-amber-100` + ★ doré : maîtrisé (`mastered` — ≥ 5 essais, ratio ≥ 90 %)

**Session flash cards** (20 questions) — affichée en `fixed inset-0 z-[2010]` (au-dessus de l'overlay principal) :
- `kana_to_romaji` : affiche le kana, 4 choix romaji
- `romaji_to_kana` : affiche le romaji, 4 choix kana (en serif)
- Déduplication des distracteurs via `Set` (évite le bug 5 boutons dû aux doublons じ/ぢ = "ji")
- Clé React `${choice}-${index}` pour éviter les conflits de clés dupliquées

**Écran résumé** : score + répartition correct/incorrect. `applyMastery(results)` sauvegarde dans localStorage.

**Types internes** :
```typescript
type KanaGroup = "basic" | "dakuten" | "combo";
type KanaScript = "hiragana" | "katakana";
type KanaMode = "kana_to_romaji" | "romaji_to_kana" | "mixed";
type KanaMasteryEntry = { correct: number; total: number };
type KanaMasteryStore = Record<string, KanaMasteryEntry>;
// clé mastery = `${script[0]}:${romaji}` ex: "h:ka", "k:chi"
```

### MapContext (`src/app/home/MapContext.tsx`)

État partagé entre `layout.tsx` (monte les maps persistantes) et `CityClient` / `HomeClient` (UI overlay). Tous les champs sont des refs ou états React exposés via `useMapCtx()`.

| Champ | Type | Rôle |
|---|---|---|
| `mapRef` | `RefObject<any>` | Référence à la map Mapbox 3D (GameMap3D) |
| `activeType` / `setActiveType` | `POIType \| null` | Filtre de type POI actif sur la city map |
| `poiClickRef` | `MutableRefObject<(id) => void>` | Handler clic POI enregistré par CityClient |
| `mapBgClickRef` | `MutableRefObject<() => void>` | Handler clic fond carte enregistré par CityClient |
| `japanFlyToRef` | `MutableRefObject<(lng, lat, zoom?) => void>` | FlyTo Japan map enregistré par JapanMap, appelé par HomeClient |
| `editMode` / `setEditMode` | `boolean` | Mode placement admin (drag POIs) |
| `poiMoveRef` | `MutableRefObject<(id, lat, lng) => void>` | Handler déplacement POI enregistré par CityClient → appelle PUT API |
| `poiPositionOverrides` | `Record<string, {lat, lng}>` | Coordonnées overridées post-drag, prioritaires sur `city.pois` |
| `updatePoiPosition` | `(id, lat, lng) => void` | Met à jour `poiPositionOverrides` immédiatement (avant réponse API) |
| `activeEvents` / `setActiveEvents` | `ActiveEvent[]` | Events actifs (seasonal + daily instances) partagés entre CityClient et GameMap3D. Peuplé au mount de CityClient via `GET /api/events`. |
| `mapReady` / `setMapReady` | `boolean` | Passe à `true` quand GameMap3D a fini de charger (idle après easeTo). CityClient l'observe pour masquer l'écran de chargement. |
| `pinPoiRef` | `MutableRefObject<(id: string \| null) => void>` | Exposé par GameMap3D (wraps `setPinnedPoiId`). Appelé par CityClient lors de la navigation par flèches pour pinner le POI de destination. |

### Carte 3D Tokyo (`GameMap3D`)

`src/app/home/[city]/GameMap3D.tsx` — carte 3D interactive pour les villes avec `use3DMap: true` dans `cities.ts`.
- **Rendu** : Mapbox GL JS + react-map-gl v8 (`react-map-gl/mapbox`), style `mapbox://styles/mapbox/standard`
- **Architecture persistante** : la map est montée une seule fois dans `src/app/home/layout.tsx` (jamais démontée) → 1 seul Map Load par session. **Toujours rendue** (pas de `visibility: hidden`) pour que Mapbox charge les tuiles en continu — `pointerEvents: isOnCityPage ? "auto" : "none"` contrôle l'interactivité. `PersistentJapanMap` utilise `visibility: hidden` sur les pages non-home (bloque aussi ses enfants `fixed`, dont l'écran de chargement Japon). État partagé via `src/app/home/MapContext.tsx`. `PersistentMap` re-fetche `/api/content/cities` à chaque changement de `pathname` (pas de `fetchedRef` guard) → les modifs admin (ex: `isActive`) sont reflétées dès la prochaine navigation.
- **Clic fond de carte** : `onMapBgClick` prop → `onClick` sur `<Map>` (markers ont `stopPropagation`). Enregistré via `mapBgClickRef` → ferme le panneau sidebar actif
- **Import SSR** : `dynamic(() => import("./[city]/GameMap3D"), { ssr: false })` dans `home/layout.tsx`
- **Style** : `setConfigProperty("basemap", "lightPreset", "dusk")` + tous les labels masqués
- **Modèle Skytree + Tokyo Tower** : `public/models/tokyo_skytree.glb` + `public/models/tokyo_tower.glb` rendus via custom Three.js layer
- **Animations canvas** : eau ("water-anim" 128×128) et herbe ("grass-anim" 32×32) via `map.addImage()` avec `render()` + `triggerRepaint()`
- **Contraintes caméra** : `minZoom=14`, `maxPitch=85`, `minPitch=20`, `maxBounds` Tokyo + Haneda (`[139.58, 35.52]` → `[139.85, 35.75]`), bearing clampé ±25° autour de −20°
- **Pins** : classe CSS `gm3d-poi` avec `--pc` (couleur par type). Logo POI via `POI_LOGOS[poi.id]` → `<img>` sinon emoji. Hover expand via `max-width` transition. En mode placement : classe `gm3d-poi--edit` (bordure orange pointillée, curseur `grab`)
- **Props** : `editMode?: boolean`, `onPoiMove?: (id, lat, lng) => void`. Coordonnées des markers : `poiPositionOverrides[poi.id] ?? poi.lat/lng` (override context prioritaire sur les données statiques)
- **`pinnedPoiId`** : state local dans `GameMap3D` — persiste l'état "ouvert" du badge après un clic. Clic POI → `setPinnedPoiId(poi.id)` (badge reste ouvert). Clic fond → `setPinnedPoiId(null)`. Drag carte → `onDragStart` → `setPinnedPoiId(null)`. Classe CSS `gm3d-poi--pinned` — mêmes styles que `:hover`. Note : `onMoveStart` NON utilisé (déclenche aussi sur `flyTo` programmatique) → `onDragStart` uniquement. `setPinnedPoiId` est exposé dans `MapContext.pinPoiRef` via `useEffect` → CityClient l'appelle lors de la navigation par flèches POI.
- **Signal `mapReady`** : dans `handleLoad`, après `map.easeTo({ pitch: 55 })`, `map.once("idle", () => setMapReady(true))` est enregistré → se déclenche seulement quand l'animation ET toutes les tuiles pitch-55 sont chargées. `mapReady` dans `MapContext` est observé par CityClient pour masquer l'écran de chargement.
- **Event markers** : lit `activeEvents` depuis `useMapCtx()`. Calcule `visibleEvents = activeEvents.filter(ev => new Date(ev.expiresAt) > now)` (tick toutes les 60s → disparition automatique). Les POI IDs des events visibles sont dans `eventPoiIds` → exclus du rendu normal des POIs. Rendu séparé avec classe `gm3d-poi--event` : badge fond coloré (`var(--pc)`), texte blanc, grand emoji 34px, anneau beacon pulsant (`gm3d-event-pulse` — double ring via `::before`, `@keyframes eventPulse` 2.6s décalé 1.3s). Clic → `onPoiClick(ev.poiId)` (ouvre drawer POI normal du POI event).

### Mode placement admin (`editMode`)

Permet aux admins de repositionner les POIs directement sur la carte par drag & drop.

**Architecture** :
- `MapContext` expose : `editMode: boolean`, `setEditMode`, `poiMoveRef`, `poiPositionOverrides: Record<string, {lat,lng}>`, `updatePoiPosition(id, lat, lng)`
- `layout.tsx` passe `editMode` + `onPoiMove` à `GameMap3D`
- `GameMap3D` lit `poiPositionOverrides` depuis `useMapCtx()` — les coordonnées overridées sont utilisées immédiatement au drag end, sans attendre la DB

**Flux** :
1. Admin clique "Placement" (bouton orange à côté de "Retour", visible si `isAdmin`)
2. Tous les markers passent en `draggable={true}`, style `gm3d-poi--edit`, clic désactivé
3. Drag end → `updatePoiPosition(id, lat, lng)` (mise à jour locale immédiate) + `onPoiMove(id, lat, lng)`
4. `poiMoveRef.current` dans `CityClient` → `PUT /api/admin/pois/${poiId}` avec `{ lat, lng }`
5. Toast de confirmation 2.5s (`moveToast` state)
6. Quitter le mode → markers gardent leurs nouvelles positions (via `poiPositionOverrides`)

**Bannière** : `fixed bottom-6 left-1/2` orange, visible tant que `editMode` est actif.

**Sécurité** : bouton visible uniquement si `(session?.user as any)?.isAdmin === true`. L'API vérifie aussi `isAdmin` côté serveur via `checkAdmin()`.

**Note** : `poiPositionOverrides` persiste en mémoire pour la session courante. Un refresh re-charge les coordonnées depuis la DB (qui est déjà à jour).

### Écrans de chargement

- **Chargement carte Japon** (`JapanMap`) : overlay blanc `z-[2000]` même style que les villes — "JAPON" + "日本" + loadbar + "地図を読み込み中". Déclenché dès `onLoad` (pas `idle`) + 250ms → fondu 250ms → disparaît. `mapLoaded` / `fadeOut` states. Persist tant que le composant est monté (map persistante = pas de rechargement au retour sur `/home`).
- **Chargement ville** (`CityClient`) : overlay blanc `z-[2000]`, fondu 400ms. `mapLoading` / `mapFading` states. L'écran s'affiche au mount puis se cache dès que `mapReady` (MapContext) passe à `true` — `mapReady` est positionné par GameMap3D via `map.once("idle")` enregistré dans `handleLoad` après `easeTo`. Pas de polling ni de fallback timer : le flow est entièrement state-driven.
- **Chargement conversation** (`POIClient`) : affiché quand `!character` — fond blanc, nom du POI, 3 points animés (`dot-pulse`).
- **Sortie conversation** (`POIClient`) : `leaving` state → overlay blanc `leaving-in 450ms`, puis `router.push`.
- **Keyframes CSS** (`globals.css`) : `loadbar-slide`, `dot-pulse`, `leaving-in`, `screen-fadein`.

### Session de quête (`POIClient`)

**Timer** : 15 min par quête (`questTimeLeft`), décrémenté toutes les secondes hors pause. À 0 → `sessionExpired`.

**Accès restreint** : `POIClient` redirige vers `/home/[city]` si aucun `questId` dans les params URL — pas de conversation libre possible.

**Tracking session** (réinitialisé à chaque nouvelle quête) :
- `sessionStartRef` — timestamp `Date.now()` au lancement
- `sessionErrors` — incrémenté à chaque mauvaise réponse au quiz
- `sessionSuggestionsUsed` — incrémenté à chaque ouverture du panneau suggestions
- `sessionPracticedVocab (Set<string>)` — mots `jp` de la **quête courante** détectés (envoyés à `/api/session/complete`)
- `sessionAllDetectedVocab (Set<string>)` — mots `jp` détectés dans **toutes les quêtes du POI** (pour le compteur stats uniquement)
- `allPoiVocabRef` — vocab dédupliqué de toutes les quêtes du POI, peuplé au chargement depuis `GET /api/quests/poi/[poiId]`

**Modales post-quête** (toutes en `fixed inset-0 overflow-y-auto` — pattern scrollable-outer) :
- `showQuestComplete` + `completedQuestInfo` → modale sombre (fond glassmorphism). Récompenses XP + aperçu vocab. Bouton unique : "Terminer la session →" (pas de "Continuer la conversation")
- `showSessionSummary` + `summaryVocabProgress` → modale blanche (fond noir/75). Stats (erreurs, aides, `sessionAllDetectedVocab.size`) + vocab quête groupé par JLPT avec icône de maîtrise. Bouton "Terminer" → `handleBack`.

**`handleEndSession(info, practiced, errors, suggestions)`** :
- POST `/api/session/complete` → reçoit `vocabWithMastery[]`
- En cas d'erreur réseau → calcul local avec `computeMastery`
- `setSummaryVocabProgress` + `setShowSessionSummary(true)`

**`shouldListenRef`** bloqué si : `isPaused || isSpeaking || isLoading || isTranscribing || showSuggestions || sessionExpired || showQuestComplete || showSessionSummary || micMuted`

### POIClient — UI et architecture de la boîte de dialogue

`src/app/home/[city]/[poi]/POIClient.tsx` — page de conversation IA. Interface en **light mode** (fond blanc/gris clair).

**Header personnage** (haut de la boîte de dialogue) :
- Photo ronde du personnage (48px) + nom blanc en gras + titre en petit
- Bulle utilisateur inline avec le header : `ml-auto`, texte italique tronqué 45% max-width, `bg-black/30 backdrop-blur-sm rounded-full`. Positionnée dans la même ligne que le nom/photo, jamais derrière les boutons.

**Boîte de dialogue** :
- Fond blanc/95, blur, ombre violette. Pas de `pt-10` — le padding top est nul, seul `pr-36` est appliqué côté droit (pour ne pas chevaucher les boutons flottants droits).
- Affiche `displayedReply.reply` (kanji + furigana) + traduction française + mots découpés
- Les boutons flottants (replay TTS, romaji toggle, display toggle) sont positionnés `absolute right-3 top-3`

**Navigation historique** :
- `replyHistoryRef` (ref, pas state) accumule `{ reply: AIReply, userMsg: string }` à chaque réponse IA
- `historyIndex` (state) pointe sur l'entrée courante. Défaut : `0` (salutation)
- Variables calculées avant le `return` : `displayedReply`, `displayedUserMsg`, `isViewingHistory`, `canGoBack`, `canGoForward`
- Boutons ← Précédent / Suivant → affichés uniquement si `replyHistoryRef.current.length > 1`, avec compteur `n / total`
- Quand l'IA répond : `historyIndex` avance automatiquement au dernier item
- `sendMessage` ne réinitialise PAS `currentReply` (évite l'écran vide si annulation). L'état de chargement est géré par `isBusy`.

**Historique de messages** :
- Initialisé vide `[]` — la salutation du personnage n'est pas dans les messages envoyés à l'API
- La salutation est dans `replyHistoryRef.current[0]` uniquement (navigation historique client-side)
- Évite le bug "pre-fill" de l'API Anthropic (réponse avec `assistant` en premier message vide les `words`)

**Injection aiContext** :
- Labelisé `[CONTEXTE DE LA TÂCHE N/N — information de fond, ne pas aborder directement]`
- Si premier message : ajoute `, répondre d'abord naturellement au message de l'utilisateur`
- Empêche l'IA de répondre directement avec le contenu de la quête sur un simple bonjour

**Bouton Menu** (remplace le bouton Carte) :
- 3 traits hamburger + label "Menu" en dessous (`text-[9px]`), `rounded-xl bg-white/95`
- Ouvre `showMenu` → modale avec : réglages volume (placeholder non fonctionnel) + "Retourner à la carte"
- "Retourner à la carte" → ouvre `showBackConfirm` → modale de confirmation : "votre ticket sera consommé et la progression non sauvegardée" → bouton confirmer → `handleBack`
- `handleBack` navigue vers `/home/${citySlug}?poi=${poiId}` (rouvre le drawer du POI dans CityClient)

**Retour vers CityClient** :
- `handleBack` ajoute `?poi=${poiId}` dans l'URL de retour
- `CityClient` lit le param `?poi=` au mount → ouvre automatiquement le drawer du POI correspondant

**Quest box** (haut gauche) :
- `maxWidth: 420px` (anciennement 320px)
- Bouton "J'ai compris ✓" désactivé (`opacity-50 pointer-events-none`) quand `isPaused`

**Bandeaux de tâche** :
- **`taskBanner`** — affiché au lancement d'une quête et à chaque nouvelle tâche. State `{ index, total, instruction }`, auto-dismiss 3,5s via `taskBannerTimerRef`. Bandeau pleine largeur, fond blanc, "Objectif N" + instruction. Keyframes : `taskBannerIn` (spring entrée) + `taskBannerOut` (fondu sortie à 3s).
- **`taskValidatedBanner`** — affiché 2,2s quand une tâche IA est auto-validée. State `string | null` (instruction de la tâche validée). Bandeau vert pleine largeur avec ✅ + "Tâche validée !".

**`SuggestionPlayButton`** (composant dans `POIClient.tsx`) :
- Bouton lecture Web Speech API gratuit, dans chaque ligne du panneau Suggestions
- Même UI pill que le bouton replay de la boîte de dialogue : fond `bg-gray-100 border border-gray-200`, `rounded-full`
- Icône haut-parleur SVG + séparateur + bouton vitesse `x1` / `.7x` (toggle)
- `utter.lang = "ja-JP"`, `utter.rate = speed * 0.85`. Cherche une voix japonaise via `getVoices().find(v => v.lang.startsWith("ja"))`
- Un seul bouton replay par suggestion (pas de doublon)

### Whisper — filtres anti-hallucination (`/api/transcribe`)

Whisper hallucine le contenu du prompt quand il n'y a pas de vraie parole.

- **Prompt enrichi** : `"日本語で話しています。観光、仕事、パスポート、ありがとうございます、すみません、です、ます、はい、いいえ、どこ、いくら、お願いします。"` — ancre Whisper sur le japonais.
- **Filtre segments** : garde uniquement les segments avec `no_speech_prob < 0.4` et `avg_logprob > -1.0`. Si aucun segment valide → retourne `{ text: "" }`
- **Filtre hallucination** `isHallucination(text)` :
  - Longueur < 3 caractères
  - Texte exact dans `HALLUCINATIONS` : `["日本語", "ご視聴", "字幕", "翻訳", "ありがとうございました", "お願いします。", "です。", "ます。"]`
  - Uniquement ponctuation/espaces : `/^[。、．，\s]+$/`
  - **Filtre langue** : si le texte ne contient aucun caractère japonais (`HAS_JAPANESE` regex) ET contient un mot français/anglais courant (`FRENCH_EN_WORDS` regex) → rejeté. Évite les confusions Whisper type "encore desu" pour "観光です".
- Appliqué sur le texte reconstruit des segments ET sur `data.text` (fallback sans segments)

### Carte illustrée (`IllustratedMap`)

`src/app/home/[city]/IllustratedMap.tsx` — affiche une image de carte custom avec pan/zoom.
- L'image est chargée à taille naturelle, le scale initial est calculé via `onLoad` pour tout faire tenir dans le viewport
- Les marqueurs POI sont positionnés en `%` via `latLngToPercent(lat, lng, bounds)` et contre-scalés (`1/transform.scale`) pour rester à taille constante à l'écran
- `mapImage` + `mapBounds` dans `src/lib/cities.ts` activent la carte illustrée (sinon fallback Leaflet)
- `use3DMap: true` dans `cities.ts` active `GameMap3D` à la place

### Système XP / Niveau

- `User.xp` en DB, incrémenté à la complétion de quête (`firstCompletedAt`)
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
- **Constantes** : `VAD_THRESHOLD = 0.042`, `VAD_TRIGGER_FRAMES = 5`, `SILENCE_DELAY = 1400ms`, `MIN_RECORD_MS = 600ms`
- **Détection** : boucle `requestAnimationFrame` calcule le RMS sur chaque frame. Le déclenchement nécessite `VAD_TRIGGER_FRAMES` (5) frames consécutives au-dessus du seuil — évite les faux déclenchements (frappe clavier, bruit bref). `triggerCount` est remis à 0 dès qu'une frame est sous le seuil.
- **Fin d'énoncé** : silence > `SILENCE_DELAY (1400ms)` → stoppe le recorder → envoie à `/api/transcribe`
- **Détection vocab** : dans le callback `transcribe`, double scan :
  1. contre `aq.vocab[].jp/kana` → `setSessionPracticedVocab` (quête courante, envoyé à l'API)
  2. contre `allPoiVocabRef.current[].jp/kana` → `setSessionAllDetectedVocab` (toutes quêtes, stats uniquement)
- **Filtre bruit court** : enregistrement ignoré si durée < `MIN_RECORD_MS (600ms)`
- **shouldListenRef** : `false` si `isPaused || isSpeaking || isLoading || isTranscribing || showSuggestions || sessionExpired || showQuestComplete || showSessionSummary || micMuted`
- **Mobile HTTP** : guard `if (navigator.mediaDevices)` obligatoire
- **Cleanup** : `audioCtxRef.current?.close()` + `streamRef.current?.getTracks().forEach(t => t.stop())` à l'unmount
- **Pas d'indicateur VAD** : aucun texte "PRÊT"/"ÉCOUTE" dans l'UI — la détection est silencieuse

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

### Système de leçon (`LessonClient`)

`src/app/home/[city]/[poi]/lesson/LessonClient.tsx` — lecteur de leçon style Busuu. `src/lib/lesson.ts` contient tous les types TypeScript.

**Types de steps (`StepType`)** :
- `INTRO` — carte introduction d'un mot (word, kana, romaji, translation, example?). Non scoré. `AudioPlayer` Busuu-style intégré (barre bleue, waveform animée, toggle vitesse 1x/.7x).
- `TRUE_FALSE` — affirmation vrai/faux. Scoré. `SpeakButton` inline sur le mot japonais.
- `CHOOSE_ANSWER` — QCM (4 choix). Scoré. `SpeakButton` à droite de chaque choix.
- `COMPLETE_WORD` — compléter le mot manquant (prefix + trou + suffix, 4 choix lettre/syllabe). Scoré. `SpeakButton` apparaît après réponse, lecture automatique si correct (300ms delay).
- `MATCH_PAIRS` — associer 4 paires japonais↔français. Scoré. Icône speaker SVG inline sur chaque item japonais (`e.stopPropagation()`).
- `CULTURE_NOTE` — note culturelle avec texte + vocab illustratif. Non scoré. `SpeakButton` par ligne vocab.
- `PRONUNCIATION` — test de prononciation via micro. Scoré. 3 essais max. Envoi à Groq Whisper (`/api/transcribe`), match substring sur `word` et `kana` normalisés. Succès → chime Web Audio (C5→E5→G5→C6) + cercle vert animé (`@keyframes successPop` spring) + checkmark SVG dessiné (`stroke-dashoffset`) + confetti + "よし！". Échec → affiche ce qui a été entendu + essais restants. Pas d'ElevenLabs ni de Web Speech API — micro réel uniquement.

**`SCORED_TYPES`** : `["TRUE_FALSE", "CHOOSE_ANSWER", "COMPLETE_WORD", "MATCH_PAIRS", "PRONUNCIATION"]` — seuls ces types contribuent au score.

**Score et validation** : `score = Math.round(correct / scored * 100)`. Si `scored === 0` (que des INTRO/CULTURE_NOTE) → score 100. `validated = score >= 80`. Stocké via `POST /api/lessons/[lessonId]/complete` en fin de leçon.

**Audio (Web Speech API — 100% gratuit, aucun appel réseau)** :
- `speakJapanese(text, rate?)` — `window.speechSynthesis`, `lang: "ja-JP"`, `rate * 0.85`, cherche une voix japonaise via `getVoices().find(v => v.lang.startsWith("ja"))`
- `SpeakButton` — bouton icône speaker inline (bleu, 14px), `e.stopPropagation()` pour ne pas interférer avec la sélection
- `AudioPlayer` — barre player Busuu (fond bleu `#1a73e8`), bouton play/pause, 20 barres waveform animées (`@keyframes audioWave`), toggle vitesse 1x/.7x. Placé dans l'INTRO entre la zone gradient et les infos mot.
- Préchargement voix : `useEffect` appelle `getVoices()` + `onvoiceschanged` pour éviter le délai au premier clic
- Cleanup : `window.speechSynthesis.cancel()` dans `handleBack` et à l'unmount de `AudioPlayer`

**UI Busuu-style** :
- Barre de progression verte en haut (pill, `width: ${stepIndex / steps.length * 100}%`)
- `FeedbackBar` fixe en bas (vert/rouge) — explication + bouton "Continuer →"
- `Confetti` (28 pièces colorées, `@keyframes confettiFall`) sur bonne réponse et si validé en fin
- `CompletionScreen` — écran final avec score, badge ✓/✗, bouton "Retour"
- `handleBack` → `router.push(/home/${citySlug}?poi=${poiId})` (rouvre le drawer du POI)

**Seed** : leçon `konbini-shinjuku` avec 8 steps : 2 INTRO (いらっしゃいませ, おにぎり) → TRUE_FALSE → CHOOSE_ANSWER → CULTURE_NOTE → COMPLETE_WORD → MATCH_PAIRS → CHOOSE_ANSWER. Steps recréés via `deleteMany` + `createMany` à chaque seed.

### Page École (`/home/[city]/school`)

Route statique `src/app/home/[city]/school/` — prend la priorité sur le segment dynamique `[poi]`. Accessible depuis le marker "École SekaiTalk" sur la carte 3D.

**POI école** : `id: "ecole-sekaitalk-tokyo"`, `type: "school"`, seedé dans `prisma/seed.ts` CITIES_DATA + `src/lib/cities.ts` (pour fallback statique). Type `school` ajouté dans `POI_META` (IllustratedMap, CityClient) et `POI_COLORS`/`POI_ICONS` (GameMap3D). Couleur accent `#7c3aed` (violet).

**CSS marker** : le hover générique (`.gm3d-poi:hover .gm3d-badge`, spécificité 0,3,0) écrasait le style du type school (0,2,0). Fix dans `globals.css` : règle `.gm3d-poi--school:hover .gm3d-badge` avec spécificité égale, qui réapplique le gradient violet.

**`SchoolClient.tsx`** (`src/app/home/[city]/school/SchoolClient.tsx`) — composant client, fond `bg-gray-50`, thème blanc/light. Props : `citySlug`, `cityName`.

**Constantes** :
- `ACCENT = "#7c3aed"` (violet)
- `TABS: { id: Tab; label: string; locked: boolean }[]` — 6 onglets : Dashboard, Basiques, **Pratique** (déverrouillé), Grammaire (🔒), Flashcards (🔒), Examen (🔒)

**Header (`<nav>`)** : sticky, `h-14`, `bg-white/95 backdrop-blur-md`, `border-b border-gray-100`. Structure en 3 blocs `flex-1` :
- **Gauche** : bouton retour (→ `backUrl`) + `|` + `SekaiTalk` (→ `/home`). Label : `"← Accueil"` si `?from=home`, sinon `"← cityName"`. `backUrl` calculé depuis `useSearchParams()` : `/home` si `from=home`, sinon `/home/${citySlug}`.
- **Centre** : onglets avec underline active (barre `h-0.5` ACCENT en `absolute bottom-0`)
- **Droite** : badge niveau N5 + avatar initiale

**Onglet Dashboard** : carte profil (avatar initiale gradient, pseudo, niveau, XP bar `XpBar`, streak 🔥) + citation 一期一会 + 3 `ProgressCard` (Vocabulaire live, Grammaire 🔒, Kanji 🔒). Fetche `GET /api/user/stats` + `GET /api/revision/vocab` au mount.

**Onglet Basiques — `BasiquesView`** : chemin de leçons style Sakuraflow.
- **Header** : titre dégradé + barre de progression globale
- **Carte chapitre** (glassmorphism) : barre accent gauche gradient, boutons "Revoir l'intro" / "Déjà familier ? Passer les leçons"
- **"Commencer ici ↓"** : animation `startHereBob` (bounce CSS `@keyframes`)
- **Chemin zigzag** : `CHAPTER1_LESSONS` (6 leçons, 1 active + 5 locked). Index pair → carte alignée à gauche, index impair → droite. Numéro de leçon affiché côté opposé à la carte. Connecteurs SVG courbes pointillés entre leçons (`M 230 0 C 230 24, 70 24, 70 48` / `M 70 0 C 70 24, 230 24, 230 48`). Couleur connecteur : violet avec glow si précédent unlocked, gris sinon.
- **Carte active** : glassmorphism, icône 🌸 gradient, grille kana+romaji, stats cartes/XP, bouton "Commencer" gradient. `hover:-translate-y-1 hover:scale-[1.03]`
- **Cartes locked** : `opacity-50`, fond neutre, icône cadenas, ★★★ grisées
- **Chapitres 2 & 3** (Katakana, Vocabulaire N5) : cartes locked en bas, barre grise gauche, mention "Disponible après le Chapitre N"

**Onglet Pratique** : `<RevisionOverlay inline onClose={() => setTab("dashboard")} />` — contenu de révision vocab + kana intégré inline dans la page. Importé via `dynamic(..., { ssr: false })`.

**Onglets locked (Grammaire, Flashcards, Examen)** : `LockedSection` — fond grisé `border-dashed`, icône cadenas, message "à venir".

**Animations CSS** (`globals.css`) :
```css
@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.animate-fadeIn { animation: fadeIn 0.4s ease both; }
@keyframes startHereBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(4px); } }
```

**TODO** : Écoles Osaka/Kyoto pas encore seedées.

### Lecteur de leçons Basiques (`/home/[city]/school/basics/lesson/[id]`)

Route : `src/app/home/[city]/school/basics/lesson/[id]/` — `page.tsx` (server) + `LessonPlayer.tsx` (client).

**Données** : `src/lib/basics-lessons.ts` — 17 leçons (L1–L17). Leçons impaires = kana (5 kana/leçon), leçons paires = vocabulaire (3–5 mots). Scraping réel de SakuraFlow pour L1–L8, placeholders réutilisant les images pour L9–L17.

**Types** :
```typescript
type KanaSlide  = { type:"kana";  char; romaji; mnemonic; image; description }
type VocabSlide = { type:"vocab"; word; romaji; meaning; meaningFr; image }
type Slide = KanaSlide | VocabSlide
type BasicsLesson = { id; title; subtitle; emoji; xp; newCount; slides: Slide[] }
```

**`generateExercises(lesson)`** : génère jusqu'à 16 exercices mélangés depuis les slides — `kana_to_romaji`, `romaji_to_kana`, `word_to_meaning`, `meaning_to_word`. 4 choix chacun.

**Assets** :
- `public/kana-mnemonics/` — 20 images mémoire kana (ex: `a-apple.webp`) + 16 illustrations vocab (ex: `word-sushi.webp`). Scraping SakuraFlow.
- `public/kanjivg/` — 20 SVGs KanjiVG (ex: `3042.svg` pour あ). Licence CC BY-SA 3.0. Téléchargés depuis `github.com/KanjiVG/kanjivg`.

**`src/lib/kana-strokes.ts`** — données statiques pré-extraites des SVGs KanjiVG. `KANA_STROKES: Record<string, string[]>` — clé = caractère kana (ex: `"あ"`), valeur = tableau de paths SVG `d` dans l'ordre des traits. Généré via `node -e` depuis les fichiers `public/kanjivg/*.svg`. Aucun fetch au runtime.

**`src/components/KanaStrokeOrder.tsx`** — animation ordre des traits. Lit `KANA_STROKES[char]`, rend les paths dans un `<svg viewBox="0 0 109 109">` avec grille (lignes + carré pointillé). Animation CSS `kana-stroke` (`@keyframes` dans `globals.css`) : `strokeDasharray/Offset: 1` + `pathLength="1"` → dessin trait par trait. `DURATION=0.65s`, `DELAY=0.5s` entre traits. Bouton ↺ replay (incrémente `animKey`). Badge "N traits".

**`LessonPlayer.tsx`** — machine à 4 phases :
- `"slides"` : slides kana/vocab avec `KanaStrokeOrder` (220px) à gauche, Memory Hook (image 260px fixed) à droite. Navigation ← Retour / Suivant. Dernier slide → "Commencer les exercices →"
- `"exercise-start"` : overlay `position:fixed; inset:0; z-50` blanc. Recap des kana appris en pills (72px), bouton "Commencer les exercices →" + "← Revoir les kana"
- `"exercises"` : overlay fullscreen. Progress bar en haut, header "Exercices — Leçon N", compteur N/total. `ExerciseScreen` centré `maxWidth:600`. Mauvaise réponse → feedback bar rouge + "Continuer →"
- `"result"` : overlay fullscreen. Score, étoiles (1–3), +XP, bouton "Leçon suivante →"

**Pièges** :
- `alignItems: "flex-start"` obligatoire sur le parent flex de `KanaSlideView` — sinon le panneau Memory Hook s'étire à toute la hauteur de la page
- Les phases `exercise-start`, `exercises`, `result` sont des overlays `position:fixed` rendus APRÈS le body div (qui a `flex:1`) — sinon elles se retrouvent poussées en bas de page
- Ne jamais refaire de `fetch` dans `KanaStrokeOrder` — les paths sont bundlés statiquement dans `kana-strokes.ts` pour éviter les requêtes réseau à chaque slide

**Pièges Windows dev** :
- `.next\trace` peut être verrouillé par d'anciens processus node. Si `Remove-Item -Recurse -Force .next` échoue : `taskkill /F /IM node.exe` puis supprimer
- Ne pas lancer `npm run dev` manuellement depuis Claude — c'est l'utilisateur qui gère le serveur

### Interface Admin (`/admin`)

Accessible uniquement aux utilisateurs avec `User.isAdmin = true`. Protégée par `src/middleware.ts` (withAuth) : redirige vers `/home` si token sans `isAdmin`. Après avoir ajouté `isAdmin` en DB, se déconnecter + reconnecter pour rafraîchir le JWT.

**Structure des routes admin** :
```
/admin                    → Dashboard (stats globales)
/admin/cities             → Liste des villes (CityRecord)
/admin/cities/[id]        → Édition ville
/admin/pois               → Liste des POIs (POIRecord)
/admin/pois/[id]          → Édition POI
/admin/lessons            → Liste des leçons
/admin/lessons/[id]       → Éditeur de leçon avec step builder
/admin/quests             → Liste des quêtes
/admin/sns                → Liste des conversations SNS (SnsConversation)
/admin/sns/[id]           → Éditeur conversation SNS (métadonnées + contact JSON + steps JSON)
/admin/events             → Liste des évènements (seasonal + daily templates + instances). Filtres par type, toggle isActive, suppression. Badges Quête/Leçon.
/admin/characters         → Liste des personnages
/admin/users              → Liste des utilisateurs
/admin/export-import      → Export JSON + Import JSON
```

**Layout admin** (`src/app/admin/layout.tsx`) : client component, sidebar fixe avec liens de navigation violet actif. Vérifie `session.user.isAdmin` côté client (double protection après middleware).

**Step builder** (`/admin/lessons/[id]`) : éditeur de leçon en 440 lignes. `StepEditor` avec `defaultData(type)` factory par type. Panneau d'édition inline sous la liste des steps. Sauvegarde via PUT `/api/admin/lessons/[id]/steps/[stepId]` ou POST pour nouveaux steps.

**Auth propagation** — `src/lib/auth.ts` injecte `isAdmin` dans le JWT et la session :
```ts
// jwt callback: token.isAdmin = (user as any).isAdmin ?? false
// session callback: (session.user as any).isAdmin = token.isAdmin
```

**Workflow export/import dev→prod** :
1. En dev : créer/modifier villes, POIs, leçons, quêtes via admin
2. `GET /api/admin/export` → télécharge `sekai-content.json`
3. En prod : `POST /api/admin/import` avec le JSON → upsert idempotent de toutes les entités
4. Le JSON contient : cityRecords, poiRecords, scenes, characters, appearances, quests+tasks+choices, lessons+steps

**Upload assets** : `POST /api/admin/upload` multipart → `public/uploads/{logos|backgrounds|sounds}/`. Types acceptés : images (logo POI, background scène), audio (entrée, ambiance).

### Système d'évènements (`Event`)

`src/lib/events.ts` — types partagés client/serveur.

**Types** :
- `ActiveEvent` — `{ id, type, title, description, poiId, poiName, emoji, color, xpReward, questId, lessonId, imageUrl, expiresAt }`
- `EventsResponse` — `{ seasonal: ActiveEvent[], daily: ActiveEvent[] }`
- `formatExpiry(expiresAt, type)` — retourne `"encore Xh Ymin"` (daily) ou `"jusqu'au DD mois"` (seasonal)

**Deux types d'events** :
- `SEASONAL` : plage mensuelle récurrente chaque année (`startMonth/Day` → `endMonth/Day`). Filtre actif côté serveur par date courante (comparaison `month*100+day`). `expiresAt` calculé au moment de la réponse API = fin de l'occurrence de l'année courante.
- `DAILY_TEMPLATE` : pool de scénarios quotidiens gérés par l'admin (ne s'affichent jamais directement).
- `DAILY_INSTANCE` : générée lazily dans `GET /api/events` si moins de 2 instances actives existent pour la journée. Sélection aléatoire depuis les templates, `endAt = now + 24h`. Clé idempotente : `daily-{templateId}-{YYYY-MM-DD}`.

**POIs event** : chaque event pointe vers un `POIRecord` dédié (ID `event-*`), décalé de ~80-100m par rapport aux POIs existants voisins pour éviter le chevauchement visuel sur la carte.

**Carte** (`GameMap3D`) :
- `visibleEvents` = events non expirés (`expiresAt > now`, réévalué chaque minute).
- Les event POI IDs sont exclus du rendu normal (pas de double marker).
- Markers event : classe `gm3d-poi--event`, badge fond `var(--pc)`, texte blanc, emoji 34px, anneau beacon pulsant (`gm3d-event-pulse` + `::before` décalé 1.3s → `@keyframes eventPulse`).
- À expiration, le marker disparaît automatiquement sans rechargement.

**Évènements seedés** (2 saisonniers + 3 daily templates) :
| ID | Type | Période |
|---|---|---|
| `event-sakura-ueno` | SEASONAL | 15 mar → 10 mai |
| `event-halloween-shibuya` | SEASONAL | 1 oct → 5 nov |
| `event-daily-lost-tourist` | DAILY_TEMPLATE | — |
| `event-daily-lost-wallet` | DAILY_TEMPLATE | — |
| `event-daily-photo` | DAILY_TEMPLATE | — |

### Système d'objectifs du jour (`src/lib/daily-goals.ts`)

Sélection déterministe : `dayIndex = floor((Date.now() - 2026-01-01 UTC) / 86400000) % 14` → même 3 objectifs pour tous les utilisateurs le même jour (pas de seed DB, purement calculé).

**10 types d'objectifs** (`GoalType`) :

| Type | Label | Cible | Source de vérification |
|---|---|---|---|
| `complete_quest` | Complète une quête | 1 | `UserQuestProgress.completedAt >= todayUTC` |
| `complete_2_quests` | Complète 2 quêtes | 2 | idem, count >= 2 |
| `complete_lesson` | Valide une leçon (≥80%) | 1 | `UserLessonProgress.completedAt + validated` |
| `complete_2_lessons` | Valide 2 leçons | 2 | idem, count >= 2 |
| `finish_session` | Termine une conversation | 1 | `SessionRecord.createdAt >= todayUTC` |
| `complete_3_sessions` | Lance 3 conversations | 3 | idem, count >= 3 |
| `complete_sns` | Complète une discussion SNS | 1 | `UserSnsProgress.completedAt >= todayUTC` |
| `practice_vocab_5` | Révise 5 mots | 5 | `UserVocabProgress.lastSeenAt >= todayUTC`, count |
| `practice_vocab_10` | Révise 10 mots | 10 | idem, count >= 10 |
| `quest_and_lesson` | Quête + leçon | 2 | min(quests,1) + min(lessons,1) |

**14 sets rotatifs** — cycle de 2 semaines, ex : Jour 0 = [quête, leçon, 5 mots], Jour 1 = [session, SNS, 5 mots], Jour 2 = [2 quêtes, 10 mots, leçon]…

**`GoalResult`** : `{ type, label, icon, done, progress, target }` — `progress` clampé à `target`.

**Hook `useDailyGoals`** (`src/hooks/useDailyGoals.ts`) — fetch `GET /api/daily-goals` au mount, expose `{ goals, loading, doneCount }`. Utilisé dans `HomeClient` et `CityClient` (remplace l'ancien tableau statique `DAILY_GOALS`).

### Scripts de maintenance DB (`scripts/`)

- `scripts/jlpt-vocab.js` — applique le vocab JLPT N5/N4/N3 à toutes les quêtes Tokyo (8 mots/quête). `node scripts/jlpt-vocab.js`
- `scripts/update-ai-tasks.js` / `apply-ai-tasks-all.js` / `restore-qcm-tasks.js` — gestion des tâches IA vs QCM.
- `scripts/generate-poi-doc.js` — génère `POIs_Tokyo_SekaiTalk.html` (document Word-compatible avec tous les POIs, quêtes, tâches, vocab). `node scripts/generate-poi-doc.js`
- `scripts/scrape-busuu.js` — scraper Playwright pour récupérer le contenu pédagogique Busuu (nécessite `.env.busuu` avec `BUSUU_EMAIL` + `BUSUU_PASSWORD`, résolution CAPTCHA manuelle).

### Favicon

`public/favicon-icon.png` — favicon du site (fichier PNG dédié, distinct du logo). Référencé dans `src/app/layout.tsx` via `export const metadata`:
```ts
icons: {
  icon: "/favicon-icon.png",
  shortcut: "/favicon-icon.png",
  apple: "/favicon-icon.png",
},
```
**Piège** : `src/app/favicon.ico` prend la priorité sur `icon.png` et les métadonnées `icons` — s'il existe, le supprimer. Hard refresh (Ctrl+Shift+R) nécessaire après changement (cache navigateur).

### SessionProvider
`src/app/providers.tsx` wrappe l'app avec le `SessionProvider` NextAuth, inclus dans `src/app/layout.tsx`.

### Assets publics (`public/`)

Les assets visuels et sonores sont dans `public/` et servis statiquement.

**`public/characters/`** — portraits personnages (PNG sans fond, fond transparent). Un fichier par personnage, nommé par rôle :
- Existant : `konbini_vendor.png` (Kenji, Hana, Taro — konbinis génériques)
- Nouveaux (22) : `airport_agent.png`, `jr_agent.png`, `shinkansen_staff.png`, `capsule_hotel_staff.png`, `grand_hyatt_staff.png`, `seven_eleven_staff.png`, `lawson_staff.png`, `pharmacist.png`, `postal_staff.png`, `starbucks_staff.png`, `mcdo_staff.png`, `izakaya_staff.png`, `shibuya109_staff.png`, `donki_staff.png`, `yodobashi_staff.png`, `skytree_guide.png`, `meiji_miko.png`, `sensoji_monk.png`, `museum_guide.png`, `big_echo_staff.png`, `maid_cafe_staff.png`, `hospital_nurse.png`
- Fallback si image manquante : `default.png` (défini dans le seed)

**`public/backgrounds/`** — fonds de scène (PNG, ratio ~16:9 ou ~4:3). Un fichier par lieu :
- Existants : `konbini.jpg`, `aeroport_tutoriel.avif`
- Nouveaux (26) : `familymart.png`, `lawson.png`, `7eleven.png`, `jr_station.png`, `shinkansen.png`, `haneda_airport.png`, `capsule_hotel.png`, `grand_hyatt.png`, `pharmacy.png`, `post_office.png`, `starbucks_shibuya.png`, `mcdo.png`, `asahi_izakaya.png`, `shibuya109.png`, `donki.png`, `yodobashi.png`, `tokyo_skytree.png`, `tokyo_tower.png`, `meiji_jingu.png`, `sensoji.png`, `tokyo_national_museum.png`, `karaoke.png`, `maid_cafe.png`, `hospital.png`, `sakura_ueno.png`, `shibuya_halloween.png`
- Fallback si background manquant : `background_placeholder.png`

**`public/sounds/`** — sons (MP3). Deux types :
- **Sons d'entrée** (`*_enter.mp3`) : joués une fois à l'ouverture d'un POI. `konbini_enter.mp3` (existant), `familymart_enter.mp3`, `haneda_enter.mp3`, `jr_enter.mp3`, `shop_bell_enter.mp3`, `sliding_door_enter.mp3`
- **Sons d'ambiance** (`*_ambient.mp3`) : loop en fond de conversation. `haneda_ambient.mp3`, `jr_ambient.mp3`
- Assignation dans `prisma/seed.ts` — `TOKYO_SCENES` + les 3 konbinis du haut

**Mappings sons d'entrée par contexte** :
- `familymart_enter.mp3` → konbinis (familymart, konbini-shinjuku, konbini-shibuya)
- `konbini_enter.mp3` → 7-Eleven, Lawson
- `jr_enter.mp3` → gares JR (jr-shinjuku, tokyo-station-shinkansen)
- `haneda_enter.mp3` → aéroport Haneda
- `sliding_door_enter.mp3` → capsule hotel, grand hyatt, poste, hôpital
- `shop_bell_enter.mp3` → tous les commerces/restaurants/loisirs (Starbucks, McDo, Donki, Yodobashi, karaoke, maid café, etc.)

### Pièges CSS connus

- **Modale flex collapse** : ne jamais utiliser `flex flex-col` + `max-height` + enfant `flex-1 overflow-y-auto` sans `min-h-0` — le contenu collapse et devient invisible. Utiliser le pattern "scrollable outer" : `fixed inset-0 overflow-y-auto` → `flex min-h-full items-center justify-center` → carte en bloc naturel.
- **Fixed + overflow-hidden parent** : les éléments `fixed` ne sont pas clippés par `overflow-hidden` des parents (sauf si le parent a `transform`/`filter`/`perspective`). Le `pointer-events-none` du root CityClient est hérité CSS — toujours mettre `pointer-events-auto` sur les modales fixes.
- **HomeShell pointer-events hérité** : HomeShell wrappe `children` avec `pointer-events: none` sur `/home` et les pages city. Tout composant rendu dans `HomeClient` ou `CityClient` (overlays, modales, TutorialLayer) qui doit être cliquable **doit** avoir `pointerEvents: "auto"` sur son élément racine, même s'il est `position: fixed`. La propriété CSS `pointer-events` s'hérite même à travers les éléments fixed. Concerne : `TutorialLayer` (déjà géré dans `GuideDialogue`), `PricingModal` (backdrop fixe), `SnsOverlay`, `RevisionOverlay`.
- **Canvas Mapbox opaque** : `mapboxgl-map` a `background: #000` par défaut dans `mapbox-gl.css` — les coins non-rendus apparaissent noirs. Fix dans `globals.css` : `.mapboxgl-map, .mapboxgl-canvas-container, .mapboxgl-canvas { background: transparent !important; }`. Ne fonctionne QUE si le style Mapbox n'a pas de layer `background` opaque (utiliser un style JSON inline sans background layer, pas `dark-v11`).
- **Gradient derrière le canvas Mapbox** : un `<div>` overlay CSS est toujours AU-DESSUS du canvas (y compris sur la terre). Pour qu'un gradient/pattern soit visible uniquement sur l'océan, le placer AVANT le `<Map>` dans le DOM avec `z-index` inférieur — le canvas opaque masquera le div sur la terre, le div sera visible à travers les pixels transparents (océan).
