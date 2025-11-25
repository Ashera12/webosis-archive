# Image Generation Guide

## Endpoint
`POST /api/ai/image-gen`

## Request Body
```jsonc
{
  "prompt": "A futuristic OSIS office with modern technology",
  "size": "1024x1024",     // Optional: "256x256"|"512x512"|"1024x1024"|"1792x1024"|"1024x1792"
  "n": 1,                  // Optional: 1-10 (DALL-E 3 only supports 1)
  "quality": "standard",   // Optional: "standard"|"hd"
  "provider": "auto"       // Optional: "openai"|"auto"
}
```

## PowerShell Example
```powershell
$body = @{
  prompt = "Gambar maskot OSIS SMK Informatika, kartun lucu dengan seragam biru"
  size = "1024x1024"
  quality = "standard"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/ai/image-gen" -ContentType "application/json" -Body $body

# View generated image URL
$response.images[0].url

# Download image
Invoke-WebRequest -Uri $response.images[0].url -OutFile "generated-image.png"
```

## Response Format
```jsonc
{
  "success": true,
  "provider": "openai",
  "prompt": "Original prompt text",
  "images": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "revised_prompt": "Detailed revised prompt used by DALL-E"
    }
  ],
  "count": 1
}
```

## Size Options
- `256x256` - Small square (fastest, cheapest)
- `512x512` - Medium square
- `1024x1024` - Large square (default, recommended)
- `1792x1024` - Wide landscape (DALL-E 3 only)
- `1024x1792` - Tall portrait (DALL-E 3 only)

## Quality Options
- `standard` - Default quality (faster, cheaper)
- `hd` - High definition (better detail, slower, more expensive)

## Model Support
Currently uses **DALL-E 3** which:
- Only generates 1 image per request (`n=1`)
- Produces higher quality results
- Auto-revises prompts for safety and quality
- Returns `revised_prompt` showing what was actually generated

To use DALL-E 2 (supports `n` up to 10, cheaper but lower quality):
- Modify `model: 'dall-e-2'` in route.ts
- Remove size restrictions for landscape/portrait

## Error Handling
Common errors:
- `Prompt is required` - Missing or empty prompt
- `Invalid size` - Size not in allowed list
- `No provider configured` - OPENAI_API_KEY not set in admin settings
- `Content policy violation` - Prompt violates OpenAI safety policy

## Integration Tips
1. **Chat Integration**: Add `/generate [prompt]` command in chat to trigger image generation
2. **Gallery Upload**: Auto-upload generated images to gallery table with metadata
3. **Caching**: Store generated URLs in database to avoid regenerating identical prompts
4. **Safety**: Add prompt filtering before sending to API (block sensitive content)

## Example Use Cases
```
Prompt: "Logo OSIS modern dengan lambang sekolah dan warna biru"
Prompt: "Poster event OSIS dengan tema teknologi dan inovasi"
Prompt: "Ilustrasi kegiatan ekstrakurikuler OSIS di sekolah"
Prompt: "Banner media sosial OSIS dengan desain minimalis elegan"
```

## Cost Considerations
DALL-E 3 pricing (as of 2024):
- Standard 1024x1024: $0.040 per image
- HD 1024x1024: $0.080 per image
- Standard 1024x1792 or 1792x1024: $0.080 per image

Use `quality: "standard"` and `size: "1024x1024"` for cost-effective generation.

Last Updated: 2025-11-21
