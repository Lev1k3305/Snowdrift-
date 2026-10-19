import React, { useState } from 'react';
import { Volume2, VolumeX, Pause, Wrench, Sparkles, Zap, Flame, Compass, Sun, CloudSnow, Wind, Sunrise, Sunset, Moon, Clock, Smartphone, Gauge } from 'lucide-react';
import { GameStats, LevelConfig } from '../game/types.ts';
import { GameEngine } from '../game/gameEngine.ts';
import { Minimap } from './Minimap.tsx';
import { InstallPromptModal } from './InstallPromptModal.tsx';

interface GameHUDProps {
  stats: GameStats;
  level: LevelConfig;
  engine: GameEngine | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onOpenGarage: () => void;
  onHonk: () => void;
  onCycleWeather?: () => void;
  onCycleTimeOfDay?: () => void;
  onCyclePerformance?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  level,
  engine,
  isMuted,
  onToggleMute,
  onPause,
  onOpenGarage,
  onHonk,
  onCycleWeather,
  onCycleTimeOfDay,
  onCyclePerformance,
}) => {
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Combo title
  const getComboTitle = (c: number) => {
    if (c >= 8) return '❄️ BLIZZARD KING';
    if (c >= 6) return '⚡ POWDER PRO';
    if (c >= 4) return '🏔️ DRIFT MASTER';
    if (c >= 2.5) return '🔥 SNOW CRUSHER';
    if (c >= 1.5) return '✨ SWEEPING';
    return 'COZY PLOW';
  };

  const getWeatherInfo = () => {
    switch (stats.weather) {
      case 'blizzard':
        return {
          title: 'Blizzard Storm',
          badgeText: '1.5x Multiplier',
          tractionText: `${Math.round(stats.tractionMultiplier * 100)}% Traction`,
          icon: <Wind className="w-4 h-4 text-cyan-300 animate-pulse" />,
          boxClass: 'bg-slate-900/95 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)]',
          badgeClass: 'bg-rose-500/25 text-rose-300 border-rose-500/40',
        };
      case 'clear':
        return {
          title: 'Clear Skies',
          badgeText: 'High Traction',
          tractionText: `${Math.round(stats.tractionMultiplier * 100)}% Traction`,
          icon: <Sun className="w-4 h-4 text-amber-400" />,
          boxClass: 'bg-slate-900/85 border-amber-400/60 shadow-[0_0_15px_rgba(251,191,36,0.2)]',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          title: 'Light Snowfall',
          badgeText: 'Calm Drift',
          tractionText: `${Math.round(stats.tractionMultiplier * 100)}% Traction`,
          icon: <CloudSnow className="w-4 h-4 text-sky-300" />,
          boxClass: 'bg-slate-900/85 border-slate-700/80 shadow-xl',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
    }
  };

  const getTimeOfDayInfo = () => {
    switch (stats.timeOfDay) {
      case 'morning':
        return {
          title: 'Morning Dawn',
          clock: stats.timeOfDayClock || '08:00 AM',
          modeText: stats.isAutoTimeOfDay ? 'Auto Diurnal' : 'Fixed Dawn',
          icon: <Sunrise className="w-4 h-4 text-amber-300" />,
          boxClass: 'bg-slate-900/85 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'midday':
        return {
          title: 'Bright Midday',
          clock: stats.timeOfDayClock || '12:30 PM',
          modeText: stats.isAutoTimeOfDay ? 'Auto Diurnal' : 'Fixed Noon',
          icon: <Sun className="w-4 h-4 text-yellow-300" />,
          boxClass: 'bg-slate-900/85 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.2)]',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        };
      case 'sunset':
        return {
          title: 'Alpenglow Sunset',
          clock: stats.timeOfDayClock || '05:45 PM',
          modeText: stats.isAutoTimeOfDay ? 'Auto Diurnal' : 'Fixed Dusk',
          icon: <Sunset className="w-4 h-4 text-rose-400" />,
          boxClass: 'bg-slate-900/85 border-rose-500/50 shadow-[0_0_18px_rgba(244,114,182,0.25)]',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      default:
        return {
          title: 'Deep Blue Night',
          clock: stats.timeOfDayClock || '11:45 PM',
          modeText: stats.isAutoTimeOfDay ? 'Auto Diurnal' : 'Fixed Night',
          icon: <Moon className="w-4 h-4 text-blue-400 animate-pulse" />,
          boxClass: 'bg-slate-950/95 border-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
          badgeClass: 'bg-blue-500/25 text-blue-300 border-blue-500/40',
        };
    }
  };

  const weatherInfo = getWeatherInfo();
  const timeInfo = getTimeOfDayInfo();
  const isComboActive = stats.currentCombo > 1.2;

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Bar Status Clusters */}
      <div className="flex flex-wrap items-start justify-between gap-3 w-full">
        {/* Top-Left: Level info & Cleared progress + Real-time Minimap */}
        <div className="flex flex-col gap-2.5">
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-xl min-w-[210px] sm:min-w-[260px]">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
                {level.name}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {level.subtitle}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2 mb-1.5">
              <span className="text-xs text-slate-400">Road Cleared</span>
              <span className="text-xl font-bold text-white tabular-nums">
                {stats.percentCleared}%
                {!level.isEndless && (
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    / {level.targetPercent}%
                  </span>
                )}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    level.isEndless
                      ? stats.percentCleared
                      : (stats.percentCleared / level.targetPercent) * 100
                  )}%`,
                }}
              />
              {!level.isEndless && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-300 z-10"
                  style={{ left: `${Math.min(99, level.targetPercent)}%` }}
                  title={`Goal: ${level.targetPercent}%`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Top-Center Cluster: Weather Condition + Time-of-Day Diurnal Progression */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Weather Condition Badge */}
          <button
            onClick={onCycleWeather}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${weatherInfo.boxClass}`}
            title="Dynamic Weather (Cycles automatically · Click or press C to toggle)"
          >
            <div className="p-1.5 rounded-xl bg-slate-800/80">
              {weatherInfo.icon}
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {weatherInfo.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${weatherInfo.badgeClass}`}>
                  {weatherInfo.badgeText}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className={stats.weather === 'blizzard' ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                  {weatherInfo.tractionText}
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  {stats.weatherTimeRemaining}s
                </span>
                <kbd className="hidden sm:inline bg-slate-800 text-[9px] px-1 rounded text-slate-400">C</kbd>
              </div>
            </div>
          </button>

          {/* Dynamic Time-of-Day Progression System Badge */}
          <button
            onClick={onCycleTimeOfDay}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${timeInfo.boxClass}`}
            title="Time of Day Progression (Shifts ambient palette from morning dawn to deep blue night · Click or press T to cycle)"
          >
            <div className="p-1.5 rounded-xl bg-slate-800/80">
              {timeInfo.icon}
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {timeInfo.title}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${timeInfo.badgeClass}`}>
                  {timeInfo.modeText}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="text-amber-300 font-bold tabular-nums">
                  {timeInfo.clock}
                </span>
                <span>·</span>
                <span className="text-slate-400">
                  {Math.round(stats.timeOfDayProgress * 100)}% Day
                </span>
                <kbd className="hidden sm:inline bg-slate-800 text-[9px] px-1 rounded text-slate-400">T</kbd>
              </div>
            </div>
          </button>

          {/* Adaptive Performance Mode Badge (Turbo for old phones / Balanced / High) */}
          <button
            onClick={onCyclePerformance}
            className={`pointer-events-auto flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md ${
              stats.performanceMode === 'turbo'
                ? 'bg-amber-950/85 border-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : stats.performanceMode === 'balanced'
                ? 'bg-slate-900/85 border-slate-700/80 shadow-md'
                : 'bg-indigo-950/85 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
            }`}
            title="Графика / Оптимизация (⚡ Турбо для старых телефонов · Клик или клавиша P)"
          >
            <div className="p-1.5 rounded-xl bg-slate-800/80">
              <Gauge className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {stats.performanceMode === 'turbo'
                    ? 'Турбо'
                    : stats.performanceMode === 'balanced'
                    ? 'Баланс'
                    : 'Высокие'}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                    stats.performanceMode === 'turbo'
                      ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {stats.fps || 60} FPS
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5">
                <span className="text-amber-300">
                  {stats.performanceMode === 'turbo' ? 'Для старых тел.' : 'Стандарт'}
                </span>
                <kbd className="hidden sm:inline bg-slate-800 text-[9px] px-1 rounded text-slate-400">P</kbd>
              </div>
            </div>
          </button>
        </div>

        {/* Top-Right: Currency, Score, Settings Controls */}
        <div className="flex items-center gap-2.5">
          {/* Currency Cluster */}
          <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-base text-cyan-300 font-black">❄</span>
              <span className="text-lg font-bold text-white tabular-nums tracking-tight">
                {stats.coins.toLocaleString()}
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Score</span>
              <span className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                {stats.score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Garage / Upgrades Button */}
          <button
            onClick={onOpenGarage}
            className="pointer-events-auto flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-3.5 py-2.5 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-xs"
            title="Open Upgrades Garage (U)"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Garage</span>
            <kbd className="hidden md:inline bg-amber-700/40 text-amber-950 text-[10px] px-1.5 py-0.5 rounded font-mono">
              U
            </kbd>
          </button>

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="pointer-events-auto p-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
            title={isMuted ? 'Unmute Synth Audio' : 'Mute Synth Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
          </button>

          {/* Smartphone Install / Share Info Button */}
          <button
            onClick={() => setShowInstallModal(true)}
            className="pointer-events-auto p-2.5 bg-slate-900/85 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-700/80 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
            title="Открыть на телефоне или установить"
          >
            <Smartphone className="w-5 h-5" />
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Toast / Notification Area (unobstructed playfield) */}
      <div className="flex-1 flex items-center justify-center pointer-events-none" />

      {/* Bottom Dock: Speed, Combo Multiplier, Boost Gauge, Horn */}
      <div className="w-full flex flex-col items-center gap-3">
        {/* Dynamic Combo Multiplier Badge */}
        {isComboActive && (
          <div className="pointer-events-auto bg-gradient-to-r from-sky-950/90 to-blue-900/90 border border-cyan-500/50 rounded-full px-5 py-2 shadow-2xl flex items-center gap-3 animate-bounce">
            <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-300">
              {getComboTitle(stats.currentCombo)}
            </span>
            <span className="text-2xl font-black text-amber-300 tabular-nums">
              x{stats.currentCombo.toFixed(1)}
            </span>

            {/* Decay bar */}
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-cyan-800">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-100"
                style={{ width: `${Math.round(stats.comboTimer * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Unified Bottom Control Dock */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-3xl px-5 py-3 shadow-2xl flex items-center gap-6 max-w-xl w-full justify-around">
          {/* Speedometer */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Speed</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white tabular-nums tracking-tight">
                {stats.speedKmh}
              </span>
              <span className="text-[11px] text-slate-400">km/h</span>
            </div>
          </div>

          {/* Nitro Boost Gauge */}
          <div className="flex-1 flex flex-col gap-1 max-w-[140px] sm:max-w-[180px]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-400" /> Nitro
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                {Math.round(stats.boostGauge * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  stats.boostGauge < 0.2
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                }`}
                style={{ width: `${Math.round(stats.boostGauge * 100)}%` }}
              />
            </div>
          </div>

          {/* Time of Day, Weather, and Horn Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCycleTimeOfDay}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300 font-semibold px-2.5 py-2 rounded-2xl border border-slate-600 transition cursor-pointer text-xs"
              title="Cycle Time of Day Lighting (T)"
            >
              {timeInfo.icon}
              <kbd className="bg-slate-900 text-slate-300 text-[10px] px-1 rounded font-mono">T</kbd>
            </button>

            <button
              onClick={onCycleWeather}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 font-semibold px-2.5 py-2 rounded-2xl border border-slate-600 transition cursor-pointer text-xs"
              title="Cycle Weather Condition (C)"
            >
              {weatherInfo.icon}
              <kbd className="bg-slate-900 text-slate-300 text-[10px] px-1 rounded font-mono">C</kbd>
            </button>

            <button
              onClick={onHonk}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-cyan-300 font-semibold px-3 py-2 rounded-2xl border border-slate-600 transition cursor-pointer text-xs"
              title="Honk Truck Horn (H)"
            >
              <span>🎺</span>
              <span className="hidden sm:inline">Honk</span>
              <kbd className="bg-slate-900 text-slate-300 text-[10px] px-1 rounded font-mono">H</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Isometric Minimap in the corner of HUD */}
      <Minimap
        engine={engine}
        percentCleared={stats.percentCleared}
        timeOfDay={stats.timeOfDay}
        level={level}
        speedKmh={stats.speedKmh}
      />

      {/* Mobile Install / Play on Phone Modal */}
      <InstallPromptModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
};
