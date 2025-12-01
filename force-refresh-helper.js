// ========================================
// 🔄 FORCE REFRESH WITH URL PARAMETER
// ========================================
// Add this button to your attendance page or run in console

// Option 1: Reload with forceRefresh parameter
function forceRefreshAttendance() {
  console.log('🔄 Force refreshing attendance page...');
  const url = new URL(window.location.href);
  url.searchParams.set('forceRefresh', '1');
  window.location.href = url.toString();
}

// Option 2: Clear cache + reload
async function clearCacheAndReload() {
  console.log('🗑️ Clearing all caches...');
  
  // Clear localStorage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear service worker cache
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log(`✅ Cleared ${cacheNames.length} caches`);
  }
  
  // Reload with forceRefresh
  forceRefreshAttendance();
}

// Run this to force refresh
console.log('🔄 Run: forceRefreshAttendance() or clearCacheAndReload()');
