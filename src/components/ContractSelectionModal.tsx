import React, { useState } from 'react';
import { CompanyProgress, Contract } from '../game/types.ts';
import { CONTRACTS, DISTRICTS } from '../game/contracts.ts';
import { LEVELS } from '../game/constants.ts';
import {
  Building2,
  Coins,
  Award,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldAlert,
  CloudSnow,
  Sun,
  CloudLightning,
  MapPin,
  Clock,
  Target,
  Play,
  FileText,
} from 'lucide-react';

interface ContractSelectionModalProps {
  companyProgress: CompanyProgress;
  onAcceptContract: (contract: Contract) => void;
  onBack: () => void;
}

export type ContractStatus = 'available' | 'locked' | 'completed';

export const ContractSelectionModal: React.FC<ContractSelectionModalProps> = ({
  companyProgress,
  onAcceptContract,
  onBack,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(CONTRACTS[0]?.id || '');

  const getContractStatus = (contract: Contract): ContractStatus => {
    if (companyProgress.completedContractIds.includes(contract.id)) {
      return 'completed';
    }
    const minRep = contract.minReputationRequired ?? 0;
    if (companyProgress.reputation < minRep) {
      return 'locked';
    }
    return 'available';
  };

  const selectedContract = CONTRACTS.find((c) => c.id === selectedContractId) || CONTRACTS[0];
  const selectedStatus = selectedContract ? getContractStatus(selectedContract) : 'available';

  const selectedLevel = selectedContract
    ? LEVELS.find((l) => l.id === selectedContract.locationId)
    : undefined;

  const selectedDistrict = selectedContract
    ? DISTRICTS.find((d) => d.unlockedContracts.includes(selectedContract.id))
    : undefined;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col justify-between p-4 sm:p-8 overflow-y-auto font-sans text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition active:scale-95 cursor-pointer flex items-center justify-center"
            title="Back to Career Hub"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-100">
                Commercial & Municipal Contracts
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Select an available work order to review target terms and rewards
            </p>
          </div>
        </div>

        {/* Player Status Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{companyProgress.coins.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 font-bold text-xs sm:text-sm">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{companyProgress.reputation} REP</span>
          </div>
        </div>
      </div>

      {/* Grid Body: Contract List on Left, Detail Screen on Right */}
      <div className="w-full max-w-6xl mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: District & Contract Catalog */}
        <div className="lg:col-span-5 space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {DISTRICTS.map((district) => {
            const districtContracts = CONTRACTS.filter((c) =>
              district.unlockedContracts.includes(c.id)
            );

            return (
              <div key={district.id} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-200">{district.name}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{district.description}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-semibold">
                    Req. Rep: {district.requiredReputation}
                  </span>
                </div>

                <div className="space-y-2">
                  {districtContracts.map((contract) => {
                    const status = getContractStatus(contract);
                    const isSelected = contract.id === selectedContractId;

                    return (
                      <button
                        key={contract.id}
                        onClick={() => setSelectedContractId(contract.id)}
                        className={`w-full p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-800/95 border-cyan-400 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                            : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          {status === 'locked' && (
                            <Lock className="w-5 h-5 text-rose-400/80 shrink-0" />
                          )}
                          {status === 'available' && (
                            <div className="w-5 h-5 rounded-full border-2 border-cyan-400/80 flex items-center justify-center shrink-0">
                              <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            </div>
                          )}

                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                              <span>{contract.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="text-amber-400 font-semibold">
                                +{contract.rewardCoins} coins
                              </span>
                              <span>·</span>
                              <span className="text-cyan-300">+{contract.rewardReputation} REP</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {status === 'completed' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                              Completed
                            </span>
                          )}
                          {status === 'locked' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                              Locked
                            </span>
                          )}
                          {status === 'available' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                              Available
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Detailed Contract Inspection Screen */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {selectedDistrict?.name || 'Alpine District'}
                </span>
                {selectedStatus === 'completed' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
                {selectedStatus === 'locked' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Locked ({selectedContract.minReputationRequired ?? 0} REP Required)
                  </span>
                )}
                {selectedStatus === 'available' && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5">
                    Available
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-400 font-mono">
                ID: {selectedContract.id}
              </span>
            </div>

            {/* Contract Title & Client */}
            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
              {selectedContract.title}
            </h2>
            <p className="text-xs font-semibold text-cyan-400 mb-4">
              Client: {selectedContract.clientName}
            </p>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-6">
              {selectedContract.description}
            </p>

            {/* Contract Terms & Target Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Target className="w-3.5 h-3.5 text-cyan-400" /> Target Snow Clear
                </div>
                <div className="text-base font-bold text-slate-100">
                  {selectedContract.targetPercent}%
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" /> Coin Reward
                </div>
                <div className="text-base font-bold text-amber-300">
                  +{selectedContract.rewardCoins}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" /> Rep Reward
                </div>
                <div className="text-base font-bold text-cyan-300">
                  +{selectedContract.rewardReputation} REP
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CloudSnow className="w-3.5 h-3.5 text-slate-300" /> Expected Weather
                </div>
                <div className="text-xs font-bold text-slate-200 capitalize">
                  {selectedContract.weather ? selectedContract.weather.replace('_', ' ') : 'Light snow'}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-slate-300" /> Shift Time
                </div>
                <div className="text-xs font-bold text-slate-200 capitalize">
                  {selectedContract.timeOfDay || selectedLevel?.timeOfDay || 'Morning'}
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-300" /> Map / Route
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {selectedLevel?.name || selectedContract.locationId}
                </div>
              </div>
            </div>

            {/* Contract Penalty terms */}
            <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200/90 leading-relaxed">
                <span className="font-bold text-rose-300 block mb-0.5">Contract Terms & Failure Terms</span>
                Clearing below <strong className="text-white">{selectedContract.penalty.minPercentRequired}%</strong> incurs a breach fee of{' '}
                <strong className="text-amber-300">{selectedContract.penalty.failureFeeCoins} coins</strong> and a loss of{' '}
                <strong className="text-rose-300">{selectedContract.penalty.reputationLoss} REP</strong>.
              </div>
            </div>
          </div>

          {/* Bottom CTA Action Bar */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {selectedStatus === 'locked' && (
                <span className="text-rose-400 font-semibold">
                  Gain {selectedContract.minReputationRequired! - companyProgress.reputation} more reputation to unlock
                </span>
              )}
              {selectedStatus === 'completed' && (
                <span className="text-emerald-400 font-semibold">
                  Contract completed! You may replay it at any time.
                </span>
              )}
              {selectedStatus === 'available' && (
                <span className="text-cyan-300 font-semibold">
                  Contract terms verified. Ready to dispatch plow.
                </span>
              )}
            </div>

            <button
              disabled={selectedStatus === 'locked'}
              onClick={() => onAcceptContract(selectedContract)}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition active:scale-95 cursor-pointer shadow-lg ${
                selectedStatus === 'locked'
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {selectedStatus === 'completed' ? 'REPLAY CONTRACT' : 'ACCEPT & START CONTRACT'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
