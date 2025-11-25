'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaImages,
  FaClock,
  FaHandsHelping,
  FaStar,
  FaCalendarCheck,
  FaTrophy,
  FaUsers,
  FaArrowUp,
  FaMosque
} from 'react-icons/fa';

export default function RamadhanCeriaPage() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const galleryImages = [
    {
      src: '/images/sekbid/sekbid-1/insidental/ramadhan-ceria/20250319_133332.jpg',
      title: 'Perlombaan Ikhwan',
      fallback: 'https://picsum.photos/400/300?random=1'
    },
    {
      src: '/images/sekbid/sekbid-1/insidental/ramadhan-ceria/IMG_6225.jpg',
      title: 'Pembukaan Lomba',
      fallback: 'https://picsum.photos/400/300?random=2'
    },
    {
      src: '/images/sekbid/sekbid-1/insidental/ramadhan-ceria/IMG_6239.jpg',
      title: 'Lomba MTQ',
      fallback: 'https://picsum.photos/400/300?random=3'
    }
  ];

  return (
    <div className="font-sans bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600 text-white py-16 md:py-24 mt-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1)_0%,transparent_50%)] bg-[length:80px_80px]" />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-6">
            <FaMosque className="text-5xl md:text-6xl mx-auto mb-4 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ramadhan Ceria
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 leading-relaxed">
            Mengisi Bulan Suci dengan Kegiatan Bermanfaat dan Penuh Kebahagiaan
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollToSection('teknis')}
              className="bg-white text-blue-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaCalendarAlt className="mr-2" />
              Teknis Pelaksanaan
            </button>
            <button
              onClick={() => scrollToSection('dokumentasi')}
              className="border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-900 transition duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FaImages className="mr-2" />
              Dokumentasi
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-16 h-16 bg-white/10 rounded-full animate-bounce" />
        <div className="absolute bottom-10 right-10 w-12 h-12 bg-white/10 rounded-full animate-bounce delay-1000" />
        <div className="absolute top-1/2 right-20 w-8 h-8 bg-white/10 rounded-full animate-bounce delay-500" />
      </section>

      {/* Main Content */}
      <main>
        {/* Back Button */}
        <div className="container mx-auto px-6 py-8">
          <Link
            href="/sekbid/sekbid-1"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Kembali ke Sekbid 1
          </Link>
        </div>

        {/* Tujuan Program Section */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                Tujuan Program
              </h2>
              <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                <div className="text-blue-900 dark:text-blue-400 mb-4">
                  <FaClock className="text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-300">
                  Mengisi Waktu Luang
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Memberikan alternatif kegiatan positif bagi siswa/i selama bulan Ramadhan untuk mengisi waktu luang dengan hal yang bermanfaat.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                <div className="text-blue-900 dark:text-blue-400 mb-4">
                  <FaHandsHelping className="text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-300">
                  Kebersamaan
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Mempererat ukhuwah islamiyah melalui kegiatan bersama seperti buka puasa dan kajian Islam yang dilaksanakan secara berjamaah.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                <div className="text-blue-900 dark:text-blue-400 mb-4">
                  <FaStar className="text-4xl" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-blue-900 dark:text-blue-300">
                  Pengembangan Diri
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Meningkatkan kualitas ibadah dan pengetahuan agama melalui berbagai kegiatan yang mendidik dan menyenangkan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Teknis Pelaksanaan Section */}
        <section id="teknis" className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                Teknis Pelaksanaan
              </h2>
              <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
            </div>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                    <FaCalendarCheck className="text-blue-900 dark:text-blue-400 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-900 dark:text-blue-300">
                      Waktu Pelaksanaan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Kegiatan Ramadhan Ceria dilaksanakan pada 19-21 Maret 2025, bersamaan dengan Bakti Sosial dan ULTI.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                    <FaTrophy className="text-blue-900 dark:text-blue-400 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-900 dark:text-blue-300">
                      Berbagai Kegiatan
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Program ini mencakup berbagai kegiatan seperti kajian Islam, buka puasa bersama, lomba-lomba islami, dan kegiatan kreatif lainnya yang mendidik sekaligus menyenangkan.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                    <FaUsers className="text-blue-900 dark:text-blue-400 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-blue-900 dark:text-blue-300">
                      Peserta
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Seluruh siswa/i SMA IT Fithrah Insani dapat berpartisipasi dalam kegiatan ini. Beberapa kegiatan juga melibatkan guru dan staf sekolah untuk menciptakan kebersamaan yang lebih luas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dokumentasi Section */}
        <section id="dokumentasi" className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                Dokumentasi Kegiatan
              </h2>
              <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-4">
                Berikut adalah momen-momen berharga dari pelaksanaan Ramadhan Ceria tahun sebelumnya.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 group"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.title}
                      className="w-full h-64 md:h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = image.fallback;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                      {image.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
}
