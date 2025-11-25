#!/usr/bin/env node
// Run the admin_actions v4 migration using a Postgres connection string.
// Usage:
// 1) Install dependencies: `npm install pg dotenv`
// 2) Ensure `DATABASE_URL` env is set (Supabase DB connection string)
// 3) Run: `node tools/apply_admin_actions_v4.js`

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.join(process.cwd(), 'supabase-admin-audit-v4.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('Migration file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Set the DATABASE_URL environment variable to your Postgres connection string.');
    console.error('If you use Supabase, copy the DB connection string from the Supabase project settings.');
    process.exit(2);
  }

  const client = new Client({ connectionString: databaseUrl });
  try {
    console.log('Connecting to database...');
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to database:', err.message || err);
    console.error('If your DATABASE_URL points to localhost, ensure Postgres is running or use the Supabase SQL editor instead.');
    process.exit(3);
  }

  try {
    console.log('Executing migration...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (_) {}
    process.exit(4);
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error(e); process.exit(99); });
