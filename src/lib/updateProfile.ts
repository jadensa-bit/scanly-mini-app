// Utility to update a profile in the Supabase 'profiles' table
import type { SupabaseClient } from '@supabase/supabase-js';

export async function updateProfile({ id, name, email, avatar_url, supabase }: { id: string, name?: string, email?: string, avatar_url?: string, supabase: SupabaseClient }) {
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  return await supabase.from('profiles').update(updates).eq('id', id);
}

export async function getProfile(id: string, supabase: SupabaseClient) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return { data, error };
}
