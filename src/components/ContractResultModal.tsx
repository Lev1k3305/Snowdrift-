import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CompanyProgress, Contract, ContractResult } from '../game/types.ts';
import {
  getNewlyUnlockedDistricts,
  getNewlyUnlockedContracts,
  getNextAvailableContract,
  getNextReputationMilestone,
} from '../game/contracts.ts';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coins,
  Award,
  Building2,
  MapPin,
  RotateCcw,
  Wrench,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  PlayCircle,
  ShieldAlert,
  Unlock,
} from 'lucide-react';

interface ContractResultModalProps {
  result: ContractResult;
  companyProgress: CompanyProgress;
  previousCompanyProgress: CompanyProgress;
  onReturnToHub: () => void;
  onRetry: () => void;
  onOpenGarage: () => void;
  onContinueNextContract?: (contract: Contract) => void;
}

export const ContractResultModal: React.FC<ContractResultModalProps> = ({
  result,
  companyProgress,
  previousCompanyProgress,
  onReturnToHub,
  onRetry,
  onOpenGarage,
  onContinueNextContract,
}) => {
  useEffect(() => {
    if (result.success) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#ffffff', '#fde047', '#34d399', '#a78bfa'],
        });
      } catch {
        // ignore confetti errors in non-browser environments
      }
    }
  }, [result.success]);

  const { contract, success, finalPercent, targetPercent } = result;

  // Determine penalty status for failure classification
  const hasPenalty = result.penaltyCoins > 0 || result.penaltyReputation > 0;
  const isFailedWithPenalty = !success && hasPenalty;
  const isFailedWithoutPenalty = !success && !hasPenalty;

  // Derive newly unlocked items
  const newlyUnlockedDistricts = getNewlyUnlockedDistricts(
    previousCompanyProgress,
    companyProgress
  );
  const newlyUnlockedContracts = getNewlyUnlockedContracts(
    previousCompanyProgress,
    companyProgress
  );
  const hasNewUnlocks =
    newlyUnlockedDistricts.length > 0 || newlyUnlockedContracts.length > 0;

  // Find next available contract for "Continue" quick action
  const nextContract = getNextAvailableContract(contract.id, companyProgress);

  // Reputation milestone progress towards next unlock
  const milestone = getNextReputationMilestone(companyProgress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-sans text-white">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {/* Ambient background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none ${
            success
              ? 'bg-cyan-500/20'
              : isFailedWithoutPenalty
              ? 'bg-amber-500/20'
              : 'bg-rose-500/20'
          }`}
        />

        {/* Status Header Badge */}
        <div className="flex flex-col items-center text-center mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg border ${
              success
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : isFailedWithoutPenalty
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-rose-500/20 border-rose-400 text-rose-300'
            }`}
          >
            {success ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : isFailedWithoutPenalty ? (
              <AlertTriangle className="w-8 h-8" />
            ) : (
              <XCircle className="w-8 h-8" />
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            {success
              ? 'CONTRACT COMPLETED! 🏆'
              : isFailedWithoutPenalty
              ? 'CONTRACT MISSED (NO PENALTY) ⚠️'
              : 'CONTRACT FAILED (PENALTY APPLIED) ⛔'}
          </h2>

          <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{contract.clientName}</span>
            <span>•</span>
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">{contract.title}</span>
          </div>
        </div>

        {/* Newly Unlocked Notification Banner */}
        {hasNewUnlocks && (
          <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-amber-950/80 border border-cyan-500/50 rounded-2xl p-3.5 mb-4 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>NEW CAREER UNLOCKS AVAILABLE!</span>
            </div>
            <div className="space-y-1 text-xs text-slate-200 pl-6">
              {newlyUnlockedDistricts.map((d) => (
                <div key={d.id} className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                  <span>District Unlocked: <strong>{d.name}</strong></span>
                </div>
              ))}
              {newlyUnlockedContracts.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 font-semibold text-cyan-300">
                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                  <span>Contract Unlocked: <strong>{c.title}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objective Performance Section */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Snow Clearing Objective
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                success
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  : isFailedWithoutPenalty
                  ? 'bg-amber-950 border border-amber-800 text-amber-300'
                  : 'bg-rose-950 border border-rose-800 text-rose-300'
              }`}
            >
              {success
                ? 'TARGET MET'
                : isFailedWithoutPenalty
                ? 'MINIMUM THRESHOLD CLEARED'
                : 'BELOW MINIMUM THRESHOLD'}
            </span>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-2xl font-black text-white tabular-nums">{finalPercent}%</span>
              <span className="text-xs text-slate-400 ml-1">cleared</span>
            </div>
            <div className="text-right text-xs text-slate-400">
              Target Required: <span className="font-bold text-slate-200">{targetPercent}%</span>
              {contract.penalty?.minPercentRequired != null && (
                <div className="text-[10px] text-slate-500">
                  Min No-Penalty: <span className="font-semibold text-slate-400">{contract.penalty.minPercentRequired}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                success
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                  : isFailedWithoutPenalty
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, finalPercent)}%` }}
            />
          </div>

          {/* Explanation badge for failure scenarios */}
          {isFailedWithoutPenalty && (
            <p className="mt-2.5 text-[11px] text-amber-300/90 leading-snug bg-amber-950/30 p-2 rounded-lg border border-amber-800/40">
              You cleared enough snow ({finalPercent}%) to reach the minimum threshold ({contract.penalty.minPercentRequired}%) so no penalty fee was assessed. However, you did not reach the {targetPercent}% target required to complete the contract.
            </p>
          )}

          {isFailedWithPenalty && (
            <p className="mt-2.5 text-[11px] text-rose-300/90 leading-snug bg-rose-950/30 p-2 rounded-lg border border-rose-800/40 flex items-start gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>
                Snow cleared ({finalPercent}%) was below the {contract.penalty.minPercentRequired}% minimum required threshold. A failure fee and reputation loss were applied.
              </span>
            </p>
          )}
        </div>

        {/* Financial & Progression Report Itemization */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 border-b border-slate-800/80 pb-1">
            Company Financial Statement
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Base Contract Fee</span>
            <span className={`font-mono font-bold ${success ? 'text-emerald-400' : 'text-slate-500'}`}>
              {success ? `+${result.baseRewardCoins} ❄` : '0 ❄'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Snow Plowing Earnings</span>
            <span className="font-mono font-bold text-cyan-300">
              +{result.gameplayCoins} ❄
            </span>
          </div>

          {result.penaltyCoins > 0 ? (
            <div className="flex justify-between items-center text-rose-400 font-semibold">
              <span>Failure Fee Penalty</span>
              <span className="font-mono font-bold">-{result.penaltyCoins} ❄</span>
            </div>
          ) : (
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Failure Fee Penalty</span>
              <span className="font-mono font-bold">0 ❄</span>
            </div>
          )}

          <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center font-bold text-sm">
            <span className="text-slate-200">Net Financial Impact</span>
            <span
              className={`font-mono flex items-center gap-1 ${
                result.netCoinsGained >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.netCoinsGained >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {result.netCoinsGained >= 0 ? `+${result.netCoinsGained}` : result.netCoinsGained} ❄
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 text-slate-400">
            <span>Reputation Impact</span>
            <span
              className={`font-mono font-bold ${
                result.netReputationGained >= 0 ? 'text-cyan-300' : 'text-rose-400'
              }`}
            >
              {result.netReputationGained >= 0
                ? `+${result.netReputationGained} REP`
                : `${result.netReputationGained} REP`}
            </span>
          </div>

          {/* Balance & Career Reputation Summary */}
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Balance: {result.updatedCoins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>{result.updatedReputation} REP</span>
            </div>
          </div>

          {/* Next Milestone Progress Indicator */}
          {milestone.type !== 'max' && (
            <div className="mt-2 text-[11px] text-slate-400 pt-1 flex justify-between items-center">
              <span>
                Next Target: <strong className="text-slate-200">{milestone.targetName}</strong>
              </span>
              <span className="text-amber-400 font-semibold font-mono">
                {milestone.remainingReputation} REP needed
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Direct "Continue to Next Contract" action when available */}
          {success && nextContract && onContinueNextContract && (
            <button
              onClick={() => onContinueNextContract(nextContract)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black py-3 px-6 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
            >
              <PlayCircle className="w-4 h-4" />
              <span>CONTINUE TO NEXT CONTRACT: {nextContract.title.toUpperCase()}</span>
            </button>
          )}

          <button
            onClick={onReturnToHub}
            className={`flex items-center justify-center gap-2 font-black py-3 px-6 rounded-2xl shadow-lg transition active:scale-95 cursor-pointer text-sm ${
              success && nextContract && onContinueNextContract
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950'
            }`}
          >
            <span>RETURN TO CAREER HUB</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer text-xs active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Retry Contract</span>
            </button>

            <button
              onClick={onOpenGarage}
              className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 px-3 rounded-xl border border-slate-700 transition cursor-pointer text-xs active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Garage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
