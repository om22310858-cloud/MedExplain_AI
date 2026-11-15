import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  GitCompare,
  Activity,
  User,
  HeartPulse,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Reports', path: '/reports', icon: FileText },
    { name: 'Compare Reports', path: '/compare', icon: GitCompare },
    { name: 'Risk Assessment', path: '/risk-assessment', icon: Activity },
    { name: 'Profile & Settings', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-foreground">
                MedExplain<span className="text-primary-600 font-extrabold">_AI</span>
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Clinical Health Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors select-none',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info badge */}
        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground mb-0.5">Clinical Literacy AI</p>
            <p className="text-[11px] leading-tight">
              Educational document understanding. Not for acute diagnosis.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
