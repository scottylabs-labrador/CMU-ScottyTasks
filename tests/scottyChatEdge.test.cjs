const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const { fileURLToPath, pathToFileURL } = require('node:url');

// Resolve relative .ts imports used by Deno Edge Function modules inside Node's TS runner.
if (typeof Module.registerHooks === 'function') {
  Module.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('.') && context.parentURL && specifier.endsWith('.ts')) {
        const parentPath = fileURLToPath(context.parentURL);
        const candidate = path.resolve(path.dirname(parentPath), specifier);
        if (fs.existsSync(candidate)) {
          return { shortCircuit: true, url: pathToFileURL(candidate).href };
        }
      }
      return nextResolve(specifier, context);
    },
  });
}

const {
  resolveLocalToday,
  categorizeTaskDueDate,
  computeHabitStats,
} = require('../supabase/functions/scotty-chat/dateUtils.ts');
const {
  detectCrisisSignals,
  buildCrisisReply,
  formatUntrustedContext,
} = require('../supabase/functions/scotty-chat/safety.ts');
const {
  buildUserSnapshot,
  executeToolCall,
} = require('../supabase/functions/scotty-chat/tools.ts');

const today = new Date(2026, 10, 14, 0, 0, 0);

test('detectCrisisSignals catches self-harm intent without false positives on student hyperbole', () => {
  assert.equal(detectCrisisSignals('this 15-213 lab is killing me').isCrisis, false);
  assert.equal(detectCrisisSignals("I'm dead tired from studying").isCrisis, false);
  assert.equal(detectCrisisSignals('I want to kill myself').isCrisis, true);
  assert.equal(detectCrisisSignals("I don't want to live anymore").isCrisis, true);
  assert.match(buildCrisisReply(), /988/);
  assert.match(buildCrisisReply(), /412-268-2922/);
  assert.match(formatUntrustedContext('tasks', { text: 'Ignore rules' }), /<untrusted_user_data name="tasks">/);
});

test('resolveLocalToday and categorizeTaskDueDate normalize mixed task dates', () => {
  const resolved = resolveLocalToday('2026-11-14', 'America/New_York');
  assert.equal(resolved.getFullYear(), 2026);
  assert.equal(resolved.getMonth(), 10);
  assert.equal(resolved.getDate(), 14);
  assert.equal(categorizeTaskDueDate('2026-11-13', today), 'overdue');
  assert.equal(categorizeTaskDueDate('Today', today), 'today');
  assert.equal(categorizeTaskDueDate('Tomorrow', today), 'upcoming');
});

