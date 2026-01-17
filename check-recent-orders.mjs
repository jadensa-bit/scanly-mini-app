import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkRecentOrders() {
  console.log('🔍 Checking most recent orders...\n');
  
  const { data: orders, error } = await supabase
    .from('scanly_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log('📭 No orders found\n');
    return;
  }
  
  console.log(`✅ Found ${orders.length} recent orders:\n`);
  
  orders.forEach((order, i) => {
    console.log(`Order ${i + 1}:`);
    console.log(`  ID: ${order.id}`);
    console.log(`  Handle: ${order.handle}`);
    console.log(`  Customer: ${order.customer_name || 'N/A'}`);
    console.log(`  Email: ${order.customer_email || 'N/A'}`);
    console.log(`  Item: ${order.item_title}`);
    console.log(`  Price: ${order.item_price}`);
    console.log(`  Amount Cents: ${order.amount_cents}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Paid: ${order.paid}`);
    console.log(`  Order Items: ${order.order_items ? JSON.stringify(order.order_items) : 'NULL'}`);
    console.log(`  Created: ${order.created_at}`);
    console.log('');
  });
  
  // Check what handles exist in sites
  console.log('🏪 Checking sites table for handles...\n');
  const { data: sites } = await supabase.from('sites').select('handle, user_id, owner_email');
  const { data: scanlySites } = await supabase.from('scanly_sites').select('handle, user_id, owner_email');
  
  const allHandles = [
    ...(sites || []).map(s => s.handle),
    ...(scanlySites || []).map(s => s.handle)
  ];
  
  console.log('Available site handles:', allHandles.join(', '));
  console.log('Order handles:', orders.map(o => o.handle).join(', '));
}

checkRecentOrders();
