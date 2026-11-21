// Survives Fast Refresh so a remounted effect cannot reuse a subscribed channel
// while its previous effect's asynchronous removeChannel is still pending.
const runtime = globalThis as typeof globalThis & { __scottyRealtimeSequence?: number };

export function realtimeTopic(scope: string, userId: string): string {
  runtime.__scottyRealtimeSequence = (runtime.__scottyRealtimeSequence ?? 0) + 1;
  return `${scope}:${userId}:${runtime.__scottyRealtimeSequence}`;
}
