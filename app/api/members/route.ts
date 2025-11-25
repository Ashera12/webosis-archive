import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MembersResponseSchema, buildError, buildSuccess, MemberSchema } from '@/lib/validation';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false'; // default true

    let query = supabaseAdmin
      .from('members')
      .select('*, sekbid:sekbid_id(id, name, color, icon)');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Only get members with sekbid 1-6 OR null (tim inti: Ketua, Wakil, etc)
    // Filter out invalid sekbid (19-24, etc)
    const { data: allMembers, error } = await query.order('display_order', { ascending: true });
    
    if (error) {
      return NextResponse.json(buildError('MEMBERS_FETCH_ERROR', error.message), { status: 500 });
    }

    // Filter: only sekbid_id null (tim inti) or 1-6 (valid sekbid)
    const filteredMembers = (allMembers || []).filter((m: any) => {
      const sekbidId = m.sekbid_id;
      return sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
    });

    // Validate each member schema (non-fatal collect errors)
    const invalid: any[] = [];
    const safeMembers = filteredMembers.filter((m: any) => {
      const parsed = MemberSchema.safeParse(m);
      if (!parsed.success) {
        invalid.push({ id: m.id, issues: parsed.error.issues });
        return false;
      }
      return true;
    });

    const payload = buildSuccess('OK', { members: safeMembers });
    try {
      MembersResponseSchema.parse(payload);
    } catch (schemaErr: any) {
      return NextResponse.json(buildError('MEMBERS_SCHEMA_INVALID', 'Invalid members schema', schemaErr.issues), { status: 500 });
    }

    const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.headers.set('ETag', etag);
    if (invalid.length) {
      res.headers.set('X-Invalid-Members', String(invalid.length));
    }
    return res;
  } catch (error: any) {
    return NextResponse.json(buildError('MEMBERS_UNEXPECTED', error.message), { status: 500 });
  }
}
