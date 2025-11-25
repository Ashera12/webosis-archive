# 🔑 Setup API Keys - Auto Sync Social Media

## 📋 Overview

Website bisa auto-fetch data dari Instagram, YouTube, dan Spotify menggunakan API mereka. Ikuti panduan ini untuk setup API keys.

---

## 📸 Instagram Graph API

### Step 1: Buat Facebook App

1. **Buka** https://developers.facebook.com/apps/
2. **Klik** "Create App"
3. **Pilih** "Business" sebagai app type
4. **Isi** App Name: "OSIS SMK Website"
5. **Klik** "Create App"

### Step 2: Setup Instagram Graph API

1. Di Dashboard app, **klik** "Add Product"
2. **Cari** "Instagram Graph API"
3. **Klik** "Set Up"
4. **Ikuti** wizard setup

### Step 3: Connect Instagram Account

1. **Buka** Settings → Basic
2. **Copy** App ID dan App Secret
3. **Buka** Instagram → Basic Display
4. **Add** Instagram Account OSIS
5. **Authorize** app untuk access posts

### Step 4: Generate Access Token

1. **Buka** Graph API Explorer: https://developers.facebook.com/tools/explorer/
2. **Pilih** app kalian
3. **Add Permissions**:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
4. **Generate** Access Token
5. **Exchange** for Long-Lived Token (60 hari):
   ```
   https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN
   ```

### Step 5: Get Instagram User ID

1. **Buka** Graph API Explorer
2. **Query**: `me/accounts`
3. **Copy** Instagram Business Account ID

### Step 6: Save to .env.local

```env
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=your_long_lived_token_here
NEXT_PUBLIC_INSTAGRAM_USER_ID=your_instagram_business_account_id
```

---

## 🎥 YouTube Data API v3

### Step 1: Create Google Cloud Project

1. **Buka** https://console.cloud.google.com/
2. **Klik** "New Project"
3. **Nama**: "OSIS SMK Website"
4. **Klik** "Create"

### Step 2: Enable YouTube Data API

1. **Buka** "APIs & Services" → "Library"
2. **Cari** "YouTube Data API v3"
3. **Klik** "Enable"

### Step 3: Create API Key

1. **Buka** "APIs & Services" → "Credentials"
2. **Klik** "Create Credentials" → "API Key"
3. **Copy** API Key
4. **Klik** "Restrict Key" (recommended):
   - Application restrictions: HTTP referrers
   - Add your website domain
   - API restrictions: YouTube Data API v3

### Step 4: Get Channel ID

**Opsi 1 - Dari URL Channel:**
- URL format: `youtube.com/channel/CHANNEL_ID`
- Copy CHANNEL_ID

**Opsi 2 - Dari Username:**
- Buka channel YouTube OSIS
- View Page Source (Ctrl+U)
- Cari `"channelId":"..."`
- Copy ID

**Opsi 3 - Pakai Tool:**
- Buka https://commentpicker.com/youtube-channel-id.php
- Paste URL channel
- Get ID

### Step 5: Save to .env.local

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

### ⚠️ YouTube API Quota

- **Free quota**: 10,000 units/day
- **Read operation**: 1 unit per request
- **Website usage**: ~20-50 units/day (auto-refresh setiap 30 menit)
- **Cukup** untuk website OSIS!

---

## 🎵 Spotify Web API

### Step 1: Create Spotify App

1. **Buka** https://developer.spotify.com/dashboard/
2. **Log in** dengan Spotify account
3. **Klik** "Create app"
4. **Isi** form:
   - App name: "OSIS SMK Website"
   - App description: "Website OSIS untuk display podcast/playlist"
   - Redirect URI: `http://localhost:3001` (untuk testing)
   - API/SDKs: Web API
5. **Klik** "Save"

### Step 2: Get Credentials

1. Di app dashboard, **klik** "Settings"
2. **Copy** Client ID
3. **Klik** "View client secret"
4. **Copy** Client Secret

### Step 3: Get Show/Playlist IDs

**Untuk Podcast:**
1. Buka Spotify podcast
2. Klik Share → Copy link
3. URL format: `https://open.spotify.com/show/SHOW_ID`
4. Copy SHOW_ID

**Untuk Playlist:**
1. Buka Spotify playlist
2. Klik Share → Copy link
3. URL format: `https://open.spotify.com/playlist/PLAYLIST_ID`
4. Copy PLAYLIST_ID

