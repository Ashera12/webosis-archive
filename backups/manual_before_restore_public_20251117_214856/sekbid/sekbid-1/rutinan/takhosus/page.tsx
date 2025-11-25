"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TakhosusPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const technicalPoints = [
    "Kegiatan Takhosus dilaksanakan pada hari Selasa, Rabu, dan Jum'at setiap minggunya",
    "Siswa/i dengan hafalan 5 juz ke bawah difokuskan untuk menambah hafalan baru",
    "Siswa/i dengan hafalan 30 juz difokuskan untuk menguatkan dan memantapkan hafalan yang sudah ada"
  ];

  const galleryImages = [
    {
      src: "/images/takhosus/ke-1.png",
      alt: "Setor Hafalan",
      title: "Setor Hafalan",
      fallback: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      src: "/images/takhosus/ke-2.png",
      alt: "Pemantapan Hafalan",
      title: "Pemantapan Hafalan",
      fallback: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      src: "/images/takhosus/ke-3.jpg",
      alt: "Pemantapan hafalan",
      title: "Pemantapan hafalan",
      fallback: "https://images.unsplash.com/photo-1542816417-0983675a5c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    }
  ];

  const benefits = [
    {
      icon: "fas fa-book-quran",
      title: "Peningkatan Hafalan",
      description: "Membantu siswa mencapai target hafalan Al-Qur'an dengan metode yang efektif"
    },
    {
      icon: "fas fa-users",
      title: "Pembelajaran Berkelompok",
      description: "Belajar bersama dalam suasana yang kondusif dan saling mendukung"
    },
    {
      icon: "fas fa-clock",
      title: "Jadwal Terstruktur",
      description: "Program terjadwal dengan baik untuk memaksimalkan hasil pembelajaran"
    },
    {
      icon: "fas fa-trophy",
      title: "Pencapaian Target",
      description: "Membantu siswa mencapai target hafalan sesuai dengan kemampuan masing-masing"
    }
  ];

  const levels = [
    {
      title: "Hafalan 1-5 Juz",
      description: "Fokus menambah hafalan baru",
      icon: "fas fa-seedling",
      color: "green",
      target: "Menambah hafalan baru secara bertahap"
    },
    {
      title: "Hafalan 30 Juz",
      description: "Fokus menguatkan hafalan",
      icon: "fas fa-star",
      color: "blue",
      target: "Memantapkan dan menguatkan hafalan yang sudah ada"
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-800 via-green-900 to-green-950 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)] bg-[length:60px_60px]" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center items-center mb-6"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <i className="fas fa-star text-5xl text-yellow-400"></i>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent"
          >
            Program Takhosus
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto"
          >
            Mempercepat dan Menguatkan Hafalan Al-Qur'an Siswa/i
          </motion.p>
          
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onClick={() => scrollToSection('tujuan')}
            className="bg-white text-green-900 hover:bg-green-50 font-bold py-4 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>Pelajari Lebih Lanjut</span>
            <i className="fas fa-arrow-down"></i>
          </motion.button>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 fill-gray-50 dark:fill-gray-900">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"></path>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Navigation Breadcrumb */}
        <motion.nav 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Home
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <Link href="/sekbid/sekbid-1" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
              Sekbid 1
            </Link>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-green-600 dark:text-green-400 font-medium">Takhosus</span>
          </div>
        </motion.nav>

        {/* Tujuan Program Section */}
        <motion.section 
          id="tujuan" 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="md:flex">
              <div className="p-8 md:w-1/2">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full mr-4">
                    <i className="fas fa-bullseye text-blue-600 dark:text-blue-400 text-xl"></i>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Tujuan Program</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                  Menjadi fasilitator siswa/i untuk mempercepat dan menguatkan hafalannya dalam menghafal Al-Qur'an. Program ini dirancang khusus untuk membantu siswa mencapai target hafalan mereka dengan metode yang efektif dan menyenangkan.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    Hafalan Al-Qur'an
                  </span>
                  <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                    Metode Efektif
                  </span>
                  <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium">
                    Pembelajaran Terarah
                  </span>
                </div>
              </div>
              <div className="md:w-1/2 p-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
                <div className="relative rounded-2xl overflow-hidden shadow-lg group">
                  <img 
                    src="https://images.unsplash.com/photo-1542816417-0983675a5c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
                    alt="Tujuan Program" 
                    className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Level Program Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Level Program
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto rounded-full mb-6"></div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Program disesuaikan dengan tingkat hafalan masing-masing siswa untuk hasil yang optimal
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {levels.map((level, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-l-4 ${
                  level.color === 'green' ? 'border-green-500' : 'border-blue-500'
                } group`}
              >
                <div className="flex items-center mb-6">
                  <div className={`${
                    level.color === 'green' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-blue-100 dark:bg-blue-900/50'
                  } p-4 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${level.icon} ${
                      level.color === 'green' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                    } text-2xl`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {level.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{level.description}</p>
                  </div>
                </div>
                <div className={`${
                  level.color === 'green' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-blue-50 dark:bg-blue-900/30'
                } p-4 rounded-lg`}>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    <i className="fas fa-target mr-2"></i>
                    Target: {level.target}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Teknis Pelaksanaan Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="md:flex flex-row-reverse">
              <div className="p-8 md:w-2/3">
                <div className="flex items-center mb-6">
                  <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full mr-4">
                    <i className="fas fa-calendar-alt text-green-600 dark:text-green-400 text-xl"></i>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Teknis Pelaksanaan</h2>
                </div>
                <div className="space-y-4">
                  {technicalPoints.map((point, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start group"
                    >
                      <div className="flex-shrink-0 bg-green-100 dark:bg-green-800 rounded-full p-1 mr-3 mt-1 group-hover:bg-green-200 dark:group-hover:bg-green-700 transition-colors">
                        <i className="fas fa-check-circle text-green-600 dark:text-green-300 text-sm"></i>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                        {point}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg mb-4 mx-auto w-32 h-32 flex items-center justify-center">
                    <i className="fas fa-calendar-week text-4xl text-green-600 dark:text-green-400"></i>
                  </div>
                  <p className="text-green-800 dark:text-green-300 font-semibold">3x Seminggu</p>
                  <p className="text-green-600 dark:text-green-400 text-sm">Selasa, Rabu, Jumat</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Manfaat Program
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-600 to-green-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="bg-green-100 dark:bg-green-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${benefit.icon} text-green-600 dark:text-green-400 text-2xl`}></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Dokumentasi Section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-white">
            Dokumentasi Kegiatan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.03 }}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                onClick={() => setSelectedImage(image.fallback)}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={image.fallback}
                    alt={image.alt}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <i className="fas fa-search-plus text-white text-2xl"></i>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {image.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-12 text-white"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Mari Bergabung dalam Program Takhosus
          </h3>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Tingkatkan hafalan Al-Qur'an Anda dengan metode yang efektif dan bimbingan yang tepat. Bergabunglah dengan program Takhosus untuk mencapai target hafalan Anda.
          </p>
          <Link 
            href="/sekbid/sekbid-1"
            className="bg-white text-green-700 hover:bg-green-50 font-bold py-3 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Kembali ke Sekbid 1</span>
          </Link>
        </motion.section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl z-10"
            >
              <i className="fas fa-times"></i>
            </button>
            <img
              src={selectedImage}
              alt="Gallery Image"
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
        aria-label="Kembali ke atas"
      >
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );
}
