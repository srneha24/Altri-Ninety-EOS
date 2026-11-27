$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$frontendDir = Join-Path $repoRoot 'frontend'
$backendEnvFile = Join-Path $backendDir '.env'
$runId = [Guid]::NewGuid().ToString('N').Substring(0, 12)
$testDatabase = "altri_test_$runId"
$backendProcess = $null
$frontendProcess = $null
$playwrightStarted = $false
$testDatabaseCreated = $false
$originalEnvironment = @{}
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "altri-tests-$runId"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$Label
    )

    Write-Host "`n=== $Label ==="
    Push-Location $WorkingDirectory
    try {
        & $FilePath @ArgumentList
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($exitCode -ne 0) {
        throw "$Label failed with exit code $exitCode."
    }
}

function Set-TaskEnvironment {
    param([string]$Name, [string]$Value)
    if (-not $originalEnvironment.ContainsKey($Name)) {
        $originalEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, 'Process')
    }
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

function Get-FreeLocalPort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    try {
        $listener.Start()
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    }
    finally {
        $listener.Stop()
    }
}

try {
    if (-not (Test-Path -LiteralPath $backendEnvFile)) {
        throw "Missing $backendEnvFile. Configure the backend database in backend/.env first."
    }

    $backendSettings = @{}
    foreach ($line in Get-Content -LiteralPath $backendEnvFile) {
        if ($line -match '^\s*([^#\s=]+)\s*=\s*(.*?)\s*$') {
            $backendSettings[$Matches[1]] = $Matches[2]
        }
    }
    foreach ($required in @('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME')) {
        if (-not $backendSettings.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($backendSettings[$required])) {
            throw "backend/.env must define $required to create an isolated PostgreSQL test database."
        }
    }
    $sourceDatabase = $backendSettings['DB_NAME']

    foreach ($name in @('DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET', 'FRONTEND_URL', 'APP_NOW', 'DB_NAME', 'PGPASSWORD', 'UV_CACHE_DIR')) {
        if ($backendSettings.ContainsKey($name)) {
            Set-TaskEnvironment $name $backendSettings[$name]
        }
    }
    Set-TaskEnvironment 'DB_NAME' $testDatabase
    Set-TaskEnvironment 'APP_NOW' '2026-11-11T15:00:00Z'
    Set-TaskEnvironment 'UV_CACHE_DIR' (Join-Path $tempRoot 'uv-cache')
    Set-TaskEnvironment 'PGPASSWORD' $backendSettings['DB_PASSWORD']
    $apiPort = Get-FreeLocalPort
    $frontendPort = Get-FreeLocalPort
    Set-TaskEnvironment 'API_PORT' "$apiPort"
    Set-TaskEnvironment 'PLAYWRIGHT_PORT' "$frontendPort"
    Set-TaskEnvironment 'NEXT_PUBLIC_API_URL' "http://127.0.0.1:$apiPort"
    Set-TaskEnvironment 'PLAYWRIGHT_BASE_URL' "http://127.0.0.1:$frontendPort"
    Set-TaskEnvironment 'FRONTEND_URL' "http://127.0.0.1:$frontendPort"

    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null
    $pgReady = Get-Command pg_isready -ErrorAction Stop
    $createdb = Get-Command createdb -ErrorAction Stop
    $dropdb = Get-Command dropdb -ErrorAction Stop
    $pgDump = Get-Command pg_dump -ErrorAction Stop
    $pgRestore = Get-Command pg_restore -ErrorAction Stop
    & $pgReady.Source --host $env:DB_HOST --port $env:DB_PORT --username $env:DB_USER --dbname $sourceDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL is not accepting connections to source database '$sourceDatabase'."
    }

    Write-Host "Creating an isolated snapshot of '$sourceDatabase' in '$testDatabase'."
    $snapshotFile = Join-Path $tempRoot 'seeded-database.dump'
    & $pgDump.Source --host $env:DB_HOST --port $env:DB_PORT --username $env:DB_USER --format custom --no-owner --no-privileges --file $snapshotFile $sourceDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not snapshot '$sourceDatabase'. The source database was not modified."
    }
    & $createdb.Source --host $env:DB_HOST --port $env:DB_PORT --username $env:DB_USER --maintenance-db postgres $testDatabase
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create isolated test database '$testDatabase'. The source database was not modified."
    }
    $testDatabaseCreated = $true
    & $pgRestore.Source --host $env:DB_HOST --port $env:DB_PORT --username $env:DB_USER --no-owner --no-privileges --dbname $testDatabase $snapshotFile
    if ($LASTEXITCODE -ne 0) {
        throw "Could not restore the source snapshot into isolated test database '$testDatabase'. The source database was not modified."
    }

    Invoke-CheckedCommand -FilePath 'uv' -ArgumentList @('run', 'python', '-m', 'unittest', 'discover', '-v') -WorkingDirectory $backendDir -Label 'Backend unittest discovery (PostgreSQL clone)'
    Invoke-CheckedCommand -FilePath 'npm' -ArgumentList @('run', 'lint') -WorkingDirectory $frontendDir -Label 'Frontend lint'
    Invoke-CheckedCommand -FilePath 'npm' -ArgumentList @('run', 'typecheck') -WorkingDirectory $frontendDir -Label 'Frontend typecheck'
    Invoke-CheckedCommand -FilePath 'npm' -ArgumentList @('run', 'build') -WorkingDirectory $frontendDir -Label 'Frontend production build'

    $backendStdout = Join-Path $tempRoot 'backend-server.stdout.log'
    $backendStderr = Join-Path $tempRoot 'backend-server.stderr.log'
    Write-Host "`n=== Starting API on the isolated database ==="
    $backendPython = Join-Path $backendDir '.venv\Scripts\python.exe'
    $backendProcess = Start-Process -FilePath $backendPython -ArgumentList @('-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', "$apiPort") -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $backendStdout -RedirectStandardError $backendStderr
    $apiReady = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($backendProcess.HasExited) {
            if (Test-Path -LiteralPath $backendStdout) { Get-Content -LiteralPath $backendStdout }
            if (Test-Path -LiteralPath $backendStderr) { Get-Content -LiteralPath $backendStderr }
            throw "API process exited before becoming ready (exit code $($backendProcess.ExitCode))."
        }
        $apiSocket = $null
        try {
            $apiSocket = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $apiSocket.ConnectAsync('127.0.0.1', $apiPort)
            if ($connectTask.Wait(1000) -and $apiSocket.Connected) {
                $apiReady = $true
                break
            }
        }
        catch {
            # Keep waiting while Uvicorn starts.
        }
        finally {
            if ($apiSocket) { $apiSocket.Dispose() }
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $apiReady) {
        if (Test-Path -LiteralPath $backendStdout) { Get-Content -LiteralPath $backendStdout }
        if (Test-Path -LiteralPath $backendStderr) { Get-Content -LiteralPath $backendStderr }
        throw 'API did not become ready within 30 seconds.'
    }

    $frontendStdout = Join-Path $tempRoot 'frontend-server.stdout.log'
    $frontendStderr = Join-Path $tempRoot 'frontend-server.stderr.log'
    Write-Host "`n=== Starting frontend server ==="
    $node = Get-Command node -ErrorAction Stop
    $frontendProcess = Start-Process -FilePath $node.Source -ArgumentList @('node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', "$frontendPort") -WorkingDirectory $frontendDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $frontendStdout -RedirectStandardError $frontendStderr
    $frontendReady = $false
    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($frontendProcess.HasExited) {
            if (Test-Path -LiteralPath $frontendStdout) { Get-Content -LiteralPath $frontendStdout }
            if (Test-Path -LiteralPath $frontendStderr) { Get-Content -LiteralPath $frontendStderr }
            throw "Frontend process exited before becoming ready (exit code $($frontendProcess.ExitCode))."
        }
        $frontendSocket = $null
        try {
            $frontendSocket = [System.Net.Sockets.TcpClient]::new()
            $connectTask = $frontendSocket.ConnectAsync('127.0.0.1', $frontendPort)
            if ($connectTask.Wait(1000) -and $frontendSocket.Connected) {
                $frontendReady = $true
                break
            }
        }
        catch {
            # Keep waiting while Next.js starts.
        }
        finally {
            if ($frontendSocket) { $frontendSocket.Dispose() }
        }
        Start-Sleep -Milliseconds 500
    }
    if (-not $frontendReady) {
        if (Test-Path -LiteralPath $frontendStdout) { Get-Content -LiteralPath $frontendStdout }
        if (Test-Path -LiteralPath $frontendStderr) { Get-Content -LiteralPath $frontendStderr }
        throw 'Frontend did not become ready within 30 seconds.'
    }

    $playwrightStarted = $true
    Invoke-CheckedCommand -FilePath 'npm' -ArgumentList @('exec', 'playwright', '--', 'test', '--reporter=list') -WorkingDirectory $frontendDir -Label 'Playwright two-browser meeting synchronization'

    Write-Host "`nAll requested checks passed. Playwright traces (if any failures) are in frontend/test-results/."
    exit 0
}
catch {
    Write-Error $_
    $failureTraceFiles = @()
    if ($playwrightStarted) {
        $failureTraceFiles = @(Get-ChildItem -LiteralPath (Join-Path $frontendDir 'test-results') -Filter 'trace.zip' -Recurse -ErrorAction SilentlyContinue)
    }
    if ($failureTraceFiles.Count -gt 0) {
        $artifactDir = Join-Path $frontendDir 'artifacts'
        New-Item -ItemType Directory -Path $artifactDir -Force | Out-Null
        foreach ($traceFile in $failureTraceFiles) {
            $artifactName = "playwright-failure-$runId-$($traceFile.Directory.Name).zip"
            Copy-Item -LiteralPath $traceFile.FullName -Destination (Join-Path $artifactDir $artifactName) -Force
            Write-Host "Preserved Playwright failure trace: frontend/artifacts/$artifactName"
        }
    }
    exit 1
}
finally {
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        $backendProcess.WaitForExit()
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        $frontendProcess.WaitForExit()
    }
    if ($testDatabaseCreated) {
        & $dropdb.Source --host $env:DB_HOST --port $env:DB_PORT --username $env:DB_USER --maintenance-db postgres --if-exists --force $testDatabase
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not remove isolated test database '$testDatabase'. It is safe to remove manually; normal development data was not modified."
        }
    }
    foreach ($name in $originalEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name], 'Process')
    }
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
