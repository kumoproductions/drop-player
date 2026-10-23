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
      className="inline-flex items-center gap-0.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
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
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur lg:hidden">
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
        <div className="fixed inset-0 top-[49px] z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden">
          <div className="flex h-full w-64 flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-6">
            <Sidebar activeId={activeId} onNavigate={closeMobile} />
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <SidebarLinks />
            </div>
            <div className="mt-auto pt-6">
              <SidebarCredit />
            </div>
          </div>
          <button
            type="button"
            onClick={closeMobile}
            className="absolute inset-0 -z-10 h-full w-full"
            aria-label="Close menu"
          />
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-zinc-800 p-6 lg:flex lg:flex-col">
          <div className="mb-8">
            <a href="#drop-player" className="text-lg font-bold text-zinc-100">
              drop-player
            </a>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs text-zinc-500">v{pkg.version}</span>
              <LanguageSwitcher />
            </div>
          </div>
          <Sidebar activeId={activeId} />
          <div className="mt-8 border-t border-zinc-800 pt-6">
            <SidebarLinks />
          </div>
          <div className="mt-auto pt-6">
            <SidebarCredit />
          </div>
        </aside>

        {/* Main content */}
        <main
          ref={mainRef}
          className="mx-auto max-w-4xl min-w-0 flex-1 space-y-16 px-6 py-10 lg:px-12"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
