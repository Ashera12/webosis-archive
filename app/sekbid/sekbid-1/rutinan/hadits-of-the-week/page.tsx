'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HaditsOfTheWeekPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const scheduleItems = [
        "Setiap setelah Sholat Dzuhur",
        "Disampaikan melalui Kultum (Kuliah Tujuh Menit)",
        "Durasi 7-10 menit",
        "Setiap minggu akan ada pergantian pemateri dari setiap kelas"
    ];

    const galleryImages = [
        {
            src: "/images/hadits/1.jpg",
            alt: "Penyampaian Hadist",
            title: "Penyampaian Hadist",
            fallback: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        },
        {
            src: "/images/hadits/2.jpg",
            alt: "Setelah Sholat Dzuhur",
            title: "Setelah Sholat Dzuhur",
            fallback: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
        },
        {
            src: "/images/hadits/3.jpg",
            alt: "Oleh Siswa SMAIT Fithrah Insani",
            title: "Oleh Siswa SMK Informatika Fithrah Insani",
            fallback: "https://images.unsplash.com/photo-1542816417-0983675a5c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
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
            <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-20 overflow-hidden">
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
                            <i className="fas fa-quote-right text-5xl text-yellow-400"></i>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent"
                    >
                        Hadits Of The Week
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl md:text-2xl mb-8 text-green-100"
                    >
                        Menginspirasi melalui sabda Nabi ﷺ setiap minggu
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        onClick={() => scrollToSection('tujuan')}
                        className="bg-white text-green-700 hover:bg-green-50 font-bold py-4 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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
                        <Link href="/" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Home
                        </Link>
                        <i className="fas fa-chevron-right text-xs"></i>
                        <Link href="/sekbid/sekbid-1" className="hover:text-green-600 dark:hover:text-green-400 transition-colors">
                            Sekbid 1
                        </Link>
                        <i className="fas fa-chevron-right text-xs"></i>
                        <span className="text-green-600 dark:text-green-400 font-medium">Hadits Of The Week</span>
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
                    <div className="flex items-center mb-8">
                        <div className="h-1 bg-green-800 dark:bg-green-600 w-12 mr-4 rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Tujuan Program</h2>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 hover:shadow-2xl transition-shadow duration-300">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                                <div className="relative rounded-2xl overflow-hidden shadow-lg group">
                                    <img
                                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                                        alt="Tujuan Program Hadits"
                                        className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                                </div>
                            </div>
                            <div className="md:w-1/2">
                                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                                    Membuat OSIS SMA IT Fithrah Insani dalam menambah tilawah bacaan dan pemahaman hadits Nabi Muhammad ﷺ. Program ini bertujuan untuk membiasakan siswa dengan sunnah Nabi dan menerapkannya dalam kehidupan sehari-hari.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700 flex items-center group cursor-pointer"
                                    >
                                        <i className="fas fa-book-open text-blue-600 dark:text-blue-400 text-xl mr-3 group-hover:scale-110 transition-transform"></i>
                                        <span className="text-blue-800 dark:text-blue-300 font-medium">Pemahaman Hadits</span>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-700 flex items-center group cursor-pointer"
                                    >
                                        <i className="fas fa-heart text-green-600 dark:text-green-400 text-xl mr-3 group-hover:scale-110 transition-transform"></i>
                                        <span className="text-green-800 dark:text-green-300 font-medium">Aplikasi Sunnah</span>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
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
                    <div className="flex items-center mb-8">
                        <div className="h-1 bg-blue-600 dark:bg-blue-500 w-12 mr-4 rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Teknis Pelaksanaan</h2>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
                        <div className="flex flex-col md:flex-row items-start gap-8">
                            <div className="md:w-1/2">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl border border-blue-200 dark:border-blue-700">
                                    <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-300 mb-6 flex items-center">
                                        <i className="fas fa-calendar-alt mr-3"></i>
                                        Jadwal Kegiatan
                                    </h3>
                                    <ul className="space-y-4">
                                        {scheduleItems.map((item, index) => (
                                            <motion.li
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                viewport={{ once: true }}
                                                className="flex items-start group"
                                            >
                                                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-800 rounded-full p-1 mr-3 mt-1 group-hover:bg-blue-200 dark:group-hover:bg-blue-700 transition-colors">
                                                    <i className="fas fa-check text-blue-600 dark:text-blue-300 text-sm"></i>
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                    {item}
                                                </span>
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="md:w-1/2">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <i className="fas fa-book-quran text-green-600 dark:text-green-400 mr-3"></i>
                                    Materi Hadits
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                    Hadits yang dipilih setiap minggu mencakup berbagai aspek kehidupan, mulai dari akhlak, ibadah, muamalah, hingga motivasi belajar.
                                </p>
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-r-lg">
                                    <p className="text-yellow-800 dark:text-yellow-300 flex items-start">
                                        <i className="fas fa-info-circle mr-2 mt-1 flex-shrink-0"></i>
                                        <span>Hadits dipilih berdasarkan relevansi dengan kondisi siswa dan situasi terkini.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
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
                    <div className="flex items-center mb-8">
                        <div className="h-1 bg-blue-600 dark:bg-blue-500 w-12 mr-4 rounded-full"></div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Dokumentasi Kegiatan</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {galleryImages.map((image, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                                onClick={() => setSelectedImage(image.fallback)}
                            >
                                <div className="relative overflow-hidden">
                                    <img
                                        src={image.fallback}
                                        alt={image.alt}
                                        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <i className="fas fa-search-plus text-white text-2xl"></i>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white text-center group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                        {image.title}
                                    </h3>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>

                {/* Current Hadith Section */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/2 p-8 md:p-12 text-white">
                            <div className="mb-6">
                                <span className="bg-white text-green-700 px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center">
                                    <i className="fas fa-star mr-2"></i>
                                    Hadits Minggu Ini
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-6">Keutamaan Menuntut Ilmu</h2>
                            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl mb-6 border border-white/30">
                                <p className="text-lg leading-relaxed mb-4 font-medium">
                                    "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga."
                                </p>
                                <p className="text-sm opacity-80 flex items-center">
                                    <i className="fas fa-book mr-2"></i>
                                    HR. Muslim - Shahih Muslim No. 2699
                                </p>
                            </div>
                        </div>

                        <div className="md:w-1/2 bg-white dark:bg-gray-800 p-8 md:p-12 flex items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                                    <i className="fas fa-lightbulb text-yellow-500 mr-3"></i>
                                    Penjelasan Hadits
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                    Hadits ini menjelaskan tentang keutamaan menuntut ilmu dalam Islam. Ilmu yang dimaksud adalah ilmu syar'i yang bermanfaat untuk dunia dan akhirat.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                                    Allah akan memudahkan jalan menuju surga bagi orang yang bersungguh-sungguh dalam menuntut ilmu, baik dengan memudahkan proses belajarnya maupun dengan memberikan pahala yang besar.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                                        Pendidikan
                                    </span>
                                    <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                                        Motivasi
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Call to Action */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mt-16 bg-gray-100 dark:bg-gray-800 rounded-2xl p-12"
                >
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Mari Bergabung dalam Program Hadits Of The Week
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                        Jadilah bagian dari komunitas yang berkomitmen untuk mempelajari dan mengamalkan hadits Nabi Muhammad ﷺ dalam kehidupan sehari-hari.
                    </p>
                    <Link
                        href="/sekbid/sekbid-1"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full inline-flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
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