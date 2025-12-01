// ========================================
// 🔧 AUTO-FIX SCHOOL LOCATION VIA API
// ========================================
// Run this in browser console (F12) while logged in as admin

(async function autoFixSchoolLocation() {
  console.log('🔧 Starting auto-fix...');
  
  // STEP 1: Get current config
  console.log('📋 Fetching current config...');
  const currentConfig = await fetch('/api/admin/attendance/config', {
    credentials: 'include'
  }).then(r => r.json());
  
  console.log('Current config:', currentConfig);
  
  // STEP 2: Prepare fixed config
  const fixedConfig = {
    // LOCATION (Using user's current GPS)
    location_name: 'SMK Fithrah Insani - Bandung',
    latitude: -6.900969,      // ⚠️ User GPS - VERIFY THIS IS SCHOOL!
    longitude: 107.542391,     // ⚠️ User GPS - VERIFY THIS IS SCHOOL!
    radius_meters: 300,        // 300m radius
    
    // IP WHITELISTING (User IP: 125.160.157.192)
    allowed_ip_ranges: [
      '125.160.0.0/16',        // User's ISP range (65,536 IPs)
      '100.64.0.0/10',         // CGNAT (Telkomsel/Indosat)
      '192.168.0.0/16',        // Local WiFi
      '10.0.0.0/8'             // Private network
    ],
    
    // NETWORK SETTINGS
    require_wifi: false,       // Allow cellular (user uses 4G)
    network_security_level: 'medium',
    
    // ENROLLMENT SECURITY
    require_enrollment: true,
    require_face_anchor: true,
    require_device_binding: true,
    ai_verification_threshold: 0.80,
    anti_spoofing_threshold: 0.95,
    min_anti_spoofing_layers: 7,
    
    // GPS VALIDATION
    bypass_gps_validation: false, // NO BYPASS!
    
    // WiFi (empty - using IP validation)
    allowed_wifi_ssids: [],
    
    // Legacy fields (keep existing values)
    is_active: true,
    enable_ip_validation: false,
    enable_webrtc_detection: true,
    enable_private_ip_check: true,
    enable_subnet_matching: false,
    allowed_connection_types: ['wifi', 'cellular'],
    min_network_quality: 'fair',
    enable_mac_address_validation: false,
    allowed_mac_addresses: [],
    block_vpn: false,
    block_proxy: false,
    enable_network_quality_check: true
  };
  
  // STEP 3: Show diff
  console.log('📊 CHANGES TO BE APPLIED:');
  console.log('────────────────────────────────────────');
  console.log('BEFORE:', {
    location: currentConfig.data?.location_name,
    lat: currentConfig.data?.latitude,
    lon: currentConfig.data?.longitude,
    radius: currentConfig.data?.radius_meters,
    ip_ranges: currentConfig.data?.allowed_ip_ranges
  });
  console.log('AFTER:', {
    location: fixedConfig.location_name,
    lat: fixedConfig.latitude,
    lon: fixedConfig.longitude,
    radius: fixedConfig.radius_meters,
    ip_ranges: fixedConfig.allowed_ip_ranges
  });
  console.log('────────────────────────────────────────');
  
  // STEP 4: Confirm
  const confirmed = confirm(
    '🔧 AUTO-FIX SCHOOL LOCATION\n\n' +
    'BEFORE:\n' +
    `📍 ${currentConfig.data?.location_name || 'Unknown'}\n` +
    `GPS: ${currentConfig.data?.latitude}, ${currentConfig.data?.longitude}\n` +
    `Radius: ${currentConfig.data?.radius_meters}m\n` +
    `IP Ranges: ${currentConfig.data?.allowed_ip_ranges?.length || 0}\n\n` +
    'AFTER:\n' +
    `📍 ${fixedConfig.location_name}\n` +
    `GPS: ${fixedConfig.latitude}, ${fixedConfig.longitude}\n` +
    `Radius: ${fixedConfig.radius_meters}m\n` +
    `IP Ranges: ${fixedConfig.allowed_ip_ranges.length}\n\n` +
    '⚠️ WARNING: This will use YOUR CURRENT GPS as school location!\n' +
    'Make sure you are AT SCHOOL before applying!\n\n' +
    'Apply fix?'
  );
  
  if (!confirmed) {
    console.log('❌ Fix cancelled by user');
    return;
  }
  
  // STEP 5: Apply fix
  console.log('💾 Saving fixed config...');
  const response = await fetch('/api/admin/attendance/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(fixedConfig)
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('Result:', result);
    
    // STEP 6: Verify
    console.log('🔍 Verifying update...');
    const verifyConfig = await fetch('/api/admin/attendance/config', {
      credentials: 'include'
    }).then(r => r.json());
    
    console.log('📋 UPDATED CONFIG:');
    console.log('────────────────────────────────────────');
    console.log('Location:', verifyConfig.data.location_name);
    console.log('GPS:', verifyConfig.data.latitude, verifyConfig.data.longitude);
    console.log('Radius:', verifyConfig.data.radius_meters + 'm');
    console.log('IP Ranges:', verifyConfig.data.allowed_ip_ranges);
    console.log('Require WiFi:', verifyConfig.data.require_wifi);
    console.log('Security Level:', verifyConfig.data.network_security_level);
    console.log('────────────────────────────────────────');
    
    // STEP 7: Test distance
    const userLat = -6.900969;
    const userLon = 107.542391;
    const schoolLat = verifyConfig.data.latitude;
    const schoolLon = verifyConfig.data.longitude;
    
    const R = 6371000; // Earth radius in meters
    const dLat = (schoolLat - userLat) * Math.PI / 180;
    const dLon = (schoolLon - userLon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userLat * Math.PI / 180) * Math.cos(schoolLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    console.log('📏 DISTANCE TEST:');
    console.log('────────────────────────────────────────');
    console.log('User GPS:', userLat, userLon);
    console.log('School GPS:', schoolLat, schoolLon);
    console.log('Distance:', Math.round(distance) + 'm');
    console.log('Max Allowed:', verifyConfig.data.radius_meters + 'm');
    console.log('Status:', distance <= verifyConfig.data.radius_meters ? '✅ PASS' : '❌ FAIL');
    console.log('────────────────────────────────────────');
    
    alert(
      '✅ FIX APPLIED!\n\n' +
      `📍 Location: ${verifyConfig.data.location_name}\n` +
      `GPS: ${schoolLat}, ${schoolLon}\n` +
      `Distance: ${Math.round(distance)}m (Max: ${verifyConfig.data.radius_meters}m)\n\n` +
      'Now refresh the attendance page to see changes!'
    );
    
    // Auto refresh attendance page if open
    if (window.location.pathname === '/attendance') {
      console.log('🔄 Auto-refreshing attendance page...');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      console.log('💡 Go to /attendance and refresh to see changes!');
    }
  } else {
    console.error('❌ FIX FAILED!');
    console.error('Error:', result.error);
    alert('❌ Failed to apply fix!\n\n' + result.error);
  }
})();

// ========================================
// 📋 HOW TO USE:
// ========================================
// 1. Open browser console (F12)
// 2. Make sure you're logged in as admin
// 3. Copy-paste this entire script
// 4. Press Enter
// 5. Confirm when prompted
// 6. Wait for success message
// 7. Refresh /attendance page

// ========================================
// ⚠️ IMPORTANT:
// ========================================
// This script uses coordinates -6.900969, 107.542391
// from user's CURRENT GPS location.
// 
// MAKE SURE you are AT SCHOOL when running this!
// 
// If not, edit lines 14-15 with correct coordinates:
// - Get from Google Maps (SMK Fithrah Insani)
// - Or use admin panel "Gunakan Lokasi Saat Ini" button
