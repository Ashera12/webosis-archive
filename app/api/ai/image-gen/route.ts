import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/adminConfig';

/**
 * Image Generation API
 * Generates images from text prompts using OpenAI DALL-E or Gemini Imagen (fallback)
 * POST /api/ai/image-gen
 * Body: { 
 *   prompt: string, 
 *   size?: "256x256"|"512x512"|"1024x1024", 
 *   n?: 1-10, 
 *   provider?: "openai"|"gemini"|"auto",
 *   referenceUrl?: string, // Optional: URL of reference image for style/content
 *   sourceImage?: string, // Optional: Base64 data URL or URL of source image for variations
 *   mode?: "generate"|"variation" // Mode: generate new image or create variation
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      prompt, 
      size = '1024x1024', 
      n = 1, 
      provider = 'auto',
      quality = 'standard',
      referenceUrl, // Optional reference image URL
      sourceImage, // Optional source image for variations (data URL or URL)
      mode = 'generate' // 'generate' or 'variation'
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ 
        error: 'Prompt is required and must be a string' 
      }, { status: 400 });
    }

    // Get API keys
    const openaiKey = await getConfig('OPENAI_API_KEY');
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const huggingfaceKey = await getConfig('HUGGINGFACE_API_KEY');
    let huggingfaceModel = (await getConfig('HUGGINGFACE_MODEL')) || 'black-forest-labs/FLUX.1-schnell';
    // Stronger validation: ensure namespace/model pattern and avoid accidental token paste
    const modelPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    if (!huggingfaceModel || huggingfaceModel.startsWith('hf_') || huggingfaceModel.length < 5 || !modelPattern.test(huggingfaceModel)) {
      console.warn('[Image Gen] Invalid HUGGINGFACE_MODEL value detected, reverting to default FLUX.1-schnell');
      huggingfaceModel = 'black-forest-labs/FLUX.1-schnell';
    }

    console.log('[Image Gen] Key status:', {
      openai: openaiKey ? openaiKey.substring(0, 8) + '...' : 'none',
      gemini: geminiKey ? geminiKey.substring(0, 8) + '...' : 'none',
      huggingface: huggingfaceKey ? huggingfaceKey.substring(0, 8) + '...' : 'none',
      model: huggingfaceModel
    });
    
    if (!openaiKey && !geminiKey && !huggingfaceKey && provider !== 'auto') {
      return NextResponse.json({ 
        error: 'No image generation provider configured. Please set OPENAI_API_KEY, GEMINI_API_KEY, or HUGGINGFACE_API_KEY in admin settings.' 
      }, { status: 500 });
    }

    // Validate size
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      return NextResponse.json({ 
        error: `Invalid size. Must be one of: ${validSizes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate count
    if (n < 1 || n > 10) {
      return NextResponse.json({ 
        error: 'Number of images (n) must be between 1 and 10' 
      }, { status: 400 });
    }

    // Fetch reference image if provided
    let referenceImageBase64: string | null = null;
    let referenceImageMimeType: string | null = null;
    if (referenceUrl) {
      try {
        const refRes = await fetch(referenceUrl);
        if (!refRes.ok) {
          return NextResponse.json({ 
            error: `Failed to fetch reference image: ${refRes.statusText}` 
          }, { status: 400 });
        }
        const contentType = refRes.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          return NextResponse.json({ 
            error: 'Reference URL must point to an image' 
          }, { status: 400 });
        }
        const buffer = await refRes.arrayBuffer();
        referenceImageBase64 = Buffer.from(buffer).toString('base64');
        referenceImageMimeType = contentType;
        console.log('[Image Gen] ✅ Fetched reference image from URL:', referenceUrl);
      } catch (error: any) {
        console.error('[Image Gen] ❌ Failed to fetch reference image:', error.message);
        return NextResponse.json({ 
          error: `Failed to fetch reference image: ${error.message}` 
        }, { status: 400 });
      }
    }

    // Process source image for variations
    let sourceImageBase64: string | null = null;
    let sourceImageMimeType: string | null = null;
    if (sourceImage) {
      if (sourceImage.startsWith('data:')) {
        // It's a data URL
        const matches = sourceImage.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) {
          return NextResponse.json({ 
            error: 'Invalid data URL format for sourceImage' 
          }, { status: 400 });
        }
        sourceImageMimeType = matches[1];
        sourceImageBase64 = matches[2];
        console.log('[Image Gen] ✅ Parsed source image from data URL');
      } else if (sourceImage.startsWith('http')) {
        // It's a regular URL
        try {
          const srcRes = await fetch(sourceImage);
          if (!srcRes.ok) {
            return NextResponse.json({ 
              error: `Failed to fetch source image: ${srcRes.statusText}` 
            }, { status: 400 });
          }
          const contentType = srcRes.headers.get('content-type');
          if (!contentType?.startsWith('image/')) {
            return NextResponse.json({ 
              error: 'Source image URL must point to an image' 
            }, { status: 400 });
          }
          const buffer = await srcRes.arrayBuffer();
          sourceImageBase64 = Buffer.from(buffer).toString('base64');
          sourceImageMimeType = contentType;
          console.log('[Image Gen] ✅ Fetched source image from URL');
        } catch (error: any) {
          console.error('[Image Gen] ❌ Failed to fetch source image:', error.message);
          return NextResponse.json({ 
            error: `Failed to fetch source image: ${error.message}` 
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ 
          error: 'sourceImage must be a data URL or HTTP(S) URL' 
        }, { status: 400 });
      }
    }

    let result;
    let usedProvider = 'none';
    const errors: string[] = [];

    // Try OpenAI DALL-E first (if available and requested)
    // Note: DALL-E variation requires the edit endpoint with mask
    // For simple variations, we'll use Gemini instead
    if (provider === 'openai' || (provider === 'auto' && openaiKey && !referenceImageBase64 && !sourceImageBase64)) {
      if (!openaiKey) {
        return NextResponse.json({ 
          error: 'OpenAI API key not configured' 
        }, { status: 500 });
      }
      
      if (referenceImageBase64 || sourceImageBase64) {
        console.log('[Image Gen] ⚠️ Reference/source image provided. OpenAI DALL-E 3 does not support this. Will try DALL-E 2 or skip.');
        // Skip OpenAI DALL-E 3 and try alternatives
      } else {
        try {
          result = await generateWithOpenAI(prompt, openaiKey, size, n, quality, 'dall-e-3');
          usedProvider = 'openai';
          console.log('[Image Gen] ✅ Generated with OpenAI DALL-E 3');
        } catch (error: any) {
          const errMsg = error.message || 'Unknown error';
          console.error('[Image Gen] ❌ OpenAI DALL-E 3 failed:', errMsg);
          errors.push(`OpenAI DALL-E 3: ${errMsg}`);
          
          // Check if billing error
          const isBillingError = errMsg.toLowerCase().includes('billing') || 
                                errMsg.toLowerCase().includes('quota') ||
                                errMsg.toLowerCase().includes('limit') ||
                                errMsg.toLowerCase().includes('insufficient');
          
          // Try DALL-E 2 as fallback (cheaper, more forgiving)
          if (isBillingError || errMsg.toLowerCase().includes('rate')) {
            try {
              console.log('[Image Gen] 🔄 Trying DALL-E 2 as fallback...');
              result = await generateWithOpenAI(prompt, openaiKey, size, n, 'standard', 'dall-e-2');
              usedProvider = 'openai-dalle2';
              console.log('[Image Gen] ✅ Generated with OpenAI DALL-E 2 (fallback)');
            } catch (dalle2Error: any) {
              const dalle2ErrMsg = dalle2Error.message || 'Unknown error';
              console.error('[Image Gen] ❌ DALL-E 2 also failed:', dalle2ErrMsg);
              errors.push(`OpenAI DALL-E 2: ${dalle2ErrMsg}`);
              
              if (provider === 'openai') {
                return NextResponse.json({ 
                  error: 'Image generation failed with all OpenAI models', 
                  details: errors.join(' | ') 
                }, { status: 500 });
              }
            }
          } else if (provider === 'openai') {
            // Don't fallback if explicitly requested OpenAI or not a billing issue
            return NextResponse.json({ 
              error: 'Image generation failed with OpenAI', 
              details: errMsg 
            }, { status: 500 });
          }
        }
      }
    }

    // If still no result and we have OpenAI key, try DALL-E 2 for reference/source images
    if (!result && openaiKey && (referenceImageBase64 || sourceImageBase64) && provider !== 'gemini') {
      try {
        console.log('[Image Gen] 🔄 Trying DALL-E 2 for image variation...');
        // DALL-E 2 supports variations but not with custom prompts
        // We'll just use the text prompt
        result = await generateWithOpenAI(prompt, openaiKey, size, n, 'standard', 'dall-e-2');
        usedProvider = 'openai-dalle2';
        console.log('[Image Gen] ✅ Generated with OpenAI DALL-E 2');
      } catch (error: any) {
        const errMsg = error.message || 'Unknown error';
        console.error('[Image Gen] ❌ DALL-E 2 failed:', errMsg);
        errors.push(`OpenAI DALL-E 2: ${errMsg}`);
      }
    }

    // Try HuggingFace with multi-model fallback
    if (!result && (provider === 'huggingface' || provider === 'auto')) {
      if (!huggingfaceKey) {
        errors.push('HuggingFace: API key not configured');
      } else {
        const hfCandidates = [
          huggingfaceModel,
          'black-forest-labs/FLUX.1-dev',
          'stabilityai/sdxl-turbo',
          'stabilityai/stable-diffusion-2-1'
        ];
        for (const mdl of hfCandidates) {
          if (result) break;
          if (!mdl) continue;
          try {
            console.log(`[Image Gen] 🔄 HuggingFace attempt model: ${mdl}`);
            const attempt = await generateWithHuggingFace(prompt, huggingfaceKey, mdl);
            result = attempt;
            usedProvider = `huggingface-${mdl.split('/').pop()}`;
            console.log(`[Image Gen] ✅ HuggingFace success with ${mdl}`);
          } catch (hfErr: any) {
            const hfMsg = hfErr.message || 'Unknown error';
            console.warn(`[Image Gen] HuggingFace model ${mdl} failed: ${hfMsg}`);
            errors.push(`HuggingFace(${mdl.split('/').pop()}): ${hfMsg}`);
            continue;
          }
        }
      }
    }

    // Try Gemini Imagen fallback (currently not available) if still no result
    if (!result && (provider === 'gemini' || (provider === 'auto' && geminiKey) || referenceImageBase64 || sourceImageBase64)) {
      if (!geminiKey) {
        return NextResponse.json({ 
          error: 'No image generation provider available', 
          attemptedProviders: errors,
          suggestion: 'Configure OPENAI_API_KEY billing, or add HUGGINGFACE_API_KEY for Flux model'
        }, { status: 500 });
      }
      try {
        result = await generateWithGemini(
          prompt, 
          geminiKey, 
          size, 
          n, 
          referenceImageBase64 || sourceImageBase64, // Use source image if no reference
          referenceImageMimeType || sourceImageMimeType,
          mode === 'variation' && sourceImageBase64 ? 'variation' : 'generate'
        );
        usedProvider = 'gemini';
        const modeStr = mode === 'variation' ? ' (variation)' : '';
        const refStr = referenceImageBase64 || sourceImageBase64 ? ' with reference' : '';
        console.log(`[Image Gen] ✅ Generated with Gemini Imagen${modeStr}${refStr}`);
      } catch (error: any) {
        const errMsg = error.message || 'Unknown error';
        console.error('[Image Gen] ❌ Gemini failed:', errMsg);
        errors.push(`Gemini: ${errMsg}`);
        
        return NextResponse.json({ 
          error: 'Image generation failed with all providers', 
          details: errors.join(' | '),
          suggestion: 'OpenAI billing limit reached. Gemini Imagen not available. Ensure HUGGINGFACE_API_KEY is set for Flux fallback.'
        }, { status: 500 });
      }
    }

    if (!result) {
      const errorSummary = errors.length > 0 ? errors.join(' | ') : 'No providers configured';
      const hasHuggingFaceError = errors.some(e => e.includes('HuggingFace: API key not configured'));
      
      let actionableMessage = '❌ Gagal membuat gambar dengan semua provider.\n\n';
      
      if (hasHuggingFaceError) {
        actionableMessage += '🔑 SOLUSI CEPAT:\n';
        actionableMessage += '1. Buka https://huggingface.co/settings/tokens\n';
        actionableMessage += '2. Generate token baru (type: Read)\n';
        actionableMessage += '3. Copy token (format: hf_...)\n';
        actionableMessage += '4. Tambahkan ke Admin Settings sebagai HUGGINGFACE_API_KEY\n';
        actionableMessage += '5. Restart server dan coba lagi\n\n';
        actionableMessage += '💡 HuggingFace FLUX.1 gratis dan powerful untuk image generation!\n\n';
      } else {
        actionableMessage += '🔑 KONFIGURASI MINIMAL YANG DIPERLUKAN:\n';
        actionableMessage += 'Tambahkan salah satu API key berikut di Admin Settings:\n';
        actionableMessage += '• HUGGINGFACE_API_KEY (recommended - gratis)\n';
        actionableMessage += '• OPENAI_API_KEY (berbayar - kualitas tinggi)\n\n';
      }
      
      actionableMessage += `Detail Error:\n${errorSummary}`;
      
      return NextResponse.json({ 
        error: actionableMessage,
        attemptedProviders: errors,
        setupInstructions: {
          huggingface: {
            url: 'https://huggingface.co/settings/tokens',
            steps: [
              'Create account or login to HuggingFace',
              'Navigate to Settings > Access Tokens',
              'Click "New token" with Read permission',
              'Copy token (starts with hf_)',
              'Add to Admin Settings as HUGGINGFACE_API_KEY'
            ],
            benefits: 'Free tier, fast generation, no billing required'
          },
          openai: {
            url: 'https://platform.openai.com/api-keys',
            steps: [
              'Login to OpenAI Platform',
              'Add billing information',
              'Create new API key',
              'Add to Admin Settings as OPENAI_API_KEY'
            ],
            benefits: 'Highest quality, supports HD mode'
          }
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: usedProvider,
      prompt,
      images: result.images,
      count: result.images.length,
      mode,
      ...(errors.length > 0 && { warnings: errors }), // Include fallback warnings
      ...(referenceUrl && { referenceUrl }), // Include reference URL if used
      ...(sourceImage && { sourceImage: 'provided' }), // Don't echo full base64
    });

  } catch (error: any) {
    console.error('[Image Gen API Error]:', error);
    return NextResponse.json({ 
      error: 'Image generation failed', 
      details: error.message 
    }, { status: 500 });
  }
}

async function generateWithOpenAI(
  prompt: string, 
  apiKey: string, 
  size: string, 
  n: number,
  quality: string,
  model: 'dall-e-2' | 'dall-e-3' = 'dall-e-3'
): Promise<{ images: Array<{ url: string; revised_prompt?: string }> }> {
  console.log(`[OpenAI Image Gen] Using model: ${model.toUpperCase()}`);
  
  // DALL-E 2 constraints: only supports 256x256, 512x512, 1024x1024
  let requestSize = size;
  let requestQuality = quality;
  let requestN = n;
  
  if (model === 'dall-e-2') {
    if (size === '1024x1792' || size === '1792x1024') {
      requestSize = '1024x1024'; // Fallback to square
      console.log(`[OpenAI Image Gen] DALL-E 2 doesn't support ${size}, using 1024x1024`);
    }
    requestQuality = 'standard'; // DALL-E 2 doesn't support quality parameter
    // DALL-E 2 supports n > 1
  } else {
    // DALL-E 3 only supports n=1
    requestN = Math.min(n, 1);
  }
  
  const requestBody: any = {
    model,
    prompt,
    size: requestSize,
    n: requestN,
    response_format: 'url',
  };
  
  // Only add quality for DALL-E 3
  if (model === 'dall-e-3') {
    requestBody.quality = requestQuality;
  }
  
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await res.json();
  
  if (!res.ok) {
    console.error(`[OpenAI Image Gen ${model}] Error:`, data);
    throw new Error(data?.error?.message || `OpenAI ${model} image generation failed`);
  }

  const images = data.data.map((item: any) => ({
    url: item.url,
    revised_prompt: item.revised_prompt,
  }));

  return { images };
}

async function generateWithGemini(
  prompt: string,
  apiKey: string,
  size: string,
  n: number,
  referenceImageBase64?: string | null,
  referenceImageMimeType?: string | null,
  mode: 'generate' | 'variation' = 'generate'
): Promise<{ images: Array<{ url: string; revised_prompt?: string }> }> {
  // Gemini uses Imagen 2 via Vertex AI
  // For simple implementation, we'll use text-to-image via generateContent
  // Note: This uses standard Gemini API, not the dedicated Imagen endpoint
  
  // Build text prompt - include reference context if provided
  let finalPrompt = prompt;
  
  if (referenceImageBase64 && referenceImageMimeType) {
    if (mode === 'variation') {
      finalPrompt = `Create a variation of this image with these changes: ${prompt}. Maintain the overall style and composition but apply the requested modifications.`;
    } else {
      finalPrompt = `Using this reference image as style inspiration, generate: ${prompt}. Match the aesthetic, color palette, and artistic style.`;
    }
  }
  
  // Use Gemini's vision model to generate images
  // Note: Gemini doesn't have native image generation yet via public API
  // We'll use a workaround or return an error message
  
  // Actually, let's use a different approach - use Gemini to enhance the prompt
  // then use a free image generation API as fallback
  
  throw new Error('Gemini Imagen is not yet available via public API. Please use OpenAI DALL-E or configure another image generation provider.');
}

// HuggingFace (Flux / Stable Diffusion) text-to-image generation
async function generateWithHuggingFace(
  prompt: string,
  apiKey: string,
  model: string
): Promise<{ images: Array<{ url: string; revised_prompt?: string }> }> {
  // Only use the current router endpoint (legacy deprecated)
  const attemptEndpoints = [
    `https://router.huggingface.co/models/${model}`
  ];

  let lastError: string | null = null;
  for (let i = 0; i < attemptEndpoints.length; i++) {
    const endpoint = attemptEndpoints[i];
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'image/png'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            guidance_scale: 7,
            num_inference_steps: 30,
            // Some Flux models respond better with negative prompts minimal; keep concise.
          }
        }),
        keepalive: true
      });

      if (res.status === 503) {
        // Model loading – wait then retry same endpoint once
        console.log(`[HuggingFace] ${model} loading (503). Waiting 5s before retry...`);
        await new Promise(r => setTimeout(r, 5000));
        const warmRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'image/png'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { guidance_scale: 7, num_inference_steps: 30 }
          }),
          keepalive: true
        });
        if (!warmRes.ok) {
          let warmErr = await warmRes.text();
          lastError = warmErr;
          continue;
        }
        const warmBuf = await warmRes.arrayBuffer();
        const warmB64 = Buffer.from(warmBuf).toString('base64');
        return { images: [{ url: `data:image/png;base64,${warmB64}`, revised_prompt: prompt }] };
      }

      if (!res.ok) {
        let errText = await res.text();
        try {
          const maybeJson = JSON.parse(errText);
          errText = maybeJson.error || errText;
        } catch {}
        // If 404 Not Found, try next endpoint unless last
        if (res.status === 404) {
          console.warn(`[HuggingFace] 404 on ${endpoint}. Will try fallback if available.`);
          lastError = `404 Not Found (${endpoint})`; 
          continue;
        }
        lastError = errText || `HTTP ${res.status}`;
        continue;
      }

      // Success
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:image/png;base64,${base64}`;
      return { images: [{ url: dataUrl, revised_prompt: prompt }] };
    } catch (e: any) {
      lastError = e.message || 'Unknown fetch error';
      console.error('[HuggingFace] Exception:', lastError);
      continue;
    }
  }

  throw new Error(lastError || 'All HuggingFace endpoints failed');
}

