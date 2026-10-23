import React, { useState } from 'react';

export interface CompanyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  withText?: boolean;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
  subtitle?: string;
}

const SIZE_MAP = {
  xs: { img: 'h-6 w-6', text: 'text-xs', badge: 'text-[9px]' },
  sm: { img: 'h-8 w-8', text: 'text-sm', badge: 'text-[10px]' },
  md: { img: 'h-10 w-10', text: 'text-base', badge: 'text-xs' },
  lg: { img: 'h-14 w-14', text: 'text-xl', badge: 'text-sm' },
  xl: { img: 'h-20 w-20', text: 'text-2xl', badge: 'text-base' },
  '2xl': { img: 'h-28 w-28', text: 'text-3xl', badge: 'text-lg' },
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  size = 'md',
  withText = false,
  glow = true,
  className = '',
  onClick,
  subtitle,
}) => {
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  const logoSrc = '/assets/neurofactory_logo.jpg';
  const fallbackSrc = '/assets/brand/WhatsApp_Image_2026-10-21_at_21.00.18_b22cc649.jpeg';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <div className={`relative shrink-0 flex items-center justify-center ${sizeConfig.img}`}>
        {/* Ambient neon radial glow backdrop */}
        {glow && (
          <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-md group-hover:bg-cyan-400/35 transition-all duration-300" />
        )}

        {/* Circular glass emblem container */}
        <div className="relative w-full h-full rounded-full overflow-hidden border border-cyan-400/40 bg-slate-950 p-[1px] shadow-[0_0_12px_rgba(6,182,212,0.35)] group-hover:border-cyan-400 group-hover:shadow-[0_0_18px_rgba(6,182,212,0.6)] transition-all">
          {!imgError ? (
            <img
              src={logoSrc}
              onError={() => {
                // If direct path failed, try secondary path or fallback to styled mark
                const img = new Image();
                img.src = fallbackSrc;
                img.onload = () => {
                  /* fallback succeeded */
                };
                img.onerror = () => setImgError(true);
              }}
              alt="NeuroFactory AI"
              className="w-full h-full object-cover object-center rounded-full scale-105 group-hover:scale-110 transition-transform duration-300"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-600 via-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white font-mono">
              N
            </div>
          )}
        </div>
      </div>

      {withText && (
        <div className="flex flex-col text-left leading-tight">
          <div className={`font-bold tracking-tight text-white flex items-center gap-1.5 ${sizeConfig.text}`}>
            <span className="font-display">NeuroFactory</span>
            <span className="text-cyan-400 font-mono font-extrabold uppercase tracking-widest text-xs px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 font-mono tracking-wide">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
