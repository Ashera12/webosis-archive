import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, provider } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Echo provider for testing
    if (provider === 'echo') {
      return NextResponse.json({
        success: true,
        response: `Echo: ${prompt}`,
        provider: 'echo',
      });
    }

    // Placeholder for AI features
    return NextResponse.json({
      success: true,
      response: 'AI features not yet fully implemented. This is a placeholder response.',
      provider: provider || 'default',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
