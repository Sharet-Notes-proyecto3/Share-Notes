# Obtener la ruta base donde reside este script
$rootDir = $PSScriptRoot

# Iniciar Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$rootDir\backend"

# Iniciar MS-PDF
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$rootDir\ms-pdf"

# Iniciar MS-Email
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$rootDir\ms-email"

# Iniciar Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$rootDir\frontend"

Write-Host "Todos los servicios se han lanzado en nuevas ventanas desde sus carpetas correspondientes." -ForegroundColor Green
Write-Host "Recuerda tener activo tu servidor MySQL (XAMPP o similar) antes de probar." -ForegroundColor Yellow
