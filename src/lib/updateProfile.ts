// Utility to update a profile in the Supabase 'profiles' table
import { supabase } from '@/lib/supabaseclient';

export async function updateProfile({ id, name, email, avatar_url }: { id: string, name?: string, email?: string, avatar_url?: string }) {
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;
  return await supabase.from('profiles').update(updates).eq('id', id);
}

export async function getProfile(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return { data, error };
}
