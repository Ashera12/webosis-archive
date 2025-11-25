import ProkerSection from '@/components/ProkerSection';

export default function BidangPage() {
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Program Kerja <span className="text-yellow-600 dark:text-yellow-400">OSIS</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Semua program kerja dari setiap Sekretariat Bidang (Sekbid) OSIS SMK Informatika Fithrah Insani
              </p>
            </div>
          </div>
        </section>
        
        <ProkerSection />
      </main>
    </>
  );
}
