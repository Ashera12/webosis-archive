import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-ds-bg dark:bg-ds-dark-bg flex flex-col items-center justify-start py-8 px-4">
      <header className="w-full max-w-5xl text-center mb-8 px-2">
        <h1 className="text-[1.75rem] sm:text-3xl md:text-4xl font-playfair leading-snug text-ds-text-light dark:text-ds-text-dark mb-2">SMA IT Fithrah Insani</h1>
        <p className="text-mobile-sub text-ds-muted dark:text-ds-text-dark mb-2">Website OSIS & Kegiatan Sekolah</p>
        <p className="text-mobile-body text-ds-muted dark:text-ds-text-dark max-w-2xl mx-auto">Temukan informasi, dokumentasi, dan program unggulan dari seluruh Sekbid, admin, dan kegiatan insidental maupun rutinan di satu tempat.</p>
      </header>
      <main className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 px-2">
        {[
          { name: "Sekbid 1", href: "/sekbid/sekbid-1", color: "bg-ds-panel" },
          { name: "Sekbid 2", href: "/sekbid/sekbid-2", color: "bg-ds-panel" },
          { name: "Sekbid 3", href: "/sekbid/sekbid-3", color: "bg-ds-panel" },
          { name: "Sekbid 4", href: "/sekbid/sekbid-4", color: "bg-ds-panel" },
          { name: "Sekbid 5", href: "/sekbid/sekbid-5", color: "bg-ds-panel" },
          { name: "Sekbid 6", href: "/sekbid/sekbid-6", color: "bg-ds-panel" },
          { name: "Admin", href: "/admin", color: "bg-ds-panel" },
        ].map(({ name, href }) => (
          <Link
            key={name}
            href={href}
            className={`rounded-ds-lg shadow-ds-soft transition-all duration-200 p-5 flex flex-col items-center justify-center text-base sm:text-lg font-semibold text-ds-text-light dark:text-ds-text-dark hover:scale-[1.02]`}
          >
            <span className="text-sm text-ds-muted mb-2">{name}</span>
            <span className="text-xs text-ds-muted">Lihat</span>
          </Link>
        ))}
      </main>
      <footer className="w-full max-w-5xl text-center text-sm text-ds-muted dark:text-ds-text-dark mt-auto py-4 px-2">
        &copy; {new Date().getFullYear()} SMA IT Fithrah Insani &mdash; OSIS Web
      </footer>
    </div>
  );
}

