# 🚢 Panduan Deployment

Panduan lengkap untuk deploy OSIS SMK Informatika Fithrah Insani Website ke berbagai platform hosting.

---

## 📋 Daftar Isi

- [Persiapan Sebelum Deploy](#-persiapan-sebelum-deploy)
- [Deploy ke Vercel](#-deploy-ke-vercel-recommended)
- [Deploy ke Netlify](#-deploy-ke-netlify)
- [Deploy ke Railway](#-deploy-ke-railway)
- [Deploy ke VPS/Self-Hosted](#-deploy-ke-vpsself-hosted)
- [Deploy ke Digital Ocean App Platform](#-deploy-ke-digital-ocean-app-platform)
- [Custom Domain Setup](#-custom-domain-setup)
- [Environment Variables](#-environment-variables)
- [Post-Deployment](#-post-deployment)

---

## 🎯 Persiapan Sebelum Deploy

### 1. Checklist Pre-Deployment

- [ ] **Code sudah production-ready**
  ```bash
  npm run build
  npm start
  # Test di local, pastikan tidak ada error
  ```

- [ ] **Environment variables sudah lengkap**
  - Supabase URL & Keys
  - NextAuth Secret
  - Social Media API Keys (optional)

- [ ] **Database sudah setup**
  - Supabase project aktif
  - Tables & storage buckets sudah dibuat
  - Seed data sudah diinsert (optional)

- [ ] **Git repository sudah di push**
  ```bash
  git add .
  git commit -m "Ready for deployment"
  git push origin main
  ```

### 2. Build Test

```bash
# Test production build
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
```

### 3. Environment Variables Template

Siapkan semua environment variables yang dibutuhkan:

```bash
# Wajib
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Optional
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=
NEXT_PUBLIC_YOUTUBE_API_KEY=
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=
```

---

## ▲ Deploy ke Vercel (Recommended)

### Mengapa Vercel?

- ✅ **Gratis** untuk personal projects
- ✅ **Zero configuration** untuk Next.js
- ✅ **Automatic HTTPS** & CDN
- ✅ **Auto deploy** setiap git push
- ✅ **Preview deployments** untuk setiap PR
- ✅ **Analytics** & monitoring built-in

### Method 1: Deploy via Vercel Dashboard (Termudah)

#### Step 1: Push ke GitHub

```bash
# Initialize git (jika belum)
git init
git add .
git commit -m "Initial commit"

# Create repository di GitHub
# Lalu push:
git remote add origin https://github.com/yourusername/webosis-archive.git
git branch -M main
git push -u origin main
```

#### Step 2: Import ke Vercel

1. **Login ke Vercel**
   - Buka <https://vercel.com>
   - Click **"Sign Up"** atau **"Login"**
   - Login dengan **GitHub account** (recommended)

2. **Import Project**
   - Click **"Add New..."** → **"Project"**
   - Pilih repository **webosis-archive**
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Set Environment Variables**
   
   Click **"Environment Variables"** tab:

   ```
   NEXT_PUBLIC_SUPABASE_URL          = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = your_anon_key
   SUPABASE_SERVICE_ROLE_KEY         = your_service_role_key
   NEXTAUTH_SECRET                   = your_nextauth_secret
   ```

   **PENTING:** Set untuk environment:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Deploy**
   - Click **"Deploy"**
   - Tunggu 2-3 menit
   - ✅ Done! URL: `https://your-project.vercel.app`

#### Step 3: Update NEXTAUTH_URL

Setelah deploy berhasil:

1. Copy production URL (misal: `https://webosis-archive.vercel.app`)
2. Kembali ke **Settings** → **Environment Variables**
3. Tambahkan/Update:
   ```
   NEXTAUTH_URL = https://webosis-archive.vercel.app
   ```
4. **Redeploy** (Vercel akan auto redeploy)

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# ? Set up and deploy? Yes
# ? Which scope? Your Account
# ? Link to existing project? No
# ? What's your project's name? webosis-archive
# ? In which directory is your code located? ./

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXTAUTH_SECRET

# Deploy to production
vercel --prod
```

### Method 3: Deploy Button (One-Click)

Tambahkan button ini di README.md:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/webosis-archive)
```

User tinggal click button → fork repo → auto deploy!

---

## 🎨 Deploy ke Netlify

### Step 1: Push ke GitHub

(Sama seperti Vercel - pastikan code sudah di GitHub)

### Step 2: Deploy via Netlify Dashboard

1. **Login ke Netlify**
   - Buka <https://app.netlify.com>
   - Sign up/Login dengan GitHub

2. **Import Project**
   - Click **"Add new site"** → **"Import an existing project"**
   - Choose **GitHub**
   - Select repository **webosis-archive**

3. **Configure Build Settings**
   ```
   Base directory:          (leave empty)
   Build command:           npm run build
   Publish directory:       .next
   Functions directory:     netlify/functions (optional)
   ```

4. **Advanced Settings**
   
   Click **"Show advanced"** → **"New variable"**:

   ```
   NEXT_PUBLIC_SUPABASE_URL          = your_value
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = your_value
   SUPABASE_SERVICE_ROLE_KEY         = your_value
   NEXTAUTH_URL                      = https://your-site.netlify.app
   NEXTAUTH_SECRET                   = your_secret
   ```

5. **Deploy**
   - Click **"Deploy site"**
   - Tunggu build selesai (~2-3 menit)

### Step 3: Configure Next.js for Netlify

Buat file `netlify.toml` di root project:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

Install Netlify plugin:

```bash
npm install -D @netlify/plugin-nextjs
```

Commit & push:

```bash
git add netlify.toml package.json
git commit -m "Add Netlify configuration"
git push
```

Netlify akan auto redeploy.

---

## 🚂 Deploy ke Railway

### Step 1: Create Railway Account

1. Buka <https://railway.app>
2. Sign up dengan GitHub

### Step 2: Deploy via Railway Dashboard

1. **New Project**
   - Click **"New Project"**
   - Choose **"Deploy from GitHub repo"**
   - Select **webosis-archive**

2. **Configure**
   - Railway auto-detect Next.js
   - Build command: `npm run build`
   - Start command: `npm start`

3. **Environment Variables**
   
   Click **"Variables"** tab:

   ```
   NEXT_PUBLIC_SUPABASE_URL          = value
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = value
   SUPABASE_SERVICE_ROLE_KEY         = value
   NEXTAUTH_SECRET                   = value
   PORT                              = 3000
   ```

4. **Deploy**
   - Railway auto deploy
   - URL: `https://webosis-archive.up.railway.app`

5. **Update NEXTAUTH_URL**
   - Add variable: `NEXTAUTH_URL = https://your-app.up.railway.app`
   - Redeploy

### Step 3: Custom Domain (Optional)

1. Click **"Settings"** → **"Domains"**
2. Add custom domain
3. Update DNS records di domain provider

---

## 🖥️ Deploy ke VPS/Self-Hosted

### Prerequisites

- VPS dengan Ubuntu 20.04+ (DigitalOcean, Linode, AWS EC2, dll)
- Domain name (optional tapi recommended)

### Step 1: Setup VPS

```bash
# SSH ke VPS
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (reverse proxy)
apt install -y nginx

# Install Git
apt install -y git
```

### Step 2: Clone & Setup Project

```bash
# Create user untuk app (security best practice)
adduser osis
usermod -aG sudo osis
su - osis

# Clone repository
cd ~
git clone https://github.com/yourusername/webosis-archive.git
cd webosis-archive

# Install dependencies
npm ci --production

# Setup environment
nano .env.local
# Paste semua environment variables
```

### Step 3: Build Project

```bash
# Build for production
npm run build

# Test run
npm start
# Ctrl+C to stop
```

### Step 4: Setup PM2

```bash
# Create ecosystem file
nano ecosystem.config.js
```

Paste:

```javascript
module.exports = {
  apps: [{
    name: 'osis-website',
    script: 'npm',
    args: 'start',
    cwd: '/home/osis/webosis-archive',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

Start dengan PM2:

```bash
# Start application
pm2 start ecosystem.config.js

# Setup PM2 startup
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs osis-website
```

### Step 5: Setup Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/osis-website
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/osis-website /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 6: Setup SSL (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 7: Setup Firewall

```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 🌊 Deploy ke Digital Ocean App Platform

### Step 1: Create App

1. Login ke <https://cloud.digitalocean.com>
2. Click **"Create"** → **"Apps"**
3. Choose **GitHub** → Select repository
4. Click **"Next"**

### Step 2: Configure

```yaml
name: webosis-archive
region: sgp1

services:
- name: web
  github:
    repo: yourusername/webosis-archive
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  http_port: 3000
  
  envs:
  - key: NEXT_PUBLIC_SUPABASE_URL
    value: your_value
  - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: your_value
  - key: SUPABASE_SERVICE_ROLE_KEY
    value: your_value
  - key: NEXTAUTH_SECRET
    value: your_value
```

### Step 3: Deploy

- Click **"Next"** → **"Create Resources"**
- Tunggu deployment (~5 menit)
- URL: `https://webosis-archive-xxxxx.ondigitalocean.app`

---

## 🌐 Custom Domain Setup

### Vercel

1. **Settings** → **Domains**
2. Add domain: `osissmaitfi.com`
3. Update DNS di domain provider:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### Netlify

1. **Domain settings** → **Add custom domain**
2. Update DNS:
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: your-site.netlify.app
   ```

### Cloudflare (Recommended for any platform)

1. Add site ke Cloudflare
2. Update nameservers di domain provider
3. Add DNS records pointing ke hosting
4. Enable:
   - ✅ Proxy (orange cloud)
   - ✅ Always Use HTTPS
   - ✅ Auto Minify
   - ✅ Brotli compression

---

## 🔐 Environment Variables

### Production Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_URL=https://osissmaitfi.com
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# Optional: Social Media
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxx
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSyxxxxx
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=1a2b3cxxxxx
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=xyz123xxxxx
```

### Generate NEXTAUTH_SECRET

```bash
# Method 1: OpenSSL
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Online
# https://generate-secret.vercel.app/32
```

---

## ✅ Post-Deployment

### 1. Verify Deployment

- [ ] Homepage loads tanpa error
- [ ] Static assets (images, CSS) load correctly
- [ ] Database connection works
- [ ] Authentication works
- [ ] API routes berfungsi
- [ ] Admin panel accessible
- [ ] File uploads works (gallery)

### 2. Performance Check

```bash
# Lighthouse audit
npm install -g lighthouse

lighthouse https://your-domain.com --view
```

Target scores:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+

### 3. Setup Monitoring

**Vercel Analytics** (jika deploy di Vercel):
- Settings → Analytics → Enable

**Google Analytics**:
- Add tracking code di `app/layout.tsx`

**Sentry** (error tracking):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### 4. Setup Backups

**Database Backup** (Supabase):
- Settings → Database → Backups
- Enable automatic backups

**Code Backup**:
- Pastikan push ke GitHub regularly
- Enable branch protection for `main`

### 5. Setup Custom Error Pages

Create `app/error.tsx` dan `app/not-found.tsx` sudah ada di project.

### 6. Configure Security Headers

Di `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
    ]
  },
}
```

---

## 🔄 Continuous Deployment

### Auto Deploy on Git Push

**Vercel/Netlify/Railway**: Sudah otomatis

**VPS**: Setup GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd ~/webosis-archive
          git pull origin main
          npm ci --production
          npm run build
          pm2 restart osis-website
```

Add secrets di GitHub:
- `HOST`: VPS IP
- `USERNAME`: osis
- `SSH_KEY`: Private SSH key

---

## 🆘 Deployment Troubleshooting

### Build Fails

```bash
# Check build logs
# Common issues:
# 1. Missing environment variables
# 2. Type errors
# 3. Dependency issues

# Fix:
npm run build
# Fix semua errors yang muncul
```

### 500 Internal Server Error

- Check environment variables
- Check database connection
- Check logs (Vercel: Logs tab, VPS: `pm2 logs`)

### Slow Performance

- Enable caching
- Optimize images (use Next.js Image component)
- Enable compression
- Use CDN (Vercel/Netlify sudah included)

### Database Connection Error

- Verify Supabase URL & keys
- Check IP whitelist (jika ada)
- Verify network access

---

## 📞 Support

Butuh bantuan deployment?

- 📖 **Docs**: Baca dokumentasi platform (Vercel, Netlify, dll)
- 💬 **GitHub Issues**: <https://github.com/yourusername/webosis-archive/issues>
- 📧 **Email**: osis@smaitfi.sch.id

---

<div align="center">

**Deployment successful! 🎉**

*Website OSIS SMAIT Fithrah Insani now live!*

</div>
