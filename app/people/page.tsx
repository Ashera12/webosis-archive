import React from 'react';
import PageEnterAnimation from '@/components/PageEnterAnimation';
import PeopleSectionsClient from '@/components/PeopleSectionsClient';
import { supabaseAdmin } from '@/lib/supabase/server';

export const revalidate = 0; // Always fetch fresh data

interface Member {
  id: number;
  name: string;
  role: string;
  photo_url?: string | null;
  sekbid?: { id: number; name: string; color?: string; icon?: string } | null;
  quote?: string | null;
  display_order?: number;
}

export default async function PeoplePage() {
  // Fetch members directly from database (same query as API)
  let members: any[] = [];
  
  try {
    const { data: rawMembers, error } = await supabaseAdmin
      .from('members')
      .select('*, sekbid:sekbid_id(id, name, color, icon)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      // Filter: only sekbid_id null (tim inti) or 1-6 (valid sekbid)
      const validMembers = (rawMembers || []).filter((m: any) => {
        const sekbidId = m.sekbid_id;
        return sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
      });

      // Transform to expected format
      members = validMembers.map((m: any) => {
        // Clean role: extract "Anggota" from "Anggota Sekbid X"
        let cleanRole = m.role || 'Anggota';
        if (/Anggota Sekbid \d+/.test(cleanRole)) {
          cleanRole = 'Anggota';
        }
        
        return {
          id: m.id || 0,
          name: m.name || 'Data Tidak Tersedia',
          position: cleanRole,
          description: m.quote || '',
          image: m.photo_url || '/images/placeholder.svg',
          department: m.sekbid?.name || undefined,
          departmentId: m.sekbid?.id ?? null,
          displayOrder: m.display_order || 0,
        };
      });
    }
  } catch (error) {
    console.error('Error fetching members:', error);
  }

  console.log('[PeoplePage] Loaded members count:', members.length);
  const sortedMembers = members.slice().sort((a, b) => {
    const aOrder = (a as any).display_order ?? (a as any).order_index ?? 0;
    const bOrder = (b as any).display_order ?? (b as any).order_index ?? 0;
    return aOrder - bOrder;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <PageEnterAnimation animation="fade">
        <section className="relative bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white py-16 sm:py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full p-5 sm:p-6 mb-6 sm:mb-8 animate-float">
                <i className="fas fa-users text-4xl sm:text-5xl lg:text-6xl" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">Anggota OSIS</h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90">Daftar anggota OSIS yang aktif</p>
            </div>
          </div>
        </section>
      </PageEnterAnimation>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <PeopleSectionsClient members={sortedMembers} />
      </div>
    </div>
  );
}
