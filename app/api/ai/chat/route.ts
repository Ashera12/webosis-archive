import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';
import { buildAIContext } from '@/lib/aiContext';
import { handleAdminCommand } from '@/lib/adminChatCommands';
import { getConfig } from '@/lib/adminConfig';
// Clean formatter to align chat with vision formatting (remove markdown bold etc.)
function formatCleanResponse(text: string, opts: { emphasis?: boolean } = {}): string {
  let out = text || '';
  // Strip triple and double asterisks
  out = out.replace(/\*\*\*+/g, '').replace(/\*\*([^*]+)\*\*/g, '$1');
  // Strip single asterisk italics *text*
  out = out.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2');
  // Normalize bullets
  out = out.replace(/^\s*[*•-]\s+/gm, '• ');
  // Collapse excessive blank lines
  out = out.replace(/\n{3,}/g, '\n\n');
  // Benar/Salah cleanup
  out = out.replace(/Pernyataan tersebut \*\*Benar\*\*\./g, '✓ BENAR')
           .replace(/Pernyataan tersebut \*\*Salah\*\*\./g, '✗ SALAH')
           .replace(/\(Benar\)/g, '✓').replace(/\(Salah\)/g, '✗');
  // Remove stray asterisks at line starts
  out = out.replace(/^\*+/gm, '').replace(/\*{2,}/g, '');
  if (opts.emphasis) {
    // Uppercase simple section headers (lines ending ':' up to 40 chars)
    out = out.replace(/^(\s*)([A-Za-z0-9 ]{3,40}:)$/gm, (m, sp, head) => sp + head.toUpperCase());
  }
  return out.trim();
}

// Sanitize AI output for public/anonymous users to prevent PII & sensitive leakage
interface PublicSanitizeOptions { vision?: boolean }
function sanitizePublicAI(text: string, opts: PublicSanitizeOptions = {}): string {
  if (!text) return text;
  // Skip heavy redaction for vision analysis to allow richer, accurate descriptions
  const isVision = opts.vision === true;
  let cleaned = text;
  cleaned = cleaned.replace(/https?:\/\/[^\s]*supabase\.co\/storage[^\s)]+/gi, '[media internal]');
  if (!isVision) {
    // For non-vision text we still strip potentially sensitive biometric traits
    const sensitiveBulletPatterns = [
      /•\s*Gender:[^\n]*/gi,
      /•\s*Bentuk wajah:[^\n]*/gi,
      /•\s*Warna kulit:[^\n]*/gi,
      /•\s*Gaya rambut:[^\n]*/gi,
      /•\s*Aksesoris:[^\n]*/gi,
      /•\s*Ciri khas:[^\n]*/gi,
      /•\s*Skor kemiripan:[^\n]*/gi
    ];
    for (const pat of sensitiveBulletPatterns) cleaned = cleaned.replace(pat, '');
    cleaned = cleaned.replace(/\d️⃣\s*ANALISIS[^\n]*\n?/gi, '').replace(/\d️⃣\s*BANDINGKAN[^\n]*\n?/gi, '').replace(/\d️⃣\s*VALIDASI MATCH[^\n]*\n?/gi, '').replace(/\d️⃣\s*CROSS-CHECK DATABASE[^\n]*\n?/gi, '');
  }
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  // DO NOT hide Sekbid or IG handle (public per requirement)
  // Preserve class (kelas), sekbid number, ig handle as-is
  cleaned = cleaned.replace(/[a-f0-9]{32,}/gi, '[redacted]');
  return cleaned.trim();
}

/**
 * Auto-detect AI provider based on API key format and call appropriate endpoint
 */
