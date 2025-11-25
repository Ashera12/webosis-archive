import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;

  try {
    const body = await req.json().catch(() => ({}));
    const format = body.format || 'json'; // json or csv
    const tables = body.tables || ['members', 'events', 'gallery', 'posts', 'announcements', 'polls'];

    const exportData: Record<string, any[]> = {};

    // Fetch data from each table
    for (const table of tables) {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      if (!error && data) {
        exportData[table] = data;
      }
    }

    if (format === 'csv') {
      // Convert to CSV (simple implementation for first table)
      const firstTable = tables[0];
      const data = exportData[firstTable] || [];
      if (data.length === 0) {
        return NextResponse.json({ success: false, message: 'No data to export' }, { status: 400 });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
      ];
      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="export-${firstTable}-${Date.now()}.csv"`,
        },
      });
    }

    // Return JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="export-${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Export failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';