import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Language } from '../types';

interface ScrollControllerProps {
  language: Language;
}

export const ScrollController: React.FC<ScrollControllerProps> = ({ language }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (windowHeight > 0) {
        const scrollPercent = (totalScroll / windowHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
      }

      setShowScrollTop(totalScroll > 240);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* Top viewport scroll progress indicator line */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-50 pointer-events-none bg-slate-950/20 backdrop-blur-xs"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating smooth back-to-top button */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-slate-900/90 px-3 py-2.5 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-cyan-400 hover:bg-slate-800 hover:text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] ${
          showScrollTop
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-6 opacity-0 pointer-events-none'
        }`}
        title={language === 'kz' ? 'Жоғарыға оралу' : 'Наверх страницы'}
        aria-label={language === 'kz' ? 'Жоғарыға оралу' : 'Наверх страницы'}
      >
        <ArrowUp className="h-4 w-4 text-cyan-400 animate-bounce" />
        <span className="hidden sm:inline font-mono text-[11px]">
          {language === 'kz' ? 'Жоғарыға' : 'Наверх'}
        </span>
        <span className="font-mono text-[10px] text-slate-400 border-l border-slate-700 pl-1.5">
          {Math.round(scrollProgress)}%
        </span>
      </button>
    </>
  );
};
