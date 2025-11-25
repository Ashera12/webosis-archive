# Error Logs Table Setup Guide

## 🚨 Table 'error_logs' Not Found

Table `error_logs` belum ada di database Supabase Anda.

## ✅ Setup Cepat (5 Menit)

### **Step 1: Buka Supabase Dashboard**
1. Go to: **https://supabase.com/dashboard**
2. Login dan pilih project Anda

### **Step 2: Buka SQL Editor**
1. Klik **SQL Editor** di sidebar kiri
2. Klik tombol **New Query**

### **Step 3: Copy SQL**
SQL sudah tersedia di file: `create_error_logs_table.sql`

Atau copy langsung dari sini:

```sql
-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_type TEXT NOT NULL DEFAULT 'runtime_error',
  severity TEXT DEFAULT 'medium',
  error_message TEXT,
  error_stack TEXT,
  url TEXT,
  method TEXT DEFAULT 'GET',
  status_code INTEGER,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address TEXT,
  request_body JSONB,
  response_body JSONB,
  headers JSONB,
  context JSONB,
  ai_analysis JSONB,
  fix_status TEXT DEFAULT 'pending',
  fix_applied_at TIMESTAMP WITH TIME ZONE,
  applied_fix TEXT
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to error_logs"
  ON public.error_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Allow anyone to insert (for error logging)
CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT TO authenticated, anon
  WITH CHECK (true);
```

## 📊 What This Table Does

Table `error_logs` menyimpan semua error dari aplikasi untuk AI Auto-Fix monitoring:

- ✅ API errors (500, 404, 403, dll)
- ✅ Runtime errors (JavaScript errors)
- ✅ Upload failures
- ✅ Network errors
- ✅ Unhandled promise rejections

## 🔄 After Setup

Setelah tabel dibuat:

1. Refresh halaman `/admin/errors`
2. Errors akan mulai terdeteksi otomatis
3. AI dapat menganalisis dan memberikan saran fix
4. Command `/errors list` di chat akan berfungsi

## 🆘 Need Help?

Jika masih ada masalah:
1. Screenshot error message
2. Check Supabase logs
3. Verify RLS policies enabled
4. Check service role key di `.env.local`

## 📝 Schema Details

- **Primary Key**: `id` (UUID)
- **Indexes**: created_at, error_type, severity, fix_status
- **RLS**: Enabled dengan policies untuk super_admin dan service_role
- **Foreign Keys**: user_id → auth.users