async function callAI(
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>,
  providerOverride?: 'openai' | 'gemini' | 'anthropic' | 'auto',
  rawQuery?: string
) {
  // Get API keys from database first, then fallback to env
  const openaiKey = await getConfig('OPENAI_API_KEY');
  const geminiKey = await getConfig('GEMINI_API_KEY');
  const anthropicKey = await getConfig('ANTHROPIC_API_KEY');
  
  // Get model preferences
  const openaiModel = await getConfig('OPENAI_MODEL') || 'gpt-4o-mini';
  let geminiModel = await getConfig('GEMINI_MODEL') || 'gemini-2.0-flash-exp';
  
  // Strip any 'models/' prefix - we'll add it in the URL builder
  geminiModel = geminiModel.replace(/^models\//, '');
  
  // Normalize to valid v1beta model names (without models/ prefix)
  const modelMap: Record<string, string> = {
    'gemini-pro': 'gemini-2.0-flash-exp',
    'gemini-1.5-pro': 'gemini-2.0-flash-exp',
    'gemini-1.5-flash': 'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest': 'gemini-2.0-flash-exp',
    'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
  };
  
  if (modelMap[geminiModel]) {
    const normalized = modelMap[geminiModel];
    if (geminiModel !== normalized) {
      console.log(`[AI] ⚠️ Normalizing ${geminiModel} to ${normalized}`);
      geminiModel = normalized;
    }
  } else {
    console.log(`[AI] ⚠️ Unknown model ${geminiModel}, using gemini-2.0-flash-exp`);
    geminiModel = 'gemini-2.0-flash-exp';
  }
  
  // Debug: Show key details (first 10 chars + length)
  console.log('[AI] Key status:', {
    openai: openaiKey ? `${openaiKey.substring(0, 10)}... (${openaiKey.length} chars)` : 'NOT SET',
    gemini: geminiKey ? `${geminiKey.substring(0, 10)}... (${geminiKey.length} chars)` : 'NOT SET',
    anthropic: anthropicKey ? `${anthropicKey.substring(0, 10)}... (${anthropicKey.length} chars)` : 'NOT SET',
  });
  
  console.log('[AI] Available providers:', {
    openai: !!openaiKey,
    gemini: !!geminiKey,
    anthropic: !!anthropicKey,
  });

  // Explicit provider override handling (single block)
  if (providerOverride) {
    console.log('[AI] Provider override requested:', providerOverride);
    const identificationQuery = !!rawQuery && /(siapa|sekbid|jabatan|ini siapa|dia siapa)/i.test(rawQuery);
    if (providerOverride === 'auto') {
      if (identificationQuery) {
        // Identification priority: OpenAI -> Gemini -> Anthropic (all providers allowed as fallback)
        console.log('[AI] Identification query detected - trying all providers in order');
        if (openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('svcacct-'))) {
          const r = await callOpenAI(messages, openaiKey, openaiModel);
          if (!('error' in r)) {
            console.log('[AI] OpenAI succeeded for identification');
            return r;
          }
          console.log('[AI] OpenAI failed, trying Gemini:', r.error);
        }
        if (geminiKey && geminiKey.startsWith('AIza')) {
          const r = await callGemini(messages, geminiKey, geminiModel);
          if (!('error' in r)) {
            console.log('[AI] Gemini succeeded for identification');
            return r;
          }
          console.log('[AI] Gemini failed, trying Anthropic as last resort:', r.error);
        }
        // Allow Anthropic as emergency fallback for identification when others fail
        if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
          console.log('[AI] Using Anthropic as emergency fallback for identification');
          return callAnthropic(messages, anthropicKey);
        }
      } else {
        // Non-identification auto priority: OpenAI -> Gemini -> Anthropic
        if (openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('svcacct-'))) {
          const r = await callOpenAI(messages, openaiKey, openaiModel);
          if (!('error' in r)) return r;
        }
        if (geminiKey && geminiKey.startsWith('AIza')) {
          const r = await callGemini(messages, geminiKey, geminiModel);
          if (!('error' in r)) return r;
        }
        if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
          return callAnthropic(messages, anthropicKey);
        }
      }
    } else if (providerOverride === 'anthropic') {
      // Only block Anthropic when explicitly selected (not auto fallback)
      if (identificationQuery) {
        console.log('[AI] ⚠️ Anthropic explicitly requested for identification - this may not work well');
      }
      if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
        return callAnthropic(messages, anthropicKey);
      }
      return { error: 'Kunci API Anthropic tidak tersedia atau format salah (harus mulai dengan sk-ant-)' };
    } else if (providerOverride === 'gemini') {
      if (geminiKey && geminiKey.startsWith('AIza')) {
        const r = await callGemini(messages, geminiKey, geminiModel);
        if ('error' in r) return r;
        return r;
      }
      return { error: 'Kunci API Gemini tidak tersedia atau format salah (harus mulai dengan AIza)' };
    } else if (providerOverride === 'openai') {
      if (openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('svcacct-') || openaiKey.startsWith('sk-proj-'))) {
        const r = await callOpenAI(messages, openaiKey, openaiModel);
        if ('error' in r) return r;
        return r;
      }
      return { error: 'Kunci API OpenAI tidak tersedia atau format salah (harus mulai dengan sk-)' };
    }
    // If we handled override but no provider succeeded, continue to normal priority below
  }

  // Normal priority order (Gemini -> OpenAI -> Anthropic) with proper fallback
  if (geminiKey && geminiKey.startsWith('AIza')) {
    console.log('[AI] ✅ Trying Gemini provider');
    const geminiResult = await callGemini(messages, geminiKey, geminiModel);
    if (!('error' in geminiResult)) {
      console.log('[AI] ✅ Gemini succeeded');
      return geminiResult;
    }
    console.log('[AI] ⚠️ Gemini failed, trying next provider:', geminiResult.error);
  } else if (geminiKey) {
    console.log('[AI] ⚠️ Gemini key exists but does not start with "AIza":', geminiKey.substring(0, 15));
  }
  
  if (openaiKey && (openaiKey.startsWith('sk-') || openaiKey.startsWith('sk-proj-'))) {
    console.log('[AI] ✅ Trying OpenAI provider');
    const openaiResult = await callOpenAI(messages, openaiKey, openaiModel);
    if (!('error' in openaiResult)) {
      console.log('[AI] ✅ OpenAI succeeded');
      return openaiResult;
    }
    console.log('[AI] ⚠️ OpenAI failed, trying next provider:', openaiResult.error);
  } else if (openaiKey) {
    console.log('[AI] ⚠️ OpenAI key exists but invalid format:', openaiKey.substring(0, 15));
  }
  
  if (anthropicKey && anthropicKey.startsWith('sk-ant-')) {
    console.log('[AI] ✅ Using Anthropic provider (last resort)');
    return callAnthropic(messages, anthropicKey);
  } else if (anthropicKey) {
    console.log('[AI] ⚠️ Anthropic key exists but does not start with "sk-ant-":', anthropicKey.substring(0, 15));
  }

  // No valid API key found
  console.error('[AI] ❌ No valid API key found. All providers unavailable.');
  return { 
    error: 'AI provider is not configured. Please set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY in admin settings.' 
  };
}

async function callOpenAI(
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>,
  apiKey: string,
  model: string = 'gpt-4o-mini'
) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('[OpenAI] Error:', json);
    return { error: json?.error?.message || 'OpenAI API error' };
  }
  const text = json?.choices?.[0]?.message?.content || '';
  return { text };
}

