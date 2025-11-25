# Quick Script to Create error_logs Table in Supabase
# Run this in PowerShell

Write-Host "Creating error_logs table in Supabase..." -ForegroundColor Cyan

# Read SQL file
$sqlContent = Get-Content -Path "create_error_logs_table.sql" -Raw

# Display SQL
Write-Host "`nSQL to execute:" -ForegroundColor Yellow
Write-Host $sqlContent -ForegroundColor Gray

Write-Host "`n=== INSTRUCTIONS ===" -ForegroundColor Green
Write-Host "1. Go to Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Open your project" -ForegroundColor White
Write-Host "3. Go to SQL Editor (left sidebar)" -ForegroundColor White
Write-Host "4. Click 'New Query'" -ForegroundColor White
Write-Host "5. Copy the SQL above and paste it" -ForegroundColor White
Write-Host "6. Click 'Run' to execute" -ForegroundColor White
Write-Host "`nOR use Supabase CLI:" -ForegroundColor Yellow
Write-Host "supabase db push" -ForegroundColor Cyan

# Copy SQL to clipboard if possible
try {
    Set-Clipboard -Value $sqlContent
    Write-Host "`n✓ SQL copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "`nNote: Could not copy to clipboard automatically" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
