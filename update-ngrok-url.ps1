# Update NEXTAUTH_URL for Ngrok
# Usage: .\update-ngrok-url.ps1 "https://your-ngrok-url.ngrok-free.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$NgrokUrl
)

Write-Host "🔧 Updating NEXTAUTH_URL in .env.local..." -ForegroundColor Cyan

# Validate URL format
if ($NgrokUrl -notmatch '^https?://') {
    Write-Host "❌ Invalid URL format. Must start with http:// or https://" -ForegroundColor Red
    Write-Host "   Example: https://abc123.ngrok-free.app" -ForegroundColor Yellow
    exit 1
}

# Remove trailing slash if present
$NgrokUrl = $NgrokUrl.TrimEnd('/')

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env.local not found!" -ForegroundColor Red
    exit 1
}

# Read current .env.local
$content = Get-Content $envFile -Raw

# Backup original
$backupFile = ".env.local.backup"
Copy-Item $envFile $backupFile -Force
Write-Host "💾 Backup saved to .env.local.backup" -ForegroundColor Green

# Update NEXTAUTH_URL
if ($content -match 'NEXTAUTH_URL=') {
    # Replace existing NEXTAUTH_URL
    $content = $content -replace 'NEXTAUTH_URL=.*', "NEXTAUTH_URL=$NgrokUrl"
    Write-Host "✅ Updated existing NEXTAUTH_URL" -ForegroundColor Green
} else {
    # Add new NEXTAUTH_URL
    $content += "`nNEXTAUTH_URL=$NgrokUrl`n"
    Write-Host "✅ Added NEXTAUTH_URL" -ForegroundColor Green
}

# Save updated content
Set-Content $envFile $content -NoNewline

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✨ NEXTAUTH_URL updated to:" -ForegroundColor Cyan
Write-Host "   $NgrokUrl" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Restart Next.js server for changes to take effect!" -ForegroundColor Yellow
Write-Host "   1. Go to Next.js terminal window" -ForegroundColor White
Write-Host "   2. Press Ctrl+C to stop" -ForegroundColor White
Write-Host "   3. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🔄 To restore original .env.local:" -ForegroundColor Cyan
Write-Host "   Copy-Item .env.local.backup .env.local -Force" -ForegroundColor White
Write-Host ""
