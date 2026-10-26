# Script para iniciar el backend de Servi Choquib
Set-Location "$PSScriptRoot\server"

# Instala dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Crea .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "Creando .env desde .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado. Edítalo si necesitas cambiar la configuración." -ForegroundColor Cyan
}

Write-Host "Iniciando servidor en http://localhost:8000 ..." -ForegroundColor Green
node src/server.js
