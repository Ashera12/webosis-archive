import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[user/preferences PUT] No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const theme = body.theme as string | undefined;
    const language = body.language as string | undefined;

    const update: any = {};
    if (theme && (theme === 'light' || theme === 'dark')) update.theme_preference = theme;
    if (language && (language === 'id' || language === 'en')) update.language_preference = language;
    if (Object.keys(update).length === 0) {
      console.warn('[user/preferences PUT] No valid preferences in body:', body);
      return NextResponse.json({ error: 'No valid preferences supplied' }, { status: 400 });
    }

    console.log('[user/preferences PUT] Updating user:', (session.user as any).id, 'with:', update);
    const { error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', (session.user as any).id);
    
    if (error) {
      console.error('[user/preferences PUT] Supabase error:', error);
      // If column doesn't exist (42703), silently succeed (backwards compatibility)
      if (error.code === '42703') {
        console.warn('[user/preferences PUT] Column does not exist, ignoring:', error.message);
        return NextResponse.json({ success: true, preferences: update, warning: 'Preferences table not fully migrated' });
      }
      throw error;
    }
    return NextResponse.json({ success: true, preferences: update });
  } catch (e: any) {
    console.error('[user/preferences PUT] Exception:', e);
    return NextResponse.json({ error: e.message || 'Failed to update preferences' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('theme_preference, language_preference')
      .eq('id', (session.user as any).id)
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, preferences: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to load preferences' }, { status: 500 });
  }
}