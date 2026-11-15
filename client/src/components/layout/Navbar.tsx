import React, { useState } from 'react';
import { Menu, Sun, Moon, Laptop, LogOut, Upload, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { Button } from '../common/Button.js';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, onOpenUpload }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Canonical Upload Report Action */}
        <Button
          onClick={onOpenUpload}
          variant="primary"
          size="sm"
          className="hidden sm:inline-flex shadow-xs"
        >
          <Upload className="h-4 w-4 mr-1.5" />
          Upload Report
        </Button>

        {/* Theme Selector Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            onClick={() => setTheme('light')}
            className={`rounded-md p-1.5 transition-colors ${
              theme === 'light'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Light Theme"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`rounded-md p-1.5 transition-colors ${
              theme === 'dark'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Dark Theme"
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`rounded-md p-1.5 transition-colors ${
              theme === 'system'
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="System Theme"
          >
            <Laptop className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-full border border-border bg-background p-1.5 pr-3 hover:bg-muted transition-colors text-left"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-semibold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block leading-tight">
              <span className="block text-xs font-semibold text-foreground max-w-[120px] truncate">
                {user?.name}
              </span>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
