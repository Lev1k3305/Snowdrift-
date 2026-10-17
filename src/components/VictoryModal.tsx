import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Snowflake, ArrowRight, RotateCcw, Wrench } from 'lucide-react';
import { LevelConfig } from '../game/types.ts';

interface VictoryModalProps {
  level: LevelConfig;
  stats: {
    percent: number;
    coins: number;
    maxCombo: number;
  };
  onNextLevel: () => void;
  onReplay: () => void;
  onOpenGarage: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  stats,
  onNextLevel,
  onReplay,
  onOpenGarage,
}) => {
  useEffect(() => {
    // Fire celebratory winter confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#ffffff', '#fde047', '#f97316', '#a78bfa'],
      });
    } catch {
      // ignore
    }
  }, []);

  // Determine snowflake rating (1-3)
  const getRating = () => {
    if (stats.percent >= 95 || stats.maxCombo >= 5.0) return 3;
    if (stats.percent >= 85 || stats.maxCombo >= 3.0) return 2;
    return 1;
  };

  const rating = getRating();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 text-center shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Snowflake rating stars */}
        <div className="flex justify-center items-center gap-2 mb-4">
          {[1, 2, 3].map((star) => (
            <div
              key={star}
              className={`p-3 rounded-2xl border transition-all duration-300 ${
                star <= rating
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-110 shadow-lg'
                  : 'bg-slate-800 border-slate-700 text-slate-600 scale-95'
              }`}
            >
              <Snowflake className="w-6 h-6 animate-spin-slow" />
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-1">
          ROUTE CLEARED! ❄️
        </h2>
        <p className="text-xs text-cyan-300 font-semibold uppercase tracking-wider mb-5">
          {level.name} · {level.subtitle}
        </p>

        {/* Performance Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/70 border border-slate-800 rounded-2xl p-3 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Cleared</span>
            <span className="text-lg font-bold text-white tabular-nums">{stats.percent}%</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Max Combo</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">x{stats.maxCombo.toFixed(1)}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Total Coins</span>
            <span className="text-lg font-bold text-cyan-300 tabular-nums">❄ {stats.coins}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onNextLevel}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
          >
            <span>NEXT ROUTE</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenGarage}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer text-xs"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Garage</span>
            </button>

            <button
              onClick={onReplay}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
