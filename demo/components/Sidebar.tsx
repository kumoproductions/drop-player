import { detectLocale } from '../utils/locale';
import { extractNavItems, type NavItem } from '../utils/readmeParser';

const NAV_ITEMS: NavItem[] = extractNavItems(detectLocale());

interface SidebarProps {
  activeId: string;
  onNavigate?: () => void;
}

export function Sidebar({ activeId, onNavigate }: SidebarProps) {
  return (
    <nav className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={onNavigate}
            className={`block py-1.5 text-sm transition-colors border-l-2 ${
              item.indent ? 'pl-6' : 'pl-3'
            } ${
              isActive
                ? 'border-blue-500 text-blue-400 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

export { NAV_ITEMS };
