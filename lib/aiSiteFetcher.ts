import { supabaseAdmin } from '@/lib/supabase/server';
import { SOCIAL_MEDIA_CONFIG } from './socialMediaConfig';

// Small helper to fetch a site snapshot for AI prompts.
// Uses simple in-memory caching to avoid excessive DB reads during rapid requests.

type SiteSnapshot = {
  announcements: { title: string; excerpt: string }[];
  events: { title: string; date?: string; excerpt?: string }[];
  sekbid: { id: number; name: string; description?: string; icon?: string }[];
  contact: { email?: string; instagram?: string; phone?: string };
  members_sample: { name: string; role?: string }[];
  ketua?: string | null;
  page_content: { [key: string]: string };
  proker: { id: number; title: string; description?: string }[];
  top_gallery: { title?: string; url?: string }[];
};

const CACHE_TTL_MS = 30 * 1000; // 30 seconds
let cached: { ts: number; data: SiteSnapshot } | null = null;

function truncate(str: string | null | undefined, max = 200) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.substring(0, max) + '...';
}

export async function fetchSiteSnapshot(): Promise<SiteSnapshot> {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data;

  // Fetch announcements
  const { data: announcements } = await supabaseAdmin
    .from('announcements')
    .select('title, content')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch upcoming events
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('title, event_date, description')
    .order('event_date', { ascending: true })
    .limit(5);

  // Fetch sekbid (divisions)
  const { data: sekbid } = await supabaseAdmin
    .from('sekbid')
    .select('id, name, description, icon')
    .order('id', { ascending: true });

  // Contact info from admin_settings (best-effort)
  const { data: settings } = await supabaseAdmin
    .from('admin_settings')
    .select('key, value')
    .in('key', ['contact_email', 'contact_instagram', 'contact_phone', 'SITE_KETUA', 'SITE_VISI', 'SITE_MISI', 'SITE_ABOUT'])
    .limit(10);

  const rawEmail = settings?.find((s: any) => s.key === 'contact_email')?.value || null;
  const rawInsta = settings?.find((s: any) => s.key === 'contact_instagram')?.value || null;
  const rawPhone = settings?.find((s: any) => s.key === 'contact_phone')?.value || null;
  const rawKetua = settings?.find((s: any) => s.key === 'SITE_KETUA')?.value || null;
  const rawVisiSetting = settings?.find((s: any) => s.key === 'SITE_VISI')?.value || null;
  const rawMisiSetting = settings?.find((s: any) => s.key === 'SITE_MISI')?.value || null;
  const rawAboutSetting = settings?.find((s: any) => s.key === 'SITE_ABOUT')?.value || null;

  // Prefer admin_settings value; fall back to hardcoded config when missing
  let instagramNormalized: string | undefined = undefined;
  if (rawInsta) {
    instagramNormalized = rawInsta.trim().startsWith('@') ? rawInsta.trim() : `@${rawInsta.trim()}`;
  } else if (SOCIAL_MEDIA_CONFIG?.instagram?.username) {
    const cfg = SOCIAL_MEDIA_CONFIG.instagram.username.trim();
    instagramNormalized = cfg.startsWith('@') ? cfg : `@${cfg}`;
  }

  const contact: SiteSnapshot['contact'] = {
    email: rawEmail || undefined,
    instagram: instagramNormalized,
    phone: rawPhone || undefined
  };

  // Ambil seluruh anggota aktif (tanpa limit)
  let members: any[] | null = null;
  try {
    const selectCols = 'id, name, nama, jabatan, sekbid_id, photo_url, foto_url, role, is_active, active';
    const res = await supabaseAdmin
      .from('members')
      .select(selectCols)
      .or('is_active.eq.true,active.eq.true')
      .order('display_order', { ascending: true });
    members = res.data || null;
  } catch (e) {
    // Fallback to wildcard select if the explicit columns caused an error
    try {
      const res2 = await supabaseAdmin
        .from('members')
        .select('*')
        .eq('is_active', true);
      members = res2.data || null;
    } catch (e2) {
      members = null;
    }
  }

  // Top gallery items
  const { data: gallery } = await supabaseAdmin
    .from('gallery')
    .select('title, url')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch CMS-managed page content (visi/misi/about and other editable texts)
  const { data: pageContent } = await supabaseAdmin
    .from('page_content')
    .select('page_key, content_value, content_type, category')
    .limit(200);

  // Fetch program kerja / proker if table exists (try common names)
  let prokerData: any[] | null = null;
  try {
    const { data: p } = await supabaseAdmin.from('proker').select('id,title,description').order('id', { ascending: true }).limit(50);
    prokerData = p || null;
  } catch (e) {
    try {
      const { data: p2 } = await supabaseAdmin.from('program_kerja').select('id,title,description').order('id', { ascending: true }).limit(50);
      prokerData = p2 || null;
    } catch (e2) {
      prokerData = null;
    }
  }

  const snapshot: SiteSnapshot = {
    announcements: (announcements || []).map((a: any) => ({ title: truncate(a.title, 100), excerpt: truncate(a.content, 200) })),
    events: (events || []).map((e: any) => ({ title: truncate(e.title, 120), date: e.event_date ? new Date(e.event_date).toISOString() : undefined, excerpt: truncate(e.description, 160) })),
    sekbid: (sekbid || []).map((s: any) => ({ id: s.id, name: truncate(s.name, 80), description: truncate(s.description, 180), icon: s.icon })),
    contact,
    // seluruh anggota aktif
    members_sample: (members || []).map((m: any) => ({ name: m.name || m.nama || m.full_name || m.display_name || '', role: m.position || m.role || m.jabatan || '' })),
    ketua: null,
    page_content: (pageContent || []).reduce((acc: any, p: any) => {
      try {
        acc[p.page_key] = String(p.content_value || '');
      } catch (e) {
        // ignore
      }
      return acc;
    }, {}),
    proker: (prokerData || []).map((p: any) => ({ id: p.id, title: truncate(p.title || p.name || '', 120), description: truncate(p.description || '', 200) })),
    top_gallery: (gallery || []).map((g: any) => ({ title: truncate(g.title, 100), url: g.url }))
  };


  // Always set snapshot.ketua and snapshot.page_content['site_ketua']
  if (rawKetua) {
    snapshot.ketua = String(rawKetua);
    snapshot.page_content['site_ketua'] = String(rawKetua);
  } else {
    try {
      const { data: maybe } = await supabaseAdmin
        .from('members')
        .select('id, name, role, position, nama, jabatan')
        .or("role.ilike.%ketua%,jabatan.ilike.%ketua%")
        .limit(1);
      const found = maybe && maybe.length ? maybe[0] : null;
      if (found) {
        const leaderName = found.name || found.nama || '';
        snapshot.ketua = leaderName;
        snapshot.page_content['site_ketua'] = leaderName;
      } else {
        snapshot.ketua = null;
        snapshot.page_content['site_ketua'] = '';
      }
    } catch (e) {
      snapshot.ketua = null;
      snapshot.page_content['site_ketua'] = '';
    }
  }

  // Inject SITE_VISI / SITE_MISI / SITE_ABOUT into page_content for AI to pick up
  if (rawVisiSetting) {
    snapshot.page_content['site_visi'] = String(rawVisiSetting);
  }
  if (rawMisiSetting) {
    snapshot.page_content['site_misi'] = String(rawMisiSetting);
  }
  if (rawAboutSetting) {
    snapshot.page_content['site_about'] = String(rawAboutSetting);
  }

  cached = { ts: now, data: snapshot };
  return snapshot;
}

/**
 * Clear the in-memory snapshot cache. Use this after DB updates or via a webhook.
 */
export function clearSnapshotCache() {
  cached = null;
}

export type { SiteSnapshot };
