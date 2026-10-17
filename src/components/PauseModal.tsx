import React from 'react';
import { Play, RotateCcw, Home, Wrench, Volume2, VolumeX } from 'lucide-react';
import { LevelConfig } from '../game/types.ts';

interface PauseModalProps {
  level: LevelConfig;
  isMuted: boolean;
  onToggleMute: () => void;
  onResume: () => void;
  onRestart: () => void;
  onOpenGarage: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  level,
  isMuted,
  onToggleMute,
  onResume,
  onRestart,
  onOpenGarage,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-6 text-center shadow-2xl">
        <h2 className="text-xl font-black text-white tracking-tight mb-1">GAME PAUSED</h2>
        <p className="text-xs text-slate-400 mb-6">
          {level.name} · {level.subtitle}
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onOpenGarage}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition cursor-pointer text-xs"
          >
            <Wrench className="w-4 h-4" />
            <span>Open Garage</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition cursor-pointer text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Level</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition cursor-pointer text-xs"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-800 transition cursor-pointer text-xs mt-2"
          >
            <Home className="w-4 h-4" />
            <span>Title Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
