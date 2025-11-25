import DynamicHero from '@/components/DynamicHero';
import VisionCard from '@/components/VisionCard';
import GoalsSection from '@/components/GoalsSection';
import LatestPostsSection from '@/components/LatestPostsSection';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import PollsWidget from '@/components/PollsWidget';

export default function Home() {
  return (
    <>
      <main className="min-h-screen">
        <DynamicHero />
        
        <div id="vision" className="scroll-mt-16">
          <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
            {/* Background decorations - Behind content, below navbar */}
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 rounded-full blur-3xl" />
            </div>
            <VisionCard />
          </section>
        </div>

        <div id="mission" className="scroll-mt-16">
          <section className="py-8 sm:py-12 lg:py-16">
            <GoalsSection />
          </section>
        </div>

        <section className="py-8 sm:py-12 lg:py-16">
          <LatestPostsSection />
        </section>
        
        <section className="py-8 sm:py-12 lg:py-16">
          <AnnouncementsWidget />
        </section>
        
        <section className="py-8 sm:py-12 lg:py-16">
          <PollsWidget />
        </section>
      </main>
    </>
  );
}
