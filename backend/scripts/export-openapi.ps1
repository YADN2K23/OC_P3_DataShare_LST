# Export OpenAPI (v3) from a running application
# Usage: from PowerShell, run in project root:
#   Push-Location "backend"; .\scripts\export-openapi.ps1 -Url 'http://localhost:8080/v3/api-docs' -OutJson '..\\docs\\openapi.generated.json' -TimeoutSeconds 30

param(
    [string]$Url = 'http://localhost:8080/v3/api-docs',
    [string]$OutJson = '..\\docs\\openapi.generated.json',
    [int]$TimeoutSeconds = 30
)

Write-Host "Waiting for OpenAPI endpoint $Url (timeout ${TimeoutSeconds}s)..."
$endTime = (Get-Date).AddSeconds($TimeoutSeconds)
$success = $false
while((Get-Date) -lt $endTime) {
    try {
        $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($resp.StatusCode -eq 200) {
            $content = $resp.Content
            # Ensure destination dir exists
            $dir = Split-Path -Parent $OutJson
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Set-Content -Path $OutJson -Value $content -Encoding UTF8
            Write-Host "Saved OpenAPI JSON to $OutJson"
            $success = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $success) {
    Write-Error "Unable to reach $Url within $TimeoutSeconds seconds. Is the application running?"
    exit 2
}

# Try to produce YAML if python and pyyaml are available
try {
    $py = Get-Command python -ErrorAction SilentlyContinue
    if ($py) {
        $script = @'
import sys, json
try:
    import yaml
except Exception as e:
    sys.exit(10)
js = json.load(sys.stdin)
print(yaml.safe_dump(js, sort_keys=False))
'@
        # Use PowerShell pipeline to feed the JSON file to python ("< file" redirection is not supported in PowerShell)
        $yaml = Get-Content $OutJson -Raw | & python -c $script 2>$null
        if ($LASTEXITCODE -eq 0 -and $yaml) {
            $outYaml = [System.IO.Path]::ChangeExtension($OutJson, '.yaml')
            Set-Content -Path $outYaml -Value $yaml -Encoding UTF8
            Write-Host "Also wrote YAML to $outYaml (pyyaml detected)."
        } else {
            Write-Host "python found but pyyaml missing or conversion failed (exit $LASTEXITCODE). JSON saved only."
        }
    } else {
        Write-Host "python not found on PATH. JSON saved only."
    }
} catch {
    Write-Host "Conversion to YAML skipped: $_"
}

Write-Host "Done."


