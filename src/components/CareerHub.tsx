import React from 'react';
import { CompanyProgress } from '../game/types.ts';
import { CONTRACTS } from '../game/contracts.ts';
import { Building2, Coins, Award, FileText, Wrench, Gamepad2, ArrowLeft, CheckCircle2, ChevronRight, Snowflake } from 'lucide-react';

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
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Contracts Completed</span>
                  <span className="text-cyan-300 font-bold">{completedCount} / {totalContracts}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-slate-300 font-medium">Career Progress</span>
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

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-cyan-400">
                {CONTRACTS.length - completedCount} Contracts Available
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
