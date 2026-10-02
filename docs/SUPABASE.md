# Supabase development setup

This replaces Firebase Auth, Realtime Database, and avatar storage. Existing Firebase development data is not imported or deleted. The old Firebase project can be retired separately after verification.

1. Create a Supabase development project.
2. Run `supabase/migrations/202609190001_initial.sql` once in its SQL editor (or apply it with the Supabase CLI migration workflow). This creates tables, signup initialization, access policies, atomic reward/shop functions, the avatar bucket, and Realtime publication entries.
3. Copy `.env.example` to `.env.local`. Enter the project URL and **publishable** key from the project's Connect dialog. Never put a secret/service-role key or Canvas token in an `EXPO_PUBLIC_` variable.
4. Restart Expo with `npm start -- --clear`.
5. Create a new account. If email confirmation is enabled, confirm the email and return to the app to log in. Configure the Auth Site URL to a real confirmation landing page; for local testing only, you can disable Confirm email in the Email provider settings. Guest mode runs without a configured backend.

New accounts start with 25 coins, 0 XP, 0 streak, 0 completed tasks and the three default shop items. Guest mode retains the sample profile. Avatars are public images, with uploads restricted to each user's own folder and a 5 MB limit; never use the bucket for private files.

## Verification

Run `npx tsc --noEmit` and `npm run lint`. Against a local Supabase database with the migration applied, run:

```sh
psql "$SUPABASE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/permissions_and_rewards.sql
```

The SQL test creates two temporary users, verifies ownership rules, protected balances, shop purchases, and duplicate task/activity rewards, and rolls back all fixtures.

Before releasing, verify signup/confirmation, persisted login after restarting, logout, task CRUD, cross-device task/profile updates, shop purchases, avatar uploads on iOS/Android/web, and failures while offline against a real Supabase project.

## Current scope

- Task completion, XP, coins and pet feeding are committed in one transaction. Reopening and completing the same task does not award another reward.
- Purchases and equipment ownership are checked in the database against `shop_items`. Keep the frontend shop catalog and this table synchronized when prices or items change.
- Habits and quests still use the existing local demo progress. Claims are stored: habits once per UTC day per ID, quests once per ID. Habit rewards remain client-reported within a 0–60 XP bound; manual tasks allow 0–1000 XP. This is a development reward system, not verified academic progress. Persist habit/quest definitions and validate progress before introducing a competitive leaderboard.
- The leaderboard remains sample data. Guest changes are in memory.
- New task dates use local calendar dates (`YYYY-MM-DD`); Today/Upcoming compare dates in the device timezone. Older month/day strings are supported using the current year because their original year was not stored. Before Canvas sync, add canonical timestamps for timezone-aware assignment deadlines.
- Canvas authentication and import are not implemented by this migration.

## Next: Canvas

Use a separate Canvas connection per user and institution, with OAuth tokens in a server-only private schema. Keep the Canvas client secret in backend secrets. Add courses and source assignment records with a unique key on connection, course ID and assignment ID. Link tasks to those records; upsert imported deadlines without resetting local completion or issuing rewards during a sync. Use a timestamp for due dates, retaining assignments with no deadline.

Implement OAuth state verification, token refresh, paginated API reads, bounded retry/backoff and disconnect/revocation in server functions. Start with manual refresh, then schedule bounded batches. Multiuser access requires a Canvas developer key approved/enabled by the institution; a Supabase project does not provide that approval.

References: [Supabase Expo auth](https://supabase.com/docs/guides/auth/quickstarts/react-native), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Canvas OAuth](https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth).
