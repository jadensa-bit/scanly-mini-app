// Creator slot management page
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { subscribeToSlots, subscribeToTeam } from "./realtime";

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  team_member_id: string;
};

type TeamMember = {
  id: string;
  name: string;
};

export default function ManageSlotsPage() {
  // ✅ strongly type params so handle is a string
  const { handle } = useParams<{ handle: string }>();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [newSlot, setNewSlot] = useState({
    start_time: "",
    end_time: "",
    team_member_id: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // ✅ guard: if route param somehow isn't ready
    if (!handle) return;

    let slotSub: { unsubscribe: () => void } | null = null;
    let teamSub: { unsubscribe: () => void } | null = null;

    async function fetchData() {
      const [slotsRes, teamRes] = await Promise.all([
        fetch(`/api/slots?handle=${encodeURIComponent(handle)}`),
        fetch(`/api/team?handle=${encodeURIComponent(handle)}`),
      ]);

      const slotsJson = await slotsRes.json();
      const teamJson = await teamRes.json();

      setSlots((slotsJson.slots as Slot[]) || []);
      setTeam((teamJson.team as TeamMember[]) || []);
    }

    fetchData();

    // Realtime subscriptions
    slotSub = subscribeToSlots(handle, (updatedSlot: Slot) => {
      setSlots((prev) => {
        const idx = prev.findIndex((s) => s.id === updatedSlot.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = updatedSlot;
          return updated;
        }
        return [updatedSlot, ...prev];
      });
    });

    teamSub = subscribeToTeam(handle, (updatedMember: TeamMember) => {
      setTeam((prev) => {
        const idx = prev.findIndex((t) => t.id === updatedMember.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = updatedMember;
          return updated;
        }
        return [updatedMember, ...prev];
      });
    });

    return () => {
      slotSub?.unsubscribe();
      teamSub?.unsubscribe();
    };
  }, [handle]);

  async function addSlot(e: FormEvent) {
    e.preventDefault();
    if (!handle) return;

    setLoading(true);

    await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newSlot, creator_handle: handle }),
    });

    setLoading(false);
    setNewSlot({ start_time: "", end_time: "", team_member_id: "" });

    // Refresh slots
    const slotsRes = await fetch(`/api/slots?handle=${encodeURIComponent(handle)}`);
    const slotsJson = await slotsRes.json();
    setSlots((slotsJson.slots as Slot[]) || []);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Booking Slots</h1>

      <form onSubmit={addSlot} className="space-y-4 mb-8">
        <input
          type="datetime-local"
          value={newSlot.start_time}
          onChange={(e) => setNewSlot((s) => ({ ...s, start_time: e.target.value }))}
          required
          className="border p-2 w-full"
        />

        <input
          type="datetime-local"
          value={newSlot.end_time}
          onChange={(e) => setNewSlot((s) => ({ ...s, end_time: e.target.value }))}
          required
          className="border p-2 w-full"
        />

        <select
          value={newSlot.team_member_id}
          onChange={(e) => setNewSlot((s) => ({ ...s, team_member_id: e.target.value }))}
          required
          className="border p-2 w-full"
        >
          <option value="">Select Team Member</option>
          {team.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Slot"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Current Slots</h2>
      <ul className="space-y-2">
        {slots.map((slot) => (
          <li key={slot.id} className="border p-2 rounded">
            {slot.start_time} - {slot.end_time} (
            {team.find((tm) => tm.id === slot.team_member_id)?.name || "Unassigned"})
          </li>
        ))}
      </ul>
    </main>
  );
}
