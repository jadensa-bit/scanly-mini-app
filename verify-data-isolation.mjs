#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function verify() {
  console.log('\n🔍 DATA ISOLATION VERIFICATION\n');
  console.log('=' .repeat(60));

  // 1. Check all sites
  console.log('\n📋 ALL SITES:');
  const { data: sites, error: sitesError } = await supabase
    .from('scanly_sites')
    .select('handle, user_id, owner_email, created_at')
    .order('created_at', { ascending: false });

  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError.message);
  } else {
    console.table(sites?.map(s => ({
      handle: s.handle,
      user_id: s.user_id?.slice(0, 8) + '...' || 'NULL',
      owner_email: s.owner_email || 'NULL',
      created: new Date(s.created_at).toLocaleString()
    })));
  }

  // 2. Check all bookings
  console.log('\n📅 ALL BOOKINGS:');
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, handle, customer_name, customer_email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (bookingsError) {
    console.error('❌ Error fetching bookings:', bookingsError.message);
  } else {
    console.table(bookings?.map(b => ({
      id: String(b.id).slice(0, 8) + '...',
      handle: b.handle,
      customer: b.customer_name,
      created: new Date(b.created_at).toLocaleString()
    })));
  }

  // 3. Check for orphaned bookings (bookings with handles not in sites)
  console.log('\n⚠️  CHECKING FOR ORPHANED BOOKINGS:');
  const siteHandles = new Set((sites || []).map(s => s.handle));
  const orphaned = (bookings || []).filter(b => !siteHandles.has(b.handle));
  
  if (orphaned.length > 0) {
    console.log(`❌ Found ${orphaned.length} orphaned bookings (handle not in sites table):`);
    console.table(orphaned.map(b => ({
      handle: b.handle,
      customer: b.customer_name
    })));
  } else {
    console.log('✅ No orphaned bookings found');
  }

  // 4. Group bookings by site owner
  console.log('\n👥 BOOKINGS GROUPED BY SITE OWNER:');
  const groupedBookings = {};
  
  for (const booking of (bookings || [])) {
    const site = sites?.find(s => s.handle === booking.handle);
    const ownerId = site?.user_id || 'UNKNOWN';
    const ownerKey = ownerId.slice(0, 8) + '...';
    
    if (!groupedBookings[ownerKey]) {
      groupedBookings[ownerKey] = {
        user_id: ownerKey,
        owner_email: site?.owner_email || 'N/A',
        sites: new Set(),
        booking_count: 0
      };
    }
    
    groupedBookings[ownerKey].sites.add(booking.handle);
    groupedBookings[ownerKey].booking_count++;
  }

  console.table(Object.values(groupedBookings).map(g => ({
    user_id: g.user_id,
    email: g.owner_email,
    sites: Array.from(g.sites).join(', '),
    bookings: g.booking_count
  })));

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Verification complete\n');
}

verify().catch(console.error);
