$scriptDir = if ($PSCommandPath) { Split-Path -Parent $PSCommandPath } `
             elseif ($PSScriptRoot) { $PSScriptRoot } `
             else { 'C:\Users\X\FYP\Business_pro_hub_dashboard\backend' }

Set-Location $scriptDir
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot'

$pom = Join-Path $scriptDir 'pom.xml'
$mvn = 'C:\maven\apache-maven-3.9.6\bin\mvn.cmd'

# Kill anything on port 8181
$conn = Get-NetTCPConnection -LocalPort 8181 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "Stopping process on port 8181 (PID $($conn.OwningProcess))..." -ForegroundColor Yellow
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep 1
}

# Load .env
Get-Content (Join-Path $scriptDir '.env') | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object {
    $kv = $_ -split '=', 2
    if ($kv.Count -eq 2) {
        [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim())
    }
}

Write-Host "Starting Spring Boot backend on http://localhost:8181`n" -ForegroundColor Cyan
& $mvn spring-boot:run -f $pom
