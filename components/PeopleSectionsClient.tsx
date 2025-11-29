"use client";

import React from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import MemberCard from '@/components/MemberCard';
import MemberStats from '@/components/MemberStats';
import { useTranslation } from '@/hooks/useTranslation';

interface MemberProp {
  id: number;
  name: string;
  position: string;
  description: string;
  image: string;
  instagram_username?: string;
  // normalize to undefined for client components
  department?: string;
  departmentId?: number | null;
}

interface Props {
  members: MemberProp[];
}

export default function PeopleSectionsClient({ members }: Props) {
  // Role-based detection (robust even if sekbid assigned):
  // Core team roles: Ketua OSIS, Wakil Ketua (OSIS), Sekretaris (1/2), Bendahara (1/2)
  const ketua = members.find(m => /^ketua(\s+osis)?$/i.test(m.position.trim())) || null;

  const isCoreTeamRole = (pos: string) => {
    const p = pos.trim().toLowerCase();
    return (
      /^ketua(\s+osis)?$/i.test(pos) ||
      /^wakil(\s+ketua(\s+osis)?)?$/i.test(pos) ||
      /^sekretaris(\s*\d+)?$/i.test(pos) ||
      /^bendahara(\s*\d+)?$/i.test(pos)
    );
  };

  // Full core team list (excluding Ketua for separate section)
  const pengurusInti = members
    .filter(m => isCoreTeamRole(m.position) && !/^ketua(\s+osis)?$/i.test(m.position))
    .sort((a,b) => a.id - b.id);

  // Koordinator Sekbid: section coordinators
  const koordinatorSekbid = members.filter(m => {
    if (!m.department) return false;
    const pos = (m.position || '').trim().toLowerCase();
    return (
      pos === 'koordinator sekbid' ||
      pos === 'kepala departemen'
    );
  });

  // Anggota Sekbid: have department but are not coordinators nor core team
  const anggotaSekbidFlat = members.filter(m => {
    return m.department &&
      !koordinatorSekbid.some(k => k.id === m.id) &&
      !isCoreTeamRole(m.position);
  });

  // Members without department and not core team (orphaned members)
  const orphanedMembers = members.filter(m => {
    return !m.department && !isCoreTeamRole(m.position);
  });

  // Group anggota per sekbid. Previously the code assumed sekbid IDs 1..6
  // which caused members with different DB IDs (e.g. id=23 but name 'sekbid-5')
  // to be omitted. Instead, detect a numeric order from the department
  // label (e.g. 'sekbid-5' or 'Sekbid 5 - Kesehatan') and use that as the
  // primary ordering key. Fallback to departmentId or raw department text.
  const anggotaNoSek: MemberProp[] = [];
  const groups = new Map<string, MemberProp[]>();
  const groupMeta = new Map<string, { order: number | null; label: string }>();

  anggotaSekbidFlat.forEach((m) => {
    const dept = m.department ?? '';
    // Try to extract a meaningful number from the department label
    const numMatch = dept.match(/(\d{1,2})/);
    const orderNum = numMatch ? Number(numMatch[1]) : null;

    let key: string;
    if (orderNum !== null && !Number.isNaN(orderNum)) {
      key = `num-${orderNum}`;
    } else if (m.departmentId) {
      key = `id-${m.departmentId}`;
    } else if (dept) {
      key = `dept-${dept}`;
    } else {
      anggotaNoSek.push(m);
      return;
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
    if (!groupMeta.has(key)) groupMeta.set(key, { order: orderNum, label: dept || `Sekbid ${m.departmentId ?? ''}` });
  });

  // Compute ordering keys and prepared JSX groups (move heavy logic out of JSX)
  const orderedKeys: string[] = [];
  for (let n = 1; n <= 6; n++) {
    const k = `num-${n}`;
    if (groups.has(k)) orderedKeys.push(k);
  }
  const otherNumKeys = Array.from(groups.keys())
    .filter(k => k.startsWith('num-') && !orderedKeys.includes(k))
    .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
  orderedKeys.push(...otherNumKeys);

  const otherKeys = Array.from(groups.keys()).filter(k => !k.startsWith('num-'));
  otherKeys.sort((a, b) => {
    const ma = groupMeta.get(a)!;
    const mb = groupMeta.get(b)!;
    return (ma.label || '').localeCompare(mb.label || '');
  });
  orderedKeys.push(...otherKeys);

  const renderGroups = orderedKeys.map((key) => {
    const group = groups.get(key) || [];
    group.sort((a, b) => {
      const aOrder = (a as any).display_order ?? 0;
      const bOrder = (b as any).display_order ?? 0;
      return aOrder - bOrder;
    });
    if (!group || group.length === 0) return null;
    const meta = groupMeta.get(key);
    const label = meta?.label ?? (group[0].department ?? key);
    return (
      <div key={`sekbid-${key}`}>
        <div className="text-center mb-6">
                          <h3 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-gray-900 dark:text-white">{label}</h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Anggota aktif</p>
                        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {group.map((member, i) => (
            <AnimatedSection key={member.id} delay={0.1 * (i + 1)} direction="up" className="scroll-reveal">
              <MemberCard member={member} delay={i * 100} />
            </AnimatedSection>
          ))}
        </div>
      </div>
    );
  });

        return (
        <>
      {/* Ketua */}
      <AnimatedSection delay={0.2} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">Ketua OSIS</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Pemimpin organisasi</p>
        </div>

        <div className="flex justify-center">
          <div className="max-w-md">
            {ketua ? <MemberCard member={ketua} isLeader delay={0} /> : (
              <div className="text-center text-gray-500">Belum ada data Ketua</div>
            )}
          </div>
        </div>
      </AnimatedSection>

      {/* Pengurus Inti */}
      <AnimatedSection delay={0.4} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">Pengurus Inti</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Tim inti organisasi (Ketua, Wakil, Sekretaris, Bendahara)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pengurusInti.map((member, i) => (
            <AnimatedSection key={member.id} delay={0.1 * (i + 1)} direction="up" className="scroll-reveal">
              <MemberCard member={member} delay={i * 100} />
            </AnimatedSection>
          ))}
        </div>
      </AnimatedSection>

      {/* Koordinator Sekbid */}
      <AnimatedSection delay={0.6} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">{useTranslation().t('peopleWarnings.deptHeadTitle')}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{useTranslation().t('peopleWarnings.deptHeadDesc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {koordinatorSekbid.map((member, i) => (
            <AnimatedSection key={member.id} delay={0.1 * (i + 1)} direction="up" className="scroll-reveal">
              <MemberCard member={member} delay={i * 100} />
            </AnimatedSection>
          ))}
        </div>
      </AnimatedSection>

      {/* Anggota Sekbid */}
      <AnimatedSection delay={0.8} className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">Anggota Seksi Bidang</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Anggota aktif per sekbid</p>
        </div>

          <div className="space-y-8">
            {renderGroups}

            {/* Orphaned members: no department and not core team */}
            {orphanedMembers.length > 0 && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Anggota Belum Ditugaskan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Member berikut belum ditugaskan ke sekbid. Silakan hubungi admin untuk penempatan.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {orphanedMembers.map((member, i) => (
                    <AnimatedSection key={member.id} delay={0.1 * (i + 1)} direction="up" className="scroll-reveal">
                      <MemberCard member={member} delay={i * 100} />
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            )}

            {/* Members with no sekbid (appear after sekbid 1..6) */}
            {anggotaNoSek.length > 0 && (
              <div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">Sekbid Lainnya</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {anggotaNoSek.map((member, i) => (
                    <AnimatedSection key={member.id} delay={0.1 * (i + 1)} direction="up" className="scroll-reveal">
                      <MemberCard member={member} delay={i * 100} />
                    </AnimatedSection>
                  ))}
                </div>
              </div>
            )}
          </div>
      </AnimatedSection>

      <AnimatedSection delay={1.0} className="scroll-reveal">
        <MemberStats />
      </AnimatedSection>
    </>
  );
}
