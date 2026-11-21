import test from 'node:test';
import assert from 'node:assert/strict';
import { RealtimeClient } from '@supabase/realtime-js';
import { realtimeTopic } from '../utils/realtimeTopic.ts';

test('remounted effects get a fresh channel while the old subscription is still joining', () => {
  const client = new RealtimeClient('wss://example.invalid/realtime/v1', { params: { apikey: 'test-only' } });
  const filter = { event: '*', schema: 'public', table: 'tasks' };
  const name = realtimeTopic('tasks', 'user-one');
  const previous = client.channel(name).on('postgres_changes', filter, () => {});
  // Simulate a joining channel without opening any network connection.
  previous.channelAdapter.isJoining = () => true;
  assert.equal(client.channel(name), previous);
  assert.throws(() => client.channel(name).on('postgres_changes', filter, () => {}), /after `subscribe\(\)`/);
  const next = client.channel(realtimeTopic('tasks', 'user-one'));
  assert.notEqual(next, previous);
  assert.doesNotThrow(() => next.on('postgres_changes', filter, () => {}));
});

test('topic identities survive module re-evaluation during Fast Refresh', async () => {
  const before = realtimeTopic('habits', 'user-one');
  const reloaded = await import('../utils/realtimeTopic.ts?refresh-test');
  const after = reloaded.realtimeTopic('habits', 'user-one');
  assert.notEqual(before, after);
  assert.notEqual(after, realtimeTopic('profile', 'user-one'));
});
