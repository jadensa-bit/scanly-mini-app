import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://djghvdbpbjzyxahusnri.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZ2h2ZGJwYmp6eXhhaHVzbnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODY5NjcsImV4cCI6MjA4MTY2Mjk2N30.f_EdjfS6uA4WHFw3KXQbh0ULDgj9RxjEienZfmM6fe8'
);

console.log('🔍 Checking delivery orders in database...\n');

// Check if delivery columns exist
const { data: orders, error } = await supabase
  .from('scanly_orders')
  .select('id, delivery_method, delivery_fee_cents, delivery_address, customer_name, item_title, created_at')
  .order('created_at', { ascending: false })
  .limit(15);

if (error) {
  console.log('❌ Error:', error.message);
  console.log('   This likely means the delivery columns have NOT been added to the database yet.');
  console.log('\n⚠️  You need to run the migration file: supabase/migrations/12_add_delivery_to_orders.sql');
  console.log('   in your Supabase SQL Editor: https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri/editor');
} else {
  console.log(`✅ Found ${orders.length} recent orders\n`);
  console.log('Recent orders:');
  orders.forEach(o => {
    const deliveryIcon = o.delivery_method === 'delivery' ? '🚚' : (o.delivery_method === 'pickup' ? '🏪' : '❓');
    console.log(`  ${deliveryIcon} Order #${o.id}: ${o.customer_name || 'N/A'} - ${o.item_title || 'N/A'}`);
    console.log(`     method=${o.delivery_method || 'NULL'}, fee=${o.delivery_fee_cents || 0}¢, address=${o.delivery_address ? 'YES' : 'NO'}`);
  });
  
  const deliveryOrders = orders.filter(o => o.delivery_method === 'delivery');
  const pickupOrders = orders.filter(o => o.delivery_method === 'pickup');
  const nullOrders = orders.filter(o => !o.delivery_method);
  
  console.log(`\n📊 Summary:`);
  console.log(`   🚚 Delivery orders: ${deliveryOrders.length}`);
  console.log(`   🏪 Pickup orders: ${pickupOrders.length}`);
  console.log(`   ❓ NULL (old orders): ${nullOrders.length}`);
  
  if (deliveryOrders.length === 0) {
    console.log('\n💡 No delivery orders found yet. To test:');
    console.log('   1. Go to a storefront (e.g., /u/top-tier-demo)');
    console.log('   2. Add items to cart');
    console.log('   3. Select "🚚 Delivery" option');
    console.log('   4. Fill in delivery address');
    console.log('   5. Complete checkout');
  }
}

process.exit(0);
