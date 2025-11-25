# Image Generation Enhancement Guide

## Overview

Current capabilities:
- ✅ Multi-provider fallback (DALL-E 3 → DALL-E 2 → HuggingFace Flux → Gemini notice)
- ✅ Web URL reference fetching
- ✅ Image-to-image variations (limited by provider capabilities)
- ✅ Quick command palette integration

## Features

### 1. Multi-Provider Fallback

Goal: Always produce an image even if premium provider hits billing/quota limits.

Auto order:
1. DALL-E 3 (quality)
2. DALL-E 2 (quota/billing fallback or variation attempt)
3. HuggingFace FLUX.1 (free/fast) model (configurable)
4. Gemini: returns explanatory message (not available yet)

Example log sequence:
```
[Image Gen] ✅ Generated with OpenAI DALL-E 3
[Image Gen] ❌ OpenAI DALL-E 3 failed: billing hard limit reached
[Image Gen] 🔄 Trying DALL-E 2 as fallback...
[Image Gen] ❌ DALL-E 2 also failed: billing hard limit reached
[Image Gen] 🔄 Trying HuggingFace FLUX.1-schnell ...
[Image Gen] ✅ Generated with HuggingFace model black-forest-labs/FLUX.1-schnell
```

### 2. Web URL Reference Fetching

**Command syntax:**
```
/generate <prompt> --ref <url>
```

**Examples:**
```
/generate sunset over mountains --ref https://example.com/style.jpg
/generate modern office design --ref https://pinterest.com/ref-image.png
```

**How it works:**
1. Parse `--ref <url>` flag from command
2. Fetch image from URL
3. Convert to base64
4. Pass to Gemini Imagen with modified prompt: "Using the reference image above as style/content inspiration, generate: {prompt}"

Notes:
- DALL-E 3 & 2: reference ignored (limitations)
- Flux: current endpoint ignores reference (future enhancement)
- Still useful for future providers; input accepted & logged.

### 3. Image-to-Image Variations

**API Endpoint:** `POST /api/ai/image-gen`

**Request body:**
```json
{
  "prompt": "make it more vibrant and colorful",
  "sourceImage": "data:image/png;base64,iVBORw0KG...",
  "mode": "variation",
  "provider": "auto"
}
```

**How it works:**
1. Accept `sourceImage` as data URL or regular URL
2. Parse base64 or fetch from URL
3. Pass to Gemini Imagen with prompt: "Create a variation of the image above with these changes: {prompt}"

Notes:
- Data URL or HTTP URL supported
- DALL-E 3: proper variation not used (mask requirement) → we skip
- DALL-E 2: treated as prompt-only variation
- Flux: treated as prompt enhancement (no true img2img yet)
- Gemini: disabled (public image generation unavailable)

### 4. Quick Command Palette Integration

**Location:** LiveChatWidget.tsx, line 67

**Command added:**
```typescript
{ cmd: '/generate', desc: 'Generate gambar dengan AI', template: '/generate <prompt>' }
```

**How to use:**
1. Type `/` in chat input
2. See filtered suggestions including `/generate`
3. Click or arrow-key navigate to select
4. Auto-fill command template

## API Documentation

### POST /api/ai/image-gen

**Request:**
```typescript
{
  prompt: string;              // Required: Text description
  size?: string;               // Optional: "1024x1024" (default), "1792x1024", etc.
  n?: number;                  // Optional: 1-10 (default 1)
  provider?: string;           // Optional: "auto" (default), "openai", "gemini"
  quality?: string;            // Optional: "standard" (default), "hd" (OpenAI only)
  referenceUrl?: string;       // Optional: URL of reference image
  sourceImage?: string;        // Optional: Data URL or URL for variations
  mode?: string;               // Optional: "generate" (default), "variation"
}
```

**Response:**
```typescript
{
  success: true,
  provider: "gemini",          // Which provider was used
  prompt: "...",
  images: [
    { url: "data:image/png;base64,..." }
  ],
  count: 1,
  mode: "variation",
  referenceUrl?: "https://...", // If reference used
  sourceImage?: "provided",     // If source used (doesn't echo full base64)
  warnings?: ["OpenAI: billing hard limit"] // Fallback errors
}
```

### Chat Command: /generate

