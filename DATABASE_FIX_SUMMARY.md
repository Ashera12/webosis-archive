
# Database Schema Fix Summary

## Overview

Fixed database schema mismatches between Supabase schema definitions and API endpoint expectations. The main issue was inconsistent field naming (Indonesian vs English) and missing/incorrect field definitions.

## Files Fixed

### 1. Database Schema Files

#### `supabase-schema.sql`

✅ **Updated Tables:**

- `sekbid` - Added proper structure with English field names
- `members` - Created with correct field names
- `events` - Updated to use `start_date` and `end_date`

#### `supabase-fix-schema.sql`

✅ **Migration Script Created:**

- Safely drops and recreates tables with correct schema
- Includes 6 default sekbid entries
- Handles foreign key constraints properly

#### `supabase-seed-data.sql`

✅ **Sample Data Created:**

- 24 members with realistic Indonesian names
- 9 events spanning different dates
- 5 announcements
- 12 program_kerja items
- 7 gallery items

### 2. API Routes Fixed

#### Members API

**File:** `app/api/admin/members/route.ts`

- ✅ Updated `MemberPayload` type
- ✅ Fixed GET query: `order_index` → `display_order`, `active` → `is_active`
- ✅ Fixed POST insert: `nama` → `name`, `jabatan` → `role`, `foto_url` → `photo_url`, `quotes` → `quote`

**File:** `app/api/admin/members/[id]/route.ts`

- ✅ Updated `MemberUpdatePayload` type
- ✅ Fixed PUT update logic with correct field names
- ✅ Removed `email` field (not in schema)
- ✅ Changed `sekbid_id` type from `string` to `number`

#### Sekbid API

**File:** `app/api/admin/sekbid/route.ts`

- ✅ Removed non-existent fields: `order_index`, `active`
- ✅ Updated field names: `nama` → `name`, `deskripsi` → `description`
- ✅ Added required `slug` field
- ✅ Added optional fields: `vision`, `mission`
- ✅ Fixed GET query ordering


**File:** `app/api/admin/sekbid/[id]/route.ts`

- ✅ Updated PUT handler with correct field names
- ✅ Added `slug`, `vision`, `mission` fields
- ✅ Removed `order_index`, `active` fields

#### Events API

✅ **Already Correct:**

- `app/api/admin/events/route.ts` - Using `start_date`, `end_date`
- `app/api/admin/events/[id]/route.ts` - Proper field names

#### Announcements API

✅ **Already Correct:**

- `app/api/admin/announcements/route.ts`
- `app/api/admin/announcements/[id]/route.ts`

#### Gallery API

✅ **Already Correct:**

- `app/api/admin/gallery/route.ts`
- `app/api/admin/gallery/[id]/route.ts`

## Field Mapping Reference

### Members Table

| Old (Wrong) | New (Correct) |
|-------------|---------------|
| `nama` | `name` |
| `jabatan` | `role` |
| `foto_url` | `photo_url` |
| `quotes` | `quote` |
| `order_index` | `display_order` |
| `active` | `is_active` |
| `email` | ❌ (removed - not in schema) |

### Sekbid Table

| Old (Wrong) | New (Correct) |
|-------------|---------------|
| `nama` | `name` |
| `deskripsi` | `description` |
| `order_index` | ❌ (removed - not in schema) |
| `active` | ❌ (removed - not in schema) |
| - | `slug` ✨ (added - required) |
| - | `vision` ✨ (added - optional) |
| - | `mission` ✨ (added - optional) |

### Events Table

| Old (Wrong) | New (Correct) |
|-------------|---------------|
| `event_date` | `start_date` |
| `event_time` | ❌ (removed - use timestamptz) |
| - | `end_date` ✨ (added) |

## Database Schema Structure

### Sekbid Table
```sql
CREATE TABLE public.sekbid (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  vision TEXT,
  mission TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Default Entries:**
1. Ketaqwaan (slug: ketaqwaan)
2. Keilmuan (slug: keilmuan)
3. Keterampilan (slug: keterampilan)
4. Kewirausahaan (slug: kewirausahaan)
5. Olahraga & Seni (slug: olahraga-seni)
6. Sosial & Lingkungan (slug: sosial-lingkungan)

### Members Table
```sql
CREATE TABLE public.members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  sekbid_id INT REFERENCES public.sekbid(id) ON DELETE SET NULL,
  photo_url TEXT,
  instagram TEXT,
  class TEXT,
  quote TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Events Table
