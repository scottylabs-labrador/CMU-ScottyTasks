# ScottyTasks

<div align="center">
  <img src="./assets/images/scotty-logo-main.png" alt="Scotty mascot" width="140" />
  <p><strong>A gamified productivity app for Carnegie Mellon University students.</strong></p>
  <p>Manage tasks, build habits, and earn rewards with your own Scotty companion.</p>
</div>

## Features

- **Home:** A personalized greeting, animated Scotty, “Talk to me!” and “Throw treat” buttons, and progress cards for tasks, habits, and quests.
- **Tasks:** An agenda sorted by date or priority, collapsible groups, and calendar navigation. Tasks require a name, priority, and due date; descriptions and times are optional. Completion earns XP and bones.
- **Habits:** Water, Sleep, Hobbies, Exercise, Social, Outdoor, and Custom categories, with yes/no or numeric tracking. Choose units, increments, and optional daily goals. Switch between a compact dog grid and detailed cards; Scotty fills with color as progress increases. Past entries, history, and statistics remain available.
- **Shop:** A panel on Home with hats, glasses, and toys. Preview accessories on Scotty, buy with bones, and place multiple owned toys. Edit each toy’s position or put it away without losing ownership.
- **Profile:** Custom photo uploads, a default Scotty avatar, or “Use my Scotty” to save the current hat-and-glasses look. Settings opens from the profile gear and returns to Profile.
- **Scotty chat:** An authenticated AI companion for task, habit, and shop questions. Replies display your equipped Scotty, with animated dots while thinking. Suggested questions and confirmation buttons support common actions.
- **Quests and rankings:** Campus-themed quests and a leaderboard interface. Rankings currently use sample classmates with the current user’s live XP; they are not a live campus leaderboard.

## Technology

Versions below reflect `package.json`.

| Layer | Technology |
| :--- | :--- |
| App | Expo SDK 58, React Native 0.88.1, React 19.3 |
| Navigation | Expo Router 58 |
| Language | TypeScript 6.0 |
| Backend | Supabase Auth, PostgreSQL, Storage, Realtime, and Edge Functions |
| Chat | Supabase `scotty-chat` Edge Function with Gemini |
| UI and animation | Shared design tokens, React Native Reanimated, and PNG mascot/shop artwork |
| Fonts | Custom Scotty regular/bold fonts via `expo-font` for headings and larger text; system text for smaller copy |

Firebase is no longer the active app backend. Database policies restrict user-owned records, and database functions handle purchases, rewards, and toy placement.

## Local setup

Use Node.js 24 and npm. Run commands from the repository folder containing `package.json`.

```bash
git clone https://github.com/scottylabs-labrador/CMU-ScottyTasks.git
cd CMU-ScottyTasks
git checkout dev
npm install
cp .env.example .env.local
```

Set these values in `.env.local` using your Supabase project’s Connect dialog:

```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is intended for the client. Never place service-role keys, Gemini secrets, or Canvas tokens in `EXPO_PUBLIC_` variables. `.env.local` is ignored by Git; `.env.example` contains placeholders for collaborators.

Configure the database using [Supabase setup](docs/SUPABASE.md). Guest mode can run without backend configuration, but guest progress is temporary and chat requires sign-in. If email confirmation is enabled, confirm your account before signing in.

### Run the app

For Expo Go, use a version compatible with the project’s SDK:

```bash
npx expo start --go
```

For a development build:

```bash
# macOS with Xcode and CocoaPods configured
npm run ios

# Android SDK/emulator configured
npm run android
```

After installing a development build, start its development server with:

```bash
npx expo start --dev-client
```

For web:

```bash
npm run web
```

Restart Expo after changing environment variables. Use `npx expo start --go --clear` or `npx expo start --dev-client --clear` when clearing the bundler cache. Native dependency changes may require rebuilding the development client.

## Supabase and chat setup

See [docs/SUPABASE.md](docs/SUPABASE.md) for schema, permissions, function deployment, and database checks.

- Collaborators using the shared development Supabase project do not need to rerun its migrations. For a new project, apply the SQL files in `supabase/migrations` in filename order.
- Recent additions include task descriptions, accessory purchases, toy placement, chat rate limits, and `202611210004_put_away_toy.sql`. Signed-in users need the put-away migration before that action works.
- Chat requires the deployed `scotty-chat` function and a server-side `GEMINI_API_KEY` secret. `GEMINI_MODEL` is an optional override.
- The function validates the signed-in user and uses a database rate-limit check. Proposed changes require confirmation in the app. Chat history is session-only, not a persistent conversation archive; safety checks are not a guarantee of safe or accurate responses.

### Profile photos

Uploaded photos live in the public Supabase Storage `avatars` bucket; the profile record stores the image URL. Anyone with that URL can view the image. Upload and deletion permissions are restricted to the user’s folder.

Changing or resetting an avatar saves the replacement choice first, then deletes the previous uploaded image. Failed deletions are queued locally for retry. “Use my Scotty” stores the selected outfit in the avatar field, rather than uploading a new image; select it again after changing outfits to update the profile look.

## Project structure

```text
app/                    Expo Router screens, authentication, and tab layouts
components/
  chat/                 Chat overlay and suggested questions
  habits/               Habit cards, dog progress, and logging views
  profile/              Home, profile, shop, dressed Scotty, and toy placement
  settings/             Shared Settings screen
  tasks/                Task cards, calendar, and date picker
  ui/                   Shared controls, avatars, and motion
contexts/               Shared auth, tasks, habits, profile, and chat state
hooks/                  Feature hooks
constants/              Design tokens, settings, habits, and shop catalog
config/supabase.ts      Supabase client and session configuration
utils/                  Date, placement, avatar, and other helpers
assets/                 Fonts and image assets
supabase/functions/     Server-side Scotty chat implementation
supabase/migrations/    Database schema, policies, and functions
supabase/tests/         Database permission and behavior checks
docs/SUPABASE.md        Backend setup and verification
```

## Development checks

```bash
npx tsc --noEmit
npm run lint
```

Database verification commands are in [Supabase setup](docs/SUPABASE.md). Test native layout, keyboard behavior, photo selection, and toy placement on devices as well as checking types and lint.

## Planned work

- Canvas authentication and assignment import; not implemented in the current app.
- Live multiuser leaderboards and peer features.
- Further chat safety evaluation and a defined privacy/retention policy before wider release.
- Device testing and development-build preparation for release.

## About

ScottyTasks is built by students from [ScottyLabs](https://scottylabs.org/) at Carnegie Mellon University.

Go Tartans!
