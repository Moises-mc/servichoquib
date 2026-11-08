# Inicia el backend PostgreSQL de Servi Choquib.
Set-Location "$PSScriptRoot\server"

if (-not (Test-Path "node_modules\pg")) {
    Write-Host "Instalando dependencias de Servi Choquib..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install falló. Revisa la conexión a Internet." }
}

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Se creó server/.env. Completa DB_PASSWORD antes de continuar." -ForegroundColor Yellow
    notepad .env
    exit 1
}

Write-Host "Comprobando conexión a PostgreSQL..." -ForegroundColor Cyan
npm run db:check
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL no está disponible. Comprueba el servicio y server/.env." }

Write-Host "Iniciando Servi Choquib API en http://localhost:8000 ..." -ForegroundColor Green
npm run dev
