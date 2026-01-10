// Items API endpoint for services/products
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseclient';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const { data: items, error } = await supabase
    .from('items')
    .select('*')
    .eq('creator_handle', handle)
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { creator_handle, name, description, price, type } = await req.json();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  // Add a new item
  const { data, error } = await supabase
    .from('items')
    .insert([{ creator_handle, name, description, price, type }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, item: data });
}
