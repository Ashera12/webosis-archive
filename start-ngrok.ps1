# Ngrok Tunnel Starter
# Run: .\start-ngrok.ps1

Write-Host "Starting Ngrok Tunnel for OSIS Website..." -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
$ngrokInstalled = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokInstalled) {
    Write-Host "Ngrok not found!" -ForegroundColor Red
    Write-Host "Installing via Chocolatey..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    $chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue
    if (-not $chocoInstalled) {
        Write-Host "Chocolatey not found. Please install ngrok manually:" -ForegroundColor Yellow
        Write-Host "   1. Visit: https://ngrok.com/download" -ForegroundColor White
        Write-Host "   2. Download and extract ngrok.exe" -ForegroundColor White
        Write-Host "   3. Add to PATH or run from download folder" -ForegroundColor White
        exit 1
    }
    
    choco install ngrok -y
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install ngrok" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Ngrok installed successfully!" -ForegroundColor Green
}

# Check if ngrok is authenticated
Write-Host "Checking ngrok authentication..." -ForegroundColor Cyan
$configPath = "$env:USERPROFILE\.ngrok2\ngrok.yml"
if (-not (Test-Path $configPath)) {
    Write-Host "Ngrok not authenticated!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Steps to authenticate:" -ForegroundColor White
    Write-Host "   1. Visit: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "   2. Copy your authtoken" -ForegroundColor White
    Write-Host "   3. Run: ngrok config add-authtoken YOUR_TOKEN_HERE" -ForegroundColor White
    Write-Host ""
    $token = Read-Host "Or paste your authtoken here (or press Enter to skip)"
    
    if ($token) {
        ngrok config add-authtoken $token
        Write-Host "Ngrok authenticated!" -ForegroundColor Green
    } else {
        Write-Host "Skipping authentication (you may hit rate limits)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Checking if Next.js server is running..." -ForegroundColor Cyan

# Check if port 3000 is in use
$portInUse = netstat -ano | Select-String ":3000" | Select-String "LISTENING"

if (-not $portInUse) {
    Write-Host "Next.js server not running on port 3000" -ForegroundColor Yellow
    Write-Host "Starting Next.js in new window..." -ForegroundColor Cyan
    
    # Start Next.js in a new PowerShell window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host 'Next.js Development Server' -ForegroundColor Green; npm run dev"
    
    Write-Host "Waiting 8 seconds for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
} else {
    Write-Host "Next.js server already running on port 3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Ngrok tunnel..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Yellow
Write-Host "   1. Copy the HTTPS URL shown below (https://xxxxx.ngrok-free.app)" -ForegroundColor White
Write-Host "   2. Update .env.local: NEXTAUTH_URL=<ngrok-url>" -ForegroundColor White
Write-Host "   3. Restart Next.js server (Ctrl+C in other window, then npm run dev)" -ForegroundColor White
Write-Host "   4. Share the URL with your friends!" -ForegroundColor White
Write-Host ""
Write-Host "Ngrok Inspector: http://localhost:4040" -ForegroundColor Cyan
Write-Host "Stop: Press Ctrl+C" -ForegroundColor Red
Write-Host ""
Write-Host "=============================================" -ForegroundColor DarkGray
Write-Host ""

# Start ngrok (force IPv4 loopback to avoid ::1 issues)
ngrok http http://127.0.0.1:3000

# Cleanup on exit
Write-Host ""
Write-Host "Tunnel stopped" -ForegroundColor Yellow
Write-Host "Tip: Don't forget to revert NEXTAUTH_URL in .env.local to http://localhost:3000" -ForegroundColor Cyan
