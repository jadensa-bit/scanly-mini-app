import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkOrders() {
  console.log('🔍 Checking recent orders in scanly_orders table...\n');
  
  const { data: orders, error } = await supabase
    .from('scanly_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Error fetching orders:', error.message);
    return;
  }
  
  if (!orders || orders.length === 0) {
    console.log('📭 No orders found in database');
    return;
  }
  
  console.log(`✅ Found ${orders.length} recent orders:\n`);
  
  orders.forEach((order, i) => {
    console.log(`Order ${i + 1}:`);
    console.log(`  ID: ${order.id}`);
    console.log(`  Handle: ${order.handle}`);
    console.log(`  Customer: ${order.customer_name || 'N/A'}`);
    console.log(`  Item: ${order.item_title}`);
    console.log(`  Price: ${order.item_price}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Paid: ${order.paid}`);
    console.log(`  Created: ${order.created_at}`);
    console.log('');
  });
}

checkOrders();