### Step 4: Save to .env.local

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Step 5: Update Code dengan IDs

Edit `lib/socialMediaData.ts`:

```typescript
export const spotifyContent: SpotifyContent[] = [
  {
    id: '1',
    title: 'OSIS Talk Podcast',
    type: 'podcast',
    // Ganti dengan SHOW_ID kalian
    url: 'https://open.spotify.com/show/ACTUAL_SHOW_ID',
    // ... data lainnya
  }
];
```

---

## ⚙️ Final Setup

### 1. Copy .env.example ke .env.local

```bash
cp .env.example .env.local
```

### 2. Edit .env.local

Isi dengan API keys yang sudah didapat:

```env
# Instagram
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxxxxxxx
NEXT_PUBLIC_INSTAGRAM_USER_ID=17841xxxxxxxxxx

# YouTube
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxx

# Spotify
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Refresh interval (menit)
NEXT_PUBLIC_REFRESH_INTERVAL=30
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Test API Integration

1. **Buka** http://localhost:3001/our-social-media
2. **Check** browser console (F12) untuk:
   - Tidak ada error API
   - Data fetched successfully
3. **Verify** posts/videos otomatis dari API (bukan dummy data)

---

## 🔄 How It Works

### Auto-Refresh

Website otomatis fetch data:
- **On page load**: Fetch semua data
- **Every 30 minutes**: Auto-refresh (configurable via `NEXT_PUBLIC_REFRESH_INTERVAL`)
- **Cache**: Next.js cache response untuk performance

### Fallback System

Jika API tidak configured atau error:
- Website pakai data dari `lib/socialMediaData.ts` (fallback)
- No crash, website tetap jalan normal
- Console warning only

### Data Flow

```
User visits page
  → useSocialMediaData() hook activated
    → Check if API keys configured
      → YES: Fetch from API
        → Format data
        → Update state
        → Display real data
      → NO: Use fallback data
    → Auto-refresh every 30 min
```

---

## 🐛 Troubleshooting

### Instagram tidak fetch data?

**Check:**
1. Access token valid? (Test di Graph API Explorer)
2. Token tidak expired? (Long-lived token = 60 hari)
3. Instagram account adalah Business Account?
4. Permissions sudah di-approve?

**Solution:**
- Generate new Long-Lived Token
- Re-authorize app di Instagram Settings

### YouTube tidak fetch videos?

**Check:**
1. API Key valid? (Test di API Console)
2. YouTube Data API v3 enabled?
3. Channel ID benar?
4. Quota tidak habis? (Check di Console)

**Solution:**
- Create new API Key
- Check quota usage di Google Console
- Verify Channel ID

### Spotify tidak load?

**Check:**
1. Client ID & Secret benar?
2. Show/Playlist ID valid?
3. Content adalah public (not private)?

**Solution:**
- Verify credentials di Spotify Dashboard
- Check Playlist/Show visibility settings

### Console error: "API credentials not configured"?

**Normal!** Artinya API keys belum di-setup. Website pakai fallback data.

**Fix:** Isi .env.local dengan API keys

---

## 📊 API Usage & Costs

### Instagram Graph API
- **Cost**: FREE
- **Limit**: Access token expires setiap 60 hari
- **Renewal**: Generate new long-lived token

### YouTube Data API
- **Cost**: FREE (with quota)
- **Quota**: 10,000 units/day
- **Usage**: ~20-50 units/day untuk website ini
- **Enough**: Ya, lebih dari cukup!

### Spotify Web API
- **Cost**: FREE
- **Limit**: Rate limiting (reasonable use)
- **Usage**: Very low untuk website ini

---

## ✅ Verification Checklist

Setelah setup semua API:

- [ ] `.env.local` file exists dengan semua keys
- [ ] Instagram posts auto-fetch (bukan dummy data)
- [ ] YouTube videos auto-fetch
- [ ] No console errors
- [ ] Data refresh setiap 30 menit
- [ ] Fallback works jika API down
- [ ] Mobile responsive tetap works
- [ ] Modal video player works

---

## 🚀 Next Steps

1. **Setup semua API keys** (ikuti panduan di atas)
2. **Test** data fetching
3. **Customize** refresh interval jika perlu
4. **Deploy** ke production
5. **Monitor** API usage di respective dashboards

Kalau ada masalah, check console log untuk error details!
