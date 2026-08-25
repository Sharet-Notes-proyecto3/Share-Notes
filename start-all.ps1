# Iniciar Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Iniciar MS-PDF
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ms-pdf; npm run dev"

# Iniciar MS-Email
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ms-email; npm run dev"

# Iniciar Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Todos los servicios se han lanzado en nuevas ventanas." -ForegroundColor Green
Write-Host "Recuerda tener activo tu servidor MySQL (XAMPP o similar) antes de probar." -ForegroundColor Yellow