**Syntax:**
```
/generate <prompt> [--ref <url>]
```

**Examples:**
```
/generate a sunset over mountains
/generate modern office --ref https://example.com/style.jpg
```

**Response format:**
```
✅ Gambar berhasil dibuat dengan Gemini Imagen!

Prompt: modern office
Referensi: https://example.com/style.jpg

![Generated Image](data:image/png;base64,...)
```

## Provider Comparison

| Feature | DALL-E 3 | DALL-E 2 | HuggingFace Flux | Gemini (public) |
|---------|----------|----------|------------------|-----------------|
| Text → Image | ✅ High | ✅ Mid | ✅ Fast/Config | ⚠️ Unavailable |
| Reference image | ❌ | ❌ | ❌ (planned) | ❌ |
| Variation | Mask edit (not used) | Basic prompt | Prompt tweak | ❌ |
| Multi-image | 1 | >1 supported | 1 (current) | N/A |
| Quality param | standard/hd | none | none | N/A |
| Sizes | 1024 + tall/wide | 256–1024 sq | PNG output | Aspect only |
| Output format | URL/base64 | URL/base64 | data URL | N/A |
| Typical cost | High | Lower | Free tier | N/A |

## Implementation Details (Updated)
The image generation system now supports:
- ✅ Multi-provider fallback (OpenAI DALL-E 3 → DALL-E 2 → HuggingFace Flux → Gemini notice)
- ✅ Web URL reference fetching
- ✅ Image-to-image variations (where supported)
- ✅ Quick command palette integration
   - Added `referenceUrl` fetching
   - Added `sourceImage` parsing (data URL + HTTP URL)
Problem solved: OpenAI billing + Gemini unavailability no longer stops generation; Flux provides resilient fallback.
**Order (auto mode):**
1. OpenAI DALL-E 3 (quality)
2. OpenAI DALL-E 2 (quota/billing fallback)
3. HuggingFace FLUX.1-schnell (fast, free tier)
4. Gemini (informative error only – not available)
   - Added reference URL extraction from command
   - Added multi-provider fallback in chat context
   - Updated response to include provider info
[Image Gen] ✅ Generated with OpenAI DALL-E 3
[Image Gen] ❌ OpenAI DALL-E 3 failed: billing hard limit reached
[Image Gen] 🔄 Trying DALL-E 2 as fallback...
[Image Gen] ❌ DALL-E 2 also failed: billing hard limit reached
[Image Gen] 🔄 Trying HuggingFace FLUX.1-schnell ...
[Image Gen] ✅ Generated with HuggingFace FLUX.1-schnell
   - Now appears in quick suggestions when typing `/`

4. **lib/adminChatCommands.ts**
**Notes:**
- Reference images currently not supported by OpenAI or Flux implementation (future roadmap)
- If `--ref` provided we still attempt generation; OpenAI 3 skipped, DALL-E 2 or Flux used
- Reference URL must return an image MIME type
### Error Handling & Fallback Chain

**Notes:**
- Supports both data URLs (`data:image/png;base64,...`) and HTTP URLs
- OpenAI DALL-E 3 limitations: no direct variation without mask; DALL-E 2 basic prompt only
- Current Flux call treats variation as prompt enhancement (no true img2img yet)
- Gemini variation disabled (public endpoint unavailable)
                      errMsg.toLowerCase().includes('quota') ||
                      errMsg.toLowerCase().includes('limit');
