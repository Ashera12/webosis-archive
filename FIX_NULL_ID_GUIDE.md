# FIX: Events dengan NULL ID - Panduan Lengkap

## Masalah
- Events berhasil dibuat tapi `id` dan `created_at` bernilai NULL
- Duplicate key error karena menggunakan title sebagai key
- Delete error karena ID null (`/api/admin/events/null`)
- Events tidak bisa di-edit atau dihapus

## Root Cause
Database table `events` menggunakan `bigint` untuk ID dengan auto-increment, tapi sequence belum dibuat atau tidak ter-trigger.

## Solusi Step-by-Step

### 1. Jalankan SQL Fix Script
Buka **Supabase SQL Editor** dan jalankan file: `fix_events_table.sql`

Script ini akan:
- Create sequence untuk auto-increment ID
- Set default untuk created_at
- Create trigger untuk updated_at
- Add RLS policy untuk service role

### 2. Cleanup Events dengan NULL ID
Jalankan: `cleanup_null_id_events.sql`

Script ini akan:
- Backup events NULL ke temporary table
- Delete events dengan ID NULL
- Show hasil cleanup

⚠️ **PENTING**: Events dengan NULL ID tidak bisa di-manage, harus dihapus.

### 3. Test Create Event Baru
1. Buka Admin Panel → Events
2. Klik "Tambah Event"
3. Isi form dan upload image
4. Submit
5. **Cek Console Log** - harus muncul dengan ID valid (number, bukan null)

### 4. Verifikasi di Database
Jalankan SQL:
```sql
SELECT id, title, event_date, created_at 
FROM events 
ORDER BY created_at DESC 
LIMIT 5;
```

Pastikan:
- ✅ `id` adalah number (bukan null)
- ✅ `created_at` terisi dengan timestamp
- ✅ `updated_at` terisi

## Files yang Sudah Diperbaiki

### Backend (API)
- ✅ `app/api/admin/events/route.ts` - GET & POST gunakan `select('*')`
- ✅ `app/api/events/route.ts` - Public API

### Frontend
- ✅ `app/admin/events/page.tsx`:
  - Unique key menggunakan composite: `id || title-date-timestamp`
  - DELETE handler cek ID null
  - Optimistic update
  
- ✅ `app/info/page.tsx`:
  - Unique key menggunakan composite
  - Tidak filter strict lagi

- ✅ `app/admin/gallery/page.tsx`:
  - Events dropdown relaxed filter

## Expected Behavior Setelah Fix

### ✅ Create Event
```javascript
[admin/events POST] Success: {
  id: 123,  // ← NUMBER bukan null!
  title: 'Test Event',
  event_date: '2025-12-01T00:00:00+00:00',
  created_at: '2025-11-24T...',  // ← Terisi!
  updated_at: '2025-11-24T...',
  ...
}
```

### ✅ Get Events
```javascript
[admin/events GET] Raw events count: 3
[admin/events GET] First event sample: {
  id: 123,  // ← Valid ID
  title: 'Test Event',
  ...
}
[admin/events GET] Returning 3 events
```

### ✅ No Duplicate Keys
Console tidak ada error:
```
❌ Encountered two children with the same key
```

### ✅ Delete Works
```
DELETE /api/admin/events/123  // ← ID valid
```

## Troubleshooting

### Masalah: ID masih NULL setelah create
**Solusi**:
1. Cek apakah sequence sudah dibuat:
   ```sql
   SELECT * FROM pg_sequences WHERE sequencename = 'events_id_seq';
   ```
2. Cek default column id:
   ```sql
   SELECT column_name, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'events' AND column_name = 'id';
   ```
   Harus return: `nextval('events_id_seq'::regclass)`

### Masalah: Permission denied
**Solusi**: Pastikan RLS policy untuk service_role ada:
```sql
SELECT * FROM pg_policies WHERE tablename = 'events';
```

### Masalah: Duplicate key "lovely" masih muncul
**Solusi**: 
1. Events lama dengan ID NULL harus dihapus
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)

## Testing Checklist

- [ ] Run `fix_events_table.sql` di Supabase
- [ ] Run `cleanup_null_id_events.sql` di Supabase  
- [ ] Verify sequence created
- [ ] Create new event
- [ ] Check console log - event has valid ID
- [ ] Event appears in admin panel
- [ ] Event appears in /info page
- [ ] Can edit event
- [ ] Can delete event
- [ ] No duplicate key errors in console
- [ ] Events dropdown in gallery shows events

## Quick Commands

```sql
-- Check sequence
SELECT * FROM pg_sequences WHERE sequencename = 'events_id_seq';

-- Check events
SELECT id, title, created_at FROM events ORDER BY created_at DESC LIMIT 10;

-- Manual insert test
INSERT INTO events (title, event_date, description) 
VALUES ('Test', '2025-12-01', 'Test description') 
RETURNING *;

-- Should return event with valid id and created_at!
```

## Summary

1. ✅ SQL scripts created for fix
2. ✅ Code updated to handle NULL gracefully
3. ✅ Unique keys use composite fallback
4. ✅ Delete handler validates ID
5. ⏳ **USER ACTION NEEDED**: Run SQL scripts in Supabase
