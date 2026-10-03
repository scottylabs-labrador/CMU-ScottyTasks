# ScottyTasks 

<div align="center">
  <img src="./assets/images/Scotty.png" alt="Scotty Mascot" width="120" />
  <br />
  <strong>The Gamified Academic Productivity Hub for Carnegie Mellon University</strong>
  <p>Stay on track, conquer course deadlines, level up with Scotty, and study together with your campus peers.</p>

  <p>
    <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-SDK%2054-black.svg?style=flat&logo=expo" alt="Expo SDK 54" /></a>
    <a href="https://reactnative.dev"><img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg?style=flat&logo=react" alt="React Native" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?style=flat&logo=typescript" alt="TypeScript" /></a>
    <a href="https://canvas.cmu.edu"><img src="https://img.shields.io/badge/CMU-Canvas%20LMS-C41230.svg?style=flat" alt="CMU Canvas" /></a>
    <a href="https://github.com/scottylabs-labrador/CMU-ScottyTasks/tree/dev-new"><img src="https://img.shields.io/badge/Branch-dev--new-success.svg?style=flat" alt="Branch" /></a>
  </p>
</div>

---

## Overview

Carnegie Mellon University students face intense workloads across courses like **15-112**, **15-213**, **21-241**, and **10-601**. Generic to-do list apps are dry, clinical, and lack the social connection and academic context of the CMU experience.

**ScottyTasks** re-imagines student time management by pairing:
1. **Frictionless Academic Task and Habit Management**: Fast organization of course assignments, priority tiers, and deadlines.
2. **Scotty the Mascot Companion**: An interactive, gamified pet who reacts to your daily academic momentum.
3. **Peer Accountability & Course Rankings**: Course-filtered study tracking and leaderboards so you never feel alone during late-night study sessions.
4. **Canvas LMS Integration (Roadmap)**: Automated homework syncing straight from CMU Canvas.

---

## Key Features

### 1. Course-Tagged Task Management
- Categorize assignments by specific CMU courses (`15-112`, `10-601`, `Math`, `Writing`).
- Dynamic priority levels (`High`, `Medium`, `Low`) with XP bounties that reward hard work.
- Date and time pickers with intuitive filtering for **All**, **Today**, and **Upcoming** deadlines.

### 2. Daily Habits & Wellness Tracker
- Built-in recognition that academic performance depends on physical and mental wellness.
- 7-day completion matrices for tracking habits: hydration, sleep schedules, exercise, and lecture reviews.
- Streak counters that reward consistency with daily streak multipliers.

### 3. Scotty’s Yard & Happiness Loop
- Scotty lives on your home screen and reacts in real-time to your study habits.
- **Feed & Happiness System**: Completing tasks feeds Scotty treats, raising his happiness from *Sleepy* to *Ecstatic*.
- **1.25× XP Streak Buff**: Keeping Scotty happy unlocks bonus XP multipliers to accelerate leaderboard climbs.
- **Custom Avatar Uploads**: Personalize your student profile with custom photos and avatar management.

### 4. Campus Quests & Traditions
- Complete CMU-themed milestones that celebrate campus culture:
  - *Paint the Fence on The Cut*
  - *Buggy Spectator on Frew Street*
  - *Dean’s Honors Academic Sprints*
  - *Tartan Game Day Traditions*

### 5. Class & Course Leaderboards
- Compare your semester XP and study milestones against classmates.
- Filter rankings by course cohorts (`All Students`, `15-112`, `10-601`) with podium highlights.

---

## Architecture & Tech Stack

