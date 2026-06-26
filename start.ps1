Write-Host "Starting Walter Backend..."
Start-Process npm.cmd -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $PSScriptRoot "walter-backend")

Write-Host "Starting Walter Frontend..."
Start-Process npm.cmd -ArgumentList "run", "dev" -WorkingDirectory (Join-Path $PSScriptRoot "walter-frontend")

$trulyPdfPath = Join-Path $PSScriptRoot "..\truly_pdf"
if (Test-Path (Join-Path $trulyPdfPath "package.json")) {
    Write-Host "Starting Truly PDF..."
    Start-Process npm.cmd -ArgumentList "run", "dev", "--", "--host", "127.0.0.1", "--port", "5174" -WorkingDirectory $trulyPdfPath
}

Write-Host "Services launched."
