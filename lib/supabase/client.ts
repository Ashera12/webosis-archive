import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Database Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'user';
  sekbid_id?: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id: string;
  sekbid_id?: number;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  slug: string;
  description?: string;
  sekbid_id: number;
  event_date: string;
  event_time?: string;
  location?: string;
  poster_url?: string;
  max_participants?: number;
  registration_deadline?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  class?: string;
  ticket_code: string;
  status: 'registered' | 'attended' | 'cancelled';
  registered_at: string;
}

export interface ProgramKerja {
  id: number;
  sekbid_id: number;
  nama: string;
  penanggung_jawab?: string;
  dasar_pemikiran?: string;
  tujuan?: string;
  waktu?: string;
  teknis?: string;
  anggaran?: string;
  evaluasi?: string;
  status: 'planned' | 'ongoing' | 'completed';
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: number;
  title: string;
  description?: string;
  image_url: string;
  event_id?: number;
  sekbid_id?: number;
  uploaded_by: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience?: string;
  published: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface Poll {
  id: number;
  question: string;
  description?: string;
  options: { id: number; text: string; votes: number }[];
  multiple_choice: boolean;
  sekbid_id?: number;
  active: boolean;
  ends_at?: string;
  created_by: string;
  created_at: string;
}

// ========== PUBLIC DATA FETCHING FUNCTIONS ==========

// PAGE CONTENT
export async function getPageContent(category?: string) {
  let query = supabase
    .from('page_content')
    .select('*')
    .order('page_key', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    // Silently handle 404 or missing table errors
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.warn('[getPageContent] page_content table not found or empty, returning empty array');
      return [];
    }
    console.error('Error fetching page content:', error);
    return [];
  }
  return data || [];
}

export async function getContentByKey(pageKey: string) {
  const { data, error } = await supabase
    .from('page_content')
    .select('*')
    .eq('page_key', pageKey)
    .single();

  if (error) {
    // Silently handle 404 or missing table errors
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.warn(`[getContentByKey] page_content table not found for key: ${pageKey}`);
      return null;
    }
    console.error(`Error fetching content for ${pageKey}:`, error);
    return null;
  }
  return data;
}

// POSTS
export async function getPublishedPosts(limit?: number) {
  // First attempt: joined query using implicit foreign key names
  // sekbid requires explicit constraint; ensure migration added posts_sekbid_id_fkey
  const baseSelect = `
      id,title,slug,excerpt,featured_image,published_at,views,status,author_id,sekbid_id,
      author:users(id,name,photo_url),
      sekbid:sekbid(id,name,nama,color,icon)
    `;
  let query = supabase
    .from('posts')
    .select(baseSelect)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  let { data, error } = await query;

  if (error || !data) {
    const flattened = `message=${error?.message || 'none'} code=${error?.code || 'none'} details=${error?.details || 'none'} hint=${error?.hint || 'none'}`;
    console.error('[Posts] Joined query failed. '+ flattened);
    if (error?.code === 'PGRST301' || error?.message?.toLowerCase().includes('permission')) {
      console.error('🔐 RLS BLOCK: Ensure SELECT policy exists on posts, users, sekbid. See FIX-ALL-RLS-ERRORS.sql Part 3.');
    } else {
      console.error('🔧 AI Suggestion: Verify table names & foreign keys posts_author_id_fkey and sekbid relationship.');
    }
    console.warn('[Posts] Falling back to base posts without joins...');

    // Fallback: select base columns only (avoid RLS on related tables)
    const { data: posts, error: baseErr } = await supabase
      .from('posts')
      .select('id,title,slug,excerpt,featured_image,author_id,sekbid_id,status,published_at,views')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit || 10);

    if (baseErr || !posts) {
      console.error('Fallback posts fetch failed:', {
        message: baseErr?.message || 'No message',
        details: baseErr?.details || 'No details',
        code: baseErr?.code || 'No code',
      });
      console.error('Possible issues: 1) posts table missing, 2) RLS policy blocking reads, 3) column mismatch');
      return [];
    }

    // Try to hydrate sekbid minimal data (best effort)
    let sekbidMap: Record<number, { id: number; name?: string; nama?: string; color?: string; icon?: string } | null> = {};
    const sekbidIds = Array.from(new Set(posts.map(p => p.sekbid_id).filter(Boolean))) as number[];
    if (sekbidIds.length) {
      const { data: sekbids } = await supabase
        .from('sekbid')
        .select('id,name,nama,color,icon')
        .in('id', sekbidIds);
      if (sekbids) {
        sekbidMap = Object.fromEntries(sekbids.map(s => [s.id, s]));
      }
    }

    // Try to hydrate authors minimal data (best effort)
    let authorMap: Record<string, { id: string; name: string; photo_url: string | null } | null> = {};
    const authorIds = Array.from(new Set(posts.map(p => p.author_id).filter(Boolean))) as string[];
    if (authorIds.length) {
      const { data: authors } = await supabase
        .from('users')
        .select('id,name,photo_url')
        .in('id', authorIds);
      if (authors) {
        authorMap = Object.fromEntries(authors.map(a => [a.id, a]));
      }
    }

    // Shape results to match UI expectation
    const shaped = posts.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      featured_image: p.featured_image ?? null,
      published_at: p.published_at,
      views: p.views ?? 0,
      author: authorMap[p.author_id] || { name: 'OSIS', photo_url: null },
      sekbid: p.sekbid_id ? (sekbidMap[p.sekbid_id] || null) : null,
    }));

    return shaped as any[];
  }
  
  // Normalize author to avoid null property access in UI components
  return (data || []).map((p: any) => ({
    ...p,
    author: p.author || { name: 'OSIS', photo_url: null }
  }));
}

