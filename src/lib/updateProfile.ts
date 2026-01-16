// Utility to update a profile in the Supabase 'profiles' table
import { supabase } from '@/lib/supabaseclient';

export async function updateProfile({ id, name, email }: { id: string, name?: string, email?: string }) {
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  return await supabase.from('profiles').update(updates).eq('id', id);
}

export async function getProfile(id: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return { data, error };
}
