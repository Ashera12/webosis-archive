import { NextResponse } from 'next/server';
import { logError } from '@/lib/errorMonitoring';

export async function handleApiError(
  error: any,
  request: Request,
  context?: Record<string, any>
) {
  const url = new URL(request.url);
  
  // Extract error details
  const errorMessage = error?.message || String(error);
  const errorStack = error?.stack || '';
  const statusCode = error?.statusCode || error?.status || 500;
  
  // Log to monitoring system
  try {
    await logError({
      errorType: 'api_error',
      url: url.pathname,
      method: request.method,
      statusCode,
      errorMessage,
      errorStack,
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      headers: Object.fromEntries(request.headers.entries()),
      context: {
        ...context,
        query: Object.fromEntries(url.searchParams.entries()),
      },
    });
  } catch (logErr) {
    console.error('Failed to log API error:', logErr);
  }

  // Return error response
  return NextResponse.json(
    {
      error: errorMessage,
      code: error?.code,
      statusCode,
    },
    { status: statusCode }
  );
}

export function withErrorLogging<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as Request;
      return handleApiError(error, request);
    }
  }) as T;
}