```sql
CREATE TABLE public.events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  image_url TEXT,
  max_participants INT,
  registration_deadline TIMESTAMPTZ,
  sekbid_id INT REFERENCES public.sekbid(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## How to Apply Fixes

### Step 1: Run Database Migration
```bash
# Connect to your Supabase database and run:
# Option A: If you want to preserve existing data (manual migration)
# - Export your current data
# - Run the ALTER TABLE commands from supabase-fix-schema.sql
# - Re-import data with correct field names

# Option B: Fresh start (destroys existing data)
# Run the entire supabase-fix-schema.sql file
psql -h [YOUR_DB_HOST] -U postgres -d postgres -f supabase-fix-schema.sql
```

### Step 2: Load Sample Data (Optional)
```bash
# Run seed data script to populate with test data
psql -h [YOUR_DB_HOST] -U postgres -d postgres -f supabase-seed-data.sql
```

### Step 3: Verify API Endpoints
All API endpoints have been fixed. Test each one:

```bash
# Test Members API
curl http://localhost:3000/api/admin/members

# Test Sekbid API
curl http://localhost:3000/api/admin/sekbid

# Test Events API
curl http://localhost:3000/api/admin/events

# Test Announcements API
curl http://localhost:3000/api/admin/announcements

# Test Gallery API
curl http://localhost:3000/api/admin/gallery
```

## Testing Checklist

- [ ] Run `supabase-fix-schema.sql` in Supabase SQL Editor
- [ ] Verify sekbid table has 6 default entries
- [ ] Run `supabase-seed-data.sql` for test data
- [ ] Test creating a new member via admin panel
- [ ] Test editing a member via admin panel
- [ ] Test creating a new event
- [ ] Test editing an event
- [ ] Test creating a new sekbid entry
- [ ] Test editing sekbid information
- [ ] Verify announcements and gallery still work

## Common Issues & Solutions

### Issue: "column does not exist"
**Solution:** You're using old field names. Check the Field Mapping Reference above and update your code.

### Issue: Foreign key constraint errors
**Solution:** Ensure sekbid table is created before members and events tables. Run `supabase-fix-schema.sql` which handles dependencies correctly.

### Issue: "relation does not exist"
**Solution:** Run the schema creation scripts in this order:
1. `supabase-schema.sql` (or relevant parts)
2. `supabase-fix-schema.sql` (migration)
3. `supabase-seed-data.sql` (sample data)

### Issue: Existing data is lost
**Solution:** 
- If you have important data, export it first
- Update field names in your export
- Run migration
- Re-import with correct field names

## Migration Notes

⚠️ **IMPORTANT:** The `supabase-fix-schema.sql` script uses `DROP TABLE ... CASCADE` which will delete all existing data in:
- `events` table
- `event_registrations` table
- `sekbid` table
- `members` table

If you have production data, create a backup first:

```sql
-- Backup existing data
CREATE TABLE events_backup AS SELECT * FROM events;
CREATE TABLE members_backup AS SELECT * FROM members;
-- etc...
```

## API Changes Required in Frontend

If you have frontend code calling these APIs, update your request payloads:

### Members
```typescript
// OLD (Wrong)
const payload = {
  nama: "Ahmad Fauzi",
  jabatan: "Ketua OSIS",
  foto_url: "...",
  quotes: "...",
  order_index: 1,
  active: true
}

// NEW (Correct)
const payload = {
  name: "Ahmad Fauzi",
  role: "Ketua OSIS",
  photo_url: "...",
  quote: "...",
  display_order: 1,
  is_active: true
}
```

### Sekbid
```typescript
// OLD (Wrong)
const payload = {
  nama: "Ketaqwaan",
  deskripsi: "Bidang yang fokus...",
  order_index: 1,
  active: true
}

// NEW (Correct)
const payload = {
  name: "Ketaqwaan",
  slug: "ketaqwaan",
  description: "Bidang yang fokus...",
  vision: "...",
  mission: "..."
}
```

## Status

✅ **Completed:**
- Database schema updated
- Migration scripts created
- Seed data created
- All API routes fixed
- Documentation created

🔄 **Next Steps:**
- Run migration on production database
- Update frontend code if needed
- Test all CRUD operations
- Monitor for any remaining issues

## Support

If you encounter any issues after applying these fixes:

1. Check the error message - it usually indicates which field name is wrong
2. Consult the Field Mapping Reference above
3. Verify your database schema matches `supabase-schema.sql`
4. Check API route implementations match the patterns shown in this document

Last Updated: 2024