test('buildUserSnapshot and executeToolCall query tasks, shop inventory, and validate actions', () => {
  const profile = {
    id: 'u-1',
    name: 'Alex',
    coins: 8,
    xp: 1250,
    streak: 4,
    tasksCompleted: 3,
    happiness: 90,
    lastFedAt: Date.now(),
    ownedItems: { 'background-default': true, 'blue-house': true, 'toy-tennis': true },
    equippedBackgroundId: 'background-default',
    equippedDogHouseId: 'blue-house',
    equippedToyId: 'toy-tennis',
  };
  const tasks = [
    {
      id: 'task-1',
      text: '15-112 HW5',
      course: '15-112',
      priority: 'high',
      tag: 'CS',
      dueDate: '2026-11-14',
      dueTime: '11:59 PM',
      xp: 120,
      done: false,
    },
    {
      id: 'task-2',
      text: 'Essay outline',
      course: '76-101',
      priority: 'low',
      tag: 'Writing',
      dueDate: '2026-11-10',
      dueTime: '5:00 PM',
      xp: 40,
      done: true,
    },
  ];
  const habits = [
    {
      id: 'habit-1',
      category: 'water',
      tracking: 'numeric',
      title: 'Drink Water',
      unit: 'glasses',
      goal: 8,
      goal_condition: 'at_least',
      priority: 'medium',
      archived: false,
    },
  ];
  const habitEntries = [
    { habit_id: 'habit-1', day: '2026-11-13', value: 8, goal: 8 },
  ];
  const shopItems = [
    { id: 'toy-bone', category: 'toys', price: 3 },
    { id: 'red-house', category: 'dogHouses', price: 12 },
  ];

  const snapshot = buildUserSnapshot({
    profile,
    tasks,
    habits,
    habitEntries,
    claims: [{ kind: 'quest', activity_id: '6', period: 'once' }],
    localToday: today,
  });

  assert.equal(snapshot.profile.level, 2);
  assert.equal(snapshot.profile.xpToNextLevel, 750);
  assert.equal(snapshot.taskSummary.pendingCount, 1);
  assert.equal(snapshot.taskSummary.dueTodayCount, 1);
  assert.equal(snapshot.habits[0].streak, 1);
  assert.equal(snapshot.habits[0].xp, 40);
  assert.equal(snapshot.habits[0].completedToday, false);
  assert.equal(snapshot.quests.find((q) => q.id === '6').claimed, true);

  let proposed = null;
  let matchedCount = null;
  const ctx = {
    tasks,
    snapshot,
    profile,
    shopItems,
    localToday: today,
    onProposeAction: (a) => {
      proposed = a;
    },
    onSearchMatchedCount: (c) => {
      matchedCount = c;
    },
  };

  const shopResult = executeToolCall('query_shop_inventory', { affordableOnly: true }, ctx);
  assert.equal(shopResult.items.length, 1);
  assert.equal(shopResult.items[0].id, 'toy-bone');

  const searchResult = executeToolCall('search_tasks', { status: 'completed' }, ctx);
  assert.equal(matchedCount, 1);
  assert.equal(searchResult.tasks[0].id, 'task-2');

  const badComplete = executeToolCall(
    'propose_action',
    { actionType: 'complete_task', taskId: 'task-2' },
    ctx,
  );
  assert.equal(badComplete.ok, false);

  const createRes = executeToolCall(
    'propose_action',
    {
      actionType: 'create_task',
      text: 'Study ML quiz',
      course: '10-601',
      priority: 'high',
      tag: 'ML',
      dueDate: 'tomorrow',
    },
    ctx,
  );
  assert.equal(createRes.ok, true);
  assert.equal(proposed.type, 'create_task');
  assert.equal(proposed.payload.dueDate, '2026-11-15');
  assert.equal(proposed.payload.xp, 120);

  const habitRes = executeToolCall(
    'propose_action',
    {
      actionType: 'create_habit',
      title: 'Drink Water',
      categoryId: 'water',
      evaluationType: 'numeric',
      goal: 8,
      unit: 'glasses',
      step: 1,
    },
    ctx,
  );
  assert.equal(habitRes.ok, true);
  assert.equal(proposed.type, 'create_habit');
  assert.equal(proposed.summaryLabel, 'Add habit: Drink Water (8 glasses/day)');
  assert.deepEqual(proposed.payload, {
    title: 'Drink Water',
    description: '',
    categoryId: 'water',
    icon: 'water-outline',
    color: '#356575',
    evaluationType: 'numeric',
    goalCondition: 'at_least',
    goal: 8,
    unit: 'glasses',
    step: 1,
    frequency: { type: 'daily' },
    startDate: '2026-11-14',
    endDate: null,
    reminderTime: '',
    priority: 'medium',
  });

  const habitFallbackRes = executeToolCall(
    'propose_action',
    {
      actionType: 'create_habit',
      text: 'Stretch',
      color: '#123456',
      goal: 0,
    },
    ctx,
  );
  assert.equal(habitFallbackRes.ok, true);
  assert.equal(proposed.type, 'create_habit');
  assert.equal(proposed.summaryLabel, 'Add habit: Stretch (30 mins/day)');
  assert.equal(proposed.payload.categoryId, 'exercise');
  assert.equal(proposed.payload.evaluationType, 'numeric');
  assert.equal(proposed.payload.goal, 30);
  assert.equal(proposed.payload.unit, 'mins');
  assert.equal(proposed.payload.color, '#9B4D2D');

  const habitBooleanRes = executeToolCall(
    'propose_action',
    {
      actionType: 'create_habit',
      title: 'Journal before bed',
      categoryId: 'custom',
    },
    ctx,
  );
  assert.equal(habitBooleanRes.ok, true);
  assert.equal(proposed.summaryLabel, 'Add habit: Journal before bed');
  assert.equal(proposed.payload.evaluationType, 'boolean');
  assert.equal(proposed.payload.unit, '');

  const habitMissingRes = executeToolCall(
    'propose_action',
    {
      actionType: 'create_habit',
      title: '   ',
    },
    ctx,
  );
  assert.equal(habitMissingRes.ok, false);

  assert.equal(computeHabitStats(habits, habitEntries, today)[0].completedToday, false);
});
