import React, { useState } from 'react';
import { Play, Sparkles, Volume2, VolumeX, ShieldCheck, Snowflake, Trophy, Smartphone } from 'lucide-react';
import { LEVELS } from '../game/constants.ts';
import { LevelConfig } from '../game/types.ts';
import { InstallPromptModal } from './InstallPromptModal.tsx';

interface TitleScreenProps {
  onStart: (levelIndex: number) => void;
  selectedLevelIndex: number;
  onSelectLevel: (index: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  selectedLevelIndex,
  onSelectLevel,
  isMuted,
  onToggleMute,
}) => {
  const [showInstallModal, setShowInstallModal] = useState(false);

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between p-6 sm:p-10 pointer-events-none z-20">
      {/* Top Header bar with sound toggle & mobile install button */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/70 border border-slate-700/60 pointer-events-auto">
            <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" /> 3D Isometric Winter Simulation
            </span>
          </div>

          <button
            onClick={() => setShowInstallModal(true)}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 text-xs font-bold transition active:scale-95 cursor-pointer shadow-lg hover:border-cyan-400"
            title="Открыть на телефоне или установить как приложение"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">На телефон</span>
            <span className="sm:hidden">Телефон</span>
          </button>
        </div>

        <button
          onClick={onToggleMute}
          className="pointer-events-auto p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </div>

      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />

      {/* Hero Centerpiece: Bespoke SVG Title Lockup over 35% negative space */}
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto my-auto">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="relative mb-3">
          <svg
            className="w-72 sm:w-96 md:w-[440px] h-auto drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
            viewBox="0 0 500 130"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft background glow */}
            <filter id="snow-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Snowdrift text with ice gradient */}
            <defs>
              <linearGradient id="snowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>

            {/* Main Wordmark */}
            <text
              x="250"
              y="75"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="2"
              fill="url(#snowGrad)"
              stroke="#0f172a"
              strokeWidth="4"
              paintOrder="stroke"
            >
              SNOWDRIFT
            </text>

            {/* Secondary Subtitle Banner */}
            <rect x="110" y="90" width="280" height="26" rx="13" fill="#0f172a" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1.5" />
            <text
              x="250"
              y="108"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="12"
              fontWeight="700"
              letterSpacing="4"
              fill="url(#amberGrad)"
            >
              COZY ALPINE SNOW PLOWING
            </text>

            {/* Snow cap decorative drip */}
            <path
              d="M110 38 C 130 30, 160 30, 185 36 C 210 42, 230 32, 260 34 C 290 36, 320 28, 350 36 C 375 42, 385 36, 395 38"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="text-slate-300 text-sm sm:text-base font-medium max-w-md mb-6 drop-shadow-md">
          Hop into your heavy-duty winter truck, carve pristine trails through deep powdery snowbanks, and keep the alpine village humming!
        </p>

        {/* Primary Start CTA Button */}
        <button
          onClick={() => onStart(selectedLevelIndex)}
          className="pointer-events-auto group relative flex items-center gap-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-lg px-8 py-4 rounded-3xl shadow-[0_0_35px_rgba(56,189,248,0.4)] transition-all duration-200 transform hover:scale-105 active:scale-98 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>START PLOWING</span>
          <kbd className="bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-lg text-xs font-mono font-bold">
            SPACE
          </kbd>
        </button>

        {/* Flat control-hint line (as required by game guidelines) */}
        <div className="mt-4 text-xs text-slate-400 font-mono tracking-wide">
          WASD / Arrows Move · Space Nitro · T Time of Day · C Weather · P Graphics Turbo · H Horn · U Garage · Esc Pause
        </div>
      </div>

      {/* Level Selection Cards pinned at bottom */}
      <div className="w-full max-w-4xl mx-auto pointer-events-auto">
        <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2 px-1 text-center sm:text-left">
          Select Route / Location
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {LEVELS.map((lvl, index) => {
            const isSelected = selectedLevelIndex === index;
            return (
              <button
                key={lvl.id}
                onClick={() => onSelectLevel(index)}
                className={`p-3 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-950/70 hover:bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-cyan-300' : 'text-slate-300'
                      }`}
                    >
                      {lvl.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {lvl.timeOfDay}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                    {lvl.subtitle}
                  </p>
                </div>

                <div className="mt-2 text-[10px] font-semibold text-amber-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>Goal:</span>
                  <span>{lvl.isEndless ? 'Endless Zen' : `${lvl.targetPercent}% Cleared`}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
