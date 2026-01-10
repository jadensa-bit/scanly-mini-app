// Supabase Realtime for slot and team updates
import { createClient } from '@/lib/supabaseclient';

export function subscribeToSlots(handle: string, onUpdate: (data: any) => void) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase
    .channel('slots-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'slots', filter: `creator_handle=eq.${handle}` }, payload => {
      onUpdate(payload.new);
    })
    .subscribe();
}

export function subscribeToTeam(handle: string, onUpdate: (data: any) => void) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase
    .channel('team-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `creator_handle=eq.${handle}` }, payload => {
      onUpdate(payload.new);
    })
    .subscribe();
}
