# ⚙️ Panduan Konfigurasi

Dokumentasi lengkap untuk konfigurasi environment variables, database, dan sistem.

---

## 📋 Daftar Isi

- [Environment Variables](#-environment-variables)
- [Supabase Configuration](#-supabase-configuration)
- [NextAuth Configuration](#-nextauth-configuration)
- [Social Media APIs](#-social-media-apis)
- [File Upload Configuration](#-file-upload-configuration)
- [Performance Tuning](#-performance-tuning)
- [Security Configuration](#-security-configuration)

---

## 🔐 Environment Variables

### Quick Setup

```bash
# Copy template
cp .env.example .env.local

# Edit dengan text editor
code .env.local  # VS Code
nano .env.local  # Terminal
notepad .env.local  # Windows
```

### Complete Environment Variables

```bash
# ============================================
# SUPABASE CONFIGURATION (REQUIRED)
# ============================================
# Get from: https://app.supabase.com/project/_/settings/api

# Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anonymous (Public) Key - untuk client-side requests
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...

# Service Role Key - untuk server-side requests (JANGAN EXPOSE KE CLIENT)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...


# ============================================
# NEXTAUTH CONFIGURATION (REQUIRED)
# ============================================

# Production URL (ganti setelah deploy)
NEXTAUTH_URL=http://localhost:3001

# Secret key untuk JWT encryption (minimum 32 characters)
# Generate: openssl rand -base64 32
NEXTAUTH_SECRET=your_super_secret_key_minimum_32_characters_long_random_string


# ============================================
# INSTAGRAM GRAPH API (OPTIONAL)
# ============================================
# Get from: https://developers.facebook.com/apps/

# Long-lived access token (valid 60 days)
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Instagram Business Account ID
NEXT_PUBLIC_INSTAGRAM_USER_ID=17841400000000000


# ============================================
# YOUTUBE DATA API V3 (OPTIONAL)
# ============================================
# Get from: https://console.cloud.google.com/apis/credentials

# API Key
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Channel ID (from YouTube channel URL)
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxxx


# ============================================
# SPOTIFY WEB API (OPTIONAL)
# ============================================
# Get from: https://developer.spotify.com/dashboard/applications

# Client ID
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p

# Client Secret (JANGAN EXPOSE KE CLIENT)
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=xyz123abc456def789ghi012jkl345mno678


# ============================================
# TIKTOK API (OPTIONAL - Coming Soon)
# ============================================
# Get from: https://developers.tiktok.com/

NEXT_PUBLIC_TIKTOK_ACCESS_TOKEN=your_tiktok_access_token_here


# ============================================
# GOOGLE OAUTH (OPTIONAL)
# ============================================
# For NextAuth Google provider
# Get from: https://console.cloud.google.com/apis/credentials

GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx


# ============================================
# APP CONFIGURATION (OPTIONAL)
# ============================================

# Auto-refresh interval for social media (in minutes)
NEXT_PUBLIC_REFRESH_INTERVAL=30

# Max file upload size (in MB)
NEXT_PUBLIC_MAX_FILE_SIZE=50

# Enable debug mode
NEXT_PUBLIC_DEBUG=false

# Node environment
NODE_ENV=development  # or 'production'
```

---

## 🗄️ Supabase Configuration

### 1. Create Supabase Project

1. **Sign Up / Login**
   - Go to <https://supabase.com>
   - Click "Start your project"
   - Sign in with GitHub (recommended)

2. **Create New Project**
   - Click "New project"
   - Fill in details:
     ```
     Organization:    Pilih atau buat baru
     Name:            osis-smait-fithrah-insani
     Database Pass:   Generate strong password (SAVE THIS!)
     Region:          Southeast Asia (Singapore) - untuk Indonesia
     Pricing Plan:    Free
     ```
   - Click "Create new project"
   - Wait ~2 minutes for project initialization

### 2. Get API Keys

1. **Navigate to Settings**
   - Sidebar: Settings (⚙️) → API

2. **Copy Credentials**
   ```
   Project URL:     Copy ke NEXT_PUBLIC_SUPABASE_URL
   anon public:     Copy ke NEXT_PUBLIC_SUPABASE_ANON_KEY
   service_role:    Copy ke SUPABASE_SERVICE_ROLE_KEY
   ```

   **⚠️ IMPORTANT:**
   - `anon` key: Aman untuk client-side (public)
   - `service_role` key: **JANGAN PERNAH** expose ke client! Server-side only!

### 3. Setup Database Schema

1. **Open SQL Editor**
   - Sidebar: SQL Editor (📝)
   - Click "New query"

2. **Run Migration Scripts**

   Execute dalam urutan:

   a. **Main Schema** - `supabase-schema.sql`
   ```sql
   -- Copy paste semua isi file supabase-schema.sql
   -- Klik RUN
   ```

   b. **CMS Schema** - `supabase-cms-schema.sql`
   ```sql
   -- Copy paste semua isi file supabase-cms-schema.sql
   -- Klik RUN
   ```

   c. **Super Admin Seed** - `supabase-super-admin-seed.sql`
   ```sql
   -- Copy paste semua isi file supabase-super-admin-seed.sql
   -- Klik RUN
   ```

3. **Verify Tables Created**
   - Sidebar: Table Editor
   - Check tables:
     - ✅ users
     - ✅ members
     - ✅ gallery
     - ✅ events
     - ✅ announcements
     - ✅ bidang
     - ✅ program_kerja
     - ✅ sekbid

### 4. Setup Storage Buckets

1. **Navigate to Storage**
   - Sidebar: Storage (📦)

2. **Create Buckets**

   a. **Gallery Bucket**
   ```
   Name:        gallery
   Public:      ✅ Yes
   File size:   50 MB
   Allowed:     image/*
   ```

   b. **Members Bucket**
   ```
   Name:        members
   Public:      ✅ Yes
   File size:   10 MB
   Allowed:     image/*
   ```

   c. **Events Bucket**
   ```
   Name:        events
   Public:      ✅ Yes
   File size:   20 MB
   Allowed:     image/*
   ```

3. **Configure Bucket Policies**

   For each bucket, go to **Policies** tab:

   ```sql
   -- SELECT Policy (Read)
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'gallery' );

   -- INSERT Policy (Upload) - untuk authenticated users
   CREATE POLICY "Authenticated Upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'gallery' 
     AND auth.role() = 'authenticated'
   );

   -- DELETE Policy - untuk admin only
   CREATE POLICY "Admin Delete"
   ON storage.objects FOR DELETE
   USING (
     bucket_id = 'gallery'
     AND auth.jwt() ->> 'role' = 'admin'
   );
   ```

### 5. Configure Row Level Security (RLS)

Enable RLS untuk security:

```sql
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy examples:

-- Public read untuk gallery
CREATE POLICY "Public can view gallery"
ON gallery FOR SELECT
USING (true);

-- Admin can insert/update/delete
CREATE POLICY "Admin full access"
ON gallery FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🔑 NextAuth Configuration

### 1. Generate NEXTAUTH_SECRET

**Method 1: OpenSSL (macOS/Linux)**
```bash
openssl rand -base64 32
```

**Method 2: Node.js (semua platform)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Method 3: Online Generator**
- Visit: <https://generate-secret.vercel.app/32>
- Copy generated secret

**Method 4: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }) -as [byte[]])
```

Copy hasil ke `NEXTAUTH_SECRET` di `.env.local`

### 2. Configure NEXTAUTH_URL

**Development:**
```bash
NEXTAUTH_URL=http://localhost:3001
```

**Production:**
```bash
# Update setelah deploy
NEXTAUTH_URL=https://osissmaitfi.com
```

**Important:** URL harus exact match dengan URL yang diakses user!

### 3. Configure Providers (Optional)

#### Google OAuth

1. **Create Google OAuth App**
   - Go to <https://console.cloud.google.com>
   - Create new project atau select existing
   - Enable "Google+ API"
   - Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     ```
     http://localhost:3001/api/auth/callback/google
     https://your-domain.com/api/auth/callback/google
     ```
   - Copy Client ID & Client Secret

2. **Add to .env.local**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. **Update auth config** di `app/api/auth/[...nextauth]/route.ts`
   ```typescript
   import GoogleProvider from "next-auth/providers/google"

   providers: [
     GoogleProvider({
       clientId: process.env.GOOGLE_CLIENT_ID!,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
     }),
     // ... other providers
   ]
   ```

---

## 📱 Social Media APIs

### Instagram Graph API

#### 1. Prerequisites
- Facebook Developer Account
- Instagram Business Account
- Facebook Page connected to Instagram

#### 2. Setup Steps

1. **Create Facebook App**
   - <https://developers.facebook.com/apps/>
   - Create App → Business
   - Add Instagram Graph API product

2. **Get Access Token**
   - Tools → Graph API Explorer
   - Permissions: `instagram_basic`, `pages_read_engagement`
   - Generate Token
   - Copy **User Access Token**

3. **Exchange for Long-Lived Token**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
   ```

4. **Get Instagram User ID**
   ```bash
   curl -X GET "https://graph.facebook.com/v18.0/me/accounts?access_token=LONG_LIVED_TOKEN"
   # Get page_id

   curl -X GET "https://graph.facebook.com/v18.0/{page_id}?fields=instagram_business_account&access_token=LONG_LIVED_TOKEN"
   # Get instagram_business_account.id
   ```

5. **Add to .env.local**
   ```bash
   NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
   NEXT_PUBLIC_INSTAGRAM_USER_ID=your_instagram_business_id
   ```

**Token Valid:** 60 days (perlu refresh)

#### 3. Refresh Token (Optional)

Create cron job untuk auto-refresh token sebelum expire.

### YouTube Data API v3

#### 1. Setup

1. **Google Cloud Console**
   - <https://console.cloud.google.com>
   - Create Project atau pilih existing

2. **Enable YouTube Data API v3**
   - APIs & Services → Library
   - Search "YouTube Data API v3"
   - Click Enable

3. **Create API Key**
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Copy API Key

4. **Restrict API Key (Recommended)**
   - Edit API Key
   - Application restrictions: HTTP referrers
   - Add:
     ```
     http://localhost:3001/*
     https://your-domain.com/*
     ```
   - API restrictions: Restrict key
   - Select: YouTube Data API v3

5. **Get Channel ID**
   - Open your YouTube channel
   - URL: `youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxx`
   - Copy ID after `/channel/`

6. **Add to .env.local**
   ```bash
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key
   NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxx
   ```

**Quota:** 10,000 units/day (gratis)

### Spotify Web API

#### 1. Setup

1. **Create Spotify App**
   - <https://developer.spotify.com/dashboard>
   - Create App
   - Name: OSIS SMAIT FI Website
   - Description: For displaying Spotify content
   - Redirect URI: `http://localhost:3001` (for now)

2. **Get Credentials**
   - Click "Settings"
   - Copy:
     - Client ID
     - Client Secret (click "View client secret")

3. **Add to .env.local**
   ```bash
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
   NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

#### 2. Get Playlist/Album ID

- Open Spotify
- Right-click playlist → Share → Copy link
- Extract ID from URL:
  ```
  https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M
                                   ^^^^^^^^^^^^^^^^^^^^^^
                                   This is the ID
  ```

---

## 📤 File Upload Configuration

### Supabase Storage Limits

```bash
# Default limits (Free tier)
NEXT_PUBLIC_MAX_FILE_SIZE=50  # MB

# File types allowed
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
ALLOWED_VIDEO_TYPES=video/mp4,video/webm
```

### Client-side Validation

Di `lib/validators.ts`:

```typescript
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: "File size must be less than 50MB",
    })
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      {
        message: "Only JPEG, PNG, and WebP images are allowed",
      }
    ),
});
```

### Increase Upload Limits

1. **Supabase Dashboard**
   - Storage → Policies
   - Edit bucket policies
   - Adjust size limits

2. **Next.js API Route**

   Create `next.config.ts`:
   ```typescript
   const nextConfig = {
     api: {
       bodyParser: {
         sizeLimit: '50mb',
       },
     },
   }
   ```

---

## ⚡ Performance Tuning

### Next.js Configuration

Edit `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    domains: [
      'your-supabase-project.supabase.co',
      'platform.instagram.com',
      'i.ytimg.com',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Production optimizations
  swcMinify: true,
  reactStrictMode: true,

  // Headers for security & performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Database Optimization

```sql
-- Add indexes untuk faster queries
CREATE INDEX idx_gallery_created_at ON gallery(created_at DESC);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_members_bidang_id ON members(bidang_id);

-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Caching Strategy

```typescript
// app/api/gallery/route.ts
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  // Your API logic
}
```

---

## 🔒 Security Configuration

### 1. Secure Environment Variables

**❌ NEVER commit:**
- `.env.local`
- `.env.production`
- Any file with real credentials

**✅ DO commit:**
- `.env.example` (with placeholder values)

### 2. Content Security Policy

Add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
            "img-src 'self' data: https:",
            "font-src 'self' fonts.gstatic.com",
            "connect-src 'self' *.supabase.co",
          ].join('; '),
        },
      ],
    },
  ];
}
```

### 3. Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

### 4. Input Validation

Always validate input dengan Zod:

```typescript
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const result = schema.safeParse(input);
```

### 5. SQL Injection Prevention

✅ **DO:** Use parameterized queries
```typescript
const { data } = await supabase
  .from('users')
  .select()
  .eq('email', userEmail); // Safe
```

❌ **DON'T:** Concatenate strings
```typescript
// DANGEROUS!
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

---

## 🔧 Advanced Configuration

### Custom Port

```bash
# package.json
"dev": "next dev -p 3002"

# atau via environment
PORT=3002 npm run dev
```

### Multiple Environments

```bash
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:3001

# .env.production
NEXT_PUBLIC_API_URL=https://osissmaitfi.com

# .env.staging
NEXT_PUBLIC_API_URL=https://staging.osissmaitfi.com
```

### Debugging

```bash
# Enable debug mode
NEXT_PUBLIC_DEBUG=true

# Node.js inspector
NODE_OPTIONS='--inspect' npm run dev
```

---

## 📞 Support

Configuration issues?

- 📖 **Check**: [INSTALLATION.md](./INSTALLATION.md)
- 💬 **Issues**: GitHub Issues
- 📧 **Email**: osis@smaitfi.sch.id

---

<div align="center">

**Configuration Complete! ✅**

</div>
