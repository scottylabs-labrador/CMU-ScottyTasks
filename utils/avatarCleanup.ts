import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireSupabase } from '@/config/supabase';

// Serialize queue changes so foreground retries cannot overwrite newly queued files.
let pending: Promise<void> = Promise.resolve();
export function cleanupAvatars(uid: string, previousUrl?: string) {
  const operation = pending.catch(() => {}).then(async () => {
    const client = requireSupabase();
    const bucket = client.storage.from('avatars');
    const prefix = bucket.getPublicUrl(uid + '/').data.publicUrl;
    const key = 'avatar-cleanup:' + uid;
    const stored = JSON.parse(await AsyncStorage.getItem(key) ?? '[]');
    const urls = new Set<string>(Array.isArray(stored) ? stored.filter((url): url is string => typeof url === 'string') : []);
    if (previousUrl?.startsWith(prefix)) urls.add(previousUrl);
    if (!urls.size) return;
    await AsyncStorage.setItem(key, JSON.stringify([...urls]));
    const { data, error } = await client.from('profiles').select('avatarUrl').eq('id', uid).single();
    if (error) throw error;
    for (const url of urls) {
      if (url === data.avatarUrl || !url.startsWith(prefix)) { urls.delete(url); continue; }
      let filename: string;
      try { filename = decodeURIComponent(url.slice(prefix.length).split('?')[0]); }
      catch { urls.delete(url); continue; }
      if (!filename || filename.includes('/') || filename === '..') { urls.delete(url); continue; }
      const result = await bucket.remove([uid + '/' + filename]);
      if (!result.error) urls.delete(url);
    }
    await AsyncStorage.setItem(key, JSON.stringify([...urls]));
  });
  pending = operation;
  return operation;
}
