import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showMenu?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showMenu = false, className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { id: Theme; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={menuRef}>
      {/* Primary Toggle Button */}
      <button
        type="button"
        onClick={showMenu ? () => setIsOpen(!isOpen) : toggleTheme}
        title={`Current theme: ${theme} (${resolvedTheme} active). Click to ${resolvedTheme === 'dark' ? 'switch to Light mode' : 'switch to Dark mode'}`}
        aria-label="Toggle light and dark theme"
        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200 hover:rotate-45" />
        )}
        {showMenu && (
          <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 ml-0.5" />
        )}
      </button>

      {/* Optional Theme Selection Dropdown */}
      {showMenu && isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Appearance
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-600 font-semibold dark:bg-blue-950/40 dark:text-blue-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
