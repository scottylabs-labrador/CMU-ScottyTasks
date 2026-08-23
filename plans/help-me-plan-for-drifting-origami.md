# Plan: Humanized Layout & Less Overwhelming UI

## Context

The current app leans hard into a gaming aesthetic — pure-black backgrounds, 6+ simultaneous accent colors, infinite looping animations on idle elements, and every screen opens with a large hero banner. Each screen contains 5–7 competing visual elements before the user even starts scrolling. The goal is to reduce cognitive load, add breathing room, and make the app feel warm and approachable (Duolingo / Notion energy) without losing the CMU identity or gamification.

---

## What Changes

### 1. Soften the background and palette

**Problem:** `#0A0A0F` pure black + neon glows is harsh and tiring.

**Fix:**
- Page background: `#0A0A0F` → `#13111F` (warm dark indigo, not cold black)
- Card background: `#1C1C2E` → `#1D1B2E` (slight warmth)
- Reduce the number of active accent colors from 6 down to 2 per screen: CMU red (`#C41230`) as the primary action color, and one supporting warm neutral (`#FFB800` gold for XP only).
- Remove per-screen accent tinting — quests no longer need a purple hero, leaderboard doesn't need a green hero. Use a single consistent card treatment.
- Border glows (colored box-shadows on cards) → remove entirely, replaced by a single 1px `#2A2A40` border. Glow reserved for interactive hover/press only.

---

### 2. Calm down always-on animations

**Problem:** `animate-level-glow` runs forever on the Profile hero; `animate-streak-pulse` runs on the header streak pill and habit totals simultaneously; `animate-shimmer` sweeps the XP bar in a loop. On first load, 3+ things pulse/shimmer at the same time.

**Fix:**
- Remove `animate-level-glow` from Profile hero card entirely (it triggers on every visit).
- Remove `animate-streak-pulse` from the persistent header streak pill — keep the pill, drop the animation. Only trigger it once as a brief pop when the streak increments.
- Keep `animate-shimmer` on the XP bar but reduce opacity of the shimmer band (`rgba(255,255,255,0.05)` instead of `0.08`).
- Keep all interaction-triggered animations (`checkBounce`, `xpFloat`, `confettiFall`, `bounceIn` for level-up, `tabPop`) — these are earned feedback, not ambient noise.

---

### 3. Simplify the persistent header

**Problem:** The sticky header shows title + coin pill + streak pill + full XP bar (level badge + label + fraction + bar). That's 6 visual units always taking up ~80px.

**Fix:**
- Remove coins and streak from the header. Move them to the Profile tab (they live with identity, not navigation).
- Header becomes: screen title (left) + a minimal XP bar (right, no level number, no fraction text — just the bar and level as a small number above it).
- Height reduces from ~80px to ~52px, freeing vertical space on every screen.

---

### 4. Consolidate the Habits screen

**Problem:** Habits appear twice — once as horizontal rings ("Tap to Complete") and again as a full weekly grid for every habit. This is the densest screen.

**Fix:**
- Remove the horizontal rings row. Fold completion into the weekly grid cards directly: tapping anywhere on the card's "today" dot completes it (or add a single tap-to-complete button per card).
- Each habit card: emoji + name + streak on one line, 7-day dot grid below — clean and contained. Add a subtle completion state (card gets a soft green left-border when today is done).
- The header card stays but simplified: just the dog + "X/5 done today" + a progress bar. Remove the "total streak" number from the header (move to the streak section within each card).

---

### 5. Simplify task cards

**Problem:** Each task card has: check button, title, tag badge, course, due date, priority dot + label text, and XP badge — 7 elements in a small card.

**Fix:**
- Remove the priority dot + label text. Priority is already communicated by the left-edge border color — that's enough.
- Move the course label inline with the due date as `15-112 · Today 11:59PM`.
- Keep: check button, title, tag badge, due date+course line, XP badge.
- Result: 5 elements, cleaner.

---

### 6. Remove hero banners from Quests and Leaderboard

**Problem:** Both screens open with a large rounded card (hero banner) summarizing the screen before showing content. It pushes actual content below the fold.

**Fix:**
- **Quests:** Replace hero banner with a simple page subtitle (`6 active quests · 1,500 XP total`) in small muted text below the heading. Filter pills move up as the first interactive element.
- **Leaderboard:** Replace hero banner with an inline rank chip: a small pill reading "You're #4 this week" sits right below the tab switcher, not above it.

---

### 7. Add whitespace and reduce card padding compression

**Problem:** Cards use `p-4` but stack with `mb-3`, and multiple sections compete vertically.

**Fix:**
- Increase spacing between logical sections (`gap-6` between section groupings instead of `gap-4`/`mb-3`).
- Section labels get more breathing room: `mt-6 mb-2` instead of `mb-3`.
- The Quests and Tasks lists get a `space-y-3` wrapper but each card internally gets `p-5` instead of `p-4`.

---

## Files to Change

| File | What changes |
|---|---|
| `src/App.tsx` | All screen components (Tasks, Habits, Quests, Leaderboard, Profile, Header, BottomNav) |
| `src/index.css` | Background tokens, animation opacity tweaks, remove `animate-level-glow` class usage |

No new files needed. `ScottyDog.tsx` is untouched.

---

## Summary of What Stays

- All five screens and their data
- ScottyDog illustration (real asset)
- XP/level system and all interaction animations (checkBounce, xpFloat, level-up modal, confetti)
- CMU red + gold color identity
- Fredoka One display font for headings
- Bottom navigation

---

## Verification

1. Open the app in the preview panel — header should be noticeably slimmer
2. Let it idle for 5 seconds — nothing should be pulsing or shimmering constantly
3. Complete a task → check animation + XP float fire once and stop
4. Navigate to Habits → single card per habit, tap today's dot → card gets green accent
5. Navigate to Quests → filter pills are the first thing visible, no hero banner
6. Navigate to Leaderboard → ranked list is visible without scrolling
7. Navigate to Profile → hero card is still there but not glowing constantly
