Param(
    [string]$BaseUrl = "https://osissmktest.biezz.my.id",
    [switch]$ShowBodySnippet,
    [int]$TimeoutSeconds = 15
)

# Simple verifier for admin page availability (unauthenticated). Routes should return login page (200)
# or protected content after manual browser auth, but NOT a 404. Uses /api/debug/routes for discovery.
# Usage:
#   pwsh ./scripts/verify-admin-routes.ps1 -BaseUrl https://yourdomain.vercel.app
# Optional:
#   pwsh ./scripts/verify-admin-routes.ps1 -ShowBodySnippet

function Invoke-SafeRequest {
    param(
        [string]$Url
    )
    try {
        $res = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        return [PSCustomObject]@{ Url = $Url; StatusCode = $res.StatusCode; Length = ($res.Content.Length); Body = $res.Content }
    } catch {
        $errStatus = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value__ } else { 0 }
        return [PSCustomObject]@{ Url = $Url; StatusCode = $errStatus; Length = 0; Body = "" }
    }
}

$debugUrl = "$BaseUrl/api/debug/routes"
Write-Host "[INFO] Fetching route list from $debugUrl" -ForegroundColor Cyan
$routeData = Invoke-SafeRequest -Url $debugUrl

if ($routeData.StatusCode -ne 200) {
    Write-Host "[ERROR] Cannot fetch /api/debug/routes (Status $($routeData.StatusCode))" -ForegroundColor Red
    exit 1
}

try {
    $json = $routeData.Body | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] Invalid JSON from /api/debug/routes" -ForegroundColor Red
    exit 1
}

$rawPages = $json.pages
if (-not $rawPages) {
    Write-Host "[WARN] No pages returned" -ForegroundColor Yellow
    $rawPages = @()
}

# Normalize pages list (old shape may be array of strings, new shape may be objects)
$pages = @()
foreach ($p in $rawPages) {
    if ($p -is [string]) { $pages += [PSCustomObject]@{ path = $p; kind = 'page' } }
    elseif ($p.path) { $pages += $p } else { }
}

# Explicit aliases (should exist now)
$expectedAliases = @(
    [PSCustomObject]@{ path = '/admin/sekbid'; kind = 'alias' },
    [PSCustomObject]@{ path = '/admin/members'; kind = 'alias' }
)
foreach ($a in $expectedAliases) {
    if (-not ($pages | Where-Object { $_.path -eq $a.path })) { $pages += $a }
}

# Create test URL list
$urls = $pages | Sort-Object path | Select-Object -ExpandProperty path | ForEach-Object { "$BaseUrl$_" }

Write-Host "[INFO] Testing $($urls.Count) admin routes..." -ForegroundColor Cyan

$results = foreach ($u in $urls) { Invoke-SafeRequest -Url $u }

# Summary table
$summary = $results | Select-Object Url, StatusCode, Length, @{n='Is404';e={ $_.StatusCode -eq 404 }}

# Print table
$summary | Format-Table -AutoSize

$bad = $summary | Where-Object { $_.Is404 -or $_.StatusCode -eq 0 }
if ($bad.Count -gt 0) {
    Write-Host "[FAIL] Some routes returned 404 or no response:" -ForegroundColor Red
    $bad | Format-Table -AutoSize
} else {
    Write-Host "[PASS] No 404 responses detected." -ForegroundColor Green
}

if ($ShowBodySnippet) {
    Write-Host "\n[INFO] Body snippets:" -ForegroundColor DarkCyan
    foreach ($r in $results) {
        $snippet = ($r.Body.Substring(0, [Math]::Min(120, $r.Body.Length))).Replace("`r"," ").Replace("`n"," ")
        Write-Host "-- $(Split-Path -Leaf $r.Url): [$($r.StatusCode)] $snippet"
    }
}
