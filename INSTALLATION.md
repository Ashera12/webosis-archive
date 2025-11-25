# 📥 Panduan Instalasi Lengkap

Panduan step-by-step instalasi OSIS SMK Informatika Fithrah Insani Website untuk berbagai sistem operasi.

---

## 📋 Daftar Isi

- [Windows](#-instalasi-di-windows)
- [macOS](#-instalasi-di-macos)
- [Linux (Ubuntu/Debian)](#-instalasi-di-linux-ubuntudebian)
- [Verifikasi Instalasi](#-verifikasi-instalasi)
- [Troubleshooting](#-troubleshooting)

---

## 🪟 Instalasi di Windows

### 1. Install Node.js

#### Opsi A: Download Installer (Recommended)

1. **Download Node.js**
   - Buka https://nodejs.org
   - Download versi **LTS** (Long Term Support)
   - Pilih **Windows Installer (.msi)** - 64-bit

2. **Install Node.js**
   - Double-click file installer `.msi`
   - Klik **Next** → **Next**
   - ✅ Centang "Automatically install necessary tools"
   - Klik **Next** → **Install**
   - Tunggu hingga selesai
   - Klik **Finish**

3. **Restart Terminal**
   - Tutup semua terminal/PowerShell yang terbuka
   - Buka kembali untuk load environment variables

#### Opsi B: Menggunakan Winget

```powershell
# Install Node.js LTS via Winget
winget install OpenJS.NodeJS.LTS
```

#### Opsi C: Menggunakan Chocolatey

```powershell
# Install Chocolatey terlebih dahulu (jika belum)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs-lts -y
```

### 2. Install Git

#### Opsi A: Download Installer

1. **Download Git**
   - Buka https://git-scm.com/download/win
   - Download **64-bit Git for Windows Setup**

2. **Install Git**
   - Jalankan installer
   - Gunakan settings default (Next → Next → Install)
   - ✅ Centang "Git Bash Here" dan "Git GUI Here"
   - Finish

#### Opsi B: Menggunakan Winget

```powershell
winget install Git.Git
```

### 3. Clone Repository

```powershell
# Buka PowerShell atau Command Prompt
# Navigate ke folder tempat Anda ingin simpan project

# Clone repository
git clone https://github.com/yourusername/webosis-archive.git

# Masuk ke folder project
cd webosis-archive
```

### 4. Install Dependencies

```powershell
# Install semua package yang dibutuhkan
npm install

# Atau gunakan npm ci untuk clean install
npm ci
```

**Estimasi waktu:** 2-5 menit (tergantung koneksi internet)

### 5. Setup Environment Variables

```powershell
# Copy template environment
Copy-Item .env.example .env.local

# Edit dengan text editor
notepad .env.local

# Atau gunakan VS Code
code .env.local
```

Isi dengan kredensial yang diperlukan. Lihat [CONFIGURATION.md](./CONFIGURATION.md) untuk detail.

### 6. Run Development Server

```powershell
# Start development server
npm run dev
```

Buka browser di **http://localhost:3001**

---

## 🍎 Instalasi di macOS

### 1. Install Homebrew (Package Manager)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verify installation
brew --version
```

### 2. Install Node.js

#### Opsi A: Menggunakan Homebrew (Recommended)

```bash
# Install Node.js LTS
brew install node@20

# Link node
brew link node@20

# Verify
node --version
npm --version
```

#### Opsi B: Menggunakan nvm (Node Version Manager)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell
source ~/.zshrc  # for zsh
# atau
source ~/.bash_profile  # for bash

# Install Node.js LTS
nvm install --lts
nvm use --lts
nvm alias default node
```

#### Opsi C: Download Installer

1. Download dari https://nodejs.org
2. Pilih **macOS Installer (.pkg)**
3. Install seperti aplikasi biasa

### 3. Install Git

```bash
# Git biasanya sudah terinstall di macOS
# Verify:
git --version

# Jika belum terinstall:
brew install git
```

### 4. Clone Repository

```bash
# Navigate ke folder project
cd ~/Documents  # atau folder pilihan Anda

# Clone repository
git clone https://github.com/yourusername/webosis-archive.git

# Masuk ke folder project
cd webosis-archive
```

### 5. Install Dependencies

```bash
# Install packages
npm install

# Atau clean install
npm ci
```

### 6. Setup Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit dengan text editor
nano .env.local

# Atau gunakan VS Code
code .env.local

# Atau TextEdit
open -a TextEdit .env.local
```

### 7. Run Development Server

```bash
# Start server
npm run dev
```

Buka browser di **http://localhost:3001**

---

## 🐧 Instalasi di Linux (Ubuntu/Debian)

### 1. Update System

```bash
# Update package list
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y
```

### 2. Install Node.js

#### Opsi A: Menggunakan NodeSource (Recommended)

```bash
# Install curl (jika belum ada)
sudo apt install -y curl

# Download dan jalankan NodeSource setup script untuk Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

#### Opsi B: Menggunakan nvm

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts
nvm alias default node

# Verify
node --version
npm --version
```

#### Opsi C: Menggunakan apt (Versi mungkin lama)

```bash
# Install dari Ubuntu repository
sudo apt install -y nodejs npm

# Upgrade npm ke versi terbaru
sudo npm install -g npm@latest
```

### 3. Install Git

```bash
# Install Git
sudo apt install -y git

# Verify
git --version

# Configure Git (optional tapi recommended)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 4. Install Build Tools (Optional tapi Recommended)

Beberapa npm packages memerlukan build tools:

```bash
sudo apt install -y build-essential
```

### 5. Clone Repository

```bash
# Navigate ke folder project
cd ~/Documents  # atau folder pilihan

# Clone repository
git clone https://github.com/yourusername/webosis-archive.git

# Masuk ke folder
cd webosis-archive
```

### 6. Install Dependencies

```bash
# Install packages
npm install

# Atau clean install
npm ci
```

### 7. Setup Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit dengan text editor
nano .env.local

# Atau gunakan gedit (GNOME)
gedit .env.local

# Atau gunakan VS Code
code .env.local
```

### 8. Run Development Server

```bash
# Start server
npm run dev
```

Buka browser di **http://localhost:3001**

---

## ✅ Verifikasi Instalasi

Setelah instalasi, verifikasi bahwa semua komponen terinstall dengan benar:

### 1. Check Node.js & npm

```bash
# Check Node.js version
node --version
# Expected output: v20.x.x atau v22.x.x

# Check npm version
npm --version
# Expected output: 10.x.x
```

### 2. Check Git

```bash
# Check Git version
git --version
# Expected output: git version 2.x.x
```

### 3. Check Project Dependencies

```bash
# Check installed packages
npm list --depth=0

# Check for vulnerabilities
npm audit

# Fix vulnerabilities (jika ada)
npm audit fix
```

### 4. Test Development Server

```bash
# Start dev server
npm run dev

# Expected output:
# ▲ Next.js 15.5.4
# - Local:        http://localhost:3001
# - Network:      http://192.168.x.x:3001
# ✓ Ready in 2.3s
```

### 5. Open Browser

Buka browser dan akses:
- **Local:** http://localhost:3001
- **Network:** http://[YOUR_IP]:3001 (untuk akses dari device lain)

**Expected:** Website homepage muncul tanpa error

---

## 🐛 Troubleshooting

### Problem: `node` tidak ditemukan setelah instalasi

**Windows:**
```powershell
# Restart terminal
# Atau tambahkan ke PATH manually:
# 1. Cari "Environment Variables" di Start Menu
# 2. Edit "Path" di System Variables
# 3. Tambahkan: C:\Program Files\nodejs\
```

**macOS/Linux:**
```bash
# Reload shell configuration
source ~/.zshrc   # zsh
source ~/.bashrc  # bash

# Atau restart terminal
```

### Problem: Permission denied saat `npm install`

**Windows:**
```powershell
# Run PowerShell as Administrator
```

**macOS/Linux:**
```bash
# Jangan gunakan sudo untuk npm install di project folder
# Jika masih error, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### Problem: Port 3001 sudah digunakan

**Windows:**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (ganti <PID> dengan PID dari hasil di atas)
taskkill /PID <PID> /F

# Atau ubah port di package.json
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Atau ubah port
# Edit package.json, ganti -p 3001 dengan -p 3002
```

### Problem: `npm install` sangat lambat

```bash
# Gunakan npm cache verify
npm cache verify

# Atau gunakan registry mirror (Indonesia)
npm config set registry https://registry.npmmirror.com

# Atau gunakan yarn sebagai alternatif
npm install -g yarn
yarn install
```

### Problem: `EACCES` error saat install global packages

**macOS/Linux:**
```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ~/.config
```

### Problem: Build error karena memory insufficient

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=4096"

# Atau di Windows PowerShell:
$env:NODE_OPTIONS="--max_old_space_size=4096"

# Kemudian run build lagi
npm run build
```

### Problem: Git clone error (SSH)

```bash
# Gunakan HTTPS instead of SSH
git clone https://github.com/yourusername/webosis-archive.git

# Atau setup SSH key terlebih dahulu
ssh-keygen -t ed25519 -C "your.email@example.com"
# Tambahkan public key ke GitHub Settings > SSH Keys
```

---

## 📦 Post-Installation

Setelah instalasi berhasil, lanjutkan ke:

1. **[CONFIGURATION.md](./CONFIGURATION.md)** - Setup environment variables
2. **[SUPABASE_SETUP_LENGKAP.md](./SUPABASE_SETUP_LENGKAP.md)** - Setup database
3. **[SETUP_API_KEYS.md](./SETUP_API_KEYS.md)** - Setup social media APIs
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy ke production

---

## 🆘 Butuh Bantuan?

Jika masih mengalami masalah:

1. **Check dokumentasi lengkap** di folder root project
2. **GitHub Issues:** https://github.com/yourusername/webosis-archive/issues
3. **Email:** osis@smaitfi.sch.id

---

<div align="center">

**Happy Coding! 🚀**

</div>
