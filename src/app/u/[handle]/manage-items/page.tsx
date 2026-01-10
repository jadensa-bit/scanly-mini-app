"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { subscribeToItems } from "./realtime";

type Item = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  type: string;
};

export default function ManageItemsPage() {
  // ✅ strongly type handle so it's a real string
  const { handle } = useParams<{ handle: string }>();

  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    type: "service",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!handle) return;

    async function fetchItems() {
      const res = await fetch(`/api/items?handle=${encodeURIComponent(handle)}`);
      const json = await res.json();
      setItems((json.items as Item[]) || []);
    }

    fetchItems();

    // Realtime subscription
    const itemSub = subscribeToItems({
      handle,
      onUpdate: (updatedItem: Item) => {
        setItems((prev) => {
          const idx = prev.findIndex((i) => i.id === updatedItem.id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = updatedItem;
            return updated;
          }
          return [updatedItem, ...prev];
        });
      },
    });

    return () => {
      // ✅ won't crash if subscribeToItems returns null
      itemSub?.unsubscribe();
    };
  }, [handle]);

  async function addItem(e: FormEvent) {
    e.preventDefault();
    if (!handle) return;

    setLoading(true);

    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newItem, creator_handle: handle }),
    });

    setLoading(false);
    setNewItem({ name: "", description: "", price: "", type: "service" });

    // optional: refresh list right after adding
    const res = await fetch(`/api/items?handle=${encodeURIComponent(handle)}`);
    const json = await res.json();
    setItems((json.items as Item[]) || []);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Services & Products</h1>

      <form onSubmit={addItem} className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Name"
          value={newItem.name}
          onChange={(e) => setNewItem((i) => ({ ...i, name: e.target.value }))}
          required
          className="border p-2 w-full"
        />

        <input
          type="text"
          placeholder="Description"
          value={newItem.description}
          onChange={(e) =>
            setNewItem((i) => ({ ...i, description: e.target.value }))
          }
          required
          className="border p-2 w-full"
        />

        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) => setNewItem((i) => ({ ...i, price: e.target.value }))}
          required
          className="border p-2 w-full"
        />

        <select
          value={newItem.type}
          onChange={(e) => setNewItem((i) => ({ ...i, type: e.target.value }))}
          className="border p-2 w-full"
        >
          <option value="service">Service</option>
          <option value="product">Product</option>
        </select>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Item"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-2">Current Items</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="border p-2 rounded">
            <strong>{item.name}</strong> ({item.type})
            <br />
            {item.description}
            <br />${item.price}
          </li>
        ))}
      </ul>
    </main>
  );
}
