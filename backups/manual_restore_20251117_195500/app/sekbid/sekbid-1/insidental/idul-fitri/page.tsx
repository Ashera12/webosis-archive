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
    FaHeart
} from 'react-icons/fa';

export default function IdulFitriPage() {
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
            src: '/images/idul-fitri-1.jpg',
            title: 'Halal Bihalal',
            fallback: 'https://picsum.photos/400/300?random=4'
        },
        {
            src: '/images/idul-fitri-2.jpg',
            title: 'Silaturahmi Bersama',
            fallback: 'https://picsum.photos/400/300?random=5'
        },
        {
            src: '/images/idul-fitri-3.jpg',
            title: 'Perayaan Bersama',
            fallback: 'https://picsum.photos/400/300?random=6'
        }
    ];

    return (
        <div className="font-sans bg-gray-50 dark:bg-gray-900 min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-16 md:py-24 mt-16 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1)_0%,transparent_50%)] bg-[length:80px_80px]" />
                </div>

                <div className="container mx-auto px-6 text-center relative z-10">
                    <div className="mb-6">
                        <FaHeart className="text-5xl md:text-6xl mx-auto mb-4 animate-pulse" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        Idul Fitri
                    </h1>
                    <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8 leading-relaxed">
                        Perayaan Hari Raya Idul Fitri dengan Penuh Kegembiraan dan Silaturahmi
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => scrollToSection('teknis')}
                            className="bg-white text-green-900 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            <FaCalendarAlt className="mr-2" />
                            Teknis Pelaksanaan
                        </button>
                        <button
                            onClick={() => scrollToSection('dokumentasi')}
                            className="border-2 border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-green-900 transition duration-300 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
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
                        className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors font-medium"
                    >
                        <FaArrowLeft className="mr-2" />
                        Kembali ke Sekbid 1
                    </Link>
                </div>

                {/* Tujuan Program Section */}
                <section className="py-16 bg-white dark:bg-gray-800">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-green-900 dark:text-green-300 mb-4">
                                Tujuan Program
                            </h2>
                            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="text-green-900 dark:text-green-400 mb-4">
                                    <FaHeart className="text-4xl" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-green-900 dark:text-green-300">
                                    Silaturahmi
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Mempererat tali silaturahmi antar warga sekolah dalam suasana yang penuh kegembiraan dan kebersamaan.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="text-green-900 dark:text-green-400 mb-4">
                                    <FaHandsHelping className="text-4xl" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-green-900 dark:text-green-300">
                                    Kebersamaan
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Menciptakan momen kebersamaan yang indah antara siswa, guru, dan seluruh civitas akademika sekolah.
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-2">
                                <div className="text-green-900 dark:text-green-400 mb-4">
                                    <FaStar className="text-4xl" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3 text-green-900 dark:text-green-300">
                                    Syukur & Kegembiraan
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Mengekspresikan rasa syukur atas nikmat Allah SWT dan berbagi kegembiraan di hari yang fitri.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Teknis Pelaksanaan Section */}
                <section id="teknis" className="py-16 bg-gray-50 dark:bg-gray-900">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-green-900 dark:text-green-300 mb-4">
                                Teknis Pelaksanaan
                            </h2>
                            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
                        </div>
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                                <div className="flex items-start">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                                        <FaCalendarCheck className="text-green-900 dark:text-green-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-green-300">
                                            Waktu Pelaksanaan
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Perayaan Idul Fitri dilaksanakan pada tanggal 1 Syawal sesuai dengan penetapan pemerintah, dengan kegiatan halal bihalal di sekolah.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                                <div className="flex items-start">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                                        <FaTrophy className="text-green-900 dark:text-green-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-green-300">
                                            Rangkaian Kegiatan
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Kegiatan meliputi halal bihalal, saling bermaaf-maafan, berbagi takjil dan makanan, serta acara hiburan yang Islami untuk memeriahkan suasana.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                                <div className="flex items-start">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-6 flex-shrink-0">
                                        <FaUsers className="text-green-900 dark:text-green-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold mb-2 text-green-900 dark:text-green-300">
                                            Peserta
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Seluruh komunitas sekolah termasuk siswa, guru, staf, dan keluarga besar SMA IT Fithrah Insani diundang untuk berpartisipasi dalam perayaan ini.
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
                            <h2 className="text-3xl font-bold text-green-900 dark:text-green-300 mb-4">
                                Dokumentasi Kegiatan
                            </h2>
                            <div className="w-24 h-1 bg-yellow-400 mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mt-4">
                                Momen-momen indah dari perayaan Idul Fitri bersama keluarga besar SMA IT Fithrah Insani.
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
                                        <h3 className="font-semibold text-green-900 dark:text-green-300">
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
                    className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
                    aria-label="Kembali ke atas"
                    title="Kembali ke atas"
                >
                    <FaArrowUp />
                </button>
            )}
        </div>
    );
}
