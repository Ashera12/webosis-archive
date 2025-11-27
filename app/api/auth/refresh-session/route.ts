import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Force refresh session to get latest user data from DB
 * Call this after updating user role to force JWT refresh
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Session will be refreshed on next request due to updateAge: 60
    // Return current session to trigger client-side refresh
    return NextResponse.json({ 
      success: true, 
      session: {
        id: (session.user as any).id,
        email: session.user.email,
        role: (session.user as any).role,
        name: session.user.name
      },
      message: 'Session akan di-refresh pada request berikutnya. Silakan refresh halaman.' 
    });
  } catch (error) {
    console.error('[API /api/auth/refresh-session] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Gagal refresh session. Silakan logout dan login kembali.'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ 
      session: {
        id: (session.user as any).id,
        email: session.user.email,
        role: (session.user as any).role,
        name: session.user.name
      }
    });
  } catch (error) {
    console.error('[API /api/auth/refresh-session GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
