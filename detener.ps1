$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot 'storage/server.pid'
if (Test-Path -LiteralPath $pidFile) {
 $serverId = [int](Get-Content -LiteralPath $pidFile)
 $server = Get-Process -Id $serverId -ErrorAction SilentlyContinue
 if ($server -and $server.ProcessName -eq 'php' -and $server.StartTime -le (Get-Item $pidFile).LastWriteTime -and $server.StartTime -gt (Get-Item $pidFile).LastWriteTime.AddSeconds(-15)) { Stop-Process -Id $serverId }
}
# La instancia de demostración fue creada exclusivamente para Solar GT en 3308.
& 'C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqladmin.exe' -h 127.0.0.1 -P 3308 -u root shutdown
Write-Host 'Servicios locales de Solar GT detenidos.'
