// Quick test script to manually trigger slot generation
// Run with: node test-slot-generation.mjs

const handle = 'xxxbooking'; // Replace with your test handle
const apiUrl = 'http://localhost:3000';

async function testSlotGeneration() {
  console.log(`🧪 Testing slot generation for handle: ${handle}\n`);
  
  try {
    const response = await fetch(`${apiUrl}/api/slots/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        daysInAdvance: 7
      })
    });
    
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Success! Slots generated:', data.slotsCount);
    } else {
      console.log('\n❌ Failed:', data.error || data.message);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testSlotGeneration();
