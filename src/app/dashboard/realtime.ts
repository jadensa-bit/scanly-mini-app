// Supabase Realtime subscription for dashboard
import { createClient } from '@/lib/supabaseclient';

export function subscribeToBookings(onUpdate: (booking: any) => void, siteHandles: string[] = []) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase
    .channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, async (payload) => {
      // Only process bookings for the user's sites (data isolation)
      const bookingHandle = (payload.new as any)?.handle || (payload.old as any)?.handle;
      if (siteHandles.length > 0 && !siteHandles.includes(bookingHandle)) {
        console.log(`🚫 Ignoring booking for handle '${bookingHandle}' - not in user's sites`);
        return;
      }
      // Fetch the full booking data with team member info
      const bookingId = (payload.new as any)?.id;
      if (bookingId) {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();
          
          if (data && !error) {
            // Fetch team member name if team_member_id exists
            let enrichedBooking = {
              ...data,
              team_member_name: null,
            };
            
            if (data.team_member_id) {
              try {
                const { data: teamData } = await supabase
                  .from('team_members')
                  .select('name')
                  .eq('id', data.team_member_id)
                  .single();
                
                if (teamData) {
                  enrichedBooking.team_member_name = teamData.name || null;
                }
              } catch (err) {
                // Team member fetch failed, just continue without it
                console.warn('Failed to fetch team member name:', err);
              }
            }
            
            onUpdate(enrichedBooking);
          } else {
            // Fallback to raw data if fetch fails
            onUpdate(payload.new);
          }
        } catch (err) {
          console.error('Error fetching booking with team member:', err);
          // Fallback to raw data if fetch fails
          onUpdate(payload.new);
        }
      } else {
        onUpdate(payload.new);
      }    })
    .subscribe();
}

export function subscribeToOrders(onUpdate: (order: any) => void, siteHandles: string[] = []) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'scanly_orders' }, async (payload) => {
      // Only process orders for the user's sites (data isolation)
      const orderHandle = (payload.new as any)?.handle || (payload.old as any)?.handle;
      if (siteHandles.length > 0 && !siteHandles.includes(orderHandle)) {
        console.log(`🚫 Ignoring order for handle '${orderHandle}' - not in user's sites`);
        return;
      }

      // Fetch the full order data
      const orderId = payload.new?.id;
      if (orderId) {
        try {
          const { data, error } = await supabase
            .from('scanly_orders')
            .select('*')
            .eq('id', orderId)
            .single();
          
          if (data && !error) {
            onUpdate(data);
          } else {
            // Fallback to raw data if fetch fails
            onUpdate(payload.new);
          }
        } catch (err) {
          console.error('Error fetching order:', err);
          // Fallback to raw data if fetch fails
          onUpdate(payload.new);
        }
      } else {
        onUpdate(payload.new);
      }
    })
    .subscribe();
}