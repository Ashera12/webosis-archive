import { supabaseAdmin } from '@/lib/supabase/server';

export interface PageContent {
  id: number;
  page_key: string;
  content_type: 'text' | 'richtext' | 'image' | 'video';
  content_value: string;
  content_value_id?: string;
  metadata?: Record<string, unknown>;
  category?: string;
  editable_by: string[];
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: number;
  filename: string;
  original_name: string;
  url: string;
  file_type: string;
  file_size?: number;
  uploaded_by?: string;
  category?: string;
  created_at: string;
}

// Client-side cache untuk page content
let contentCache: Record<string, PageContent> = {};
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

export async function getPageContent(pageKey: string): Promise<PageContent | null> {
  // Check cache
  const now = Date.now();
  if (contentCache[pageKey] && now - cacheTimestamp < CACHE_TTL) {
    return contentCache[pageKey];
  }

  const { data, error } = await supabaseAdmin
    .from('page_content')
    .select('*')
    .eq('page_key', pageKey)
    .maybeSingle();

  if (error || !data) return null;

  // Update cache
  contentCache[pageKey] = data as PageContent;
  cacheTimestamp = now;

  return data as PageContent;
}

export async function getPageContentByCategory(category: string): Promise<PageContent[]> {
  const { data, error } = await supabaseAdmin
    .from('page_content')
    .select('*')
    .eq('category', category)
    .order('page_key');

  if (error) return [];
  return data as PageContent[];
}

export async function getAllPageContent(): Promise<PageContent[]> {
  const { data, error } = await supabaseAdmin
    .from('page_content')
    .select('*')
    .order('category, page_key');

  if (error) return [];
  return data as PageContent[];
}

export async function updatePageContent(
  pageKey: string,
  contentValue: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('page_content')
    .update({ content_value: contentValue, updated_at: new Date().toISOString() })
    .eq('page_key', pageKey);

  if (!error) {
    // Clear cache on update
    delete contentCache[pageKey];
  }

  return !error;
}

export async function createPageContent(content: Partial<PageContent>): Promise<PageContent | null> {
  const { data, error } = await supabaseAdmin
    .from('page_content')
    .insert(content)
    .select()
    .single();

  if (error) return null;
  return data as PageContent;
}

export function clearContentCache() {
  contentCache = {};
  cacheTimestamp = 0;
}
