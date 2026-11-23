import React, { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { ThemeId } from '../types';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  previewBg: string;
  previewAccent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'charcoal',
    name: 'Cinza Escuro Degradê',
    subtitle: 'Grafite profundo & azul elétrico',
    previewBg: 'linear-gradient(135deg, #0b0e14, #202836)',
    previewAccent: '#0ea5e9',
  },
  {
    id: 'midnight',
    name: 'Azul Noturno & Prata',
    subtitle: 'Marinho executivo & ciano',
    previewBg: 'linear-gradient(135deg, #060d1b, #132548)',
    previewAccent: '#38bdf8',
  },
  {
    id: 'graphite-gold',
    name: 'Grafite & Champanhe',
    subtitle: 'Ônix fosco & dourado sutil',
    previewBg: 'linear-gradient(135deg, #0d0d10, #24242c)',
    previewAccent: '#e5a93c',
  },
  {
    id: 'light',
    name: 'Branco Gelo & Azul',
    subtitle: 'Claro luminoso & azul royal',
    previewBg: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
    previewAccent: '#0284c7',
  },
];

interface ThemeSwitcherProps {
  currentTheme: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onSelectTheme,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const active =
    THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Trocar tema de cores"
        title="Trocar tema de cores"
        className={`min-h-[38px] rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs font-medium'
        }`}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/25 shrink-0"
          style={{ background: active.previewAccent }}
        />
        <Palette className="w-3.5 h-3.5 shrink-0" />
        {!compact && <span className="hidden sm:inline">Tema</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--surface)] border border-[var(--border-strong)] shadow-xl p-2 z-50">
          <p className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
            Combinações de Cores
          </p>
          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const selected = opt.id === currentTheme;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg border border-white/20 shrink-0 flex items-center justify-center"
                      style={{ background: opt.previewBg }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: opt.previewAccent }}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-[var(--text-primary)]">
                        {opt.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {opt.subtitle}
                      </p>
                    </div>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
