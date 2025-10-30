# 🔧 Commandes de test PowerShell

## ✅ Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:4000/health" | Select-Object -Expand Content
```

## 🔐 Test Login

```powershell
$body = @{
    email = "admin@neemba.com"
    password = "password123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -SessionVariable session | 
    Select-Object -Expand Content
```

## 📦 Test Equipment (avec token)

```powershell
# D'abord, récupérer le token du login
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$result = $response.Content | ConvertFrom-Json
$token = $result.accessToken

# Ensuite, utiliser le token
Invoke-WebRequest -Uri "http://localhost:4000/api/equipment" `
    -Headers @{Authorization = "Bearer $token"} |
    Select-Object -Expand Content
```

## 📋 Test complet

```powershell
Write-Host "=== Test Health ===" -ForegroundColor Green
Invoke-WebRequest -Uri "http://localhost:4000/health" | Select-Object -Expand Content

Write-Host "`n=== Test Login ===" -ForegroundColor Green
$body = @{
    email = "admin@neemba.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$result = $response.Content | ConvertFrom-Json
Write-Host "✅ Login successful!" -ForegroundColor Green
Write-Host "User: $($result.user.name) ($($result.user.role))"
Write-Host "Token: $($result.accessToken.Substring(0,20))..."

Write-Host "`n=== Test Equipment ===" -ForegroundColor Green
$token = $result.accessToken
Invoke-WebRequest -Uri "http://localhost:4000/api/equipment" `
    -Headers @{Authorization = "Bearer $token"} |
    Select-Object -Expand Content
```
