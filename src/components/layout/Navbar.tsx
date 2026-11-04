import React from 'react';
import { motion } from 'framer-motion';
import { Code2, Cpu, Database, DatabaseZap, Gauge, Scale, type LucideIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cx } from '../ui/primitives';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

const MENU: NavItem[] = [
  { id: 'playground', path: '/playground', label: 'Playground', icon: Cpu },
  { id: 'comparison', path: '/comparison', label: 'Bandingkan', icon: Scale },
  { id: 'perflab', path: '/performance', label: 'Performa', icon: Gauge },
  { id: 'sqlexplorer', path: '/sql', label: 'SQL', icon: Code2 },
  { id: 'materializedview', path: '/materialized-view', label: 'Materialized View', icon: DatabaseZap },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = () => {
    const p = location.pathname;
    if (p.startsWith('/comparison') || p.startsWith('/bandingkan')) return 'comparison';
    if (p.startsWith('/materialized-view') || p.startsWith('/materializedview')) return 'materializedview';
    if (p.startsWith('/performance') || p.startsWith('/performa')) return 'perflab';
    if (p.startsWith('/sql')) return 'sqlexplorer';
    return 'playground';
  };

  const activeId = currentTab();

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft/80 bg-white/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-8">
        <button
          type="button"
          onClick={() => navigate('/playground')}
          className="group flex items-center gap-2 sm:gap-3 rounded-lg shrink-0"
          aria-label="IndexLab, kembali ke Playground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-md shadow-blue-500/30 transition-transform group-hover:scale-105">
            <Database className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-[16px] sm:text-[17px] font-bold tracking-tight text-ink">
            Index<span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lab</span>
          </span>
        </button>

        <nav aria-label="Navigasi utama" className="flex items-center rounded-full bg-fill/80 p-0.5 sm:p-1 border border-line-soft shadow-inner overflow-x-auto no-scrollbar">
          {MENU.map(({ id, path, label, icon: Icon }) => {
            const active = activeId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  navigate(path);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative inline-flex h-7 sm:h-8 items-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-3.5 text-[12px] sm:text-[13.5px] font-medium transition-colors shrink-0',
                  active ? 'text-white font-semibold' : 'text-ink-2 hover:text-ink'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 shadow-md shadow-blue-500/25"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1 sm:gap-1.5">
                  <Icon className={cx('h-3.5 w-3.5', active ? 'text-white' : 'text-ink-2')} aria-hidden />
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
