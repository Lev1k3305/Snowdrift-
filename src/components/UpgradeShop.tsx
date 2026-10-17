import React from 'react';
import { X, Wrench, Sparkles, Check, Flame, Zap, Shield, Gauge, Disc } from 'lucide-react';
import { TRUCK_COLORS, UPGRADES } from '../game/constants.ts';
import { TruckColorOption, UpgradeInfo } from '../game/types.ts';

interface UpgradeShopProps {
  coins: number;
  upgrades: Record<string, number>;
  selectedColorHex: string;
  onPurchase: (upgradeId: string) => boolean;
  onSelectColor: (color: TruckColorOption) => void;
  onClose: () => void;
}

export const UpgradeShop: React.FC<UpgradeShopProps> = ({
  coins,
  upgrades,
  selectedColorHex,
  onPurchase,
  onSelectColor,
  onClose,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shovel':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      case 'gauge':
        return <Gauge className="w-5 h-5 text-amber-400" />;
      case 'disc':
        return <Disc className="w-5 h-5 text-emerald-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      default:
        return <Wrench className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Cozy Alpine Garage</h2>
              <p className="text-xs text-slate-400">Upgrade your plow truck & customize winter paint</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Coins badge */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-cyan-500/40 px-3.5 py-1.5 rounded-full">
              <span className="text-sm text-cyan-400">❄</span>
              <span className="font-bold text-white font-mono text-sm tabular-nums">
                {coins.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close Garage (Esc or U)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Paint Swatches */}
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5">
              Truck Custom Paint
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TRUCK_COLORS.map((col) => {
                const isSelected = selectedColorHex.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.id}
                    onClick={() => onSelectColor(col)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                        : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="text-[11px] font-semibold truncate text-slate-200">
                      {col.name.split(' ')[1] || col.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgrades List */}
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5">
              Performance & Clearing Upgrades
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(UPGRADES).map((upgrade: UpgradeInfo) => {
                const currentLvl = upgrades[upgrade.id] || 1;
                const isMax = currentLvl >= upgrade.maxLevel;
                const nextCost = isMax ? 0 : upgrade.costs[currentLvl - 1];
                const canAfford = coins >= nextCost && !isMax;

                return (
                  <div
                    key={upgrade.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top title and level pips */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80">
                            {getIcon(upgrade.icon)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white leading-tight">
                              {upgrade.name}
                            </div>
                            <div className="text-[11px] text-cyan-300 font-medium">
                              {upgrade.getStatText(currentLvl)}
                            </div>
                          </div>
                        </div>

                        {/* Level Pips */}
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full ${
                                i < currentLvl
                                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                  : 'bg-slate-800 border border-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                        {upgrade.description}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {isMax ? 'MAX LEVEL' : `Next: Lvl ${currentLvl + 1}`}
                      </span>

                      {isMax ? (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Maxed Out
                        </div>
                      ) : (
                        <button
                          onClick={() => onPurchase(upgrade.id)}
                          disabled={!canAfford}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95 ${
                            canAfford
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          <span>❄ {nextCost}</span>
                          <span>Upgrade</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Back to Plowing
          </button>
        </div>
      </div>
    </div>
  );
};
