import { useState, useEffect, useRef } from "react";
import ScottyDog from "./ScottyDog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  course?: string;
  dueDate: string;
  xp: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
  tag: string;
}

interface Habit {
  id: string;
  title: string;
  emoji: string;
  streak: number;
  completedToday: boolean;
  weekProgress: boolean[];
  xp: number;
  color: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  xp: number;
  coins: number;
  progress: number;
  total: number;
  completed: boolean;
  category: "cmu" | "academic" | "social" | "wellness";
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  course: string;
  delta: number;
  isMe: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  { id: "1", title: "15-112 HW5 — Recursion", course: "15-112", dueDate: "Today 11:59PM", xp: 120, priority: "high", completed: false, tag: "CS" },
  { id: "2", title: "Read Chapter 7 — Neural Nets", course: "10-601", dueDate: "Tomorrow", xp: 80, priority: "medium", completed: false, tag: "ML" },
  { id: "3", title: "21-241 Matrix Algebra Problem Set", course: "21-241", dueDate: "Thu Nov 14", xp: 100, priority: "high", completed: false, tag: "Math" },
  { id: "4", title: "76-101 Essay Draft", course: "76-101", dueDate: "Fri Nov 15", xp: 90, priority: "medium", completed: true, tag: "Writing" },
  { id: "5", title: "Submit RSVP for Career Fair", course: undefined, dueDate: "Nov 13", xp: 30, priority: "low", completed: false, tag: "Career" },
  { id: "6", title: "67-250 Lab Report", course: "67-250", dueDate: "Wed Nov 13", xp: 75, priority: "medium", completed: false, tag: "Stats" },
];

const INITIAL_HABITS: Habit[] = [
  { id: "1", title: "Morning Run", emoji: "🏃", streak: 14, completedToday: false, weekProgress: [true, true, true, true, true, false, false], xp: 40, color: "#FB923C" },
  { id: "2", title: "No Phone after 11PM", emoji: "📵", streak: 7, completedToday: true, weekProgress: [true, true, false, true, true, true, true], xp: 50, color: "#A855F7" },
  { id: "3", title: "Drink 8 Glasses of Water", emoji: "💧", streak: 21, completedToday: false, weekProgress: [true, true, true, true, true, true, false], xp: 30, color: "#38BDF8" },
  { id: "4", title: "Review Lecture Notes", emoji: "📝", streak: 5, completedToday: false, weekProgress: [false, true, true, true, false, true, false], xp: 60, color: "#4ADE80" },
  { id: "5", title: "Meditate 10 min", emoji: "🧘", streak: 3, completedToday: true, weekProgress: [true, false, false, true, true, true, false], xp: 35, color: "#F472B6" },
];

const INITIAL_QUESTS: Quest[] = [
  { id: "1", title: "Paint the Fence", description: "Be part of CMU tradition! Paint the fence on The Cut.", xp: 500, coins: 200, progress: 0, total: 1, completed: false, category: "cmu", rarity: "legendary" },
  { id: "2", title: "Buggy Spectator", description: "Watch a Buggy race on Frew Street as a CMU student.", xp: 300, coins: 100, progress: 0, total: 1, completed: false, category: "cmu", rarity: "epic" },
  { id: "3", title: "Perfect Week", description: "Complete all habits for 7 consecutive days.", xp: 250, coins: 75, progress: 4, total: 7, completed: false, category: "wellness", rarity: "rare" },
  { id: "4", title: "Study Warrior", description: "Complete 10 assignments this week.", xp: 200, coins: 60, progress: 6, total: 10, completed: false, category: "academic", rarity: "rare" },
  { id: "5", title: "Social Butterfly", description: "Attend 3 campus events this month.", xp: 150, coins: 50, progress: 1, total: 3, completed: false, category: "social", rarity: "common" },
  { id: "6", title: "Tartan Tradition", description: "Wear CMU colors on a game day.", xp: 100, coins: 40, progress: 1, total: 1, completed: true, category: "cmu", rarity: "common" },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Alex Kim", avatar: "🦊", xp: 12450, level: 24, course: "CS '26", delta: 3, isMe: false },
  { rank: 2, name: "Jordan Lee", avatar: "🐺", xp: 11800, level: 23, course: "ECE '25", delta: 1, isMe: false },
  { rank: 3, name: "Sam Rivera", avatar: "🦁", xp: 10900, level: 22, course: "IS '26", delta: -1, isMe: false },
  { rank: 4, name: "You", avatar: "🐾", xp: 9650, level: 19, course: "CS '27", delta: 2, isMe: true },
  { rank: 5, name: "Casey Park", avatar: "🐻", xp: 9200, level: 18, course: "Math '26", delta: 0, isMe: false },
  { rank: 6, name: "Morgan Chen", avatar: "🐯", xp: 8750, level: 17, course: "CS '26", delta: -3, isMe: false },
  { rank: 7, name: "Riley Wang", avatar: "🦋", xp: 8100, level: 16, course: "BXA '27", delta: 5, isMe: false },
];