export async function getPostBySlug(slug: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,slug,title,content,excerpt,featured_image,published_at,views,status,author_id,sekbid_id,
      author:users(id,name,photo_url),
      sekbid:sekbid(id,name,nama,color,icon)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error(`Error fetching post ${slug}:`, error);
    return null;
  }

  // Increment view count
  if (data) {
    await supabase
      .from('posts')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);
  }

  return data ? { ...data, author: data.author || { name: 'OSIS', photo_url: null } } : data;
}

// SEKBID
export async function getActiveSekbid() {
  const { data, error } = await supabase
    .from('sekbid')
    .select('*')
    .eq('active', true);

  if (error) {
    console.error('Error fetching sekbid:', error);
    return [];
  }

  // Sort client-side by display_order (preferred) falling back to legacy order_index
  const items = (data || []) as Array<Record<string, any>>;
  return items.slice().sort((a, b) => {
    const aOrder = a.display_order ?? a.order_index ?? 0;
    const bOrder = b.display_order ?? b.order_index ?? 0;
    return aOrder - bOrder;
  });
}

// MEMBERS
export async function getActiveMembers(sekbidId?: number) {
  let query = supabase
    .from('members')
    .select(`
      *,
      sekbid(id, name, nama, color, icon)
    `)
    .eq('is_active', true)
    ;

  if (sekbidId) {
    query = query.eq('sekbid_id', sekbidId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }
  const items = (data || []) as Array<Record<string, any>>;
  return items.slice().sort((a, b) => {
    const aOrder = a.display_order ?? a.order_index ?? 0;
    const bOrder = b.display_order ?? b.order_index ?? 0;
    return aOrder - bOrder;
  });
}

export async function getCoreMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .is('sekbid_id', null)
    ;

  if (error) {
    console.error('Error fetching core members:', error);
    return [];
  }
  const items = (data || []) as Array<Record<string, any>>;
  return items.slice().sort((a, b) => {
    const aOrder = a.display_order ?? a.order_index ?? 0;
    const bOrder = b.display_order ?? b.order_index ?? 0;
    return aOrder - bOrder;
  });
}

// GALLERY
export async function getGalleryItems(limit?: number) {
  try {
    let query = supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching gallery:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Gallery fetch exception:', err);
    return [];
  }
}

// ANNOUNCEMENTS
export async function getActiveAnnouncements() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Announcements fetch exception:', err);
    return [];
  }
}

// EVENTS - Updated
export async function getUpcomingEvents(limit?: number) {
  try {
    const now = new Date().toISOString();

    // Try event_date first (normalized column)
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Events fetch exception:', err);
    return [];
  }
}

export async function getAllEvents(limit?: number) {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all events:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('All events fetch exception:', err);
    return [];
  }
}

// POLLS
export async function getActivePolls() {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .lte('created_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active polls:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Polls fetch exception:', err);
    return [];
  }
}

export async function getAllPolls() {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all polls:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('All polls fetch exception:', err);
    return [];
  }
}

