[CmdletBinding()]
param(
    [string]$DbContainer = "backend-platform-postgres",
    [string]$DbName = "backend_platform",
    [string]$DbUser = "backend",
    [string]$DbPassword = "backend",
    [string]$ApiBaseUrl = "http://localhost:8080/api",
    [string]$Login = "exploreur",
    [string]$Password = "Explora123!"
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message"
}

function Assert-CommandAvailable {
    param([string]$CommandName)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Commande introuvable: $CommandName"
    }
}

Assert-CommandAvailable -CommandName "docker"

Write-Step "Verification du conteneur PostgreSQL '$DbContainer'"
$containerNames = docker ps --format "{{.Names}}"
if (-not ($containerNames -split "`n" | Where-Object { $_.Trim() -eq $DbContainer })) {
    throw "Le conteneur '$DbContainer' n'est pas en cours d'execution."
}

Write-Step "Suppression de tous les comptes utilisateurs"
docker exec -e PGPASSWORD=$DbPassword $DbContainer psql -h localhost -U $DbUser -d $DbName -t -A -q -c "DELETE FROM users;" | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Echec SQL pendant la purge des comptes."
}

$usersCountAfterDelete = docker exec -e PGPASSWORD=$DbPassword $DbContainer psql -h localhost -U $DbUser -d $DbName -t -A -q -c "SELECT COUNT(*) FROM users;"
if ($LASTEXITCODE -ne 0) {
    throw "Echec SQL pendant la verification apres purge."
}

$usersCountAfterDelete = ($usersCountAfterDelete | Select-Object -Last 1).Trim()
if ($usersCountAfterDelete -ne "0") {
    throw "La purge a echoue: users_count=$usersCountAfterDelete (attendu: 0)."
}

Write-Step "Creation du compte exploratoire via l'API"
$registerPayload = @{ login = $Login; password = $Password } | ConvertTo-Json
$registerResponse = Invoke-WebRequest -Uri "$ApiBaseUrl/register" -Method Post -ContentType "application/json" -Body $registerPayload -UseBasicParsing
if ($registerResponse.StatusCode -ne 204) {
    throw "Creation du compte echouee. Status HTTP recu: $($registerResponse.StatusCode)."
}

Write-Step "Validation du login du compte exploratoire"
$loginPayload = @{ login = $Login; password = $Password } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/login" -Method Post -ContentType "application/json" -Body $loginPayload
if (-not $loginResponse.token) {
    throw "Login KO: aucun token JWT recu."
}

Write-Step "Verification finale en base"
$finalCountOutput = docker exec -e PGPASSWORD=$DbPassword $DbContainer psql -h localhost -U $DbUser -d $DbName -t -A -q -c "SELECT COUNT(*) FROM users;"
if ($LASTEXITCODE -ne 0) {
    throw "Echec SQL pendant la verification finale."
}

$finalUsersCount = ($finalCountOutput | Select-Object -Last 1).Trim()
if ($finalUsersCount -ne "1") {
    throw "Etat final inattendu: users_count=$finalUsersCount (attendu: 1)."
}

Write-Host "[OK] Reset termine."
Write-Host "[OK] Compte actif: $Login"
Write-Host "[OK] users_count: $finalUsersCount"