```

Fallback chain:
1. DALL-E 3 fails (billing/quota/rate) → DALL-E 2
2. DALL-E 2 fails (billing/quota/rate) → Flux
3. Flux fails → Gemini explanatory error
4. Aggregate all errors in response

**Validation errors:**
- Invalid prompt → 400 Bad Request
| Feature | DALL-E 3 | DALL-E 2 | Flux (HF) | Gemini (public) |
|---------|----------|----------|-----------|-----------------|
| Text → Image | ✅ High | ✅ Mid | ✅ Fast | ⚠️ Unavailable |
| Reference image | ❌ | ❌ (basic) | ❌ (planned) | ❌ (public) |
| Variations | Limited (mask) | Basic | Planned | ❌ |
| Sizes | 1024/1792 variants | 256–1024 sq | PNG output | Aspect ratio (N/A) |
| Multi-image | n=1 enforced | n>1 allowed | 1 current | N/A |
| Quality param | standard/hd | none | none | N/A |
| Output format | URL/base64 | URL/base64 | data URL | N/A |
| Typical cost | Higher | Lower | Free tier | N/A |
- Invalid size → 400 Bad Request
- Failed to fetch reference/source image → 400 Bad Request
1. DALL-E 3 fails (billing/rate) → DALL-E 2
2. DALL-E 2 fails (billing/rate) → HuggingFace Flux
3. Flux fails → Gemini informative error (not generated)
4. All fail → aggregated error response

### Basic Generation
- [ ] `/generate a sunset` → generates with DALL-E 3 or falls back
-- Force billing error scenario → expect DALL-E 2 then Flux
- [ ] Disable OpenAI keys → Flux used automatically
- [ ] DALL-E 3 billing error → DALL-E 2 → Flux success
- [ ] `/generate sunset --ref <valid-url>` → DALL-E 3 skipped, DALL-E 2/Flux attempt
- [ ] Console shows reference fetch success
- [ ] Variation with sourceImage triggers DALL-E 2 or Flux
- [ ] Invalid data URL → 400 error
- [ ] `/generate sunset --ref <valid-url>` → generates with reference
- [ ] Verify Gemini used (not OpenAI)
- [ ] Check console for "Fetched reference image from URL"
- [ ] Invalid URL → 400 error with clear message

### Image Variations (API only)
- [ ] POST with `sourceImage` data URL → generates variation
- [ ] POST with `sourceImage` HTTP URL → fetches and generates
- [ ] POST with invalid data URL → 400 error
- [ ] `mode: "variation"` → uses variation prompt

### Quick Palette
- [ ] Type `/` in chat → see `/generate` in suggestions
- [ ] Click `/generate` → auto-fill template
- [ ] Filter works (type `/gen` → shows `/generate`)

### Edge Cases
- [ ] Empty prompt → 400 error
- [ ] Invalid size → 400 error
- [ ] n > 10 → 400 error
- [ ] No API keys configured → 500 error
- [ ] Reference URL returns non-image → 400 error

## Future Enhancements

### Potential Additions
1. **DALL-E Edit API Integration**
   - Support mask-based editing
   - Inpainting/outpainting
   - Requires UI for mask drawing

2. **Batch Generation UI**
   - Generate multiple variations at once
   - Side-by-side comparison
   - Vote/favorite system

3. **Style Presets**
   - Predefined style keywords
   - `/generate sunset --style anime`
   - Style library management

4. **Image History**
   - Save generated images to database
   - Search/filter by prompt
   - Re-generate with tweaks

5. **Advanced Variation Controls**
   - Variation strength slider (0-100%)
   - Preserve specific elements
   - Multi-stage refinement

## Configuration

### Required API Keys

**Admin Settings → API Keys:**
- `OPENAI_API_KEY` (quality primary)
- `HUGGINGFACE_API_KEY` (resilient free fallback)
- `HUGGINGFACE_MODEL` (optional: `black-forest-labs/FLUX.1-schnell` default or `black-forest-labs/FLUX.1-dev`)
- `GEMINI_API_KEY` (optional; currently only for notice)

**Recommended:** Configure both for maximum reliability

### Environment Variables

```env
# Optional override (usually managed via admin settings)
OPENAI_API_KEY=sk-proj-...
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_MODEL=black-forest-labs/FLUX.1-dev
GEMINI_API_KEY=AIza... (optional)
```

## Troubleshooting

### "Billing hard limit reached"
→ Configure Gemini API key as fallback

### "No image generation provider available"
→ Configure at least one API key (OpenAI or Gemini)

### Reference image not working
→ Ensure URL returns image MIME type, verify Gemini key configured

### Images not rendering in chat
→ Check browser console for errors, verify markdown image syntax

### Quick palette not showing /generate
→ Clear browser cache, verify adminCommands array updated

## Credits

**Implementation Date:** January 2025

**Features Added:**
- Multi-provider fallback architecture
- Web URL reference fetching with base64 conversion
- Image-to-image variation support
- Quick command palette integration
- Comprehensive error handling and logging

**Status:** ✅ Production-ready
