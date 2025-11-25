# 📜 NPM Scripts Documentation

Dokumentasi lengkap semua scripts yang tersedia di `package.json`.

---

## 📋 Daftar Isi

- [Development Scripts](#-development-scripts)
- [Production Scripts](#-production-scripts)
- [Build Scripts](#-build-scripts)
- [Testing & Quality](#-testing--quality)
- [Utility Scripts](#-utility-scripts)
- [Custom Scripts](#-custom-scripts)

---

## 🔧 Development Scripts

### `npm run dev`

Start development server di port 3001 dengan network access.

```bash
npm run dev
```

**Details:**
- Port: 3001
- Hostname: 0.0.0.0 (accessible dari network)
- Hot reload: Enabled
- Pre-dev hook: Menampilkan LAN IP

**Use when:**
- Local development
- Testing di device lain (mobile, tablet)
- Collaboration dengan tim lokal

**Output:**
```
▲ Next.js 15.5.4
- Local:        http://localhost:3001
- Network:      http://192.168.1.100:3001
✓ Ready in 2.3s
```

---

### `npm run dev:turbo`

Start development dengan Turbo mode (lebih cepat).

```bash
npm run dev:turbo
```

**Details:**
- Menggunakan Next.js Turbopack
- Faster compilation
- Port: 3001
- Hot reload: Lebih cepat

**Use when:**
- Development dengan banyak perubahan file
- Butuh reload yang lebih cepat
- Working dengan large codebase

**Note:** Turbo mode masih beta, mungkin ada bugs.

---

### `npm run dev:fast`

Development mode dengan Turbo + Network access.

```bash
npm run dev:fast
```

**Combines:**
- Turbopack untuk speed
- Network access untuk testing

**Use when:**
- Development intensif
- Testing real-time di multiple devices

---

## 🚀 Production Scripts

### `npm start`

Start production server (default port 3000).

```bash
npm start
```

**Prerequisites:**
```bash
npm run build  # Must build first
```

**Details:**
- Runs optimized production build
- Port: 3000 (default)
- No hot reload
- Environment: production

**Use when:**
- Testing production build locally
- Running on production server

---

### `npm run start:prod`

Start production server di port 3000 (explicit).

```bash
npm run start:prod
```

**Same as `npm start`** but explicitly set port 3000.

---

## 🏗️ Build Scripts

### `npm run build`

Build production-ready application.

```bash
npm run build
```

**Process:**
1. Type checking (TypeScript)
2. Linting
3. Compiling pages
4. Optimizing images
5. Generating static pages
6. Creating `.next` folder

**Output:**
```
✓ Linting and checking validity of types
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (15/15)
```

**Build Size Example:**
```
Route (app)                Size     First Load JS
┌ ○ /                      5.2 kB         92.1 kB
├ ○ /about                 3.8 kB         88.9 kB
├ ○ /admin                 12.3 kB        125.4 kB
├ ○ /gallery               6.1 kB         96.8 kB
└ ○ /api/*                 0 kB           0 kB
```

**Legend:**
- ○ = Static (SSG)
- ● = Server-side rendered (SSR)
- λ = Serverless function

---

### `npm run clean`

Remove build artifacts.

```bash
npm run clean
```

**Removes:**
- `.next/` folder
- Build cache
- Temporary files

**Use when:**
- Build errors
- Corrupted cache
- Fresh build needed

**Then:**
```bash
npm run build  # Rebuild
```

---

## ✅ Testing & Quality

### `npm run lint`

Run ESLint untuk check code quality.

```bash
npm run lint
```

**Checks:**
- TypeScript type errors
- Code style violations
- Unused variables
- Missing dependencies
- Accessibility issues

**Output Example:**
```
✔ No ESLint warnings or errors
```

**Or with errors:**
```
./app/page.tsx
  12:7  Error: 'useState' is defined but never used  no-unused-vars
  25:3  Warning: Missing key prop for element in list  react/jsx-key
```

---

### `npm run lint:fix`

Auto-fix linting errors.

```bash
npm run lint:fix
```

**Fixes:**
- Formatting issues
- Import sorting
- Trailing commas
- Spacing & indentation

**Cannot fix:**
- Logic errors
- Type errors
- Complex violations

**Use when:**
- Before committing code
- After major refactoring
- Cleaning up codebase

---

## 🛠️ Utility Scripts

### `npm run predev`

Pre-development hook (runs automatically before `npm run dev`).

```bash
# Runs automatically, or manually:
npm run predev
```

**Function:**
- Displays LAN IP address
- Shows network access URL
- Helps team members access dev server

**Output:**
```
🌐 Network URLs:
   Local:   http://localhost:3001
   Network: http://192.168.1.100:3001
```

**Script location:** `show-lan-ip.js`

---

### `npm run hash:pw`

Hash password untuk admin users.

```bash
npm run hash:pw
```

**Interactive:**
```
Enter password to hash: ********
Hashed password: $2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Use when:**
- Creating new admin users
- Resetting passwords
- Manual database seeding

**Script location:** `scripts/hash-password.js`

**Example usage:**
```bash
npm run hash:pw
# Copy hashed password
# Insert ke database users table
```

---

## 🔍 Custom Scripts

### Create Custom Script

Tambahkan di `package.json`:

```json
{
  "scripts": {
    "custom:script": "node scripts/your-script.js"
  }
}
```

**Examples:**

#### Seed Database

```json
{
  "scripts": {
    "db:seed": "node scripts/seed-database.js"
  }
}
```

```bash
npm run db:seed
```

#### Generate Types

```json
{
  "scripts": {
    "generate:types": "supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts"
  }
}
```

```bash
npm run generate:types
```

#### Backup Data

```json
{
  "scripts": {
    "backup:db": "node scripts/backup-database.js"
  }
}
```

```bash
npm run backup:db
```

---

## 🔗 Script Chaining

### Run Multiple Scripts

**Sequential (one after another):**

```bash
npm run clean && npm run build && npm start
```

**Parallel (simultaneously):**

```bash
npm run dev & npm run test:watch
```

**Pre/Post Hooks:**

```json
{
  "scripts": {
    "prebuild": "npm run clean",
    "build": "next build",
    "postbuild": "echo 'Build complete!'"
  }
}
```

When you run `npm run build`:
1. `prebuild` runs first
2. `build` runs
3. `postbuild` runs last

---

## 📊 Common Workflows

### Development Workflow

```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies (if package.json changed)
npm install

# 3. Start development
npm run dev

# 4. Make changes...

# 5. Lint before commit
npm run lint:fix

# 6. Commit and push
git add .
git commit -m "feat: add new feature"
git push
```

---

### Production Deployment Workflow

```bash
# 1. Test build locally
npm run build
npm start

# 2. Test in browser
# Open http://localhost:3000

# 3. If successful, deploy
git push origin main

# Vercel/Netlify will auto-deploy
```

---

### Clean Install Workflow

```bash
# 1. Remove old dependencies
rm -rf node_modules package-lock.json

# 2. Clear Next.js cache
npm run clean

# 3. Fresh install
npm install

# 4. Rebuild
npm run build
```

---

### Bug Fixing Workflow

```bash
# 1. Create branch
git checkout -b fix/bug-description

# 2. Start dev server
npm run dev

# 3. Fix bug...

# 4. Test
npm run build

# 5. Lint
npm run lint:fix

# 6. Commit
git commit -m "fix: resolve bug"

# 7. Push
git push origin fix/bug-description

# 8. Create PR
```

---

## 🚦 Script Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of shell command |
| 126 | Command not executable |
| 127 | Command not found |
| 130 | Terminated by Ctrl+C |

**Check exit code:**

```bash
npm run build
echo $?  # macOS/Linux
echo %ERRORLEVEL%  # Windows CMD
echo $LASTEXITCODE  # Windows PowerShell
```

---

## 🎯 Tips & Best Practices

### 1. Always Lint Before Commit

```bash
npm run lint:fix
git add .
git commit -m "message"
```

### 2. Test Build Before Deploy

```bash
npm run build
npm start
# Test thoroughly
```

### 3. Clean Build on Errors

```bash
npm run clean
npm run build
```

### 4. Use Turbo for Speed

```bash
npm run dev:turbo  # Development
```

### 5. Check Network Access

```bash
npm run predev  # Show LAN IP
npm run dev     # Start with network access
```

---

## 🆘 Troubleshooting Scripts

### Script Not Found

```bash
npm run unknown-script
# Error: missing script: unknown-script

# Solution: Check package.json scripts section
```

### Permission Denied

```bash
# macOS/Linux
chmod +x scripts/your-script.js

# Or run with node
node scripts/your-script.js
```

### Port Already in Use

```bash
# Error: Port 3001 is already in use

# Solution:
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Build Fails

```bash
# 1. Clean
npm run clean

# 2. Delete node_modules
rm -rf node_modules package-lock.json

# 3. Reinstall
npm install

# 4. Rebuild
npm run build
```

---

## 📚 Additional Resources

- **npm scripts docs:** <https://docs.npmjs.com/cli/v8/using-npm/scripts>
- **Next.js CLI:** <https://nextjs.org/docs/api-reference/cli>
- **package.json reference:** <https://docs.npmjs.com/cli/v8/configuring-npm/package-json>

---

## 🆘 Need Help?

Questions about scripts?

- 📖 Read this documentation
- 💬 GitHub Issues
- 📧 Email: osis@smaitfi.sch.id

---

<div align="center">

**Happy scripting! 🚀**

</div>
