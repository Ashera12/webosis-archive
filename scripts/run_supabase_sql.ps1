<#
Runs the SQL files in this repo against a PostgreSQL connection using psql.

Usage (PowerShell):
  # Option A: Provide DATABASE_URL env var (postgres://user:pass@host:port/db)
  $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'
  ./scripts/run_supabase_sql.ps1

  # Option B: Run interactively - the script will prompt for a connection string

Behavior:
  - If `psql` is available in PATH, the script will execute the SQL files in order:
      supabase-schema.sql
      supabase-fix-schema.sql
      supabase-seed-data.sql
      supabase-super-admin-seed.sql
    and stop if any script fails.
  - If `psql` is not available, the script prints clear manual instructions for
    running the files in the Supabase Dashboard SQL editor.

Security:
  - Provide a project/service role connection only on a trusted machine. The
    script does not log passwords but the commands will be visible in terminal
    history on some systems.
#>

Set-StrictMode -Version Latest

function Parse-DatabaseUrl {
    param([string]$url)
    # Expect: postgres://user:pass@host:port/dbname
    if (-not $url) { return $null }
    if ($url -notmatch '^postgres(?:ql)?://') { return $null }
    $uri = [System.Uri]$url
    $userInfo = $uri.UserInfo -split ':'
    return [pscustomobject]@{
        Host = $uri.Host
        Port = $uri.Port
        Database = $uri.AbsolutePath.TrimStart('/')
        Username = $userInfo[0]
        Password = if ($userInfo.Count -ge 2) { $userInfo[1] } else { '' }
    }
}

function Run-FileWithPsql {
    param(
        [string]$psqlPath,
        [string]$file,
        [pscustomobject]$conn
    )
    Write-Host "Running $file..." -ForegroundColor Cyan
    $args = @()
    if ($conn.Password) {
        # Use PGPASSWORD temporarily for the call to avoid passing password as arg
        $env:PGPASSWORD = $conn.Password
    }
    $psqlArgs = @(
        '-h', $conn.Host,
        '-p', [string]$conn.Port,
        '-U', $conn.Username,
        '-d', $conn.Database,
        '-v', 'ON_ERROR_STOP=1',
        '-f', $file
    )

    $proc = Start-Process -FilePath $psqlPath -ArgumentList $psqlArgs -NoNewWindow -Wait -PassThru -RedirectStandardOutput 'stdout.txt' -RedirectStandardError 'stderr.txt'
    $out = Get-Content -Path 'stdout.txt' -Raw -ErrorAction SilentlyContinue
    $err = Get-Content -Path 'stderr.txt' -Raw -ErrorAction SilentlyContinue
    Remove-Item 'stdout.txt','stderr.txt' -ErrorAction SilentlyContinue

    if ($proc.ExitCode -ne 0) {
        Write-Host "psql returned exit code $($proc.ExitCode)" -ForegroundColor Red
        if ($err) { Write-Host $err -ForegroundColor Red }
        throw "psql failed for $file"
    }

    Write-Host "OK: $file" -ForegroundColor Green
    if ($env:PGPASSWORD) { Remove-Item Env:\PGPASSWORD }
}

try {
    $repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $files = @(
        'supabase-schema.sql',
        'supabase-fix-schema.sql',
        'supabase-seed-data.sql',
        'supabase-super-admin-seed.sql'
    ) | ForEach-Object { Join-Path $repoRoot "..\$_" | Resolve-Path -ErrorAction SilentlyContinue }

    # Normalize to string paths and filter existing files
    $sqlFiles = @()
    foreach ($f in $files) {
        if ($f -and (Test-Path $f)) { $sqlFiles += (Resolve-Path $f).Path }
    }

    if (-not $sqlFiles -or $sqlFiles.Count -eq 0) {
        Write-Host "No SQL files found in repo root. Expected supabase-*.sql files." -ForegroundColor Yellow
        exit 1
    }

    # Look for psql
    $psqlPath = Get-Command psql -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { $_.Path }
    if ($psqlPath) {
        Write-Host "psql found at: $psqlPath" -ForegroundColor Green

        # Read DATABASE_URL or prompt
        $databaseUrl = $env:DATABASE_URL
        if (-not $databaseUrl) {
            $databaseUrl = Read-Host "Enter DATABASE_URL (postgres://user:pass@host:port/db)"
        }

        $conn = Parse-DatabaseUrl -url $databaseUrl
        if (-not $conn) { throw "Unable to parse DATABASE_URL" }

        foreach ($sql in $sqlFiles) {
            Run-FileWithPsql -psqlPath $psqlPath -file $sql -conn $conn
        }

        Write-Host "All scripts executed. If you use Supabase hosted PostgREST, open the Supabase Dashboard > API and click Refresh to update the schema cache." -ForegroundColor Cyan
    }
    else {
        Write-Host "psql not found in PATH." -ForegroundColor Yellow
        Write-Host "Please run the following steps manually in the Supabase Dashboard -> SQL Editor:" -ForegroundColor Cyan
        Write-Host "1) Open supabase-fix-schema.sql, paste its contents into the SQL Editor, and Run." -ForegroundColor White
        Write-Host "2) Open supabase-seed-data.sql, paste its contents, and Run." -ForegroundColor White
        Write-Host "3) Open supabase-super-admin-seed.sql, paste its contents, and Run." -ForegroundColor White
        Write-Host "After running, refresh the API / restart PostgREST in the Supabase Dashboard to clear schema cache." -ForegroundColor Cyan
    }
}
catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Done." -ForegroundColor Green