async function callGemini(
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>,
  apiKey: string,
  model: string = 'gemini-1.5-flash'
) {
  // Normalize model name - ensure it has models/ prefix but not duplicated
  let geminiModel = model.trim();
  // Strip any leading 'models/' for internal handling; we'll add exactly once in URL
  geminiModel = geminiModel.replace(/^models\//, '');
  
  // Convert OpenAI format to Gemini format
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');
  
  // Gemini format: parts array with text
  const contents = conversationMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  // Prepend system prompt to first user message if exists
  if (systemPrompt && contents.length > 0 && contents[0].role === 'user') {
    contents[0].parts[0].text = `${systemPrompt}\n\n${contents[0].parts[0].text}`;
  }

  const buildUrl = (m: string) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
  let attemptModel = geminiModel;
  let url = buildUrl(attemptModel);
  console.log('[Gemini] Attempting model:', attemptModel);
  console.log('[Gemini] Request URL:', url);

  // Retry logic for network errors (ECONNRESET, timeout, etc.)
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Gemini] Attempt ${attempt}/${maxRetries}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      let res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('[Gemini] Response status:', res.status, res.statusText);
      console.log('[Gemini] Response headers:', Object.fromEntries(res.headers.entries()));
      
      const responseText = await res.text();
      console.log('[Gemini] Response body:', responseText);
      
      if (!responseText) {
        if (res.status === 404) {
          console.error('[Gemini] 404 empty body - model or endpoint not found for', attemptModel);
          // Fallback strategy: try gemini-1.5-pro-latest as stable alternative
          const altModel = attemptModel === 'gemini-2.0-flash-exp' ? 'gemini-1.5-pro-latest' : 'gemini-2.0-flash-exp';
          if (altModel !== attemptModel) {
            console.log('[Gemini] Retrying with alternate model:', altModel);
            attemptModel = altModel;
            url = buildUrl(attemptModel);
            
            const altController = new AbortController();
            const altTimeoutId = setTimeout(() => altController.abort(), 30000);
            
            res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents,
                generationConfig: { temperature: 0.2, topP: 0.8, topK: 40, maxOutputTokens: 2048 },
              }),
              signal: altController.signal,
            });
            
            clearTimeout(altTimeoutId);
            const altText = await res.text();
            console.log('[Gemini] Alt model response status:', res.status);
            if (res.status === 200 && altText) {
              let altJson: any;
              try { altJson = JSON.parse(altText); } catch { return { error: 'Gemini alt model JSON parse error' }; }
              const altReply = altJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (altReply) return { text: altReply };
                return { error: 'Gemini alt model tidak mengembalikan teks jawaban.' };
            }
          }
          return { error: 'Gemini 404: model/endpoint tidak ditemukan setelah fallback. Model tersedia: gemini-2.0-flash-exp, gemini-1.5-pro-latest' };
        }
        console.error('[Gemini] Empty response body');
        return { error: 'Gemini API response kosong. Pastikan API aktif & kuota tersedia.' };
      }

      let json;
      try {
        json = JSON.parse(responseText);
      } catch (e) {
        console.error('[Gemini] JSON parse error:', e);
        console.error('[Gemini] Raw response:', responseText);
        return { error: 'Invalid JSON response from Gemini' };
      }

      if (!res.ok) {
        console.error('[Gemini] Error:', json);
        return { error: (json?.error?.message ? `Gemini: ${json.error.message}` : `Gemini API error status ${res.status}`) + ' | Tips: cek enable API & billing.' };
      }
      
      console.log('[Gemini] Success response:', JSON.stringify(json, null, 2));
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[Gemini] Extracted text:', text);
      if (!text) {
        return { error: 'Gemini tidak mengembalikan teks jawaban.' };
      }
      return { text };
      
    } catch (error: any) {
      lastError = error;
      const errorCode = error?.cause?.code || error?.code;
      console.error(`[Gemini] Attempt ${attempt} failed:`, {
        message: error.message,
        code: errorCode,
        cause: error.cause,
      });
      
      // Retry on network errors (ECONNRESET, ETIMEDOUT, etc.)
      if (errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const backoff = attempt * 1000; // 1s, 2s, 3s
          console.log(`[Gemini] Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        }
      }
      
      // Non-retryable error or max retries reached
      break;
    }
  }
  
  // All retries exhausted
  const errorCode = lastError?.cause?.code || lastError?.code || 'UNKNOWN';
  console.error('[Gemini] All retries failed. Last error:', lastError);
  return { 
    error: `Gemini network error (${errorCode}). ${errorCode === 'ECONNRESET' ? 'Connection reset - check network/proxy/firewall settings.' : 'Please try again later.'}` 
  };
}

async function callAnthropic(
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>,
  apiKey: string
) {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.2,
      system: systemPrompt,
      messages: conversationMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('[Anthropic] Error:', json);
    return { error: json?.error?.message || 'Anthropic API error' };
  }
  
  const text = json?.content?.[0]?.text || '';
  return { text };
}

// In-memory cache for retrieval context (2 min TTL)
let retrievalCache: { query: string; result: string; ts: number } | null = null;
const RETRIEVAL_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

// Enhanced retriever with full member-sekbid mapping and structured data
async function retrieveContext(query: string) {
  // Check cache
  const now = Date.now();
  if (retrievalCache && retrievalCache.query === query && now - retrievalCache.ts < RETRIEVAL_CACHE_TTL) {
    return retrievalCache.result;
  }

  const ctx: string[] = [];
  const q = `%${query}%`;
  try {
    // posts
    {
      const { data } = await supabaseAdmin
        .from('posts')
        .select('id,title,content,excerpt,published_at')
        .or(`title.ilike.${q},content.ilike.${q},excerpt.ilike.${q}`)
        .limit(8);
      if (data?.length) {
        ctx.push('Posts:');
        for (const p of data) {
          ctx.push(`- ${p.title} (${p.published_at || 'unpublished'})\n${(p.excerpt || p.content || '').slice(0, 400)}`);
        }
      }
    }
    // events (event_date/end_date)
    {
      const { data } = await supabaseAdmin
        .from('events')
        .select('id,title,description,location,event_date,start_date,end_date,sekbid_id,status')
        .or(`title.ilike.${q},description.ilike.${q},location.ilike.${q}`)
        .limit(8);
      if (data?.length) {
        ctx.push('Events:');
        for (const e of data) {
          const evtDate = e.event_date || e.start_date || '';
          ctx.push(`- ${e.title} @ ${e.location || '-'} (${e.status || 'unknown'}) ${evtDate}..${e.end_date || ''}\n${(e.description || '').slice(0, 400)}`);
        }
      }
    }
    // announcements
    {
      const { data } = await supabaseAdmin
        .from('announcements')
        .select('id,title,content,priority,expires_at,created_at')
        .or(`title.ilike.${q},content.ilike.${q}`)
        .limit(8);
      if (data?.length) {
        ctx.push('Announcements:');
        for (const a of data) {
          ctx.push(`- ${a.title} [${a.priority}] (exp: ${a.expires_at || '-'})\n${(a.content || '').slice(0, 400)}`);
        }
      }
    }
    // members (with sekbid name resolution)
    {
      const { data } = await supabaseAdmin
        .from('members')
        .select('id,name,nama,role,sekbid_id,instagram,class,quote,is_active,display_order,jabatan')
        .or(`name.ilike.${q},role.ilike.${q},quote.ilike.${q},class.ilike.${q},instagram.ilike.${q},jabatan.ilike.${q},nama.ilike.${q}`)
        .limit(50); // Increased limit for better coverage
      if (data?.length) {
        // Fetch all sekbid names for resolution
        const sekbidIds = [...new Set(data.map(m => m.sekbid_id).filter(Boolean))];
        const sekbidMap: Record<number, string> = {};
        if (sekbidIds.length) {
          const { data: sekbids } = await supabaseAdmin
            .from('sekbid')
            .select('id,name,description')
            .in('id', sekbidIds);
          (sekbids || []).forEach((s: any) => { sekbidMap[s.id] = s.name; });
        }
        ctx.push('Members (active OSIS members with sekbid mapping):');
        for (const m of data) {
          const displayName = m.name || m.nama || 'Unknown';
          const roleInfo = m.role || m.jabatan || '-';
          const sekbidName = m.sekbid_id ? (sekbidMap[m.sekbid_id] || `ID ${m.sekbid_id}`) : 'Tidak ada sekbid';
          ctx.push(`- ${displayName} | Jabatan: ${roleInfo} | Sekbid: ${sekbidName} | Aktif: ${m.is_active} | Kelas: ${m.class || '-'} | IG: ${m.instagram || '-'}`);
          if (m.quote) ctx.push(`  Quote: ${m.quote.slice(0, 200)}`);
        }
      }
    }
    // sekbid
    {
      const { data } = await supabaseAdmin
        .from('sekbid')
        .select('id,name,slug,description')
        .or(`name.ilike.${q},description.ilike.${q},slug.ilike.${q}`)
        .limit(8);
      if (data?.length) {
        ctx.push('Sekbid:');
        for (const s of data) {
          ctx.push(`- [${s.id}] ${s.name} (${s.slug})\n${(s.description || '').slice(0, 200)}`);
        }
      }
    }
    // program_kerja (proker) - align with actual columns
    {
      const { data } = await supabaseAdmin
        .from('program_kerja')
        .select('id,sekbid_id,title,description,start_date,end_date,status')
        .or(`title.ilike.${q},description.ilike.${q},status.ilike.${q}`)
        .limit(12);
      if (data?.length) {
        ctx.push('Program Kerja:');
        for (const p of data) {
          const startInfo = p.start_date || '';
          ctx.push(`- ${p.title} [${p.status}] ${startInfo}..${p.end_date || ''} sekbid:${p.sekbid_id ?? '-'}`);
          if (p.description) ctx.push(`  deskripsi: ${p.description.slice(0, 200)}`);
        }
      }
    }
    // gallery (titles only)
    {
      const { data } = await supabaseAdmin
        .from('gallery')
        .select('id,title,description,sekbid_id,event_id')
        .or(`title.ilike.${q},description.ilike.${q}`)
        .limit(8);
      if (data?.length) {
        ctx.push('Gallery:');
        for (const g of data) {
          ctx.push(`- ${g.title} (${g.sekbid_id ? 'sekbid '+g.sekbid_id : g.event_id ? 'event '+g.event_id : 'unlinked'})`);
        }
      }
    }
    // page_content
    {
      const { data } = await supabaseAdmin
        .from('page_content')
        .select('page_key,content_type,content_value,category')
        .or(`page_key.ilike.${q},content_value.ilike.${q},category.ilike.${q}`)
        .limit(12);
      if (data?.length) {
        ctx.push('Page Content:');
        for (const c of data) {
          ctx.push(`- ${c.page_key} [${c.category || 'general'}|${c.content_type}]: ${(c.content_value || '').slice(0, 300)}`);
        }
      }
    }
  } catch (e) {
    ctx.push(`Retriever error: ${(e as Error).message}`);
  }

  if (!ctx.length) {
    // Fallback: provide full structured catalog with complete member-sekbid mapping
    try {
      const { fetchSiteSnapshot } = await import('@/lib/aiSiteFetcher');
      const snap = await fetchSiteSnapshot();
      ctx.push('=== COMPLETE OSIS DATABASE (Real-time snapshot) ===');
      
      // All Sekbid
      if (snap.sekbid?.length) {
        ctx.push('\n📚 SEKBID (Seksi Bidang):');
        snap.sekbid.forEach(s => ctx.push(`  [${s.id}] ${s.name}${s.description ? ': '+s.description : ''}`));
      }
      
      // All Members with Sekbid mapping
      if (snap.members_sample?.length) {
        ctx.push(`\n👥 ANGGOTA OSIS (${snap.members_sample.length} total):`);
        // Fetch all members with sekbid_id
        const { data: allMembers } = await supabaseAdmin
          .from('members')
          .select('id,name,nama,role,jabatan,sekbid_id,class,is_active')
          .or('is_active.eq.true,active.eq.true')
          .order('display_order', { ascending: true })
          .limit(200);
        
        if (allMembers?.length) {
          // Build sekbid map
          const sekbidIds = [...new Set(allMembers.map(m => m.sekbid_id).filter(Boolean))];
          const sekbidMap: Record<number, string> = {};
          if (sekbidIds.length && snap.sekbid) {
            snap.sekbid.forEach(s => { if (s.id) sekbidMap[s.id] = s.name; });
          }
          
          allMembers.forEach((m, i) => {
            const name = m.name || m.nama || 'Unknown';
            const role = m.role || m.jabatan || '-';
            const sekbid = m.sekbid_id ? (sekbidMap[m.sekbid_id] || `Sekbid ID ${m.sekbid_id}`) : 'Belum ada sekbid';
            ctx.push(`  ${i+1}. ${name} | ${role} | Sekbid: ${sekbid} | Kelas: ${m.class || '-'}`);
          });
        } else {
          snap.members_sample.forEach((m, i) => ctx.push(`  ${i+1}. ${m.name}${m.role ? ' ('+m.role+')' : ''}`));
        }
      }
      
      if (snap.events?.length) {
        ctx.push('\n📅 UPCOMING EVENTS:');
        snap.events.forEach(e => ctx.push(`  - ${e.title} ${e.date || ''}`));
      }
      if (snap.announcements?.length) {
        ctx.push('\n📢 ANNOUNCEMENTS:');
        snap.announcements.forEach(a => ctx.push(`  - ${a.title}`));
      }
      if (snap.proker?.length) {
        ctx.push('\n🎯 PROGRAM KERJA:');
        snap.proker.forEach(p => ctx.push(`  - ${p.title}`));
      }
    } catch (e2) {
      ctx.push('No direct matches found. Database snapshot unavailable.');
    }
  }

  const result = ctx.join('\n');
  // Cache result
  retrievalCache = { query, result, ts: now };
  return result;
}

// Enhanced fact-checker for member sekbid claims with strict validation
function factCheckMemberSekbid(knowledge: string, answer: string): string {
  try {
    const lines = knowledge.split(/\n/);
    interface MemberInfo { name: string; sekbid: string; sekbidId?: number; role?: string; kelas?: string; }
    const members: MemberInfo[] = [];
    let current: MemberInfo | null = null;
    
    for (const line of lines) {
      const nameMatch = line.match(/NAMA:\s*(.+)/i) || line.match(/^\s*\d+\.\s*([^|]+)\|/);
      if (nameMatch) {
        if (current) members.push(current);
        const raw = nameMatch[1].trim();
        current = { name: raw, sekbid: '', sekbidId: undefined };
        continue;
      }
      if (current) {
        const sekMatch = line.match(/Sekbid:?\s*(Sekbid\s*\d+)/i);
        if (sekMatch) {
          current.sekbid = sekMatch[1].trim();
          const numMatch = sekMatch[1].match(/\d+/);
          if (numMatch) current.sekbidId = parseInt(numMatch[0]);
        }
        const roleMatch = line.match(/Jabatan\/Role:\s*(.+)/i);
        if (roleMatch && !current.role) current.role = roleMatch[1].trim();
      }
    }
    if (current) members.push(current);

    if (!members.length) return answer; // nothing to check

    let corrected = answer;
    let modified = false;
    let foundMember: MemberInfo | null = null;
    
    // Check if answer mentions any member name
    for (const m of members) {
      if (!m.name) continue;
      const namePattern = new RegExp(m.name.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'), 'i');
      if (namePattern.test(answer)) {
        foundMember = m;
        break;
      }
    }
    
    if (foundMember) {
      // Validate sekbid number
      const claimedSekbid = answer.match(/Sekbid\s*(\d+)/i);
      if (claimedSekbid && foundMember.sekbidId) {
        const claimedNum = parseInt(claimedSekbid[1]);
        const allowedSekbid = new Set([1,2,3,4,5,6]);
        if (claimedNum !== foundMember.sekbidId || !allowedSekbid.has(claimedNum)) {
          const replacement = allowedSekbid.has(foundMember.sekbidId) ? `Sekbid ${foundMember.sekbidId}` : 'Sekbid tidak valid';
          console.warn(`[Fact-Check] ⚠️ KOREKSI: ${foundMember.name} klaim sekbid ${claimedNum} → ${replacement}`);
          corrected = corrected.replace(/Sekbid\s*\d+/gi, replacement);
          modified = true;
        }
        // Collapse multi-sekbid hallucinations like "Sekbid 5 dan 23"
        corrected = corrected.replace(/Sekbid\s*(\d+)\s*(dan|&|,|\/)+\s*\d+/gi, (full, first) => {
          const num = parseInt(first);
          return allowedSekbid.has(num) ? `Sekbid ${num}` : 'Sekbid tidak valid';
        });
      }
      
      // Validate role/jabatan if mentioned
      if (foundMember.role && /jabatan|role/i.test(answer)) {
        const rolePattern = new RegExp(foundMember.role.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'), 'i');
        if (!rolePattern.test(answer)) {
          console.warn(`[Fact-Check] ⚠️ Role mismatch for ${foundMember.name}`);
          // Don't auto-correct role as it's complex, but flag it
        }
      }
    } else {
      // AI mentioned a name not in database - REJECT
      const suspectedName = answer.match(/(?:bernama|adalah|yaitu|ini adalah)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (suspectedName) {
        const mentioned = suspectedName[1];
        const exists = members.some(m => new RegExp(mentioned.replace(/[-\/\\^$*+?.()|[\]{}]/g,'\\$&'), 'i').test(m.name));
        if (!exists) {
          console.error(`[Fact-Check] ❌ HALLUCINATION DETECTED: Name "${mentioned}" not in database!`);
          return `⚠️ Maaf, saya tidak dapat mengidentifikasi orang ini dengan pasti berdasarkan database anggota OSIS yang tersedia. Mohon periksa kembali atau hubungi admin untuk informasi lebih lanjut.\n\n(Debug: AI mencoba menyebutkan nama yang tidak ada di database - jawaban ditolak untuk mencegah informasi yang salah)`;
        }
      }
    }
    
    if (modified) {
      corrected += '\n\n✅ (Informasi sekbid telah diverifikasi dan dikoreksi otomatis berdasarkan database)';
    }
    return corrected;
  } catch (e) {
    console.warn('[AI] Fact-checker error:', (e as Error).message);
    return answer;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { messages: incomingMessages, history, reset = false, sessionId, mode: requestMode, provider, emphasis = false } = body || {};
    // Chat history continuity support
    let baseMessages: Array<{ role: string; content: string }> = Array.isArray(history) ? history : (incomingMessages || []);
    if (reset) {
      // Preserve only the earliest system message if provided
      const firstSystem = baseMessages.find(m => m.role === 'system');
      baseMessages = firstSystem ? [firstSystem] : [];
    }
    const lastUser = [...baseMessages].reverse().find((m: any) => m.role === 'user');
    const userQuery: string = lastUser?.content || '';
    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    const mode: 'admin' | 'public' = requestMode || (role && (role === 'admin' || role === 'super_admin') ? 'admin' : 'public');
    
    console.log('[/api/ai/chat] Request:', { mode, userQuery: userQuery.substring(0, 50), hasSession: !!session });
    
    const aiContext = await buildAIContext(userId ?? null, role ?? null, mode);

    // Image / media analysis command (vision) BEFORE generation & admin commands
    let isVisionAnalysis = false;
    if (typeof userQuery === 'string') {
      const analyzeMatch = userQuery.match(/^\s*\/analyze\s+(https?:\/\/\S+)(?:\s+--focus\s+(.+))?/i);
      if (analyzeMatch) {
        const imageUrl = analyzeMatch[1];
        const focusText = analyzeMatch[2]?.trim() || '';
        isVisionAnalysis = true;
        try {
          const openaiKey = await getConfig('OPENAI_API_KEY');
          const geminiKey = await getConfig('GEMINI_API_KEY');
          if (!openaiKey && !geminiKey) {
            return NextResponse.json({ reply: '❌ Vision belum dikonfigurasi. Tambahkan OPENAI_API_KEY atau GEMINI_API_KEY.' });
          }
          const visionInstructions = `Analisa foto berikut secara akurat. Fokus pada atribut NON-SENSITIF: pakaian, warna dominan, aktivitas, ekspresi umum (senang/serius), objek di sekitar, teks yang terbaca, dan konteks kegiatan. BOLEH menyebut Nama, Kelas, Sekbid, IG jika data cocok dengan database anggota yang diberikan dalam konteks (jangan menebak jika tidak pasti). Terima koreksi user jika diberikan nanti. Jangan menilai kecantikan/ketampanan atau karakter pribadi.` + (focusText ? `\nFokus tambahan pengguna: ${focusText}` : '');
          let visionReply = '';
          // Prefer Gemini for vision if available, else OpenAI
          if (geminiKey) {
            // Fetch image and encode base64
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) throw new Error('Gagal mengambil gambar untuk analisa');
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            const b64 = buf.toString('base64');
            const geminiModel = (await getConfig('GEMINI_MODEL')) || 'gemini-2.0-flash-exp';
            const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel.replace(/^models\//,'')}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  { role: 'user', parts: [ { text: visionInstructions }, { inline_data: { mime_type: contentType, data: b64 } } ] }
                ],
                generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
              })
            });
            const gemJson = await gemRes.json();
            if (!gemRes.ok) throw new Error(gemJson?.error?.message || 'Gemini vision error');
            visionReply = gemJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else if (openaiKey) {
            // OpenAI vision
            const model = (await getConfig('OPENAI_MODEL')) || 'gpt-4o-mini';
            const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
              body: JSON.stringify({
                model,
                temperature: 0.2,
                messages: [
                  { role: 'user', content: [
                    { type: 'text', text: visionInstructions },
                    { type: 'image_url', image_url: { url: imageUrl } }
                  ] }
                ]
              })
            });
            const oaiJson = await oaiRes.json();
            if (!oaiRes.ok) throw new Error(oaiJson?.error?.message || 'OpenAI vision error');
            visionReply = oaiJson?.choices?.[0]?.message?.content || '';
          }
          return NextResponse.json({ reply: formatCleanResponse(visionReply, { emphasis }), vision: true, analyzed: true });
        } catch (err: any) {
          return NextResponse.json({ reply: `❌ Vision error: ${err.message}` });
        }
      }
    }

    // Image generation command (both admin and public) - MUST BE BEFORE admin commands
    // Supports: /generate <prompt> [--ref <url>]
    if (typeof userQuery === 'string') {
      const generateMatch = userQuery.match(/^\s*\/generate\s+(.+)/i);
      if (generateMatch) {
        let imagePrompt = generateMatch[1].trim();
        let referenceUrl: string | null = null;
        
        // Extract reference URL if provided with --ref flag
        const refMatch = imagePrompt.match(/\s+--ref\s+(https?:\/\/[^\s]+)/i);
        if (refMatch) {
          referenceUrl = refMatch[1];
          imagePrompt = imagePrompt.replace(refMatch[0], '').trim(); // Remove --ref flag from prompt
          console.log('[Chat Image Gen] Reference URL detected:', referenceUrl);
        }
        
        try {
          const { getConfig } = await import('@/lib/adminConfig');
          const openaiKey = await getConfig('OPENAI_API_KEY');
          const geminiKey = await getConfig('GEMINI_API_KEY');
          
          if (!openaiKey && !geminiKey) {
            return NextResponse.json({ 
              reply: '❌ Fitur generasi gambar belum dikonfigurasi. Admin perlu mengatur OPENAI_API_KEY atau GEMINI_API_KEY di pengaturan.', 
              error: 'No API key' 
            });
          }
          
          let imageUrl: string | null = null;
          let revisedPrompt: string | null = null;
          let usedProvider = '';
          const errors: string[] = [];
          
          // Fetch reference image if URL provided
          let referenceImageBase64: string | null = null;
          let referenceImageMimeType: string | null = null;
          if (referenceUrl) {
            try {
              const refRes = await fetch(referenceUrl);
              if (!refRes.ok) {
                return NextResponse.json({ 
                  reply: `❌ Gagal mengambil gambar referensi: ${refRes.statusText}` 
                });
              }
              const contentType = refRes.headers.get('content-type');
              if (!contentType?.startsWith('image/')) {
                return NextResponse.json({ 
                  reply: '❌ URL referensi harus mengarah ke gambar' 
                });
              }
              const buffer = await refRes.arrayBuffer();
              referenceImageBase64 = Buffer.from(buffer).toString('base64');
              referenceImageMimeType = contentType;
              console.log('[Chat Image Gen] ✅ Fetched reference image from URL');
            } catch (error: any) {
              return NextResponse.json({ 
                reply: `❌ Gagal mengambil gambar referensi: ${error.message}` 
              });
            }
          }
          
          // Try OpenAI DALL-E 3 first (only if no reference image - DALL-E doesn't support reference images)
          if (openaiKey && !referenceImageBase64) {
            try {
              const genRes = await fetch('https://api.openai.com/v1/images/generations', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openaiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'dall-e-3',
                  prompt: imagePrompt,
                  size: '1024x1024',
                  n: 1,
                  quality: 'standard',
                  response_format: 'url',
                }),
              });
              
              const genData = await genRes.json();
              if (!genRes.ok) {
                const errMsg = genData?.error?.message || 'Unknown error';
                console.error('[Chat Image Gen] DALL-E 3 Error:', errMsg);
                errors.push(`OpenAI DALL-E 3: ${errMsg}`);
                
                // Check if it's a billing/quota error - try DALL-E 2 as fallback
                const isBillingError = errMsg.toLowerCase().includes('billing') || 
                                      errMsg.toLowerCase().includes('quota') ||
                                      errMsg.toLowerCase().includes('limit') ||
                                      errMsg.toLowerCase().includes('insufficient');
                
                if (isBillingError || errMsg.toLowerCase().includes('rate')) {
                  // Try DALL-E 2 fallback (cheaper, more forgiving)
                  try {
                    console.log('[Chat Image Gen] 🔄 Trying DALL-E 2 as fallback...');
                    const dalle2Res = await fetch('https://api.openai.com/v1/images/generations', {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${openaiKey}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        model: 'dall-e-2',
                        prompt: imagePrompt,
                        size: '1024x1024',
                        n: 1,
                        response_format: 'url',
                      }),
                    });
                    
                    const dalle2Data = await dalle2Res.json();
                    if (!dalle2Res.ok) {
                      const dalle2ErrMsg = dalle2Data?.error?.message || 'Unknown error';
                      console.error('[Chat Image Gen] DALL-E 2 Error:', dalle2ErrMsg);
                      errors.push(`OpenAI DALL-E 2: ${dalle2ErrMsg}`);
                    } else {
                      imageUrl = dalle2Data.data[0]?.url;
                      revisedPrompt = dalle2Data.data[0]?.revised_prompt;
                      usedProvider = 'OpenAI DALL-E 2';
                      console.log('[Chat Image Gen] ✅ Generated with OpenAI DALL-E 2 (fallback)');
                    }
                  } catch (dalle2Error: any) {
                    const dalle2ErrMsg = dalle2Error.message || 'Unknown error';
                    console.error('[Chat Image Gen] DALL-E 2 Exception:', dalle2ErrMsg);
                    errors.push(`OpenAI DALL-E 2: ${dalle2ErrMsg}`);
                  }
                } else {
                  // Non-billing error, don't try DALL-E 2, just continue to Gemini fallback
                  console.log('[Chat Image Gen] Non-billing error, skipping DALL-E 2 fallback');
                }
              } else {
                imageUrl = genData.data[0]?.url;
                revisedPrompt = genData.data[0]?.revised_prompt;
                usedProvider = 'OpenAI DALL-E 3';
                console.log('[Chat Image Gen] ✅ Generated with OpenAI DALL-E 3');
              }
            } catch (error: any) {
              const errMsg = error.message || 'Unknown error';
              console.error('[Chat Image Gen] DALL-E 3 Exception:', errMsg);
              errors.push(`OpenAI DALL-E 3: ${errMsg}`);
            }
          }
          
          // Try HuggingFace (Flux) if OpenAI failed
          if (!imageUrl && !referenceImageBase64) {
            const huggingfaceKey = await getConfig('HUGGINGFACE_API_KEY');
            let huggingfaceModel = (await getConfig('HUGGINGFACE_MODEL')) || 'black-forest-labs/FLUX.1-schnell';
            if (!huggingfaceModel || huggingfaceModel.startsWith('hf_') || huggingfaceModel.length < 5) {
              console.warn('[Chat Image Gen] Invalid HUGGINGFACE_MODEL value; using default FLUX.1-schnell');
              huggingfaceModel = 'black-forest-labs/FLUX.1-schnell';
            }
            if (huggingfaceKey) {
              // Stronger validation: ensure model follows namespace/model pattern and not an API key mistakenly pasted.
              const modelPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
              if (!modelPattern.test(huggingfaceModel)) {
                console.warn('[Chat Image Gen] Model pattern invalid, reverting to default FLUX.1-schnell');
                huggingfaceModel = 'black-forest-labs/FLUX.1-schnell';
              }
              const hfModels = [
                huggingfaceModel,
                'black-forest-labs/FLUX.1-dev',
                'stabilityai/sdxl-turbo',
                'stabilityai/stable-diffusion-2-1'
              ];
              // HuggingFace legacy endpoint removed (api-inference deprecated) to reduce 404 noise.
              const hfEndpointsBase = [
                'https://router.huggingface.co/models/'
              ];
              let hfLastErr: string | null = null;
              
              for (const mdl of hfModels) {
                if (imageUrl) break;
                for (const epBase of hfEndpointsBase) {
                  if (imageUrl) break;
                  const ep = epBase + mdl;
                  try {
                    console.log(`[Chat Image Gen] HuggingFace attempt model ${mdl}`);
                    let hfRes = await fetch(ep, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${huggingfaceKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'image/png'
                      },
                      body: JSON.stringify({
                        inputs: imagePrompt,
                        parameters: { guidance_scale: 7, num_inference_steps: 28 }
                      }),
                      // Keep connection alive to mitigate ngrok idle disconnects
                      keepalive: true
                    });
                    
                    if (hfRes.status === 503) {
                      console.log(`[Chat Image Gen] Model ${mdl} loading. Waiting 5s...`);
                      await new Promise(r => setTimeout(r, 5000));
                      hfRes = await fetch(ep, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${huggingfaceKey}`,
                          'Content-Type': 'application/json',
                          'Accept': 'image/png'
                        },
                        body: JSON.stringify({
                          inputs: imagePrompt,
                          parameters: { guidance_scale: 7, num_inference_steps: 28 }
                        }),
                        keepalive: true
                      });
                    }
                    
                    if (hfRes.ok) {
                      const buf = await hfRes.arrayBuffer();
                      const b64 = Buffer.from(buf).toString('base64');
                      imageUrl = `data:image/png;base64,${b64}`;
                      usedProvider = `HuggingFace ${mdl.split('/').pop()}`;
                      console.log(`[Chat Image Gen] ✅ HuggingFace success ${mdl}`);
                    } else {
                      const txtFull = await hfRes.text();
                      hfLastErr = txtFull.substring(0, 200);
                      console.warn(`[Chat Image Gen] HuggingFace ${mdl} failed: ${hfLastErr}`);
                      continue;
                    }
                  } catch (epErr: any) {
                    hfLastErr = epErr.message || 'Unknown HF error';
                    console.error(`[Chat Image Gen] HuggingFace ${mdl} exception:`, hfLastErr);
                    continue;
                  }
                }
              }
              if (!imageUrl && hfLastErr) {
                errors.push(`HuggingFace: ${hfLastErr}`);
              }
            } else {
              errors.push('HuggingFace: API key not configured');
            }
          }
          
          if (!imageUrl) {
            const hasHuggingFaceError = errors.some(e => e.includes('HuggingFace: API key not configured'));
            
            let helpMessage = '❌ Gagal membuat gambar dengan semua provider.\n\n';
            
            if (hasHuggingFaceError) {
              helpMessage += '🔑 **SOLUSI CEPAT - Setup HuggingFace (GRATIS):**\n';
              helpMessage += '1. Buka https://huggingface.co/settings/tokens\n';
              helpMessage += '2. Login/daftar akun HuggingFace\n';
              helpMessage += '3. Klik "New token" → pilih type **Read**\n';
              helpMessage += '4. Copy token yang dimulai dengan `hf_...`\n';
              helpMessage += '5. Buka **Admin Settings** → tambahkan key:\n';
              helpMessage += '   ```\n   HUGGINGFACE_API_KEY=hf_your_token_here\n   ```\n';
              helpMessage += '6. **Restart server** (Ctrl+C lalu `npm run dev`)\n';
              helpMessage += '7. Coba `/generate` lagi!\n\n';
              helpMessage += '💡 *HuggingFace FLUX.1-schnell cepat dan gratis - perfect untuk testing!*\n\n';
            } else {
              helpMessage += '⚙️ **Tambahkan minimal satu API key:**\n';
              helpMessage += '• **HUGGINGFACE_API_KEY** (gratis) - https://huggingface.co/settings/tokens\n';
              helpMessage += '• **OPENAI_API_KEY** (berbayar) - https://platform.openai.com/api-keys\n\n';
            }
            
            helpMessage += `📋 **Detail Error:**\n${errors.map(e => `• ${e}`).join('\n')}`;
            
            return NextResponse.json({ 
              reply: helpMessage
            });
          }
          
          const reply = `✅ Gambar berhasil dibuat dengan ${usedProvider}!\n\nPrompt: ${imagePrompt}\n${referenceUrl ? `Referensi: ${referenceUrl}\n` : ''}${revisedPrompt ? `Prompt yang direvisi: ${revisedPrompt}\n` : ''}${imageUrl.startsWith('http') ? `URL: ${imageUrl}\n` : ''}\n\n![Generated Image](${imageUrl})`;
          
          return NextResponse.json({ 
            reply: formatCleanResponse(reply, { emphasis }), 
            imageUrl, 
            revisedPrompt,
            provider: usedProvider,
            ...(referenceUrl && { referenceUrl }),
            generated: true 
          });
        } catch (error: any) {
          console.error('[Chat Image Gen] Exception:', error);
          return NextResponse.json({ 
            reply: `❌ Terjadi kesalahan: ${error.message}` 
          });
        }
      }
    }

    // Admin slash-commands only (no direct intents)
    if (mode === 'admin' && typeof userQuery === 'string') {
      const origin = request.headers.get('origin') || request.headers.get('host') || '';
      const trimmed = userQuery.trim();
      if (trimmed.startsWith('/') || /(analisis(kan)? semua error|perbaik(i|an)? semua error)/i.test(trimmed)) {
        const cmdRes = await handleAdminCommand({ input: trimmed, sessionId: sessionId || 'browser', origin });
        return NextResponse.json({ reply: formatCleanResponse(cmdRes.text, { emphasis }), admin: true });
      }
    }

    // All queries go through AI with COMPLETE auto-learned knowledge + specific retrieval
    const { getAIKnowledge } = await import('@/lib/aiAutoLearn');
    const completeKnowledge = await getAIKnowledge(); // Full DB snapshot, auto-refreshed every 5min
    const specificContext = await retrieveContext(userQuery || ''); // Query-specific search
    
    console.log('[AI] Knowledge base size:', completeKnowledge.length, 'chars');
    console.log('[AI] Specific context size:', specificContext.length, 'chars');
    console.log('[AI] Sample knowledge (first 800 chars):', completeKnowledge.substring(0, 800));
    console.log('[AI] User query:', userQuery);
    
    // CRITICAL FIX: Inject knowledge directly into user message to force AI to read it
    // Some AI providers ignore system messages, so we prepend to user query
    const lastUserMessage = baseMessages[baseMessages.length - 1];
    const enhancedUserQuery = `[CONTEXT - YOU MUST READ THIS FIRST]
${completeKnowledge}

[ADDITIONAL CONTEXT FOR THIS QUERY]
${specificContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[USER QUESTION - ANSWER USING ONLY THE CONTEXT ABOVE]
${lastUserMessage.content}

⚠️ ATURAN KETAT - WAJIB DIIKUTI:
1. HANYA gunakan informasi dari CONTEXT di atas
2. JANGAN mengarang nama, sekbid, atau jabatan
3. Jika nama tidak ada di database, katakan "tidak ditemukan di database"
4. Sekbid HARUS sesuai dengan yang tercantum di database (Sekbid [ID])
5. Jika ragu, sebutkan kemungkinan berdasarkan data yang ada
6. VALIDASI: Setiap nama yang disebutkan HARUS ada di daftar "ANGGOTA OSIS" di atas

REMINDER: You have ALL the data above. Answer ONLY from this data. DO NOT hallucinate.`;
    
    // Build messages with enhanced user query
    // Extend system prompt with public member field policy & correction acceptance
    const memberPublicAddendum = `\n\nKebijakan Tambahan (WAJIB):\n- Data anggota berupa Nama, Kelas, Sekbid, dan IG adalah publik dalam konteks organisasi ini dan BOLEH diberikan jika ada di database.\n- Jika user memberikan koreksi yang valid (mengandung kata 'koreksi:'), TANGGAPI dengan menerima koreksi, akui kesalahan, dan perbarui jawaban secara ringkas tanpa defensif.\n- Jika data tidak ada di konteks, jawab 'tidak ditemukan dalam database'. Jangan mengarang.\n- Tunjukkan keraguan dengan kalimat: 'Perlu verifikasi lanjut' jika tidak 100% yakin.`;
    const composite = [
      { role: 'system' as const, content: aiContext.systemPrompt + memberPublicAddendum },
      ...(baseMessages.slice(0, -1) || []).map((m: any) => ({ role: m.role as 'user'|'assistant'|'system', content: m.content })),
      { role: 'user' as const, content: enhancedUserQuery },
    ];
    
    console.log('[AI] Sending', composite.length, 'messages to AI provider');

    const result = await callAI(composite, provider, userQuery);
    if ('error' in result) {
      if (aiContext.mode === 'public') {
        // Fallback: minimal reply without LLM using links
        const fallback = 'AI sementara tidak aktif. Untuk info OSIS: lihat halaman /people (Anggota), /bidang (Program Kerja), /gallery (Galeri), dan /info (Pengumuman & Event).';
        return NextResponse.json({ reply: formatCleanResponse(fallback), disabled: true });
      }
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    // Apply fact-check if query about identification / sekbid
    let finalReply = result.text;
    if (/(siapa|sekbid|jabatan|ini siapa|dia siapa)/i.test(userQuery)) {
      finalReply = factCheckMemberSekbid(completeKnowledge, finalReply);
    }
    // Privacy & safety sanitization for public/anonymous users
    if (mode === 'public') {
      finalReply = sanitizePublicAI(finalReply, { vision: false });
    }
    return NextResponse.json({ reply: formatCleanResponse(finalReply, { emphasis }), historyEnabled: true, resetApplied: reset });
  } catch (e: any) {
    console.error('[/api/ai/chat] Error:', e);
    return NextResponse.json({ 
      error: e.message || 'AI chat failed',
      reply: '❌ Maaf, terjadi kesalahan. Silakan coba lagi.'
    }, { status: 200 }); // Return 200 with error message in reply
  }
}
