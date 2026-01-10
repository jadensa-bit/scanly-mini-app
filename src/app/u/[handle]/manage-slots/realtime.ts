import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  team_member_id: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

export function subscribeToSlots(
  handle: string,
  onUpdate: (slot: Slot) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  return supabase
    .channel(`slots-changes:${handle}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "slots", filter: `creator_handle=eq.${handle}` },
      (payload) => {
        const s = payload.new as Partial<Slot> | null;

        if (
          s &&
          typeof s.id === "string" &&
          typeof s.start_time === "string" &&
          typeof s.end_time === "string" &&
          typeof s.team_member_id === "string"
        ) {
          onUpdate(s as Slot);
        }
      }
    )
    .subscribe();
}

type TeamMember = { id: string; name: string };

export function subscribeToTeam(
  handle: string,
  onUpdate: (member: TeamMember) => void
): RealtimeChannel | null {
  if (!supabase) return null;

  return supabase
    .channel(`team-changes:${handle}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "team_members", filter: `creator_handle=eq.${handle}` },
      (payload) => {
        const m = payload.new as Partial<TeamMember> | null;

        if (m && typeof m.id === "string" && typeof m.name === "string") {
          onUpdate(m as TeamMember);
        }
      }
    )
    .subscribe();
}
