'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FaQuran, 
  FaUserGraduate, 
  FaBook, 
  FaChartLine, 
  FaLeaf, 
  FaMobileAlt,
  FaArrowRight
} from 'react-icons/fa';
import AnimatedSection from '@/components/AnimatedSection';
import { useTranslation } from '@/hooks/useTranslation';

export default function SekbidPage() {
  const { t } = useTranslation();
  
  const sekbidData = [
    {
      id: 1,
      nama: 'Sekbid 1 - Keagamaan',
      icon: <img src="/icons/keagamaan.svg" alt="Keagamaan" className="w-12 h-12 object-contain" />,
      color: "from-green-400 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-200 dark:border-green-700",
      jumlahProker: 3,
      deskripsi: 'Membina keimanan dan ketakwaan siswa'
    },
    {
      id: 2,
      nama: 'Sekbid 2 - Kaderisasi',
      icon: <img src="/icons/kaderisasi.svg" alt="Kaderisasi" className="w-12 h-12 object-contain" />,
      color: "from-blue-400 to-indigo-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-200 dark:border-blue-700",
      jumlahProker: 4,
      deskripsi: 'Meningkatkan kedisiplinan, tanggung jawab, dan keteladanan bagi seluruh siswa dan pengurus OSIS'
    },
    {
      id: 3,
      nama: 'Sekbid 3 - Akademik',
      icon: <img src="/icons/akademik.svg" alt="Akademik" className="w-12 h-12 object-contain" />,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-200 dark:border-purple-700",
      jumlahProker: 5,
      deskripsi: 'Mengembangkan prestasi akademik dan non-akademik'
    },
    {
      id: 4,
      nama: 'Sekbid 4 - Ekonomi Kreatif',
      icon: <img src="/icons/ekonomi.svg" alt="Ekonomi Kreatif" className="w-12 h-12 object-contain" />,
      color: "from-yellow-400 to-orange-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      borderColor: "border-yellow-200 dark:border-yellow-700",
      jumlahProker: 6,
      deskripsi: 'Meningkatkan keterampilan dan jiwa wirausaha'
    },
    {
      id: 5,
      nama: 'Sekbid 5 - Kesehatan',
      icon: <img src="/icons/kesehatan.svg" alt="Kesehatan" className="w-12 h-12 object-contain" />,
      color: "from-green-400 to-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      borderColor: "border-teal-200 dark:border-teal-700",
      jumlahProker: 5,
      deskripsi: 'Menjaga kesehatan dan kelestarian lingkungan'
    },
    {
      id: 6,
      nama: 'Sekbid 6 - Kominfo',
      icon: <img src="/icons/kominfo.svg" alt="Kominfo" className="w-12 h-12 object-contain" />,
      color: "from-cyan-400 to-blue-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      borderColor: "border-cyan-200 dark:border-cyan-700",
      jumlahProker: 4,
      deskripsi: 'Kominfo / Web Development'
    }
  ];

  return (
    <main className="page-content bg-white dark:bg-gray-900 transition-colors duration-300 min-h-screen">
      <AnimatedSection>
        <section className="py-20 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
          {/* Background decorations - Behind content, below navbar */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="heading-primary text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-100 mb-6">
                {t('sekbidPage.title1')} <span className="text-yellow-600 dark:text-yellow-400">{t('sekbidPage.title2')}</span>
              </h1>
              <div className="flex justify-center items-center space-x-4 mb-8">
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-yellow-400" />
                <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-yellow-400" />
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('sekbidPage.subtitle')}
              </p>
            </div>

            {/* Sekbid Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {sekbidData.map((sekbid) => (
                <Link 
                  key={sekbid.id}
                  href={`/sekbid/sekbid-${sekbid.id}`}
                  className="group"
                >
                  <div className={`relative h-full rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 overflow-hidden border-2 ${sekbid.borderColor} ${sekbid.bgColor}`}>
                    {/* Gradient Header */}
                    <div className={`h-2 bg-gradient-to-r ${sekbid.color}`} />
                    
                    <div className="p-8">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${sekbid.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        {sekbid.icon}
                      </div>

                      {/* Sekbid Number */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">SEKBID</span>
                        <span className={`text-2xl font-bold bg-gradient-to-r ${sekbid.color} bg-clip-text text-transparent`}>
                          {sekbid.id}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                        {sekbid.nama}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                        {sekbid.deskripsi}
                      </p>

                      {/* Program Count */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {sekbid.jumlahProker} {t('sekbidPage.programWork')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 group-hover:gap-4 transition-all">
                          <span className="text-sm font-semibold">{t('sekbidPage.viewDetail')}</span>
                          <FaArrowRight className="text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Hover Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
