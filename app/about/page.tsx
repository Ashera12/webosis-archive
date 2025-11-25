"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import AnimatedSection from '@/components/AnimatedSection';
import TeamMemberModal from '@/components/TeamMemberModal';
import { useTranslation } from '@/hooks/useTranslation';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  image: string;
  description: string;
  ttl: string;
  alamat: string;
  motto: string;
}

export default function AboutPage() {
  const { t } = useTranslation();

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [coreTeam, setCoreTeam] = useState<TeamMember[] | null>(null);
  const [koordinatorSekbid, setKoordinatorSekbid] = useState<TeamMember[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Always fetch core team and koordinator sekbid from DB; show error if fetch fails
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/members?active=true');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await safeJson(res, { url: '/api/members?active=true', method: 'GET' });
        const data = json.members || [];
        // Group members by role/department
        const mapped = (data || []).map((m: any) => ({
          id: String(m.id),
          name: m.name || m.nama || 'Unknown',
          position: m.role || m.jabatan || 'Anggota',
          image: m.photo_url || m.foto_url || '/images/placeholder.svg',
          description: m.quote || m.quotes || t('about.coreDataPending'),
          ttl: m.ttl || '-',
          alamat: m.alamat || '-',
          motto: m.motto || '-',
        }));
        // Pengurus Inti: Ketua OSIS, Wakil Ketua, Sekretaris, Bendahara only
        const core = mapped.filter((m: any) => {
          const pos = (m.position || '').toLowerCase();
          return (
            pos === 'ketua osis' ||
            pos === 'wakil ketua' ||
            pos === 'sekretaris' ||
            pos === 'bendahara' ||
            pos === (t('about.positionChairman') || '').toLowerCase() ||
            pos === (t('about.positionViceChairman') || '').toLowerCase() ||
            pos === (t('about.positionSecretary') || '').toLowerCase() ||
            pos === (t('about.positionTreasurer') || '').toLowerCase()
          );
        });
        // Koordinator Sekbid: only members with position 'koordinator sekbid'
        const koordinator = mapped.filter((m: any) => {
          const pos = (m.position || '').trim().toLowerCase();
          return pos === 'koordinator sekbid' || pos === 'kepala departemen';
        });
        if (mounted) {
          setCoreTeam(core);
          setKoordinatorSekbid(koordinator);
        }
      } catch (e) {
        if (mounted) setFetchError('Gagal mengambil data anggota OSIS. Silakan coba lagi nanti.');
      }
    })();
    return () => { mounted = false; };
  }, [t]);

  const openModal = (member: TeamMember) => {
    setSelectedMember(member);
  };

  const closeModal = () => {
    setSelectedMember(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <header className="relative min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden pt-24 sm:pt-28">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-slate-900/90 z-0" />
        
        {/* Animated background elements - Behind content, below navbar */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-28 sm:top-32 left-5 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-blue-400/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="heading-primary text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-4 text-shadow-strong">
              <span className="block bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 dark:from-yellow-300 dark:via-amber-400 dark:to-yellow-500 bg-clip-text text-transparent">
                {t('about.heroTitle1')}
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-2 text-gray-200 dark:text-gray-300">
                {t('about.heroTitle2')}
              </span>
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed font-light">
            {t('about.heroSubtitle1')}
            <span className="block mt-2 text-yellow-400 font-medium">{t('about.heroSubtitle2')}</span>
          </p>

          {/* Scroll indicator */}
          <div className="mt-8 sm:mt-12 animate-bounce hidden sm:flex justify-center">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* About Section */}
        <AnimatedSection>
          <section className="mb-16 sm:mb-20 lg:mb-24">
            {/* Story Section */}
            <div className="text-center mb-12 sm:mb-16">
                <h2 className="heading-primary text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-900 dark:text-gray-100 mb-6">
                {t('about.storyTitle1')} <span className="text-yellow-600 dark:text-yellow-400">{t('about.storyTitle2')}</span>
              </h2>
              <div className="flex justify-center items-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-400 rounded-full" />
                <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
              </div>
            </div>

            <div className="relative max-w-6xl mx-auto">
              {/* Background decoration */}
              <div className="absolute -top-2 sm:-top-4 -left-2 sm:-left-4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-xl" />
              <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-xl" />
              
              <div className="relative card-gradient rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-12 card-hover border border-gray-200/50 backdrop-blur-sm">
                <div className="flex justify-center mb-8">
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4 rounded-full shadow-lg">
                    <span className="text-white text-3xl">☀️</span>
                  </div>
                </div>

                <h3 className="heading-secondary text-2xl md:text-3xl text-center text-gray-900 dark:text-gray-100 mb-8">
                  {t('about.philosophyTitle')} <span className="text-yellow-600 dark:text-yellow-400">{t('about.philosophyHighlight')}</span>
                </h3>
                
                <div className="prose prose-lg max-w-none text-center">
                  <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    {t('about.philosophyPart1')} <span className="font-bold text-yellow-600 dark:text-yellow-400">{t('about.philosophyNameHighlight')}</span> {t('about.philosophyPart2')}{' '}
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{t('about.philosophySkyHighlight')}</span>
                    {t('about.philosophyPart3')}
                  </p>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                    {t('about.philosophyDesc1')}{' '}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{t('about.philosophyLeadershipHighlight')}</span>{' '}
                    {t('about.philosophyDesc2')}
                  </p>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t('about.philosophyDesc3')}{' '}
                    <span className="font-semibold text-green-600 dark:text-green-400">{t('about.philosophyWadahHighlight')}</span>{' '}
                    {t('about.philosophyDesc4')}
                  </p>
                </div>

                {/* Decorative elements */}
                <div className="flex justify-center items-center mt-8 space-x-4">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
                </div>
              </div>
            </div>

            {/* Symbol Meaning Section */}
            <div className="mt-20">
              <div className="text-center mb-16">
                <h3 className="heading-primary text-4xl md:text-5xl text-gray-900 dark:text-gray-100 mb-6">
                  {t('about.symbolTitle1')} <span className="text-yellow-600 dark:text-yellow-400">{t('about.symbolTitle2')}</span>
                </h3>
                <div className="flex justify-center items-center space-x-4 mb-8">
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                  <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                  <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
                </div>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {t('about.symbolSubtitle')}
                </p>
              </div>

              <div className="card-gradient rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 card-hover">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="relative p-8 lg:p-12 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-amber-50">
                    <div className="text-center">
                      <img 
                        src="/images/logo-2.png" 
                        className="w-64 h-64 mx-auto object-contain drop-shadow-2xl" 
                        alt={t('navbar.logoAlt')} 
                      />
                      <p className="text-gray-600 mt-6 font-medium">{t('about.symbolLogoCaption')}</p>
                    </div>
                  </div>
                  
                  <div className="p-8 lg:p-12">
                    <h4 className="heading-secondary text-2xl lg:text-3xl text-gray-900 dark:text-gray-100 mb-8">
                      {t('about.symbolLogoTitle')}
                    </h4>
                    
                    <div className="space-y-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">💻</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolTech')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolTechDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🎓</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolEducation')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolEducationDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🌟</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolCreativity')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolCreativityDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🤝</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolCollaboration')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolCollaborationDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">🚀</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolVision')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolVisionDesc')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-xl">📖</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('about.symbolIslamic')}</h5>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {t('about.symbolIslamicDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Core Team Section (Pengurus Inti) */}
        <AnimatedSection>
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="heading-primary text-5xl md:text-6xl text-gray-900 dark:text-gray-100 mb-6">
                {t('about.coreTeamTitle1')} <span className="text-yellow-600 dark:text-yellow-400">{t('about.coreTeamTitle2')}</span>
              </h2>
              <div className="flex justify-center items-center space-x-4 mb-8">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mx-auto max-w-3xl leading-relaxed">
                {t('about.coreTeamSubtitle')}
              </p>
              <div className="mt-6 inline-block px-6 py-3 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                <p className="text-base text-yellow-800 dark:text-yellow-300 font-medium">
                  {t('about.coreTeamWarning')}
                </p>
              </div>
            </div>
            {fetchError ? (
              <div className="text-red-600 text-center font-semibold py-8">{fetchError}</div>
            ) : !coreTeam ? (
              <div className="text-center py-8">Memuat data...</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
              {coreTeam.map((member, index) => (
                <div key={member.id} className="group relative">
                  {/* Background glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300" />
                  <div className="relative card-gradient rounded-xl shadow-xl text-center h-full card-hover border border-gray-200/50 backdrop-blur-sm overflow-hidden">
                    <div className="relative w-full h-80 overflow-hidden group cursor-pointer">
                      <img 
                        src={member.image} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={member.name}
                        onClick={() => openModal(member)}
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white text-sm font-medium">{t('about.clickForDetail')}</p>
                        </div>
                      </div>
                      {/* View button */}
                      <button 
                        type="button"
                        title={`${t('about.viewProfile')} ${member.name}`}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        onClick={() => openModal(member)}
                      >
                        <span className="text-white text-2xl">👤</span>
                      </button>
                    </div>
                    <div className="p-6">
                      <h5 className="heading-secondary text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors duration-300">
                        {member.name}
                      </h5>
                      <p className="text-yellow-600 dark:text-yellow-400 font-medium mb-3 text-sm">
                        {member.position}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {member.description}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="w-8 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mx-auto opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        </AnimatedSection>

        {/* Koordinator Sekbid Section */}
        <AnimatedSection>
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="heading-primary text-5xl md:text-6xl text-gray-900 dark:text-gray-100 mb-6">
                {t('about.deptHeadsTitle1')} <span className="text-yellow-600 dark:text-yellow-400">{t('about.deptHeadsTitle2')}</span>
              </h2>
              <div className="flex justify-center items-center space-x-4 mb-8">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400 mx-auto max-w-3xl leading-relaxed">
                {t('about.deptHeadsSubtitle')}
              </p>
              <div className="mt-6 inline-block px-6 py-3 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 rounded-lg">
                <p className="text-base text-blue-800 dark:text-blue-300 font-medium">
                  {t('about.deptHeadsWarning')}
                </p>
              </div>
            </div>
            
            {fetchError ? (
              <div className="text-red-600 text-center font-semibold py-8">{fetchError}</div>
            ) : !koordinatorSekbid ? (
              <div className="text-center py-8">Memuat data...</div>
            ) : koordinatorSekbid.length === 0 ? (
              <div className="text-center py-8">Belum ada Koordinator Sekbid.</div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {koordinatorSekbid.map((member, index) => (
                <div key={member.id} className="group relative">
                  {/* Background glow with different colors */}
                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                    index === 0 ? 'from-blue-400 to-blue-600' :
                    index === 1 ? 'from-green-400 to-green-600' :
                    index === 2 ? 'from-purple-400 to-purple-600' :
                    index === 3 ? 'from-red-400 to-red-600' :
                    index === 4 ? 'from-orange-400 to-orange-600' :
                    'from-cyan-400 to-cyan-600'
                  } rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300`} />
                  
                  <div className="relative card-gradient rounded-xl shadow-xl text-center h-full card-hover border border-gray-200/50 backdrop-blur-sm overflow-hidden">
                    <div className="relative w-full h-80 overflow-hidden group cursor-pointer">
                      <img 
                        src={member.image} 
                        className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500" 
                        alt={member.name}
                        onClick={() => openModal(member)}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white text-sm font-medium">{t('about.clickForDetail')}</p>
                        </div>
                      </div>
                      
                      {/* View button */}
                      <button 
                        type="button"
                        title={`${t('about.viewProfile')} ${member.name}`}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                        onClick={() => openModal(member)}
                      >
                        <span className="text-white text-2xl">👨‍💼</span>
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <h5 className="heading-secondary text-lg font-semibold mb-2 text-gray-900 group-hover:text-yellow-700 transition-colors duration-300">
                        {member.name}
                      </h5>
                      <p className="text-yellow-600 font-medium mb-3 text-sm">
                        {member.position}
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {member.description}
                      </p>
                      
                      {/* Bottom decoration with department color */}
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <div className={`w-8 h-1 rounded-full mx-auto opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
                          index === 0 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          index === 1 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          index === 2 ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                          index === 3 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                          index === 4 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-cyan-400 to-cyan-600'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </section>
        </AnimatedSection>
      </div>

      {/* Team Member Modal */}
      {selectedMember && (
        <TeamMemberModal 
          member={selectedMember} 
          isOpen={!!selectedMember} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
}