// ─── XP Float Component ───────────────────────────────────────────────────────

function XPFloat({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="fixed pointer-events-none z-[9999] font-display text-2xl text-cmu-gold"
      style={{
        top: "40%", left: "50%", transform: "translate(-50%,-50%)",
        animation: "xpFloat 1.2s ease-out forwards",
      }}
    >
      +{amount} XP ⚡
    </div>
  );
}

// ─── Confetti Component ───────────────────────────────────────────────────────

function Confetti() {
  const colors = ["#C41230", "#FFB800", "#4ADE80", "#A855F7", "#38BDF8", "#F472B6"];
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            background: colors[Math.floor(Math.random() * colors.length)],
            animation: `confettiFall ${1 + Math.random() * 1.5}s ease-in ${Math.random() * 0.5}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── XP Bar Component ─────────────────────────────────────────────────────────

function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = Math.round((current / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-display text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #C41230, #8B0A20)" }}
      >
        {level}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-text-secondary font-semibold">Level {level}</span>
          <span className="text-xs text-cmu-gold font-mono">{current.toLocaleString()} / {max.toLocaleString()} XP</span>
        </div>
        <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #C41230, #FF6B6B)",
              transition: "width 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div className="animate-shimmer absolute inset-0" />
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({ task, onComplete }: { task: Task; onComplete: (id: string, xp: number) => void }) {
  const [completing, setCompleting] = useState(false);
  const priorityColor = { high: "#C41230", medium: "#FFB800", low: "#4ADE80" }[task.priority];
  const tagColors: Record<string, string> = {
    CS: "#38BDF8", ML: "#A855F7", Math: "#4ADE80", Writing: "#F472B6",
    Career: "#FFB800", Stats: "#FB923C",
  };

  const handleComplete = () => {
    if (task.completed || completing) return;
    setCompleting(true);
    setTimeout(() => {
      onComplete(task.id, task.xp);
    }, 600);
  };

  return (
    <div
      className="relative rounded-2xl p-4 mb-3 transition-all duration-300"
      style={{
        background: task.completed ? "rgba(28,28,46,0.5)" : "#1C1C2E",
        border: `1px solid ${task.completed ? "#2A2A40" : priorityColor + "40"}`,
        opacity: task.completed ? 0.5 : 1,
        transform: completing ? "scale(0.97)" : "scale(1)",
        boxShadow: task.completed ? "none" : `0 0 20px ${priorityColor}18`,
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleComplete}
          className="mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200"
          style={{
            borderColor: task.completed ? "#4ADE80" : priorityColor,
            background: task.completed ? "#4ADE8020" : "transparent",
          }}
        >
          {task.completed && (
            <svg className="task-complete-check w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {completing && !task.completed && (
            <svg className="task-complete-check w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-semibold text-sm leading-tight ${task.completed ? "line-through text-text-muted" : "text-text-primary"}`}>
              {task.title}
            </p>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ background: tagColors[task.tag] + "25", color: tagColors[task.tag] }}
            >
              {task.tag}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            {task.course && (
              <span className="text-xs text-text-muted">{task.course}</span>
            )}
            <span className="text-xs text-text-secondary">{task.dueDate}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: priorityColor }} />
          <span className="text-xs text-text-muted capitalize">{task.priority} priority</span>
        </div>
        <div className="flex items-center gap-1 text-cmu-gold">
          <span className="text-xs">⚡</span>
          <span className="text-xs font-bold font-mono">+{task.xp} XP</span>
        </div>
      </div>
    </div>
  );
}

