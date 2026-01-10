// Supabase Edge Function: check-in webhook
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { bookingId } = await req.json();
  // TODO: Add logic to notify dashboard clients (e.g., via Realtime)
  return new Response(JSON.stringify({ success: true, bookingId }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
