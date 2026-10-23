import React from 'react';
import { CompanyProgress } from '../game/types.ts';
import {
  CONTRACTS,
  DISTRICTS,
  getContractStatus,
  getDistrictStatus,
  getNextReputationMilestone,
} from '../game/contracts.ts';
import {
  Building2,
  Coins,
  Award,
  FileText,
  Wrench,
  Gamepad2,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Snowflake,
  Lock,
  MapPin,
  Flame,
  Target,
} from 'lucide-react';

interface CareerHubProps {
  companyProgress: CompanyProgress;
  onOpenContracts: () => void;
  onOpenGarage: () => void;
  onOpenArcade: () => void;
  onBack: () => void;
}

export const CareerHub: React.FC<CareerHubProps> = ({
  companyProgress,
  onOpenContracts,
  onOpenGarage,
  onOpenArcade,
  onBack,
}) => {
  const completedCount = companyProgress.completedContractIds.length;
  const totalContracts = CONTRACTS.length;
  const completionPercentage = Math.round((completedCount / totalContracts) * 100);

  const milestone = getNextReputationMilestone(companyProgress);
  const activeContract = companyProgress.activeContractId
    ? CONTRACTS.find((c) => c.id === companyProgress.activeContractId)
    : null;

  const availableContractsCount = CONTRACTS.filter(
    (c) => getContractStatus(c, companyProgress) === 'available'
  ).length;

  const lockedContractsCount = CONTRACTS.filter(
    (c) => getContractStatus(c, companyProgress) === 'locked'
  ).length;

  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col justify-between p-4 sm:p-8 overflow-y-auto font-sans text-white select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition active:scale-95 cursor-pointer flex items-center justify-center"
            title="Return to Main Menu"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-slate-100">
                {companyProgress.companyName}
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Career Operations & District Headquarters
            </p>
          </div>
        </div>

        {/* Currency & Reputation Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 font-bold text-sm shadow-md">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{companyProgress.coins.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 font-bold text-sm shadow-md">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>{companyProgress.reputation} REP</span>
          </div>
        </div>
      </div>

      {/* Main Career Content */}
      <div className="w-full max-w-5xl mx-auto my-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Progress Summary */}
        <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Snowflake className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-200">Company Overview</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Welcome back to operational command. View available commercial and residential contracts across alpine districts, upgrade your fleet, or practice in arcade mode.
            </p>

            <div className="space-y-4">
              {/* Reputation & Next Milestone Progress */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" /> Current Reputation
                  </span>
                  <span className="text-cyan-300 font-black font-mono">
                    {companyProgress.reputation} REP
                  </span>
                </div>

                {milestone.type === 'max' ? (
                  <div className="mt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    Maximum Career Reputation Achieved!
                  </div>
                ) : (
                  <>
                    <div className="mt-2 text-[11px] text-slate-300 flex justify-between items-center">
                      <span className="truncate pr-2">
                        Next: <strong className="text-white">{milestone.targetName}</strong>
                      </span>
                      <span className="text-amber-400 font-bold shrink-0">
                        {milestone.remainingReputation} REP remaining
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              Math.round(
                                (companyProgress.reputation / milestone.nextThreshold) * 100
                              )
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                      <span>{companyProgress.reputation} REP</span>
                      <span>Target: {milestone.nextThreshold} REP</span>
                    </div>
                  </>
                )}
              </div>

              {/* Completion Overview */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Contracts Completed</span>
                  <span className="text-cyan-300 font-bold">{completedCount} / {totalContracts}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-medium">Career Completion</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
            Snowdrift Fleet Operations v1.0
          </div>
        </div>

        {/* Right 2 Columns: Navigation Cards */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contracts Action Card */}
          <button
            onClick={onOpenContracts}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-cyan-500/30 hover:border-cyan-400 p-6 rounded-2xl text-left transition-all duration-200 shadow-xl hover:shadow-[0_0_25px_rgba(56,189,248,0.15)] flex flex-col justify-between cursor-pointer active:scale-98"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-1.5 flex items-center justify-between">
                <span>Available Contracts</span>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Browse, evaluate, and accept snow-plowing assignments across residential suburbs, town squares, and alpine mountain passes.
              </p>
            </div>

            {activeContract && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">
                  Active: <strong>{activeContract.title}</strong>
                </span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-cyan-400">
                {availableContractsCount} Available · {lockedContractsCount} Locked
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                Career Catalog
              </span>
            </div>
          </button>

          {/* Garage & Upgrades Action Card */}
          <button
            onClick={onOpenGarage}
            className="group relative bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl text-left transition-all duration-200 shadow-xl flex flex-col justify-between cursor-pointer active:scale-98"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wrench className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-300 transition-colors mb-1.5 flex items-center justify-between">
                <span>Garage & Upgrades</span>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upgrade blade width, engine horsepower, snow grip tires, heated de-icers, salt spreaders, and vehicle paint jobs.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-amber-400">
                {companyProgress.coins.toLocaleString()} Coins Available
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                Upgrades
              </span>
            </div>
          </button>

          {/* Arcade Mode Action Card */}
          <button
            onClick={onOpenArcade}
            className="group sm:col-span-2 relative bg-gradient-to-br from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl text-left transition-all duration-200 shadow-xl flex items-center justify-between cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                <Gamepad2 className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  Arcade & Free Roam Mode
                </h4>
                <p className="text-xs text-slate-400">
                  Play quick levels or endless snow day without contract penalties or reputation pressure.
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          {/* District Unlock Status Summary Card */}
          <div className="sm:col-span-2 bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">District Unlock Status</h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Current: <strong className="text-cyan-300 font-mono">{companyProgress.reputation} REP</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DISTRICTS.map((district) => {
                const status = getDistrictStatus(district, companyProgress);
                return (
                  <div
                    key={district.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between ${
                      status.isUnlocked
                        ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                        : 'bg-rose-950/20 border-rose-900/40 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {district.name}
                        </span>
                        {status.isUnlocked ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold shrink-0">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1">
                        {status.isUnlocked ? (
                          <span className="text-emerald-400 font-medium">
                            {status.completedCount} / {status.totalContracts} Contracts Completed
                          </span>
                        ) : (
                          <span className="text-rose-300 font-semibold">
                            Requires {district.requiredReputation} REP ({status.remainingReputation} REP remaining)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="w-full max-w-5xl mx-auto pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-2">
        <span>Snowdrift Career Headquarters</span>
        <span>Select contracts to earn coins and build client reputation</span>
      </div>
    </div>
  );
};