// ─── Habit Ring ───────────────────────────────────────────────────────────────

function HabitRing({ habit, onComplete }: { habit: Habit; onComplete: (id: string, xp: number) => void }) {
  const [tapped, setTapped] = useState(habit.completedToday);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const streakDays = habit.weekProgress.filter(Boolean).length;
  const dashOffset = circ - (circ * streakDays) / 7;

  const handleTap = () => {
    if (tapped) return;
    setTapped(true);
    onComplete(habit.id, habit.xp);
  };

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
      onClick={handleTap}
      style={{ width: 80 }}
    >
      <div className="relative w-16 h-16">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#2A2A40" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={habit.color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={tapped ? dashOffset - circ / 7 : dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        </svg>
        <button
          className="absolute inset-0 flex items-center justify-center text-2xl transition-transform duration-200"
          style={{ transform: tapped ? "scale(1.2)" : "scale(1)" }}
        >
          {tapped ? "✅" : habit.emoji}
        </button>
      </div>
      <p className="text-xs text-text-secondary font-semibold text-center leading-tight line-clamp-2">{habit.title}</p>
      <div
        className="flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
        style={{ background: habit.color + "25", color: habit.color }}
      >
        🔥 {habit.streak + (tapped && !habit.completedToday ? 1 : 0)}
      </div>
    </div>
  );
}

// ─── Quest Card ───────────────────────────────────────────────────────────────

function QuestCard({ quest }: { quest: Quest }) {
  const rarityColors = {
    common: { bg: "#2A2A40", border: "#4A4A60", text: "#8888AA", label: "Common" },
    rare: { bg: "#1E2A4A", border: "#3B5BDB", text: "#748FFC", label: "Rare" },
    epic: { bg: "#2A1E4A", border: "#7950F2", text: "#9775FA", label: "Epic" },
    legendary: { bg: "#4A1E1E", border: "#C41230", text: "#FF8080", label: "Legendary" },
  };
  const catEmoji = { cmu: "🏫", academic: "📚", social: "👥", wellness: "💚" };
  const r = rarityColors[quest.rarity];
  const pct = (quest.progress / quest.total) * 100;

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        background: r.bg,
        border: `1px solid ${r.border}`,
        boxShadow: quest.rarity === "legendary" ? `0 0 24px ${r.border}30` : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: r.border + "30" }}
        >
          {catEmoji[quest.category]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm text-text-primary">{quest.title}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: r.border + "30", color: r.text }}>
              {r.label}
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">{quest.description}</p>
        </div>
      </div>
      {!quest.completed && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>Progress</span>
            <span>{quest.progress} / {quest.total}</span>
          </div>
          <div className="h-2 bg-bg-deep rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${r.border}, ${r.text})`,
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1 text-cmu-gold text-xs font-bold">
          <span>⚡</span> +{quest.xp} XP
        </div>
        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
          <span>🪙</span> +{quest.coins}
        </div>
        {quest.completed && (
          <span className="ml-auto text-xs font-bold text-xp-green">✓ Complete</span>
        )}
      </div>
    </div>
  );
}

// ─── Leaderboard Entry ────────────────────────────────────────────────────────

function LeaderboardRow({ entry, delay }: { entry: LeaderboardEntry; delay: number }) {
  const medalEmoji = ["🥇", "🥈", "🥉"];
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl mb-2 animate-slide-up"
      style={{
        background: entry.isMe ? "linear-gradient(135deg, #C4123020, #C4123008)" : "#1C1C2E",
        border: entry.isMe ? "1px solid #C41230" : "1px solid #2A2A40",
        animationDelay: `${delay}ms`,
        boxShadow: entry.isMe ? "0 0 20px #C4123030" : "none",
      }}
    >
      <div className="w-8 text-center shrink-0">
        {entry.rank <= 3 ? (
          <span className="text-xl">{medalEmoji[entry.rank - 1]}</span>
        ) : (
          <span className="text-text-muted font-bold font-mono text-sm">#{entry.rank}</span>
        )}
      </div>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: "#2A2A40" }}>
        {entry.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-bold text-sm text-text-primary">{entry.name}</p>
          {entry.isMe && <span className="text-xs text-cmu-red font-bold">(You)</span>}
        </div>
        <p className="text-xs text-text-muted">{entry.course} · Lv.{entry.level}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold font-mono text-cmu-gold">{entry.xp.toLocaleString()}</p>
        <p className="text-xs" style={{ color: entry.delta > 0 ? "#4ADE80" : entry.delta < 0 ? "#F87171" : "#8888AA" }}>
          {entry.delta > 0 ? `▲${entry.delta}` : entry.delta < 0 ? `▼${Math.abs(entry.delta)}` : "—"}
        </p>
      </div>
    </div>
  );
}

