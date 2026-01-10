// Supabase Realtime subscription for dashboard
import { createClient } from '@/lib/supabaseclient';

export function subscribeToBookings(onUpdate: (booking: any) => void) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase
    .channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
      onUpdate(payload.new);
    })
    .subscribe();
}
