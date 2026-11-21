# Supabase development setup

This replaces Firebase Auth, Realtime Database, and avatar storage. Existing Firebase development data is not imported or deleted. The old Firebase project can be retired separately after verification.

1. Create a Supabase development project.
2. Apply the files in `supabase/migrations` in filename order. Keep the existing October habit migrations: the chat integration adds `202611210002_chat_rate_limits.sql` without replacing habits or their history. If your project already has the earlier migrations, run only the new chat-rate-limit migration (and any unapplied accessory/toy migrations). Do not rerun older migrations.
3. Copy `.env.example` to `.env.local`. Enter the project URL and **publishable** key from the project's Connect dialog. Never put a secret/service-role key, `GEMINI_API_KEY`, or Canvas token in an `EXPO_PUBLIC_` variable.
4. For the embedded AI chatbot (`supabase/functions/scotty-chat`), store your Gemini key in Supabase Edge Function secrets and deploy the function (`--no-verify-jwt` lets `scotty-chat` verify the user JWT via `supabase.auth.getUser()` directly, avoiding gateway rejections on asymmetric/publishable-key projects):
   ```sh
   npx supabase secrets set GEMINI_API_KEY=your-google-ai-studio-key
   # Optional model override (defaults to gemini-3.5-flash-lite):
   npx supabase secrets set GEMINI_MODEL=gemini-3.5-flash-lite
   npx supabase functions deploy scotty-chat --no-verify-jwt --use-api
   ```
5. Restart Expo with `npm start -- --clear`.
6. Create a new account. If email confirmation is enabled, confirm the email and return to the app to log in. Configure the Auth Site URL to a real confirmation landing page; for local testing only, you can disable Confirm email in the Email provider settings. Guest mode runs without a configured backend.

New accounts start with 25 coins, 0 XP, 0 streak, 0 completed tasks and the three default shop items. Guest mode retains the sample profile. Avatars are public images, with uploads restricted to each user's own folder and a 5 MB limit; never use the bucket for private files.

## Verification

Run `npx tsc --noEmit` and `npm run lint`. Against a local Supabase database with the migration applied, run:

```sh
psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/permissions_and_rewards.sql
psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/habits.sql
```

The SQL test creates two temporary users, verifies ownership rules, protected balances, shop purchases, and duplicate task/activity rewards, and rolls back all fixtures.

Before releasing, verify signup/confirmation, persisted login after restarting, logout, task CRUD, cross-device task/profile updates, shop purchases, avatar uploads on iOS/Android/web, and failures while offline against a real Supabase project.

## Current scope

The Home accessory shop requires `supabase/migrations/202611200001_accessory_shop.sql`.
Toy placement also requires `supabase/migrations/202611210001_toy_placement.sql`.
Apply it after the accessory migration to save each owned toy's position and equip it
atomically. Users place newly purchased toys or edit their position in the Toys tab;
toys cannot be dragged on Home. Guest positions last for the current session.
Run `supabase/tests/toy_placement.sql` to verify ownership, positions, and account isolation.
Apply this migration to your development Supabase project before purchasing hats or glasses
with a signed-in account. It adds equipment fields and four catalog entries priced at 100 bones.
The UI calls the currency **bones**, while the database and reward API retain `coins`;
existing balances, toy purchases, and legacy ownership are preserved. Houses and backgrounds
are no longer offered in the app. Guest purchases remain in memory for the current session.
Run `supabase/tests/accessory_shop.sql` after migrations to verify purchases, ownership,
duplicate charges, balance protection, and account isolation.

- Task completion, XP, coins and pet feeding are committed in one transaction. Reopening and completing the same task does not award another reward.
- Purchases and equipment ownership are checked in the database against `shop_items`. Keep the frontend shop catalog and this table synchronized when prices or items change.
- Habits are persisted per user in `public.habits` and `public.habit_entries` with atomic daily check-ins, numeric logging, and priority-tiered daily rewards via `record_habit_day` and `reset_habit_progress`; quests still use local demo progress with claims stored once per ID in `activity_claims`. Habit rewards remain within a 0–60 XP bound; manual tasks allow 0–1000 XP.
- The embedded Scotty Companion chatbot (`supabase/functions/scotty-chat`) requires a signed-in user JWT, enforces per-user rate limits (`check_chat_rate_limit`), queries user data under RLS, and keeps chat history strictly in-memory per app session.
- The leaderboard remains sample data. Guest changes are in memory.
- New task dates use local calendar dates (`YYYY-MM-DD`); Today/Upcoming compare dates in the device timezone. Older month/day strings are supported using the current year because their original year was not stored. Before Canvas sync, add canonical timestamps for timezone-aware assignment deadlines.
- Canvas authentication and import are not implemented by this migration.

## Next: Canvas

Use a separate Canvas connection per user and institution, with OAuth tokens in a server-only private schema. Keep the Canvas client secret in backend secrets. Add courses and source assignment records with a unique key on connection, course ID and assignment ID. Link tasks to those records; upsert imported deadlines without resetting local completion or issuing rewards during a sync. Use a timestamp for due dates, retaining assignments with no deadline.

Implement OAuth state verification, token refresh, paginated API reads, bounded retry/backoff and disconnect/revocation in server functions. Start with manual refresh, then schedule bounded batches. Multiuser access requires a Canvas developer key approved/enabled by the institution; a Supabase project does not provide that approval.

References: [Supabase Expo auth](https://supabase.com/docs/guides/auth/quickstarts/react-native), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Canvas OAuth](https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth).
