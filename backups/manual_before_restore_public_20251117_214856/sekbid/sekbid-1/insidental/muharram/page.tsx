'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaImages,
  FaBullseye,
  FaStar,
  FaStarAndCrescent,
  FaCalendarDay,
  FaArrowUp,
  FaMoon,
  FaUsers,
  FaClock,
  FaMapMarkerAlt,
  FaPlay,
  FaQuoteLeft,
  FaBookOpen,
  FaHeart,
  FaLightbulb
} from 'react-icons/fa';

export default function MuharramPage() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
      
      // Update active section based on scroll position
      const sections = ['hero', 'tujuan', 'teknis', 'dokumentasi'];
      const scrollPosition = window.scrollY + 100;
      
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
          }
        }
      });
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

  const stats = [
    { icon: FaUsers, label: 'Peserta', value: '500+', color: 'text-blue-400' },
    { icon: FaClock, label: 'Durasi', value: '1 Hari', color: 'text-green-400' },
    { icon: FaMapMarkerAlt, label: 'Lokasi', value: 'SMK Informatika FI', color: 'text-purple-400' },
    { icon: FaHeart, label: 'Impact', value: 'Spiritual', color: 'text-red-400' }
  ];

  const highlights = [
    {
      icon: FaQuoteLeft,
      title: "Refleksi Spiritual",
      description: "Momen introspeksi dan perenungan makna tahun baru Hijriah",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: FaBookOpen,
      title: "Kajian Sejarah",
      description: "Pembelajaran mendalam tentang peristiwa hijrah Nabi Muhammad SAW",
      color: "from-green-500 to-green-600"
    },
    {
      icon: FaLightbulb,
      title: "Inspirasi Baru",
      description: "Motivasi untuk memulai tahun dengan semangat dan tekad baru",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className={`font-sans bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 dark:from-gray-900 dark:via-green-900 dark:to-emerald-900 min-h-screen transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {/* Enhanced Hero Section */}
      <section 
        id="hero"
        className="relative bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 text-white py-20 md:py-32 mt-16 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.85), rgba(16, 185, 129, 0.85)), url('https://images.unsplash.com/photo-1519817650390-64a93db51149?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.15)_0%,transparent_50%)] bg-[length:100px_100px] animate-pulse" />
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,255,255,0.1)_60deg,transparent_120deg)] animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Enhanced Icon Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />
              <FaMoon className="text-6xl md:text-8xl text-white relative z-10 animate-pulse group-hover:scale-110 transition-transform duration-500" />
              <FaStar className="text-3xl md:text-4xl text-yellow-300 absolute -top-3 -right-3 animate-bounce group-hover:text-yellow-200 transition-colors duration-300" />
              <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
            </div>
          </div>

          {/* Enhanced Typography */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-green-100 to-emerald-200 bg-clip-text text-transparent animate-fade-in">
              Program Kerja Muharram
            </h1>
            <p className="text-xl md:text-2xl max-w-4xl mx-auto mb-8 leading-relaxed text-green-100 animate-fade-in-delay">
              Mengisi bulan Muharram dengan kegiatan positif dan bermanfaat untuk memulai tahun Hijriah dengan penuh berkah
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <stat.icon className={`text-2xl md:text-3xl ${stat.color} mb-2 mx-auto`} />
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => scrollToSection('tujuan')}
              className="group bg-white text-green-700 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-100 transition-all duration-300 flex items-center shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
            >
              <FaBullseye className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
              <span>Tujuan Proker</span>
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaPlay className="text-sm" />
              </div>
            </button>
            <button
              onClick={() => scrollToSection('teknis')}
              className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1"
            >
              <FaCalendarAlt className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
              <span>Teknis Pelaksanaan</span>
              <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaPlay className="text-sm" />
              </div>
            </button>
          </div>
        </div>

        {/* Enhanced Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce" />
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce delay-1000" />
        <div className="absolute top-1/2 right-20 w-12 h-12 bg-white/10 rounded-full animate-bounce delay-500" />
        <div className="absolute top-20 right-1/4 w-6 h-6 bg-yellow-300/30 rounded-full animate-ping" />
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-green-300/30 rounded-full animate-pulse" />
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/sekbid/sekbid-1"
            className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors font-medium"
          >
            <FaArrowLeft className="mr-2" />
            Kembali ke Sekbid 1
          </Link>
        </div>

        {/* Program Highlights Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent mb-6">
              Keunggulan Program
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mb-6"></div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tiga aspek utama yang membuat program Muharram ini istimewa dan bermakna
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="group relative">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105">
                  <div className={`w-16 h-16 bg-gradient-to-r ${highlight.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    <highlight.icon className="text-2xl text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    {highlight.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {highlight.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Tujuan Proker Section */}
        <section id="tujuan" className="mb-20">
          <div className="flex items-center mb-12">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 w-16 mr-6 rounded-full"></div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-green-600 dark:from-gray-200 dark:to-green-400 bg-clip-text text-transparent">
              Tujuan Program
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                <div className="relative overflow-hidden rounded-3xl shadow-2xl border-4 border-white/20 dark:border-gray-700/20">
                  <img 
                    src="/images/sekbid/sekbid-1/insidental/muharram/IMG_0118.JPG" 
                    alt="Tujuan Program Muharram" 
                    className="w-full h-auto transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1519817650390-64a93db51149?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Image Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <h4 className="text-white font-semibold text-lg mb-2">Kegiatan Muharram</h4>
                    <p className="text-gray-200 text-sm">Dokumentasi persiapan program tahun baru Hijriah</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-8">
              <div className="bg-gradient-to-br from-white/90 to-green-50/90 dark:from-gray-800/90 dark:to-green-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <FaBullseye className="text-2xl text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                      Tujuan Utama
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                      Mengisi bulan Muharram dengan hal-hal yang positif dan bermanfaat bagi seluruh siswa SMK Informatika Fithrah Insani, menciptakan momentum spiritual yang bermakna.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white/90 to-purple-50/90 dark:from-gray-800/90 dark:to-purple-900/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
                <div className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <FaStar className="text-2xl text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      Nilai Tambah
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
                      Meningkatkan pemahaman siswa tentang pentingnya bulan Muharram dalam Islam serta mengembangkan kreativitas dan kepemimpinan melalui kegiatan yang bermakna.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white w-14 h-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 z-50 backdrop-blur-sm border border-white/20 group"
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
        >
          <FaArrowUp className="group-hover:-translate-y-0.5 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
        </button>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-delay {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in-delay 1s ease-out 0.3s both;
        }
        
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
