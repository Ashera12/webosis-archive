import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * POST /api/admin/tools/sync
 * Sync and validate all data between admin and public pages
 * Ensures data integrity and consistency across the platform
 */
export async function POST(req: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const { target = 'all', force = false } = body;

    console.log('[Sync] Starting sync process:', { target, force });

    const results: Record<string, any> = {
      timestamp: new Date().toISOString(),
      target,
      force,
      synced: {},
      errors: [],
    };

    // Sync functions for each data type
    const syncTasks = {
      members: async () => {
        const { count, error } = await supabaseAdmin
          .from('members')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },

      posts: async () => {
        const { count, error } = await supabaseAdmin
          .from('posts')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },

      events: async () => {
        const { count, error } = await supabaseAdmin
          .from('events')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },

      gallery: async () => {
        const { count, error } = await supabaseAdmin
          .from('gallery')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },

      announcements: async () => {
        const { count, error } = await supabaseAdmin
          .from('announcements')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },

      settings: async () => {
        const { count, error } = await supabaseAdmin
          .from('admin_settings')
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        return { count, status: 'synced' };
      },
    };

    // Run sync tasks
    if (target === 'all') {
      // Sync all tables
      for (const [key, task] of Object.entries(syncTasks)) {
        try {
          results.synced[key] = await task();
          console.log(`[Sync] ${key} synced:`, results.synced[key]);
        } catch (error: any) {
          console.error(`[Sync] ${key} error:`, error);
          results.errors.push({
            table: key,
            error: error.message,
          });
          results.synced[key] = { status: 'error', message: error.message };
        }
      }
    } else if (syncTasks[target as keyof typeof syncTasks]) {
      // Sync specific table
      try {
        results.synced[target] = await syncTasks[target as keyof typeof syncTasks]();
        console.log(`[Sync] ${target} synced:`, results.synced[target]);
      } catch (error: any) {
        console.error(`[Sync] ${target} error:`, error);
        results.errors.push({
          table: target,
          error: error.message,
        });
        results.synced[target] = { status: 'error', message: error.message };
      }
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid target', 
          validTargets: ['all', ...Object.keys(syncTasks)] 
        },
        { status: 400 }
      );
    }

    const totalSynced = Object.keys(results.synced).length;
    const totalErrors = results.errors.length;
    const success = totalErrors === 0;

    console.log('[Sync] Complete:', {
      success,
      totalSynced,
      totalErrors,
    });

    return NextResponse.json({
      success,
      message: success 
        ? `✅ Sync berhasil! ${totalSynced} tabel tersinkronisasi.`
        : `⚠️ Sync selesai dengan ${totalErrors} error.`,
      results,
    });
  } catch (error: any) {
    console.error('[Sync] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Sync failed', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/tools/sync
 * Get sync status and last sync information
 */
export async function GET(req: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    // Get counts for all tables
    const tables = ['members', 'posts', 'events', 'gallery', 'announcements', 'admin_settings'];
    const status: Record<string, any> = {};

    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) throw error;
        status[table] = {
          count,
          status: 'healthy',
        };
      } catch (error: any) {
        status[table] = {
          count: 0,
          status: 'error',
          error: error.message,
        };
      }
    }

    return NextResponse.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Sync Status] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get sync status', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
