import React from 'react';
import { BRAND } from '../constants';

const SIZE_MAP = {
  sm: {
    box: 'h-12 w-12 rounded-2xl',
    icon: 30,
    title: 'text-sm',
    subtitle: 'text-[9px]'
  },
  md: {
    box: 'h-14 w-14 rounded-[1.1rem]',
    icon: 34,
    title: 'text-base',
    subtitle: 'text-[10px]'
  },
  lg: {
    box: 'h-20 w-20 rounded-[1.6rem]',
    icon: 48,
    title: 'text-xl',
    subtitle: 'text-[11px]'
  }
};

const BrandLogo = ({ tone = 'dark', size = 'md', showWordmark = true, className = '' }) => {
  const palette = SIZE_MAP[size] || SIZE_MAP.md;
  const isDark = tone === 'dark';

  const titleClass = isDark ? 'text-white' : 'text-slate-900';
  const subtitleClass = isDark ? 'text-amber-200/90' : 'text-stone-500';
  const shellClass = isDark
    ? 'border-white/10 bg-gradient-to-br from-slate-900 via-stone-800 to-amber-700 shadow-black/35'
    : 'border-amber-200 bg-gradient-to-br from-slate-950 via-slate-800 to-amber-700 shadow-amber-200/70';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative overflow-hidden border shadow-2xl ${palette.box} ${shellClass}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.34),_transparent_32%)]" />
        <div className="absolute -right-4 top-2 h-10 w-10 rounded-full bg-white/10 blur-xl" />

        <svg
          viewBox="0 0 64 64"
          className="relative z-10 h-full w-full p-3"
          aria-hidden="true"
        >
          <rect x="10" y="14" width="16" height="16" rx="4" fill="#F8FAFC" />
          <rect x="38" y="14" width="16" height="16" rx="4" fill="#FCD34D" />
          <rect x="24" y="34" width="16" height="16" rx="4" fill="#FDBA74" />
          <path
            d="M18 30V38H32M46 30V38H32"
            stroke="#E2E8F0"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.92"
          />
          <path
            d="M41 42H50V33"
            stroke="#111827"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M49 33L37 45"
            stroke="#111827"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-black uppercase tracking-[0.26em] ${palette.title} ${titleClass}`}>
            {BRAND.appName}
          </span>
          <span className={`mt-1 uppercase tracking-[0.32em] ${palette.subtitle} ${subtitleClass}`}>
            logistics handoff
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
