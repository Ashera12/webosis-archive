// Client-side error logging utility
// This sends errors to API endpoint instead of directly to DB

export interface ClientErrorData {
  errorType: 'runtime_error' | '404_page' | 'api_error' | 'build_error';
  url: string;
  method: string;
  statusCode: number;
  errorMessage: string;
  errorStack?: string;
  userAgent?: string;
  context?: Record<string, any>;
}

export async function logClientError(data: ClientErrorData): Promise<void> {
  try {
    // Send to API endpoint instead of direct DB access
    await fetch('/api/admin/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    // Silently fail - don't create infinite error loop
    console.error('Failed to log error:', err);
  }
}
