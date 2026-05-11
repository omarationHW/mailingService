# start-dev.ps1
# Arranca ngrok, actualiza APP_URL en el .env del backend, y luego inicia el servidor.
# Uso: .\start-dev.ps1

$EnvFile = "$PSScriptRoot\backend\.env"
$BackendPort = 3001

Write-Host "`n Iniciando ngrok en puerto $BackendPort..." -ForegroundColor Cyan

# Arrancar ngrok en background
$ngrokJob = Start-Job -ScriptBlock {
    param($port)
    npx ngrok http $port --log=stdout
} -ArgumentList $BackendPort

# Esperar a que ngrok levante y exponga la URL pública
$ngrokUrl = $null
$attempts = 0
while (-not $ngrokUrl -and $attempts -lt 20) {
    Start-Sleep -Seconds 1
    $attempts++
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        $tunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($tunnel) { $ngrokUrl = $tunnel.public_url }
    } catch {}
}

if (-not $ngrokUrl) {
    Write-Host " No se pudo obtener la URL de ngrok. Verifica que no haya otra sesion activa." -ForegroundColor Red
    Stop-Job $ngrokJob | Out-Null
    exit 1
}

Write-Host " URL publica: $ngrokUrl" -ForegroundColor Green

# Actualizar APP_URL en el .env
$envContent = Get-Content $EnvFile -Raw
$envContent = $envContent -replace 'APP_URL="[^"]*"', "APP_URL=`"$ngrokUrl`""
Set-Content $EnvFile $envContent -Encoding utf8 -NoNewline

Write-Host " APP_URL actualizado en backend\.env" -ForegroundColor Green
Write-Host "`n Abre otra terminal y corre: cd backend && npm run dev" -ForegroundColor Yellow
Write-Host " Y otra para el frontend:    cd frontend && npm run dev" -ForegroundColor Yellow
Write-Host "`n Panel de ngrok: http://localhost:4040" -ForegroundColor Cyan
Write-Host "`n Presiona Ctrl+C para detener ngrok`n" -ForegroundColor Gray

# Mantener el script vivo mientras ngrok corre
try {
    Wait-Job $ngrokJob | Out-Null
} finally {
    Stop-Job $ngrokJob | Out-Null
    Remove-Job $ngrokJob | Out-Null
    Write-Host "`n ngrok detenido." -ForegroundColor Gray
}
