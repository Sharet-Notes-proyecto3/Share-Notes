# Ejecuta la suite unitaria del módulo MODERADOR y muestra un resumen legible
# (útil para tomar capturas de pantalla para el informe).
#
# Uso:
#   .\scripts\run-moderator-tests.ps1              # las 10 pruebas
#   .\scripts\run-moderator-tests.ps1 -Test MOD-01 # una prueba específica
#   .\scripts\run-moderator-tests.ps1 -Test MOD-01 | Tee-Object captura.txt

param(
  [string]$Test = ''
)

$ErrorActionPreference = 'Stop'
Push-Location (Join-Path $PSScriptRoot '..')

try {
  # Evita el mensaje FATAL de JWT_SECRET al importar auth.middleware en tests.
  if (-not $env:JWT_SECRET) { $env:JWT_SECRET = 'test-secret-sharenotes' }

  $jsonPath = Join-Path $env:TEMP ("moderator-tests-{0}.json" -f ([guid]::NewGuid().ToString('N')))

  $jestArgs = @(
    'jest',
    '--config', 'jest.config.json',
    '--forceExit',
    '--json',
    "--outputFile=$jsonPath",
    '--runTestsByPath', 'src/__tests__/moderator.rbac.test.ts'
  )
  if ($Test) { $jestArgs += @('--testNamePattern', $Test) }

  # Jest escribe su resumen por stderr; con ErrorActionPreference=Stop PowerShell
  # lo trataría como excepción. Lo silenciamos y leemos el resultado del JSON.
  $previousEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & npx @jestArgs 2>&1 | Out-Null
    $jestExit = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousEap
  }

  if (-not (Test-Path $jsonPath)) {
    Write-Host 'No se pudo generar el reporte JSON de Jest.' -ForegroundColor Red
    exit 1
  }

  $result = Get-Content $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
  Remove-Item $jsonPath -Force -ErrorAction SilentlyContinue

  $assertions = @(
    foreach ($suite in $result.testResults) {
      foreach ($assertion in $suite.assertionResults) {
        if ($Test -and $assertion.status -eq 'pending') { continue }
        $assertion
      }
    }
  )

  Write-Host ''
  Write-Host '================================================================' -ForegroundColor Cyan
  Write-Host '  PRUEBAS UNITARIAS - MODULO MODERADOR (ShareNotes)' -ForegroundColor Cyan
  Write-Host '  Archivo: backend/src/__tests__/moderator.rbac.test.ts' -ForegroundColor Cyan
  Write-Host '================================================================' -ForegroundColor Cyan

  foreach ($assertion in $assertions) {
    if ($assertion.status -eq 'passed') {
      Write-Host ("  [PASS] " + $assertion.title) -ForegroundColor Green
    } else {
      Write-Host ("  [FAIL] " + $assertion.title) -ForegroundColor Red
      if ($assertion.failureMessages) {
        foreach ($message in $assertion.failureMessages) {
          Write-Host ("         " + ($message -split "`n")[0]) -ForegroundColor DarkRed
        }
      }
    }
  }

  $passed  = @($assertions | Where-Object { $_.status -eq 'passed' }).Count
  $failed  = @($assertions | Where-Object { $_.status -eq 'failed' }).Count
  $skipped = @($assertions | Where-Object { $_.status -eq 'pending' }).Count

  Write-Host '----------------------------------------------------------------' -ForegroundColor Cyan
  Write-Host ("  Resultado: {0} pasadas, {1} fallidas, {2} omitidas" -f $passed, $failed, $skipped) -ForegroundColor Yellow
  Write-Host '================================================================' -ForegroundColor Cyan
  Write-Host ''

  if ($jestExit -ne 0 -or $failed -gt 0) { exit 1 }
  exit 0
}
finally {
  Pop-Location
}
