$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$mysqlExe = 'C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe'
$phpExe = 'C:\laragon\bin\php\php-8.3.28-Win32-vs16-x64\php.exe'
$dataPath = Join-Path (Split-Path $projectPath -Parent) '.runtime\mysql'
if (-not (Test-Path -LiteralPath $dataPath)) { throw 'No existe la base local. Consulte README.md para instalar en otra computadora.' }
$listener = Get-NetTCPConnection -LocalPort 3308 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) { Start-Process $mysqlExe -ArgumentList '--no-defaults','--basedir=C:/laragon/bin/mysql/mysql-8.0.30-winx64',("--datadir=`"$dataPath`""),'--port=3308','--bind-address=127.0.0.1','--mysqlx=OFF' -WindowStyle Hidden }
$web = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (-not $web) { Start-Process $phpExe -ArgumentList '-S','127.0.0.1:8000','-t','public' -WorkingDirectory $projectPath -WindowStyle Hidden }
Write-Host 'Solar GT: http://127.0.0.1:8000'
Write-Host 'Credenciales: ACCESO-LOCAL.txt (no subir a Git).'
