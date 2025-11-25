# 🚀 Quick Fix: Program Kerja API

## Problem
Console error: "Failed to fetch proker" - API route tidak ditemukan

## Solution
✅ Sudah dibuat:
1. **API Routes:**
   - `app/api/admin/proker/route.ts` - GET (list) & POST (create)
   - `app/api/admin/proker/[id]/route.ts` - PUT (update) & DELETE

2. **Database Migration:**
   - `supabase/migrations/create_program_kerja_table.sql`

## Setup Database

### Option 1: Via Supabase Dashboard
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `supabase/migrations/create_program_kerja_table.sql`
3. Run SQL

### Option 2: Via CLI (if using local Supabase)
```bash
supabase migration up
```

## Database Schema

```sql
program_kerja (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sekbid_id INTEGER REFERENCES sekbid(id),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) -- 'planned', 'ongoing', 'completed', 'cancelled'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## API Endpoints

### GET /api/admin/proker
List semua program kerja dengan join ke sekbid

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Pesantren Kilat",
    "description": "Program ramadhan",
    "sekbid_id": 1,
    "start_date": "2025-03-01",
    "end_date": "2025-03-15",
    "status": "planned",
    "sekbid": {
      "id": 1,
      "name": "Sekbid 1 - Kerohanian"
    }
  }
]
```

### POST /api/admin/proker
Buat program kerja baru

**Body:**
```json
{
  "title": "Program Baru",
  "description": "Deskripsi",
  "sekbid_id": 1,
  "start_date": "2025-03-01",
  "end_date": "2025-03-15",
  "status": "planned"
}
```

### PUT /api/admin/proker/[id]
Update program kerja

### DELETE /api/admin/proker/[id]
Hapus program kerja

## Testing

Setelah menjalankan migration SQL, refresh halaman `/admin/proker` dan error seharusnya hilang!

## Sample Data
Migration sudah include 6 sample program kerja (1 per sekbid).
