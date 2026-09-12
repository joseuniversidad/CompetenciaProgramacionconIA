$ErrorActionPreference = 'Stop'
$projectPath = $PSScriptRoot
$dataPath = Join-Path (Split-Path $projectPath -Parent) '.runtime\mysql'
foreach ($port in @(3308,8000)) {
 $listeners=Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
 foreach ($connection in $listeners) {
  $process=Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)"
  if (($port -eq 3308 -and $process.CommandLine -like '*--port=3308*' -and $process.CommandLine -like '*DESARROLLO WEB*') -or ($port -eq 8000 -and $process.CommandLine -like '*127.0.0.1:8000*' -and $process.Name -eq 'php.exe')) { Stop-Process -Id $process.ProcessId }
 }
}
Write-Host 'Servicios locales de Solar GT detenidos.'