```
D:\ScottyTasks\
├── app/                       # Expo Router v6 file-based navigation
│   ├── (tabs)/                # Bottom tab navigators (Tasks, Habits, Scotty, Quests, Ranks)
│   ├── _layout.tsx            # Root layout with dark theme & auth guards
│   ├── login.tsx              # Authentication entry
│   └── signup.tsx             # New user registration
├── components/                # Component-Driven Development (CDD) structure
│   ├── ui/                    # Pure presentational primitives (ScreenContainer, Title, Card, Pill)
│   ├── tasks/                 # Task feature components (TaskCard, TaskHeroBanner)
│   ├── habits/                # Habit feature components (HabitRing, HabitWeekRow)
│   ├── quests/                # Quest feature components (QuestCard, QuestHeroBanner)
│   ├── leaderboard/           # Leaderboard components (Podium, RankRow)
│   └── profile/               # Mascot & profile components (PetYardScene, PetHappinessCard)
├── constants/
│   ├── tokens.ts              # Centralized design tokens (spacing, radii, typography)
│   ├── gamification.ts        # UI_COLORS palette, formulas, quest/badge definitions
│   └── shop.ts                # Profile states and normalization utilities
├── hooks/                     # Decoupled business logic & custom state hooks
│   ├── useTasks.ts            # Task state and CRUD logic
│   ├── useHabits.ts           # Habit tracking and streak calculations
│   ├── useQuests.ts           # Campus quest progression
│   ├── useLeaderboard.ts      # Dynamic rank calculation and course filters
│   └── useUserShopProfile.ts  # Gamification profile & pet happiness management
└── config/
    └── firebase.ts            # Auth, database, and storage configurations
```

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | [Expo SDK 54](https://expo.dev) | Native mobile development with modern Expo toolchain |
| **Runtime** | [React Native 0.81.5](https://reactnative.dev) | React 19 architecture with New Architecture support |
| **Routing** | [Expo Router v6](https://docs.expo.dev/router/introduction/) | Type-safe, file-based routing architecture |
| **Language** | [TypeScript 5.9](https://www.typescriptlang.org/) | Strict type checking across components and hooks |
| **Styling** | Design Token Architecture | CMU Tartan Palette (`#C41230`, `#FFB800`) with standardized scales |
| **Storage / Backend** | Supabase & Firebase | Transitioning to Supabase PostgreSQL + Realtime Presence | https://dtacqzkhqgewwqjpffvq.supabase.co

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **[Node.js](https://nodejs.org/)** (v18.x or v20.x recommended)
- **[npm](https://www.npmjs.com/)** or **yarn**
- **[Expo Go](https://expo.dev/go)** on your mobile device (iOS or Android) OR an emulator (Xcode Simulator / Android Studio)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/scottylabs-labrador/CMU-ScottyTasks.git
   cd CMU-ScottyTasks
   ```

2. **Check out the main branch**:
   ```bash
   git checkout main
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the Expo development server**:
   ```bash
   npm start
   ```

5. **Run on your device**:
   - Scan the QR code in your terminal using the **Expo Go** app (Android) or the **Camera** app (iOS).
   - Press `i` to open the iOS Simulator or `a` to open the Android Emulator.

---

## Product Roadmap

- [x] **Component-Driven Architecture (CDD)**: Modularized presentational primitives and feature components.
- [x] **Scotty Pet Happiness & Feed Loop**: Dynamic mascot reactions and 1.25× XP streak multipliers.
- [x] **User Avatar System**: Custom profile photo uploads via image picker.
- [ ] **CMU Canvas LMS Auto-Sync**: Personal Access Token integration for zero-friction homework syncing.
- [ ] **The Cut Live Focus Hub**: Course-specific Pomodoro timer with live peer presence powered by Supabase Realtime.
- [ ] **Course Study Minutes Leaderboard**: Transition from cosmetic XP to verified time spent studying.
- [ ] **Semester Study Heatmap**: GitHub-style consistency calendar visualization on student profiles.

---

## License & Heritage

ScottyTasks is maintained with pride by students from **[ScottyLabs](https://scottylabs.org/)** at **Carnegie Mellon University**.

*Scotty Dog is the beloved official mascot of Carnegie Mellon University. Go Tartans!*
