/**
 * Client-side error logger
 * Logs browser errors to database for AI monitoring
 */

let isLoggingEnabled = false;

export function enableErrorLogging() {
  if (isLoggingEnabled) return;
  isLoggingEnabled = true;

  // Log uncaught errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logError({
        type: 'runtime_error',
        message: event.message || 'Uncaught error',
        stack: event.error?.stack,
        url: window.location.href,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Log unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logError({
        type: 'runtime_error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        context: {
          reason: String(event.reason),
        },
      });
    });

    // Log fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof originalFetch>) => {
      try {
        const response = await originalFetch(...args);
        
        // Log API errors
        if (!response.ok && response.status >= 400) {
          const first = args[0];
          let url: string;
          if (typeof first === 'string') url = first;
          else if (first instanceof Request) url = first.url;
          else if (first instanceof URL) url = first.href;
          else url = 'unknown';
          
          // Skip logging for error logging endpoint itself
          if (!url.includes('/api/admin/errors') && !url.includes('/api/log-error')) {
            logError({
              type: 'api_error',
              message: `HTTP ${response.status}: ${response.statusText}`,
              url,
              statusCode: response.status,
              context: {
                method: args[1]?.method || 'GET',
              },
            });
          }
        }
        
        return response;
      } catch (error: any) {
        const first = args[0];
        let url: string;
        if (typeof first === 'string') url = first;
        else if (first instanceof Request) url = first.url;
        else if (first instanceof URL) url = first.href;
        else url = 'unknown';
        
        // Log network errors
        logError({
          type: 'api_error',
          message: `Network error: ${error.message}`,
          stack: error.stack,
          url,
          context: {
            method: args[1]?.method || 'GET',
          },
        });
        
        throw error;
      }
    };
  }
}

interface ErrorLogData {
  type: 'api_error' | '404_page' | 'runtime_error' | 'build_error';
  message: string;
  stack?: string;
  url?: string;
  statusCode?: number;
  context?: any;
}

async function logError(data: ErrorLogData) {
  try {
    // Avoid logging in development for minor errors
    if (process.env.NODE_ENV === 'development') {
      // Only log critical errors in dev
      if (data.statusCode && data.statusCode < 500) return;
    }

    // Send to logging endpoint
    await fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error_type: data.type,
        error_message: data.message,
        error_stack: data.stack,
        url: data.url || window.location.href,
        status_code: data.statusCode,
        user_agent: navigator.userAgent,
        context: data.context,
        method: data.context?.method,
      }),
    }).catch(() => {
      // Silently fail if logging fails
      console.error('[ClientErrorLogger] Failed to log error to server');
    });
  } catch (e) {
    // Prevent infinite loops
    console.error('[ClientErrorLogger] Error in error logger:', e);
  }
}

export function logManualError(message: string, context?: any) {
  logError({
    type: 'runtime_error',
    message,
    context,
  });
}
