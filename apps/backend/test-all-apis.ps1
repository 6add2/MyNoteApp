# Test All APIs Script
# Run this from the project root: cd C:\my-note-app; .\apps\backend\test-all-apis.ps1

$baseUrl = "http://localhost:3000"
$accessToken = $null
$refreshToken = $null
$noteId = $null

Write-Host "=== Testing All APIs ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: GET /
Write-Host "1. Testing GET /" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   ✓ SUCCESS: $($result | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: GET /health
Write-Host "2. Testing GET /health" -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✓ SUCCESS: $($result | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: POST /api/auth/register
Write-Host "3. Testing POST /api/auth/register" -ForegroundColor Yellow
$testEmail = "testuser$(Get-Random)@example.com"
$registerBody = @{
    email = $testEmail
    password = "password123"
    name = "Test User"
} | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
    $accessToken = $result.accessToken
    $refreshToken = $result.refreshToken
    Write-Host "   ✓ SUCCESS: User registered, email=$testEmail" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
    if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
    Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
}
Write-Host ""

# Test 4: POST /api/auth/login (if register failed, try with existing user)
if (-not $accessToken) {
    Write-Host "4. Testing POST /api/auth/login (with test@example.com)" -ForegroundColor Yellow
    $loginBody = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
        $accessToken = $result.accessToken
        $refreshToken = $result.refreshToken
        Write-Host "   ✓ SUCCESS: Logged in" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 5: GET /api/auth/me (requires auth)
Write-Host "5. Testing GET /api/auth/me" -ForegroundColor Yellow
if ($accessToken) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
        Write-Host "   ✓ SUCCESS: User info retrieved" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

# Test 6: POST /api/auth/refresh
Write-Host "6. Testing POST /api/auth/refresh" -ForegroundColor Yellow
if ($refreshToken) {
    $refreshBody = @{ refreshToken = $refreshToken } | ConvertTo-Json
    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshBody
        Write-Host "   ✓ SUCCESS: Token refreshed" -ForegroundColor Green
        $accessToken = $result.accessToken
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No refresh token available" -ForegroundColor Yellow
}
Write-Host ""

# Test 7: POST /api/auth/logout
Write-Host "7. Testing POST /api/auth/logout" -ForegroundColor Yellow
if ($accessToken) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method Post -Headers $headers
        Write-Host "   ✓ SUCCESS: Logged out" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: GET /api/notes (requires auth)
Write-Host "8. Testing GET /api/notes" -ForegroundColor Yellow
if ($accessToken) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes" -Method Get -Headers $headers
        Write-Host "   ✓ SUCCESS: Listed $($result.notes.Count) notes" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

# Test 9: POST /api/notes (requires auth)
Write-Host "9. Testing POST /api/notes" -ForegroundColor Yellow
if ($accessToken) {
    $createNoteBody = @{ title = "Test Note $(Get-Date -Format 'HH:mm:ss')" } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes" -Method Post -ContentType "application/json" -Body $createNoteBody -Headers $headers
        $noteId = $result.note._id
        Write-Host "   ✓ SUCCESS: Note created, ID=$noteId" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

# Test 10: GET /api/notes/:id (requires auth)
Write-Host "10. Testing GET /api/notes/:id" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes/$noteId" -Method Get -Headers $headers
        Write-Host "   ✓ SUCCESS: Note retrieved" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 11: PUT /api/notes/:id (requires auth)
Write-Host "11. Testing PUT /api/notes/:id" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    $updateNoteBody = @{ 
        title = "Updated Note $(Get-Date -Format 'HH:mm:ss')"
        tags = @("test", "api")
        isPublic = $false
    } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes/$noteId" -Method Put -ContentType "application/json" -Body $updateNoteBody -Headers $headers
        Write-Host "   ✓ SUCCESS: Note updated" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 12: GET /api/notes/:id/snapshot (requires auth)
Write-Host "12. Testing GET /api/notes/:id/snapshot" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes/$noteId/snapshot" -Method Get -Headers $headers
        Write-Host "   ✓ SUCCESS: Snapshot retrieved (null=$($result.snapshot -eq $null))" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 13: POST /api/notes/:id/share (requires auth)
Write-Host "13. Testing POST /api/notes/:id/share" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    $shareBody = @{ isPublic = $true } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes/$noteId/share" -Method Post -ContentType "application/json" -Body $shareBody -Headers $headers
        Write-Host "   ✓ SUCCESS: Note shared, isPublic=$($result.isPublic)" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 14: DELETE /api/notes/:id (requires auth)
Write-Host "14. Testing DELETE /api/notes/:id" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/notes/$noteId" -Method Delete -Headers $headers
        Write-Host "   ✓ SUCCESS: Note deleted" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

# Test 15-18: AI endpoints (stubs, require auth)
Write-Host "15. Testing POST /api/ai/ocr" -ForegroundColor Yellow
if ($accessToken) {
    $ocrBody = @{ imageUrl = "http://example.com/image.png" } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/ai/ocr" -Method Post -ContentType "application/json" -Body $ocrBody -Headers $headers
        Write-Host "   ✓ SUCCESS: OCR endpoint responded" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "16. Testing POST /api/ai/chat" -ForegroundColor Yellow
if ($accessToken) {
    $chatBody = @{ question = "What is this note about?" } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/ai/chat" -Method Post -ContentType "application/json" -Body $chatBody -Headers $headers
        Write-Host "   ✓ SUCCESS: Chat endpoint responded" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token available" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "17. Testing POST /api/ai/summarize" -ForegroundColor Yellow
if ($accessToken -and $noteId) {
    $summarizeBody = @{ noteId = $noteId } | ConvertTo-Json
    try {
        $headers = @{ Authorization = "Bearer $accessToken" }
        $result = Invoke-RestMethod -Uri "$baseUrl/api/ai/summarize" -Method Post -ContentType "application/json" -Body $summarizeBody -Headers $headers
        Write-Host "   ✓ SUCCESS: Summarize endpoint responded" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
        if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
        Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ SKIPPED: No access token or note ID available" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "18. Testing POST /api/ai/webhook" -ForegroundColor Yellow
$webhookBody = @{ data = "test" } | ConvertTo-Json
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/ai/webhook" -Method Post -ContentType "application/json" -Body $webhookBody
    Write-Host "   ✓ SUCCESS: Webhook endpoint responded" -ForegroundColor Green
} catch {
    $errorMsg = $_.Exception.Response | ConvertFrom-Json | Select-Object -ExpandProperty error -ErrorAction SilentlyContinue
    if (-not $errorMsg) { $errorMsg = $_.Exception.Message }
    Write-Host "   ✗ FAILED: $errorMsg" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Testing Complete ===" -ForegroundColor Cyan

