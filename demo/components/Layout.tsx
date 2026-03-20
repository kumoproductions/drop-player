import { ArrowUpRight, Menu, X } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import pkg from '../../package.json';
import { detectLocale, getLocalePath } from '../utils/locale';
import { NAV_ITEMS, Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

function LanguageSwitcher() {
  const currentLocale = detectLocale();
  const otherLocale = currentLocale === 'en' ? 'ja' : 'en';
  const label = currentLocale === 'en' ? '日本語' : 'English';

  return (
    <a
      href={getLocalePath(otherLocale)}
      className="inline-flex items-center gap-0.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
    >
      {label}
      <ArrowUpRight size={12} />
    </a>
  );
}

function SidebarLinks() {
  return (
    <div className="space-y-2 text-xs text-zinc-500">
      <a
        href="https://github.com/kumoproductions/drop-player"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-zinc-300"
      >
        GitHub
      </a>
      <a
        href="https://www.npmjs.com/package/drop-player"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-zinc-300"
      >
        npm
      </a>
      <a
        href="https://npmx.dev/package/drop-player"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-zinc-300"
      >
        npmx.dev
      </a>
      <a
        href="https://drop.mov"
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:text-zinc-300"
      >
        drop.mov
      </a>
    </div>
  );
}

function SidebarCredit() {
  return (
    <div className="text-xs text-zinc-600">
      Built by{' '}
      <a
        href="https://x.com/cumuloworks"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-zinc-400"
      >
        @cumuloworks
      </a>{' '}
      at{' '}
      <a
        href="https://kumo.productions"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-zinc-400"
      >
        kumo.productions™
      </a>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [activeId, setActiveId] = useState('drop-player');
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll-spy with IntersectionObserver
  useEffect(() => {
    const ids = NAV_ITEMS.filter((n) => !n.indent).map((n) => n.id);
    const subIds = NAV_ITEMS.filter((n) => n.indent).map((n) => n.id);
    const allIds = [...ids, ...subIds];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-100">drop-player</span>
          <span className="text-xs text-zinc-500">v{pkg.version}</span>
          <LanguageSwitcher />
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-zinc-400 hover:text-zinc-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile sidebar overlay — positioned below the header */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-[49px] z-40 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-64 h-full bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col overflow-y-auto">
            <Sidebar activeId={activeId} onNavigate={closeMobile} />
            <div className="mt-8 pt-6 border-t border-zinc-800">
              <SidebarLinks />
            </div>
            <div className="mt-auto pt-6">
              <SidebarCredit />
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="absolute inset-0 w-full h-full -z-10"
            aria-label="Close menu"
          />
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-zinc-800 p-6">
          <div className="mb-8">
            <a href="#drop-player" className="text-lg font-bold text-zinc-100">
              drop-player
            </a>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-zinc-500">v{pkg.version}</span>
              <LanguageSwitcher />
            </div>
          </div>
          <Sidebar activeId={activeId} />
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <SidebarLinks />
          </div>
          <div className="mt-auto pt-6">
            <SidebarCredit />
          </div>
        </aside>

        {/* Main content */}
        <main
          ref={mainRef}
          className="flex-1 min-w-0 max-w-4xl mx-auto px-6 lg:px-12 py-10 space-y-16"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
