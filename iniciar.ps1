$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$dataPath = Join-Path (Split-Path $projectPath -Parent) '.runtime\mysql'
function Test-SolarPort([int]$port) {
 $client = [System.Net.Sockets.TcpClient]::new()
 try { $client.Connect('127.0.0.1', $port); return $true } catch { return $false } finally { $client.Dispose() }
}
if (-not (Test-Path -LiteralPath $dataPath)) { throw 'No existe la base local. Consulte README.md.' }
if (-not (Test-SolarPort 3308)) { Start-Process 'C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqld.exe' -ArgumentList '--no-defaults','--basedir=C:/laragon/bin/mysql/mysql-8.0.30-winx64',("--datadir=`"$dataPath`""),'--port=3308','--bind-address=127.0.0.1','--mysqlx=OFF' -WindowStyle Hidden }
if (-not (Test-SolarPort 8000)) {
 $server = Start-Process 'C:\laragon\bin\php\php-8.3.28-Win32-vs16-x64\php.exe' -ArgumentList '-S','127.0.0.1:8000','-t','public','server.php' -WorkingDirectory $projectPath -WindowStyle Hidden -PassThru
 $server.Id | Set-Content (Join-Path $projectPath 'storage/server.pid')
}
Write-Host 'Solar GT: http://127.0.0.1:8000'
Write-Host 'Credenciales: ACCESO-LOCAL.txt'
