import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share2, PlusSquare, Copy, Check, X, QrCode, Sparkles } from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android'>('android');

  const shareUrl = window.location.href.includes('ais-dev')
    ? 'https://ais-pre-am33nxa5lap45ntrqzlspd-855529640822.asia-southeast1.run.app'
    : window.location.href;

  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setActiveTab('ios');
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      onClose();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-white flex flex-col gap-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Играть на телефоне <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>
            <p className="text-xs text-slate-400">
              Игра полностью оптимизирована для мобильных экранов с сенсорным джойстиком!
            </p>
          </div>
        </div>

        {/* One-Click PWA Install Button (Chrome / Android / Desktop) */}
        {deferredPrompt && (
          <button
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl shadow-lg transition active:scale-98 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Установить как приложение на телефон</span>
          </button>
        )}

        {/* Platform Tabs: Android / iPhone */}
        <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'android'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Android (Chrome)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            iPhone / iPad (Safari)
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
          {activeTab === 'android' ? (
            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>Откройте ссылку игры в браузере <strong>Google Chrome</strong> на телефоне.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  2
                </span>
                <span>Нажмите меню <strong>⋮ (три точки)</strong> в правом верхнем углу браузера.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  3
                </span>
                <span>Выберите <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  1
                </span>
                <span>Откройте ссылку в стандартном браузере <strong>Safari</strong> на iPhone.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Нажмите кнопку <Share2 className="w-4 h-4 text-sky-400 inline" /> <strong>«Поделиться»</strong> (квадрат со стрелкой вверх) внизу экрана.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[11px] shrink-0">
                  3
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Прокрутите вниз и нажмите <PlusSquare className="w-4 h-4 text-emerald-400 inline" /> <strong>«На экран „Домой“»</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Share Link Box */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Ссылка для телефона:
          </span>
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2 px-3">
            <span className="text-xs font-mono text-cyan-300 truncate flex-1 select-all">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition active:scale-95 cursor-pointer shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info about touch controls */}
        <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 flex items-center justify-between">
          <span>🕹️ Сенсорный джойстик включится автоматически</span>
          <button
            onClick={onClose}
            className="text-cyan-400 font-bold hover:underline cursor-pointer"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
