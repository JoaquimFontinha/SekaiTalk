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

- `User` — profil central (email, pseudo unique, firstName, lastName, birthDate, image, password haché bcrypt). Champ `isAdmin: Boolean @default(false)` — accès interface admin
- `Account` — méthode de connexion liée à un User (géré par NextAuth)
- `Session` — toujours vide (JWT strategy)
- `CityRecord` — ville gérée via admin (id=slug ex: `"tokyo"`, name, nameJp, centerLat, centerLng, zoom, pitch, bearing, levelRequired, use3DMap, mapImage, mapBoundsJson, isActive). Source de vérité pour le jeu via `getCityFromDB()` — remplace `cities.ts` au runtime
- `POIRecord` — POI géré via admin (id ex: `"tokyo-station-shinkansen"`, cityId FK vers CityRecord, name, type, lat, lng, description, logoPath, isActive). Le jeu lit depuis cette table via `getCityFromDB()`, plus depuis `cities.ts`
- `Character` — personnage IA sans `poiId` (peut apparaître dans plusieurs lieux). Contient `id` stable (ex: `"char-kenji"`), `systemPrompt`, `greetingMessage`, `greetingTranslation`, `greetingWords` (Json — `Word[]` pré-calculé, évite un appel IA au chargement), `image`, `voiceId` (ElevenLabs), `isFriendable` (active la mémoire + outil `remember_fact`)
- `CharacterAppearance` — table de jonction many-to-many `Character ↔ POI`. Champs : `characterId`, `poiId`, `locationContext?` (injection supplémentaire dans le system prompt pour contextualiser le lieu). Contrainte `@@unique([characterId, poiId])`
- `Scene` — décor lié à un POI (`poiId @unique`). Champs : `backgroundImage?`, `entrySound?`, `ambientSound?`. Séparé du personnage car le même lieu peut avoir un autre personnage à l'avenir
- `CharacterMemory` — mémoire persistante par `(characterId, userId, key)`. Valeur mise à jour via upsert. Activée uniquement si `character.isFriendable = true` + utilisateur connecté. Contrainte `@@unique([characterId, userId, key])`
- `Quest` — quête liée à un POI (`poiId`). Plusieurs quêtes possibles par POI, ordonnées par `order`. Champ `vocab Json @default("[]")` — tableau de `VocabEntry[]` prédéfini pour la quête (voir `src/lib/mastery.ts`)
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

### Seed

`prisma/seed.ts` — crée `Scene`, `Character`, `CharacterAppearance`, `Quest`, `Lesson`, `CityRecord` et `POIRecord` avec des IDs stables.
- Personnages : upsert par `id` stable (`"char-kenji"`, `"char-hana"`, `"char-taro"`)
- `greetingWords` et `greetingTranslation` hardcodés dans le seed — pour un nouveau personnage, appeler `/api/analyze` une fois pour générer le breakdown puis le coller dans le seed
- Scènes : upsert par `poiId` (konbini-shinjuku, konbini-shibuya, konbini-kyoto) avec `entrySound: "/sounds/konbini_enter.mp3"`
- Apparitions : upsert par `@@unique([characterId, poiId])`
- Quêtes : `findUnique` + `create` — idempotentes, non recréées si l'ID existe déjà
- Vocab : `quest.update({ data: { vocab: VocabEntry[] } })` après le create — toujours upsertée pour rester à jour
- Quête de test : `quest-konbini-shinjuku-info-1` avec 10 mots (N5 : すみません, どこ, おにぎり, ありますか, いくら, ありがとうございます / N4 : 種類, 新鮮, 冷蔵庫, 今朝)
- **Leçons** : `findUnique` + `create` pour la `Lesson`, puis `deleteMany` + `createMany` pour les `LessonStep` (idempotent, les étapes sont recréées à chaque seed pour rester à jour). **28 leçons** au total — tous les POIs Tokyo (27) + konbini-shinjuku. Chaque leçon a 7 steps : 2 INTRO → PRONUNCIATION → TRUE_FALSE ou CHOOSE_ANSWER → CULTURE_NOTE → MATCH_PAIRS → CHOOSE_ANSWER.
- **CityRecord + POIRecord** : upsert de toutes les villes et POIs depuis `cities.ts` à la fin du seed. 10 villes (tokyo, osaka, kyoto + 7 coming-soon) et 44 POIs Tokyo. Idempotent via `upsert({ where: { id }, create, update })`. Ces enregistrements servent de source de vérité pour le jeu via `getCityFromDB()`.
- **SnsConversation** : upsert des 7 conversations SNS à la fin du seed (`upsert({ where: { id }, update, create })`). IDs stables : `sns-konbini-shinjuku`, `sns-familymart-shibuya`, `sns-donquijote-shibuya`, `sns-starbucks-shibuya`, `sns-jr-shinjuku`, `sns-at-home-cafe-akihabara`, `sns-tokyo-skytree`.

