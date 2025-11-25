// ============================================
// TEST SCRIPT - Paste di Browser Console
// Buka /admin/settings di browser, login sebagai super_admin
// Buka Developer Tools → Console
// Paste script ini dan jalankan
// ============================================

async function testSaveSettings() {
  console.log('🧪 Testing Settings Save...');
  
  const testData = {
    settings: {
      ALLOW_ADMIN_OPS: 'true',
      ALLOW_UNSAFE_TERMINAL: 'true',
      ADMIN_OPS_TOKEN: 'test-token-1234567890123456789012345678901234567890',
      AUTO_EXECUTE_MODE: 'off',
      AUTO_EXECUTE_DELAY_MINUTES: '5'
    },
    secrets: ['ADMIN_OPS_TOKEN', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'DATABASE_URL']
  };
  
  try {
    console.log('📤 Sending POST /api/admin/settings...');
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Response status:', response.status);
    const result = await response.json();
    console.log('📥 Response body:', result);
    
    if (response.ok) {
      console.log('✅ SUKSES! Settings saved.');
      console.log('🔄 Reloading to verify...');
      
      // Verify by GET
      const getResp = await fetch('/api/admin/settings');
      const getData = await getResp.json();
      console.log('📊 Current values after save:', getData.values);
      
      // Check if saved
      if (getData.values.ALLOW_ADMIN_OPS === 'true') {
        console.log('🎉 VERIFIED! Settings persisted correctly!');
      } else {
        console.log('❌ FAILED! Settings not persisted. Value:', getData.values.ALLOW_ADMIN_OPS);
      }
    } else {
      console.error('❌ FAILED!', result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run test
testSaveSettings();
