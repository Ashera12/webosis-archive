#!/usr/bin/env node
// Quick E2E tester for /errors -> /analyze -> /fix
// Usage:
//   node scripts/test-fix-flow.js [--base http://localhost:3000] [--token <ADMIN_OPS_TOKEN>] [--error <errorId>]

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
}

const base = getArg('--base', process.env.BASE_URL || 'http://localhost:3000');
const token = getArg('--token', process.env.ADMIN_OPS_TOKEN || '');
const errorIdCli = getArg('--error', process.env.TEST_ERROR_ID || '');

if (!token) {
  console.error('Missing token. Provide --token <ADMIN_OPS_TOKEN> or set ADMIN_OPS_TOKEN env.');
  process.exit(1);
}

async function main() {
  try {
    let errorId = errorIdCli;
    if (!errorId) {
      const res = await fetch(`${base}/api/admin/errors?limit=1`, { headers: { 'x-admin-ops-token': token } });
      const j = await res.json();
      if (!res.ok) throw new Error(`List errors failed: ${j.error || res.status}`);
      if (!j.errors?.length) throw new Error('No recent errors found');
      errorId = j.errors[0].id;
      console.log('Using latest errorId:', errorId);
    }

    // Analyze
    const analyze = await fetch(`${base}/api/admin/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-ops-token': token },
      body: JSON.stringify({ errorId })
    });
    const analyzeJson = await analyze.json();
    if (!analyze.ok) throw new Error(`Analyze failed: ${analyzeJson.error || analyze.status}`);
    console.log('Analyze OK. Suggestions:', analyzeJson.analysis?.fixSuggestions?.length || 0);

    // Apply fix (index 0)
    const fix = await fetch(`${base}/api/admin/errors/fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-ops-token': token },
      body: JSON.stringify({ errorId, autoApprove: true })
    });
    const fixJson = await fix.json();
    if (!fix.ok) throw new Error(`Fix failed: ${fixJson.error || fix.status}`);
    console.log('Fix result:', fixJson);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

main();