### Navigation et routes

```
/home                          → liste des villes (carte)
/home/[city]                   → carte 3D de la ville (CityClient)
/home/[city]/[poi]             → conversation IA avec le personnage (POIClient)
/home/[city]/[poi]?quest=<id>  → même page, démarre directement la quête
/home/[city]/[poi]/lesson      → leçon interactive du POI (LessonClient)
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
| `/api/chat` | POST | Envoie un message à Claude Haiku. Body : `{messages, systemPrompt, characterId}`. Retourne `{reply, translation, words, suggestions}`. Agentic loop (max 5 tours) avec outil `remember_fact` si personnage `isFriendable`. Parsing JSON en 3 niveaux (strip fences → regex extract → fallback texte brut) |
| `/api/analyze` | POST | Analyse un texte japonais, retourne `{translation, words}`. Usage ponctuel (admin/seed) — ne pas appeler au runtime |
| `/api/transcribe` | POST | Transcrit un audio via Groq Whisper (`language: "ja"`, prompt court `"日本語"`, filtres qualité segments + filtre hallucination) |
| `/api/tts` | POST | TTS ElevenLabs server-side (`{text, voiceId}`), retourne `audio/mpeg` |
| `/api/user/stats` | GET | Stats XP/Yens/niveau de l'utilisateur connecté |
| `/api/contacts` | GET | Liste tous les personnages `isFriendable + isActive` avec `memoryCount` (groupBy CharacterMemory) et `locations` (POIs résolus depuis cities.ts) |
| `/api/quests/poi/[poiId]` | GET | Liste les quêtes d'un POI avec progression utilisateur (inclut `vocab`, `xpReward`, `yenReward`) |
| `/api/quests/[questId]/start` | POST | Crée un `UserQuestProgress` (auth requise) |
| `/api/quests/tasks/[taskId]/complete` | POST | Valide une tâche, débloque la suivante ou termine la quête |
| `/api/session/complete` | POST | Sauvegarde `SessionRecord` + upsert `UserVocabProgress` pour **tous** les mots du vocab de la quête (pas uniquement les mots prononcés). Mots pratiqués : `encounters+1, correctCount+1`. Mots non pratiqués existants : inchangés. Nouveaux mots non pratiqués : `encounters:1, correctCount:0`. Retourne `{ vocabWithMastery }` — chaque mot enrichi de `mastery`, `encounters`, `practiced` |
| `/api/lessons/poi/[poiId]` | GET | Récupère la leçon d'un POI avec ses steps ordonnés et la progression de l'utilisateur connecté (`userProgress` ou `null`) |
| `/api/lessons/[lessonId]/complete` | POST | Reçoit `{ score }`, calcule `validated = score >= 80`, upsert `UserLessonProgress` (ne repasse pas `validated` à `false`), **puis upsert `UserVocabProgress`** pour chaque step INTRO de la leçon (`update: {}` préserve la progression existante, `create` avec `encounters:1, correctCount:0`), retourne `{ validated, score }` |
| `/api/revision/vocab` | GET | Retourne `{ words: RevisionWord[], stats: { toWork, toReview, acquired } }` — tous les mots de l'utilisateur (`encounters > 0`), triés par `lastSeenAt desc`, enrichis du niveau `mastery`. `toWork` = never/new/learning, `toReview` = almost/acquired, `acquired` = perfect |
| `/api/revision/result` | POST | Reçoit `{ results: [{ wordJp, correct }] }`, incrémente `encounters` + `correctCount`/`errorCount` + `lastSeenAt` via la clé `userId_wordJp` |
| `/api/content/cities` | GET | Public (pas d'auth). Retourne `Record<string, CityData>` depuis la DB via `getAllCitiesFromDB()`. `revalidate = 0` (toujours frais). Utilisé par `layout.tsx` et `JapanMap.tsx` pour afficher les villes admin |
| `/api/sns/poi/[poiId]` | GET | Public. Retourne la `SnsConversation` active pour un POI (`isActive: true`), ou `null`. Appelé par `CityClient` à chaque sélection de POI. |
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
- Logos de POI : `src/lib/poi-logos.ts` — `Record<poiId, string>` importé par `GameMap3D` et `CityClient`. Logos dans `public/images/pois/logos/`

### Sidebar CityClient (`src/app/home/[city]/CityClient.tsx`)

La sidebar est **rétractable** : état `sidebarExpanded` (défaut `true`), largeur 448px étendue / 60px collapsée. Transition CSS `transition-all duration-200`. `position: fixed, left: 20px, top: 50%, translateY(-50%)`, hauteur `calc(100vh - 40px)`, `rounded-2xl bg-white`.

**État étendu (448px)** :
- Header : `<img src="/logo_sekai_talk.png">` (h-[120px]) + bouton `ChevronLeft` (collapse + `setSidebarPanel(null)`) — même logo que HomeClient
- **Mon Objectif** : `<MonObjectif />` en haut juste après le header (avant les objectifs du jour)
- Objectifs du jour : 3 tâches avec `CheckCircle2`/`Circle`
- Navigation : `SIDEBAR_BUTTONS` = [Guidage, Lieux, Contacts, Évènements, Révision] — **tous enabled: true**. Icônes SVG colorées inline (pas de lucide-react). Type `{ panel, label, enabled, color, svg: React.ReactNode }`. Section `flex-1`.
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

**Panneau Évènements** (`sidebarPanel === "evenements"`, 380px) — placeholder vide.

**Panneau Guidage** (`sidebarPanel === "guidage"`, 380px) — premier item de navigation. Affiche le système de guidage contextuel (`src/lib/guidage.ts`).

**Panneau Révision** — désactivé dans `CityClient` (`enabled: false`), à implémenter. Actif dans `HomeClient` via bouton "Révision" dans la sidebar (ouvre `RevisionOverlay`).

**HUD top-right** — identique à `HomeClient` (voir section ci-dessous). Positionnement : `right: selectedPoi ? 440 : 20`.

**Titre ville** : `position: absolute, top: 20`, `left: sidebarPanel ? 864 : sidebarExpanded ? 488 : 96` — se décale dynamiquement selon l'état sidebar/panneau.

**Drawer POI** (420px, `right-0`, slide-in, fond `bg-gray-950/96`)
- Hero image ou gradient par type. Titre, description, leçon (si disponible) puis quêtes avec barre de progression.
- **Section Leçon** : fetche `GET /api/lessons/poi/${poiId}` en parallèle avec les quêtes. État `lessonData` : `null` (chargement) | `"none"` (aucune leçon) | `{ id, title, validated, score }`. Affiche un spinner puis une carte avec GraduationCap, statut ("Non commencée" / score précédent / "Validée ✓") et bouton "🎓 Commencer la leçon" / "🔄 Réessayer" / "🔄 Refaire la leçon". Navigue vers `/home/${citySlug}/${poi.id}/lesson`.
- Bouton "▶ Faire la quête" / "🔄 Refaire" → ouvre `questPreview` (état local).
- **Section SNS** : si `snsConversation` (state, fetchée via `GET /api/sns/poi/[poiId]` à la sélection du POI) est non-null, affiche une carte verte "Discussion SNS" avec l'avatar/nom du contact, le contexte et les XP. Clic → `setShowSns(true)` → `SnsOverlay`. State `snsConversation` réinitialisée à `null` à chaque changement de POI.
- Pas de bouton "Conversation libre" — toute navigation vers un POI requiert un `questId`.

**Modale prévisualisation quête** (`questPreview` state)
- Overlay `fixed inset-0 overflow-y-auto` (pattern scrollable-outer) → carte `max-w-2xl` centrée.
- Affiche : nom du POI + titre + description + récompenses (XP/Yens) + nombre de tâches.
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

**Interactivité** : `dragPan`, `scrollZoom`, `touchZoomRotate` activés. `minZoom=5.4` (zoom initial = minimum), `maxZoom=9`, `maxBounds=[[122,23],[155,47]]`. Plus de navigation hors du Japon.

**Centrage avec sidebar** : `onLoad` → `map.setPadding({ left: 468 })` + `map.jumpTo({ center: [136.5, 36.8], zoom: 5.4 })`. Le `setPadding` décale le centre optique de Mapbox pour compenser la sidebar. `initialViewState` seul ne suffit pas car la map est persistante (montée une fois). `CENTER_LNG=136.5`, `CENTER_LAT=36.8`, `INIT_ZOOM=5.4`, `SIDEBAR_PX=468`.

**`japanFlyToRef`** : enregistré dans `onLoad` → `japanFlyToRef.current = (lng, lat, zoom=7) => map.flyTo(...)`. Appelé par `HomeClient` (panneau Lieux) pour zoomer sur une ville.

**Canvas transparent** : override CSS dans `globals.css` :
```css
.mapboxgl-map, .mapboxgl-canvas-container, .mapboxgl-canvas { background: transparent !important; }
.mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { display: none !important; }
```

**Gradient** : `background: radial-gradient(ellipse farthest-corner at 54% 50%, #3a5fa0, #1a3568)` sur le container.

**Pins** : classe `gm3d-poi japan-poi` (double classe — `japan-poi` applique des overrides CSS plus grands : badge 36×36px, icône 30px, texte 12px). `CITY_LOGOS: Record<string, string> = { tokyo: "/images/cities/tokyo_home.svg" }` — affiche le SVG de la tour si disponible, sinon emoji 🗾.

**`gm3d-city-label`** : pill sombre `background: rgba(0,0,0,0.48)`, `padding: 3px 7px`, `border-radius: 4px` — assure la lisibilité sur le fond beige/terre.

**Lock logic** : `city.levelRequired > (userStats?.level ?? 0)` — `?? 0` garantit que les villes `levelRequired: 99` restent verrouillées même sans session.

**Cities coming soon** (`levelRequired: 99`) : Nara, Hiroshima, Sapporo, Nikkō, Nagoya, Fukuoka, Beppu.

**Architecture persistante** — `PersistentJapanMap` dans `src/app/home/layout.tsx` :
```tsx
<div style={{ position:"fixed", inset:0, zIndex:0,
  visibility: isOnHomePage ? "visible" : "hidden",
  pointerEvents: isOnHomePage ? "auto" : "none" }}>
  <JapanMap />
</div>
```

**Footer links** : `HomeShell` dans `layout.tsx` rend un `div` fixe `bottom: 16, right: 20` avec 5 liens semi-transparents : À propos, Blog, Efficacité, Termes, Confidentialité. `pointer-events: auto` explicite. Visibles sur toutes les pages `/home/*`.

### Page `/home` — `HomeClient.tsx`

`src/app/home/HomeClient.tsx` — UI overlay de la page d'accueil (carte Japon). Deux éléments principaux :

**Sidebar flottante** (`position: fixed, left: 20px, top: 50%, translateY(-50%)`)
- Toujours déployée (pas de toggle), largeur 448px, hauteur `calc(100vh - 40px)`
- `overflow-y: auto` pour les petits écrans
- Sections :
  1. **Header** — `<img src="/logo_sekai_talk.png">` `h-[120px]`, `border-b border-gray-200`
  2. **Objectifs du jour** (`id="tut-home-daily"`) — 3 tâches avec `CheckCircle2` / `Circle` (statiques)
  3. **Navigation** (`id="tut-home-nav"`) — icônes SVG colorées inline. **Lieux** enabled → ouvre panneau flottant `showLieux`. Contacts/Évènements disabled. **Révision** enabled → ouvre `RevisionOverlay`. Section `flex-1`.
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

Modal plein-écran de révision style Busuu. Accessible via le bouton **Révision** dans la sidebar de `HomeClient` (et désactivé dans `CityClient`). Overlay `fixed inset-0 z-[2000] bg-white`.

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

### Carte 3D Tokyo (`GameMap3D`)

`src/app/home/[city]/GameMap3D.tsx` — carte 3D interactive pour les villes avec `use3DMap: true` dans `cities.ts`.
- **Rendu** : Mapbox GL JS + react-map-gl v8 (`react-map-gl/mapbox`), style `mapbox://styles/mapbox/standard`
- **Architecture persistante** : la map est montée une seule fois dans `src/app/home/layout.tsx` (jamais démontée) → 1 seul Map Load par session. CSS `visibility` toggle pour afficher/masquer. État partagé via `src/app/home/MapContext.tsx` (`mapRef`, `activeType`, `poiClickRef`, `mapBgClickRef`)
- **Clic fond de carte** : `onMapBgClick` prop sur `GameMap3D` → `onClick` sur `<Map>` (les markers ont `stopPropagation`). Enregistré par `CityClient` via `mapBgClickRef` → ferme le panneau sidebar actif (`setSidebarPanel(null)`)
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

**Accès restreint** : `POIClient` redirige vers `/home/[city]` si aucun `questId` dans les params URL — pas de conversation libre possible.

**Tracking session** (réinitialisé à chaque nouvelle quête) :
- `sessionStartRef` — timestamp `Date.now()` au lancement
- `sessionErrors` — incrémenté à chaque mauvaise réponse au quiz
- `sessionSuggestionsUsed` — incrémenté à chaque ouverture du panneau suggestions
- `sessionPracticedVocab (Set<string>)` — mots `jp` de la **quête courante** détectés (envoyés à `/api/session/complete`)
- `sessionAllDetectedVocab (Set<string>)` — mots `jp` détectés dans **toutes les quêtes du POI** (pour le compteur stats uniquement)
- `allPoiVocabRef` — vocab dédupliqué de toutes les quêtes du POI, peuplé au chargement depuis `GET /api/quests/poi/[poiId]`

**Modales post-quête** (toutes en `fixed inset-0 overflow-y-auto` — pattern scrollable-outer) :
- `showQuestComplete` + `completedQuestInfo` → modale sombre (fond glassmorphism). Récompenses XP/Yens + aperçu vocab. Bouton unique : "Terminer la session →" (pas de "Continuer la conversation")
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

**`SuggestionPlayButton`** (composant dans `POIClient.tsx`) :
- Bouton lecture Web Speech API gratuit, dans chaque ligne du panneau Suggestions
- Même UI pill que le bouton replay de la boîte de dialogue : fond `bg-gray-100 border border-gray-200`, `rounded-full`
- Icône haut-parleur SVG + séparateur + bouton vitesse `x1` / `.7x` (toggle)
- `utter.lang = "ja-JP"`, `utter.rate = speed * 0.85`. Cherche une voix japonaise via `getVoices().find(v => v.lang.startsWith("ja"))`
- Un seul bouton replay par suggestion (pas de doublon)

### Whisper — filtres anti-hallucination (`/api/transcribe`)

Whisper hallucine le contenu du prompt quand il n'y a pas de vraie parole.

- **Prompt court** : `"日本語"` uniquement (l'ancien prompt long était reproduit tel quel)
- **Filtre segments** : garde uniquement les segments avec `no_speech_prob < 0.4` et `avg_logprob > -1.0`. Si aucun segment valide → retourne `{ text: "" }`
- **Filtre hallucination** `isHallucination(text)` :
  - Longueur < 3 caractères
  - Texte exact dans `HALLUCINATIONS` : `["日本語", "ご視聴", "字幕", "翻訳", "ありがとうございました", "お願いします。", "です。", "ます。"]`
  - Uniquement ponctuation/espaces : `/^[。、．，\s]+$/`
- Appliqué sur le texte reconstruit des segments ET sur `data.text` (fallback sans segments)

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

### SessionProvider
`src/app/providers.tsx` wrappe l'app avec le `SessionProvider` NextAuth, inclus dans `src/app/layout.tsx`.

### Pièges CSS connus

- **Modale flex collapse** : ne jamais utiliser `flex flex-col` + `max-height` + enfant `flex-1 overflow-y-auto` sans `min-h-0` — le contenu collapse et devient invisible. Utiliser le pattern "scrollable outer" : `fixed inset-0 overflow-y-auto` → `flex min-h-full items-center justify-center` → carte en bloc naturel.
- **Fixed + overflow-hidden parent** : les éléments `fixed` ne sont pas clippés par `overflow-hidden` des parents (sauf si le parent a `transform`/`filter`/`perspective`). Le `pointer-events-none` du root CityClient est hérité CSS — toujours mettre `pointer-events-auto` sur les modales fixes.
- **HomeShell pointer-events hérité** : HomeShell wrappe `children` avec `pointer-events: none` sur `/home` et les pages city. Tout composant rendu dans `HomeClient` ou `CityClient` (overlays, modales, TutorialLayer) qui doit être cliquable **doit** avoir `pointerEvents: "auto"` sur son élément racine, même s'il est `position: fixed`. La propriété CSS `pointer-events` s'hérite même à travers les éléments fixed. Concerne : `TutorialLayer` (déjà géré dans `GuideDialogue`), `PricingModal` (backdrop fixe), `SnsOverlay`, `RevisionOverlay`.
- **Canvas Mapbox opaque** : `mapboxgl-map` a `background: #000` par défaut dans `mapbox-gl.css` — les coins non-rendus apparaissent noirs. Fix dans `globals.css` : `.mapboxgl-map, .mapboxgl-canvas-container, .mapboxgl-canvas { background: transparent !important; }`. Ne fonctionne QUE si le style Mapbox n'a pas de layer `background` opaque (utiliser un style JSON inline sans background layer, pas `dark-v11`).
- **Gradient derrière le canvas Mapbox** : un `<div>` overlay CSS est toujours AU-DESSUS du canvas (y compris sur la terre). Pour qu'un gradient/pattern soit visible uniquement sur l'océan, le placer AVANT le `<Map>` dans le DOM avec `z-index` inférieur — le canvas opaque masquera le div sur la terre, le div sera visible à travers les pixels transparents (océan).
