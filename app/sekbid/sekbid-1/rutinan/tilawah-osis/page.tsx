'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function TilawahOsisPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const technicalPoints = [
        "Dilaksanakan setiap rapat OSIS",
        "Durasi 15 menit sebelum rapat dimulai",
        "Dibimbing oleh guru tahfidz",
        "Menggunakan metode tartil"
    ];

    const galleryImages = [
        {
            src: "/images/tilawah/ke-1.png",
            alt: "Tilawah OSIS Kegiatan 1",
            title: "Sesi Tilawah OSIS",
            fallback: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        },
        {
            src: "/images/tilawah/ke-2.png",
            alt: "Tilawah OSIS Kegiatan 2",
            title: "Bimbingan Guru Tahfidz",
            fallback: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        },
        {
            src: "/images/tilawah/ke-3.png",
            alt: "Tilawah OSIS Kegiatan 3",
            title: "Kegiatan Rutin OSIS",
            fallback: "https://images.unsplash.com/photo-1542816417-0983675a5c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        }
    ];

    const benefits = [
        {
            icon: "fas fa-book-quran",
            title: "Peningkatan Kualitas Bacaan",
            description: "Meningkatkan tajwid dan kelancaran membaca Al-Qur'an"
        },
        {
            icon: "fas fa-users",
            title: "Kebersamaan Spiritual",
            description: "Membangun ikatan spiritual antar anggota OSIS"
        },
        {
            icon: "fas fa-clock",
            title: "Rutinitas Positif",
            description: "Membiasakan membaca Al-Qur'an secara rutin"
        },
        {
            icon: "fas fa-heart",
            title: "Kedekatan dengan Al-Qur'an",
            description: "Menumbuhkan cinta dan kedekatan dengan kitab suci"
        }
    ];

    const features = [
        {
            icon: "fas fa-graduation-cap",
            title: "Bimbingan Profesional",
            description: "Dibimbing langsung oleh guru tahfidz berpengalaman"
        },
        {
            icon: "fas fa-stopwatch",
            title: "Efisien Waktu",
            description: "Hanya 15 menit namun memberikan manfaat maksimal"
        },
        {
            icon: "fas fa-users-cog",
            title: "Khusus Anggota OSIS",
            description: "Program eksklusif untuk pengembangan anggota OSIS"
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
            <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white py-20 overflow-hidden">
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
                            <i className="fas fa-quran text-5xl text-yellow-400"></i>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent"
                    >
                        Tilawah OSIS
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto"
                    >
                        Meningkatkan kualitas bacaan Al-Qur'an anggota OSIS SMK Informatika Fithrah Insani
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        onClick={() => scrollToSection('tujuan')}
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-4 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        <span>Pelajari Program</span>
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
                        <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Home
                        </Link>
                        <i className="fas fa-chevron-right text-xs"></i>
                        <Link href="/sekbid/sekbid-1" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Sekbid 1
                        </Link>
                        <i className="fas fa-chevron-right text-xs"></i>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">Tilawah OSIS</span>
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
                            <div className="md:w-1/2 mb-6 md:mb-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
                                <div className="relative rounded-2xl overflow-hidden shadow-lg group">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                        alt="Tujuan Program"
                                        className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
                                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                                                Tilawah Al-Qur'an OSIS
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 md:w-1/2">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                                    Tujuan Program
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                    Membuat OSIS SMA IT Fithrah Insani dalam menambah tilawah bacaan. Program ini bertujuan untuk meningkatkan kualitas bacaan Al-Qur'an para anggota OSIS serta menumbuhkan kebiasaan membaca Al-Qur'an secara rutin.
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg text-center">
                                        <i className="fas fa-book-open text-blue-600 dark:text-blue-400 text-xl mb-2"></i>
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Kualitas Bacaan</p>
                                    </div>
                                    <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg text-center">
                                        <i className="fas fa-users text-green-600 dark:text-green-400 text-xl mb-2"></i>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Anggota OSIS</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Features Section */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                            Keunggulan Program
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center hover:shadow-2xl transition-all duration-300 group"
                            >
                                <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <i className={`${feature.icon} text-blue-600 dark:text-blue-400 text-2xl`}></i>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Teknis Pelaksanaan Section */}
                <motion.section
                    id="teknis"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                        <div className="md:flex flex-row-reverse">
                            <div className="md:w-1/3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center p-8">
                                <div className="text-center">
                                    <div className="bg-white dark:bg-gray-800 rounded-full p-6 shadow-lg mb-4 mx-auto w-32 h-32 flex items-center justify-center">
                                        <i className="fas fa-calendar-check text-6xl text-green-600 dark:text-green-400"></i>
                                    </div>
                                    <p className="text-green-800 dark:text-green-300 font-semibold">Setiap Rapat OSIS</p>
                                    <p className="text-green-600 dark:text-green-400 text-sm">15 Menit</p>
                                </div>
                            </div>
                            <div className="p-8 md:w-2/3">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
                                    Teknis Pelaksanaan
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                    Tilawah OSIS dilaksanakan selama 15 menit pada saat sebelum rapat umum OSIS dimulai. Kegiatan ini dipandu oleh pembina rohani sekolah dan dibimbing oleh guru tahfidz.
                                </p>
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
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-400 mx-auto rounded-full mb-6"></div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                            Program Tilawah OSIS memberikan berbagai manfaat spiritual dan pengembangan diri
                        </p>
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
                                <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <i className={`${benefit.icon} text-blue-600 dark:text-blue-400 text-2xl`}></i>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                    id="dokumentasi"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
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
                                className="relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedImage(image.fallback)}
                            >
                                <img
                                    src={image.fallback}
                                    alt={image.alt}
                                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="text-center text-white">
                                        <i className="fas fa-search-plus text-3xl mb-2"></i>
                                        <p className="font-semibold">{image.title}</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3">
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {image.title}
                                        </p>
                                    </div>
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
                    className="text-center bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white"
                >
                    <h3 className="text-2xl md:text-3xl font-bold mb-4">
                        Mari Bergabung dalam Program Tilawah OSIS
                    </h3>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Tingkatkan kualitas bacaan Al-Qur'an Anda dan perkuat ikatan spiritual dengan sesama anggota OSIS melalui program Tilawah yang rutin dan terarah.
                    </p>
                    <Link
                        href="/sekbid/sekbid-1"
                        className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-40"
                aria-label="Kembali ke atas"
            >
                <i className="fas fa-arrow-up"></i>
            </button>
        </div>
    );
}