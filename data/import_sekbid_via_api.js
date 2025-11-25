/*
 * Script to create sekbid entries and members via admin API.
 * Usage:
 *  set BASE_URL=http://localhost:3000    (or your deployed URL)
 *  set ADMIN_TOKEN=your_admin_token      (or cookie/bearer token that the API accepts)
 *  node data/import_sekbid_via_api.js
 *
 * NOTE: The API endpoints require admin authentication. Do not run on production without approval.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('Missing ADMIN_TOKEN environment variable. Set ADMIN_TOKEN before running.');
  process.exit(1);
}

async function post(path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_TOKEN}`
    },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`POST ${path} failed:`, res.status, json);
    throw new Error('Request failed');
  }
  return json;
}

async function main() {
  // Sekbid seed data (names should match your app naming convention)
  const sekbids = [
    { name: 'sekbid-1', nama: 'Sekbid 1 - Keagamaan', color: '#0ea5e9', icon: '/icons/keagamaan.svg' },
    { name: 'sekbid-2', nama: 'Sekbid 2 - Kaderisasi', color: '#10b981', icon: '/icons/kaderisasi.svg' },
    { name: 'sekbid-3', nama: 'Sekbid 3 - Akademik', color: '#f97316', icon: '/icons/akademik.svg' },
    { name: 'sekbid-4', nama: 'Sekbid 4 - Ekonomi Kreatif', color: '#f43f5e', icon: '/icons/ekonomi.svg' },
    { name: 'sekbid-5', nama: 'Sekbid 5 - Kesehatan', color: '#8b5cf6', icon: '/icons/kesehatan.svg' },
    { name: 'sekbid-6', nama: 'Sekbid 6 - Kominfo', color: '#06b6d4', icon: '/icons/kominfo.svg' }
  ];

  const sekbidMap = {};

  for (const s of sekbids) {
    console.log('Creating or ensuring sekbid:', s.name);
    try {
      const res = await post('/api/admin/sekbid', s);
      // API might return created record in res.data or res
      const created = res?.data || res?.sekbid || res;
      if (Array.isArray(created)) {
        sekbidMap[s.name] = created[0];
      } else {
        sekbidMap[s.name] = created;
      }
      console.log(' -> OK', sekbidMap[s.name]?.id || 'no-id');
    } catch (err) {
      console.error('Failed to create sekbid', s.name, err.message || err);
    }
  }

  // Members from the draft
  const members = [
    { name: 'Muhammad Irsyad Kaamil Pasha', role: 'Anggota Sekbid 1', sekbid: 'sekbid-1' },
    { name: 'Nazmia Tsakib Hanani', role: 'Anggota Sekbid 1', sekbid: 'sekbid-1' },
    { name: 'Alifah Shafina Amanda', role: 'Anggota Sekbid 1', sekbid: 'sekbid-1' },
    { name: 'Safa Aprilia Ansari', role: 'Anggota Sekbid 2', sekbid: 'sekbid-2' },
    { name: 'Almer Shaquille Althafurrahman Darmawan', role: 'Anggota Sekbid 2', sekbid: 'sekbid-2' },
    { name: 'Raihan Akbar Putra Jaya', role: 'Anggota Sekbid 2', sekbid: 'sekbid-2' },
    { name: 'Qaulan Tsakilla', role: 'Anggota Sekbid 2', sekbid: 'sekbid-2' },
    { name: 'Alvira Alifiah Raiq', role: 'Anggota Sekbid 3', sekbid: 'sekbid-3' },
    { name: 'Tsurayya Naqiya Octanary', role: 'Anggota Sekbid 3', sekbid: 'sekbid-3' },
    { name: 'Alfadjri alifaumi', role: 'Anggota Sekbid 3', sekbid: 'sekbid-3' },
    { name: 'M. Syaddad Muallim', role: 'Anggota Sekbid 3', sekbid: 'sekbid-3' },
    { name: 'Muhammad Shofwan Abdul Hakim', role: 'Anggota Sekbid 4', sekbid: 'sekbid-4' },
    { name: 'Medina Zulfanisa', role: 'Anggota Sekbid 4', sekbid: 'sekbid-4' },
    { name: 'Darrel Khalfan Gunadi', role: 'Anggota Sekbid 4', sekbid: 'sekbid-4' },
    { name: 'Resti Dewi Lestari', role: 'Anggota Sekbid 4', sekbid: 'sekbid-4' },
    { name: 'Nasya Ghalia Muharti', role: 'Anggota Sekbid 4', sekbid: 'sekbid-4' },
    { name: 'Annisa', role: 'Anggota Sekbid 5', sekbid: 'sekbid-5' },
    { name: 'Zahra', role: 'Anggota Sekbid 5', sekbid: 'sekbid-5' },
    { name: 'Kiki', role: 'Anggota Sekbid 5', sekbid: 'sekbid-5' },
    { name: 'Marrisa', role: 'Anggota Sekbid 5', sekbid: 'sekbid-5' },
    { name: 'Lian', role: 'Anggota Sekbid 5', sekbid: 'sekbid-5' },
    { name: 'Athaya Zanirah Ramadhani', role: 'Anggota Sekbid 6', sekbid: 'sekbid-6' },
    { name: 'Adzrahaifa Amadea Dwi', role: 'Anggota Sekbid 6', sekbid: 'sekbid-6' },
    { name: 'Irga Andreansyah Setiawan', role: 'Anggota Sekbid 6', sekbid: 'sekbid-6' },
    { name: 'Najwan Azhiim Muntadzor', role: 'Anggota Sekbid 6', sekbid: 'sekbid-6' }
  ];

  for (const m of members) {
    try {
      const sek = sekbidMap[m.sekbid];
      const payload = {
        name: m.name,
        role: m.role,
        sekbid_id: sek?.id || null,
        photo_url: m.photo_url || null,
        instagram: m.instagram || null,
        class: m.class || null,
        quote: m.quote || null,
        display_order: m.display_order || null,
        is_active: m.is_active === undefined ? true : !!m.is_active
      };
      console.log('Creating/updating member:', m.name, 'sekbid_id=', payload.sekbid_id);
      const res = await post('/api/admin/members', payload);
      console.log(' -> OK', res?.data || res);
    } catch (err) {
      console.error('Failed to create member', m.name, err.message || err);
    }
  }

  console.log('Import finished.');
}

main().catch(err => {
  console.error('Fatal error', err);
  process.exit(1);
});
