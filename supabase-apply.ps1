<#
PowerShell helper to apply the combined Supabase SQL safely.
Usage:
  - Install supabase CLI and authenticate locally (supabase login)
  - Run this script from the repository root: pwsh .\supabase-apply.ps1

This script will:
  - Check for supabase CLI on PATH
  - Ask for confirmation before running the combined SQL file (supabase-apply-all.sql)
  - Optionally run cleanup preview RPC first (if you want to see duplicates)

IMPORTANT: This script runs SQL against the Supabase project you have configured via supabase CLI. It does not store credentials.
#>

param(
    [switch]$AutoConfirm,
    [string]$SqlFile = "./supabase-apply-all.sql"
)

function Fail([string]$msg) {
    Write-Host "ERROR: $msg" -ForegroundColor Red
    exit 1
}

# check supabase CLI
$which = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $which) {
    Fail "supabase CLI not found. Install it: https://supabase.com/docs/guides/cli"
}

if (-not (Test-Path $SqlFile)) {
    Fail "SQL file not found: $SqlFile"
}

Write-Host "This will execute SQL against the Supabase project configured in your local CLI context." -ForegroundColor Yellow
Write-Host "Make sure you've backed up your database or have a project snapshot before proceeding." -ForegroundColor Yellow

if (-not $AutoConfirm) {
    $ok = Read-Host "Type 'YES' to proceed"
    if ($ok -ne 'YES') {
        Write-Host "Aborted by user." -ForegroundColor Yellow
        exit 0
    }
}

# Run the SQL file
Write-Host "Running: supabase db query --file $SqlFile" -ForegroundColor Cyan
try {
    supabase db query --file $SqlFile | Write-Host
    Write-Host "SQL executed. Verify indexes and RPC in Supabase dashboard." -ForegroundColor Green
} catch {
    Write-Host "Execution failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Done. If you want to grant RPC execute to 'authenticated', run the following in Supabase SQL editor:" -ForegroundColor Yellow
Write-Host "GRANT EXECUTE ON FUNCTION public.consume_checkin(text,text,text,uuid,jsonb) TO authenticated;"


# Optional: provide a quick verification query
Write-Host "To verify, you can run: supabase db query --sql \"SELECT proname FROM pg_proc WHERE proname ILIKE '%consume_checkin%';\"" -ForegroundColor Cyan
