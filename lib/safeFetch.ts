export async function safeJson(res: Response, context?: { url?: string; method?: string }) {
  const contentType = res.headers.get('content-type') || '';
  const method = context?.method || 'GET';
  const url = context?.url;

  // Helper to log
  const logError = async (error_message: string) => {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: 'api_error',
          error_message: error_message.slice(0, 500),
          status_code: res.status,
          url,
          method,
        }),
      }).catch(() => {});
    } catch {}
  };

  if (!contentType.includes('application/json')) {
    const raw = await res.text().catch(() => '');
    await logError(`Non-JSON response (${res.status}): ${raw}`);
    // Graceful fallback object instead of throwing SyntaxError
    return {
      __nonJson: true,
      status: res.status,
      ok: res.ok,
      snippet: raw.slice(0, 500),
      length: raw.length,
    };
  }
  try {
    return await res.json();
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    await logError(`JSON parse error (${res.status}): ${errorMsg}`);
    return {
      __parseError: true,
      status: res.status,
      ok: res.ok,
      error: errorMsg,
    };
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error_type: 'api_error',
          error_message: `HTTP ${res.status} ${res.statusText}`,
          status_code: res.status,
          url,
          method: init?.method || 'GET',
        }),
      }).catch(() => {});
    } catch {}
  }
  return res;
}
/**
 * Safe fetch wrapper with HTML response detection
 * Prevents "Unexpected token '<'" errors when server returns HTML error pages
 */

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public readonly isHtmlResponse = false,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

export async function safeFetchJSON<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  context = 'API'
): Promise<T> {
  try {
    const response = await fetch(input, init);
    const text = await response.text();

    // Detect HTML response (error pages, redirects, etc.)
    if (text.trim().startsWith('<')) {
      console.error(`[${context}] HTML response instead of JSON:`, text.substring(0, 200));
      throw new SafeFetchError(
        'Server returned HTML instead of JSON - possible error page or redirect',
        true,
        response.status
      );
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(text) as T;
      return data;
    } catch (parseError) {
      console.error(`[${context}] JSON parse error:`, parseError, 'Text:', text.substring(0, 200));
      throw new SafeFetchError(
        `Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        false,
        response.status
      );
    }
  } catch (error) {
    // Re-throw SafeFetchError as-is
    if (error instanceof SafeFetchError) {
      throw error;
    }

    // Network or fetch errors
    console.error(`[${context}] Fetch error:`, error);
    throw new SafeFetchError(
      error instanceof Error ? error.message : String(error),
      false
    );
  }
}

/**
 * Safe fetch for text responses (no JSON parsing)
 */
export async function safeFetchText(
  input: RequestInfo | URL,
  init?: RequestInit,
  context = 'API'
): Promise<string> {
  try {
    const response = await fetch(input, init);
    return await response.text();
  } catch (error) {
    console.error(`[${context}] Fetch error:`, error);
    throw new SafeFetchError(
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Check if error is a SafeFetchError with HTML response
 */
export function isHtmlResponseError(error: unknown): boolean {
  return error instanceof SafeFetchError && error.isHtmlResponse;
}

/**
 * Get user-friendly error message from SafeFetchError
 */
export function getFetchErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof SafeFetchError) {
    if (error.isHtmlResponse) {
      return 'Server error - received HTML instead of JSON. Please try again or contact support.';
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallback;
}
