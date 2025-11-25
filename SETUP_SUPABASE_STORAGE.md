# Setup Supabase Storage untuk Gallery

## Masalah Saat Ini
Google Drive direct download links tidak bisa diakses langsung karena memerlukan authentication.

## Solusi: Gunakan Supabase Storage

### 1. Setup Storage Bucket di Supabase Dashboard

1. Buka Supabase Dashboard: https://app.supabase.com
2. Pilih project kamu
3. Di sidebar kiri, klik **Storage**
4. Klik **New bucket**
5. Nama bucket: `gallery`
6. **Public bucket**: ON (centang)
7. Klik **Create bucket**

### 2. Set Storage Policy (Public Read Access)

Setelah bucket dibuat:
1. Klik bucket `gallery`
2. Klik tab **Policies**
3. Klik **New Policy**
4. Pilih template **Enable read access for all users**
5. Klik **Review** → **Save policy**

### 3. Upload File Test

1. Klik bucket `gallery`
2. Klik **Upload file**
3. Upload foto test
4. Setelah upload, klik file → **Get URL**
5. Copy URL - formatnya: `https://[project-id].supabase.co/storage/v1/object/public/gallery/[filename]`

### 4. Update Admin Gallery Form

Nanti kita akan update form admin untuk:
- Upload file langsung ke Supabase Storage
- Generate public URL otomatis
- Simpan URL ke database

### 5. Migration Existing Data

Untuk foto yang sudah ada:
1. Download dari Google Drive
2. Upload ke Supabase Storage bucket `gallery`
3. Update database dengan URL baru

## Temporary Fix: Set Google Drive Permission

Untuk sementara, kamu bisa set file Google Drive ke public:
1. Buka Google Drive
2. Klik kanan file → Share
3. Change to "Anyone with the link"
4. Set permission to "Viewer"
5. File sekarang bisa diakses langsung
