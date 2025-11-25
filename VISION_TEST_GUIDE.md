# Vision API Testing Guide

## Single Photo Test (PowerShell)

### 1. Convert photo to base64 data URL
```powershell
$imagePath = "C:\path\to\photo.jpg"
$bytes = [IO.File]::ReadAllBytes($imagePath)
$base64 = [Convert]::ToBase64String($bytes)
$dataUrl = "data:image/jpeg;base64,$base64"
```

### 2. Test single face identification
```powershell
$body = @{
  image = $dataUrl
  question = "Siapa orang di foto ini?"
  provider = "auto"
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/vision" -ContentType "application/json" -Body $body
$response.result
```

### 3. Test structured output
```powershell
$body = @{
  image = $dataUrl
  question = "Analisis wajah di foto ini"
  provider = "auto"
  structured = $true
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/vision" -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
```

## Multi-Image Test

### Convert multiple photos
```powershell
$images = @()
foreach ($path in @("photo1.jpg", "photo2.jpg", "photo3.jpg")) {
  $bytes = [IO.File]::ReadAllBytes($path)
  $base64 = [Convert]::ToBase64String($bytes)
  $images += "data:image/jpeg;base64,$base64"
}
```

### Test batch analysis
```powershell
$body = @{
  images = $images
  question = "Identifikasi semua orang di foto-foto ini"
  provider = "auto"
  structured = $true
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/vision" -ContentType "application/json" -Body $body
$response.items | ForEach-Object { $_.raw }
```

## Chat History Test

### Basic conversation
```powershell
$body = @{
  history = @(
    @{ role = "system"; content = "You are an OSIS assistant." }
    @{ role = "user"; content = "Siapa ketua OSIS?" }
  )
  provider = "auto"
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/chat" -ContentType "application/json" -Body $body
$response.reply
```

### Continue conversation
```powershell
$history = @(
  @{ role = "system"; content = "You are an OSIS assistant." }
  @{ role = "user"; content = "Siapa ketua OSIS?" }
  @{ role = "assistant"; content = $response.reply }
  @{ role = "user"; content = "Sekbid apa yang dia pimpin?" }
)

$body = @{
  history = $history
  provider = "auto"
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/chat" -ContentType "application/json" -Body $body
$response.reply
```

### Reset conversation
```powershell
$body = @{
  history = $history
  reset = $true
  provider = "auto"
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/chat" -ContentType "application/json" -Body $body
Write-Host "Reset applied: $($response.resetApplied)"
```

## Expected Outputs

### Single Face (high confidence >90%)
```
Berdasarkan analisis wajah dan database OSIS, ini adalah [Nama Lengkap]!

📋 Detail:
• Jabatan: [Jabatan]
• Sekbid: [Nama Sekbid]
• Kelas: [Kelas]
• Bio: [Bio]

Fotonya ada di database: [URL]
```

### Single Face (medium confidence 70-90%)
```
Berdasarkan ciri-ciri wajah, kemungkinan ini adalah:
1. [Nama 1] ([Jabatan 1] - [Sekbid 1]) - 87%
2. [Nama 2] ([Jabatan 2] - [Sekbid 2]) - 74%
3. [Nama 3] ([Jabatan 3] - [Sekbid 3]) - 68%
```

### Multi-Face Group Photo
```
LANGKAH 1: ANALISIS CIRI FISIK FOTO QUERY

Terdeteksi 5 wajah dalam foto:

Wajah 1 (baris depan, kiri):
- Gender: Pria
- Bentuk: Oval
- Rambut: Pendek, hitam
- Aksesoris: Kacamata
...

IDENTIFIKASI:
Wajah 1: [Nama] - 92%
Wajah 2: [Nama] - 88%
Wajah 3: Tidak dapat dipastikan (<70%)
...
```

## Validation Checklist

- [ ] AI provides step-by-step physical analysis
- [ ] Confidence scores shown (percentage or verbal)
- [ ] Names match database exactly (no hallucination)
- [ ] Sekbid ID correct
- [ ] Multi-face correctly enumerated
- [ ] No privacy refusal messages
- [ ] Chat maintains context across turns
- [ ] Reset clears previous context
- [ ] Structured JSON includes all requested fields

Last Updated: 2025-11-21