// ─── Profile Screen ───────────────────────────────────────────────────────────

function ProfileScreen({ totalXP, level, streak }: { totalXP: number; level: number; streak: number }) {
  const badges = [
    { emoji: "🔥", label: "21-Day Streak", earned: true },
    { emoji: "🎓", label: "Dean's Honors", earned: true },
    { emoji: "🏁", label: "First Quest", earned: true },
    { emoji: "🎨", label: "Painted Fence", earned: false },
    { emoji: "🏆", label: "Top 3 Leaderboard", earned: false },
    { emoji: "⭐", label: "100 Tasks", earned: false },
  ];

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Hero Card */}
      <div
        className="rounded-3xl p-5 text-center relative overflow-hidden animate-level-glow"
        style={{ background: "linear-gradient(135deg, #1C1C2E, #2A1E2E)", border: "1px solid #C41230" }}
      >
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 0%, #C41230, transparent 60%)" }} />
        <div className="relative">
          <div className="flex justify-center mb-2">
            <ScottyDog size={80} style={{ animation: "dogWag 0.8s ease-in-out infinite" }} />
          </div>
          <h2 className="font-display text-2xl text-text-primary mb-0.5">Scotty Jr.</h2>
          <p className="text-sm text-text-secondary mb-4">CMU CS '27 · Pittsburgh, PA</p>
          <XPBar current={totalXP % 1000} max={1000} level={level} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total XP", value: totalXP.toLocaleString(), icon: "⚡", color: "#FFB800" },
          { label: "Day Streak", value: `${streak}🔥`, icon: "🔥", color: "#FB923C" },
          { label: "Tasks Done", value: "47", icon: "✅", color: "#4ADE80" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center" style={{ background: "#1C1C2E", border: "1px solid #2A2A40" }}>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div>
        <h3 className="font-display text-base text-text-primary mb-3">Badges & Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(b => (
            <div
              key={b.label}
              className="rounded-2xl p-3 text-center"
              style={{
                background: b.earned ? "#1C1C2E" : "#13131C",
                border: b.earned ? "1px solid #C41230" : "1px solid #2A2A40",
                opacity: b.earned ? 1 : 0.4,
                boxShadow: b.earned ? "0 0 12px #C4123030" : "none",
              }}
            >
              <div className="text-2xl mb-1">{b.emoji}</div>
              <p className="text-xs text-text-secondary leading-tight">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #2A2A40" }}>
        {["Canvas Integration", "Notification Settings", "Friends & Sharing", "About Scotty Tasks"].map((item, i) => (
          <div
            key={item}
            className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-bg-elevated transition-colors"
            style={{ borderBottom: i < 3 ? "1px solid #2A2A40" : "none", background: "#1C1C2E" }}
          >
            <span className="text-sm text-text-primary font-semibold">{item}</span>
            <span className="text-text-muted text-sm">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Habits Screen ────────────────────────────────────────────────────────────

function HabitsScreen({ habits, onComplete }: { habits: Habit[]; onComplete: (id: string, xp: number) => void }) {
  const completedCount = habits.filter(h => h.completedToday).length;
  const totalStreak = habits.reduce((s, h) => s + h.streak, 0);

  return (
    <div className="px-4 py-4">
      {/* Header Card */}
      <div
        className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1C1C2E, #2A1E2E)", border: "1px solid #A855F740" }}
      >
        <div className="flex items-center gap-4">
          <ScottyDog size={56} />
          <div className="flex-1">
            <p className="text-xs text-text-muted mb-1">Today's Progress</p>
            <div className="flex items-end gap-1">
              <span className="font-display text-3xl text-text-primary">{completedCount}</span>
              <span className="text-text-muted font-semibold mb-1">/ {habits.length}</span>
            </div>
            <div className="h-2 bg-bg-elevated rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(completedCount / habits.length) * 100}%`,
                  background: "linear-gradient(90deg, #A855F7, #C41230)",
                  transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            </div>
          </div>
          <div className="text-center">
            <div className="font-display text-2xl text-streak-orange animate-streak-pulse">{totalStreak}</div>
            <div className="text-xs text-text-muted">total streak</div>
          </div>
        </div>
      </div>

      {/* Habit Rings */}
      <h3 className="font-display text-sm text-text-secondary mb-3 uppercase tracking-widest">Tap to Complete</h3>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-5">
        {habits.map(h => (
          <div key={h.id} className="shrink-0">
            <HabitRing habit={h} onComplete={onComplete} />
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <h3 className="font-display text-sm text-text-secondary mb-3 uppercase tracking-widest">This Week</h3>
      <div className="space-y-3">
        {habits.map(h => (
          <div key={h.id} className="rounded-2xl p-3" style={{ background: "#1C1C2E", border: "1px solid #2A2A40" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{h.emoji}</span>
                <span className="text-sm font-semibold text-text-primary">{h.title}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold" style={{ color: h.color }}>
                🔥 {h.streak}d
              </div>
            </div>
            <div className="flex gap-1.5">
              {["M","T","W","T","F","S","S"].map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-text-muted">{day}</span>
                  <div
                    className="w-full aspect-square rounded-md max-w-[28px]"
                    style={{
                      background: h.weekProgress[i] ? h.color : "#2A2A40",
                      boxShadow: h.weekProgress[i] ? `0 0 6px ${h.color}60` : "none",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tasks Screen ─────────────────────────────────────────────────────────────

function TasksScreen({ tasks, onComplete }: { tasks: Task[]; onComplete: (id: string, xp: number) => void }) {
  const [filter, setFilter] = useState<"all" | "today" | "upcoming">("all");
  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  const totalXpToday = pending.filter(t => t.dueDate.includes("Today")).reduce((s, t) => s + t.xp, 0);

  const filteredPending = filter === "today"
    ? pending.filter(t => t.dueDate.includes("Today") || t.dueDate.includes("Tomorrow"))
    : pending;

  return (
    <div className="px-4 py-4">
      {/* Summary Banner */}
      <div
        className="rounded-3xl p-4 mb-4 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #C4123015, #13131C)", border: "1px solid #C4123040" }}
      >
        <ScottyDog size={48} />
        <div className="flex-1">
          <p className="text-xs text-text-muted">Outstanding</p>
          <p className="font-display text-2xl text-text-primary">{pending.length} tasks</p>
          <p className="text-xs text-cmu-gold mt-0.5">⚡ {totalXpToday} XP available today</p>
        </div>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-transform active:scale-90"
          style={{ background: "#C41230" }}
        >
          +
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "today", "upcoming"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-bold capitalize transition-all duration-200"
            style={{
              background: filter === f ? "#C41230" : "#1C1C2E",
              color: filter === f ? "white" : "#8888AA",
              border: filter === f ? "1px solid #C41230" : "1px solid #2A2A40",
              transform: filter === f ? "scale(1.05)" : "scale(1)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div>
        {filteredPending.map(task => (
          <TaskCard key={task.id} task={task} onComplete={onComplete} />
        ))}
        {done.length > 0 && (
          <>
            <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-3 mt-2">Completed Today</p>
            {done.map(task => (
              <TaskCard key={task.id} task={task} onComplete={onComplete} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Quests Screen ────────────────────────────────────────────────────────────

function QuestsScreen({ quests }: { quests: Quest[] }) {
  const [filter, setFilter] = useState<"all" | "cmu" | "academic" | "wellness">("all");
  const filtered = filter === "all" ? quests : quests.filter(q => q.category === filter);

  return (
    <div className="px-4 py-4">
      {/* Hero */}
      <div
        className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2A1E4A, #1E1E2E)", border: "1px solid #7950F2" }}
      >
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 50%, #7950F2, transparent 60%)" }} />
        <div className="relative flex items-center gap-4">
          <div className="text-5xl">⚔️</div>
          <div>
            <h2 className="font-display text-xl text-text-primary">Active Quests</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {quests.filter(q => !q.completed).length} quests in progress
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold">
              <span className="text-cmu-gold">⚡ {quests.reduce((s, q) => s + q.xp, 0)} XP total</span>
              <span className="text-amber-400">🪙 {quests.reduce((s, q) => s + q.coins, 0)} coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {(["all", "cmu", "academic", "wellness"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold capitalize shrink-0 transition-all"
            style={{
              background: filter === f ? "#7950F2" : "#1C1C2E",
              color: filter === f ? "white" : "#8888AA",
              border: filter === f ? "1px solid #7950F2" : "1px solid #2A2A40",
            }}
          >
            {f === "cmu" ? "🏫 CMU" : f === "academic" ? "📚 Academic" : f === "wellness" ? "💚 Wellness" : "All"}
          </button>
        ))}
      </div>

      {/* Quest list */}
      {filtered.map(q => <QuestCard key={q.id} quest={q} />)}
    </div>
  );
}

// ─── Leaderboard Screen ───────────────────────────────────────────────────────

function LeaderboardScreen() {
  const [tab, setTab] = useState<"class" | "15-112" | "10-601">("class");
  const me = LEADERBOARD.find(e => e.isMe)!;

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div
        className="rounded-3xl p-5 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E2A1E, #1C1C2E)", border: "1px solid #4ADE8040" }}
      >
        <div className="absolute inset-0 opacity-15" style={{ background: "radial-gradient(circle at 50% 0%, #4ADE80, transparent 60%)" }} />
        <div className="relative text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="font-display text-xl text-text-primary">Class Leaderboard</h2>
          <p className="text-sm text-text-secondary mt-1">CMU Fall 2024 · Week 11</p>
          <div
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: "#C4123020", border: "1px solid #C41230" }}
          >
            <span className="text-sm font-bold text-cmu-red">You're #{me.rank}</span>
            <span className="text-xs text-text-muted">of {LEADERBOARD.length} students</span>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        {(["class", "15-112", "10-601"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all"
            style={{
              background: tab === t ? "#4ADE8020" : "#1C1C2E",
              color: tab === t ? "#4ADE80" : "#8888AA",
              border: tab === t ? "1px solid #4ADE80" : "1px solid #2A2A40",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="flex items-end justify-center gap-3 mb-5 px-2">
        {[LEADERBOARD[1], LEADERBOARD[0], LEADERBOARD[2]].map((entry, i) => {
          const heights = ["h-20", "h-28", "h-16"];
          const colors = ["#C0C0C0", "#FFB800", "#CD7F32"];
          const order = [1, 0, 2];
          return (
            <div key={entry.rank} className="flex-1 flex flex-col items-center">
              <div className="text-2xl mb-1">{entry.avatar}</div>
              <p className="text-xs font-bold text-text-primary text-center mb-2">{entry.name.split(" ")[0]}</p>
              <div
                className={`w-full ${heights[i]} rounded-t-xl flex items-center justify-center`}
                style={{ background: colors[i] + "30", border: `1px solid ${colors[i]}60` }}
              >
                <span className="text-lg font-display" style={{ color: colors[i] }}>
                  {order[i] + 1 === 1 ? "🥇" : order[i] + 1 === 2 ? "🥈" : "🥉"}
                </span>
              </div>
              <p className="text-xs font-mono text-cmu-gold mt-1">{entry.xp.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      {/* Full list */}
      <div>
        {LEADERBOARD.map((entry, i) => (
          <LeaderboardRow key={entry.rank} entry={entry} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ active, onTab }: { active: string; onTab: (t: string) => void }) {
  const tabs = [
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "habits", label: "Habits", icon: "🔄" },
    { id: "quests", label: "Quests", icon: "⚔️" },
    { id: "leaderboard", label: "Ranks", icon: "🏆" },
    { id: "profile", label: "Profile", icon: "🐾" },
  ];

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 flex items-end px-2 pb-3 pt-2 z-50"
      style={{
        width: "100%",
        maxWidth: 430,
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(24px)",
        borderTop: "1px solid #2A2A40",
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTab(tab.id)}
          className="flex-1 flex flex-col items-center gap-0.5 py-1 transition-all"
          style={{
            animation: active === tab.id ? "tabPop 0.3s ease-out" : "none",
          }}
        >
          <span
            className="text-xl transition-transform duration-200"
            style={{ transform: active === tab.id ? "scale(1.25)" : "scale(1)" }}
          >
            {tab.icon}
          </span>
          <span
            className="text-xs font-bold transition-colors duration-200"
            style={{ color: active === tab.id ? "#C41230" : "#555570" }}
          >
            {tab.label}
          </span>
          {active === tab.id && (
            <div className="w-1 h-1 rounded-full" style={{ background: "#C41230" }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Level Up Modal ───────────────────────────────────────────────────────────

function LevelUpModal({ level, onDone }: { level: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div
        className="rounded-3xl p-8 text-center animate-bounce-in"
        style={{ background: "linear-gradient(135deg, #1C1C2E, #2A1E2E)", border: "2px solid #C41230", maxWidth: 300, width: "90%" }}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="font-display text-3xl text-cmu-gold mb-1">Level Up!</h2>
        <p className="text-text-secondary mb-4">You reached</p>
        <div
          className="text-7xl font-display text-white mb-4"
          style={{ textShadow: "0 0 30px #C41230" }}
        >
          {level}
        </div>
        <ScottyDog size={60} style={{ animation: "dogWag 0.8s ease-in-out infinite" }} />
        <p className="text-sm text-text-secondary mt-3">Scotty is proud of you! 🐾</p>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);
  const [quests] = useState<Quest[]>(INITIAL_QUESTS);
  const [totalXP, setTotalXP] = useState(9650);
  const [level, setLevel] = useState(19);
  const [streak] = useState(21);
  const [xpFloat, setXpFloat] = useState<{ amount: number; key: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState(false);
  const floatKey = useRef(0);

  const addXP = (amount: number) => {
    floatKey.current += 1;
    setXpFloat({ amount, key: floatKey.current });
    setTotalXP(prev => {
      const next = prev + amount;
      const newLevel = Math.floor(next / 1000) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        setShowConfetti(true);
        setLevelUpModal(true);
        setTimeout(() => setShowConfetti(false), 2500);
      }
      return next;
    });
  };

  const handleTaskComplete = (id: string, xp: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    addXP(xp);
  };

  const handleHabitComplete = (id: string, xp: number) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: true } : h));
    addXP(xp);
  };

  const handleTab = (t: string) => {
    setTab(t);
  };

  const screenTitles: Record<string, string> = {
    tasks: "My Tasks",
    habits: "Habits",
    quests: "Quests",
    leaderboard: "Leaderboard",
    profile: "Profile",
  };

  return (
    <div className="min-h-dvh w-full flex justify-center" style={{ background: "#0A0A0F" }}>
      <div className="relative w-full max-w-[430px] min-h-dvh flex flex-col overflow-hidden">
        {/* Status / Header */}
        <div
          className="sticky top-0 z-40 px-4 pt-12 pb-3"
          style={{ background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #2A2A40" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-display text-xl text-text-primary">{screenTitles[tab]}</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "#1C1C2E", border: "1px solid #2A2A40" }}>
                <span className="text-sm">🪙</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {Math.floor(totalXP / 50)}
                </span>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-streak-pulse"
                style={{ background: "#FB923C20", border: "1px solid #FB923C" }}
              >
                <span className="text-sm">🔥</span>
                <span className="text-sm font-bold text-streak-orange">{streak}</span>
              </div>
            </div>
          </div>
          <XPBar current={totalXP % 1000} max={1000} level={level} />
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto pb-28">
          {tab === "tasks" && <TasksScreen tasks={tasks} onComplete={handleTaskComplete} />}
          {tab === "habits" && <HabitsScreen habits={habits} onComplete={handleHabitComplete} />}
          {tab === "quests" && <QuestsScreen quests={quests} />}
          {tab === "leaderboard" && <LeaderboardScreen />}
          {tab === "profile" && <ProfileScreen totalXP={totalXP} level={level} streak={streak} />}
        </div>

        {/* Bottom Nav */}
        <BottomNav active={tab} onTab={handleTab} />
      </div>

      {/* Overlays */}
      {xpFloat && <XPFloat amount={xpFloat.amount} key={xpFloat.key} onDone={() => setXpFloat(null)} />}
      {showConfetti && <Confetti />}
      {levelUpModal && <LevelUpModal level={level} onDone={() => setLevelUpModal(false)} />}
    </div>
  );
}
