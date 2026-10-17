import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine.ts';
import { LEVELS, TRUCK_COLORS } from './game/constants.ts';
import { FloatingText, GameStats, ScreenState, TruckColorOption } from './game/types.ts';
import { TitleScreen } from './components/TitleScreen.tsx';
import { GameHUD } from './components/GameHUD.tsx';
import { UpgradeShop } from './components/UpgradeShop.tsx';
import { VictoryModal } from './components/VictoryModal.tsx';
import { PauseModal } from './components/PauseModal.tsx';
import { TouchControls } from './components/TouchControls.tsx';
import { synthAudio } from './audio/synthAudio.ts';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screenState, setScreenState] = useState<ScreenState>('title');
  const [selectedLevelIndex, setSelectedLevelIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedColorHex, setSelectedColorHex] = useState<string>(TRUCK_COLORS[0].hex);

  // Upgrades state in React for immediate UI sync
  const [upgrades, setUpgrades] = useState<Record<string, number>>({
    bladeWidth: 1,
    enginePower: 1,
    studdedTires: 1,
    heatedBlade: 1,
    saltSpreader: 1,
    turboBoost: 1,
  });

  // Game stats
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    coins: 100,
    percentCleared: 0,
    currentCombo: 1.0,
    maxCombo: 1.0,
    comboTimer: 0,
    speedKmh: 0,
    boostGauge: 1.0,
    timeElapsed: 0,
    weather: 'light_snow',
    weatherTimeRemaining: 35,
    tractionMultiplier: 1.0,
    timeOfDay: 'morning',
    timeOfDayClock: '08:00 AM',
    timeOfDayProgress: 0.04,
    isAutoTimeOfDay: true,
  });

  // Victory modal stats
  const [victoryStats, setVictoryStats] = useState<{
    percent: number;
    coins: number;
    maxCombo: number;
  }>({ percent: 0, coins: 0, maxCombo: 1 });

  // Floating text markers in 2D screen space
  const [floatingTexts, setFloatingTexts] = useState<
    Array<{ id: number; text: string; sx: number; sy: number; color: string; life: number }>
  >([]);

  // Initialize GameEngine once
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(canvasMountRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onVictory: (vStats) => {
        setVictoryStats(vStats);
        setScreenState('victory');
      },
      onFloatingTextUpdate: (rawTexts: FloatingText[]) => {
        if (!engineRef.current) return;
        const projected = rawTexts
          .map((ft) => {
            const screen = engineRef.current!.getScreenCoordinates(ft);
            if (!screen) return null;
            return {
              id: ft.id,
              text: ft.text,
              sx: screen.x,
              sy: screen.y,
              color: ft.color,
              life: ft.life,
            };
          })
          .filter(Boolean) as Array<{
          id: number;
          text: string;
          sx: number;
          sy: number;
          color: string;
          life: number;
        }>;
        setFloatingTexts(projected);
      },
    });

    engineRef.current = engine;

    // Listen for global keyboard shortcuts (Esc for pause, U for garage, Space for title start)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setScreenState((prev) => {
          if (prev === 'playing') {
            engine.setScreenState('paused');
            return 'paused';
          } else if (prev === 'paused' || prev === 'garage') {
            engine.setScreenState('playing');
            return 'playing';
          }
          return prev;
        });
      } else if (e.code === 'KeyU') {
        setScreenState((prev) => {
          if (prev === 'playing' || prev === 'paused') {
            engine.setScreenState('garage');
            return 'garage';
          } else if (prev === 'garage') {
            engine.setScreenState('playing');
            return 'playing';
          }
          return prev;
        });
      } else if ((e.code === 'Space' || e.code === 'Enter') && engine.getScreenState() === 'title') {
        handleStartGame(selectedLevelIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(
    (lvlIndex: number) => {
      setSelectedLevelIndex(lvlIndex);
      if (engineRef.current) {
        engineRef.current.loadLevel(lvlIndex);
        engineRef.current.setScreenState('playing');
      }
      setScreenState('playing');
    },
    []
  );

  const handleToggleMute = useCallback(() => {
    const muted = synthAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.setScreenState('paused');
    setScreenState('paused');
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.setScreenState('playing');
    setScreenState('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.loadLevel(selectedLevelIndex);
      engineRef.current.setScreenState('playing');
    }
    setScreenState('playing');
  }, [selectedLevelIndex]);

  const handleHome = useCallback(() => {
    engineRef.current?.setScreenState('title');
    setScreenState('title');
  }, []);

  const handleOpenGarage = useCallback(() => {
    engineRef.current?.setScreenState('garage');
    setScreenState('garage');
  }, []);

  const handleCloseGarage = useCallback(() => {
    engineRef.current?.setScreenState('playing');
    setScreenState('playing');
  }, []);

  const handlePurchaseUpgrade = useCallback((upgradeId: string) => {
    if (!engineRef.current) return false;
    const success = engineRef.current.purchaseUpgrade(upgradeId);
    if (success) {
      setUpgrades(engineRef.current.getUpgrades());
      setStats((prev) => ({ ...prev, coins: engineRef.current!.getCoins() }));
    }
    return success;
  }, []);

  const handleSelectTruckColor = useCallback((color: TruckColorOption) => {
    setSelectedColorHex(color.hex);
    engineRef.current?.setTruckColor(color.hex, color.bladeHex);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextIndex = (selectedLevelIndex + 1) % LEVELS.length;
    setSelectedLevelIndex(nextIndex);
    if (engineRef.current) {
      engineRef.current.loadLevel(nextIndex);
      engineRef.current.setScreenState('playing');
    }
    setScreenState('playing');
  }, [selectedLevelIndex]);

  const handleHonk = useCallback(() => {
    engineRef.current?.triggerHorn();
  }, []);

  const handleCycleWeather = useCallback(() => {
    engineRef.current?.cycleWeather();
  }, []);

  const handleCycleTimeOfDay = useCallback(() => {
    engineRef.current?.cycleTimeOfDay();
  }, []);

  const currentLevel = LEVELS[selectedLevelIndex] || LEVELS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none text-white">
      {/* 3D WebGL Canvas Container (Strictly isolated from React re-renders) */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 touch-none" />

      {/* 2D Floating Score & Combo Texts in projected Screen Coordinates */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-black text-sm sm:text-base pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${ft.sx}px`,
              top: `${ft.sy}px`,
              color: ft.color,
              opacity: 1 - ft.life,
              transform: `translate(-50%, -50%) scale(${1 + ft.life * 0.4})`,
              transition: 'opacity 0.05s ease',
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* Screen: Title Screen */}
      {screenState === 'title' && (
        <TitleScreen
          selectedLevelIndex={selectedLevelIndex}
          onSelectLevel={(idx) => {
            setSelectedLevelIndex(idx);
            engineRef.current?.loadLevel(idx);
          }}
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Screen: In-Game Playing HUD */}
      {screenState === 'playing' && (
        <>
          <GameHUD
            stats={stats}
            level={currentLevel}
            engine={engineRef.current}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onPause={handlePause}
            onOpenGarage={handleOpenGarage}
            onHonk={handleHonk}
            onCycleWeather={handleCycleWeather}
            onCycleTimeOfDay={handleCycleTimeOfDay}
          />

          {/* On-Screen Touch Joystick for touch/mobile devices */}
          <TouchControls
            onJoystickMove={(x, y) => engineRef.current?.setVirtualJoystick(x, y)}
            onBoostChange={(active) => engineRef.current?.setTouchBoost(active)}
            onHonk={handleHonk}
          />
        </>
      )}

      {/* Screen: Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          level={currentLevel}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onResume={handleResume}
          onRestart={handleRestart}
          onOpenGarage={handleOpenGarage}
          onHome={handleHome}
        />
      )}

      {/* Screen: Upgrades / Alpine Garage Modal */}
      {screenState === 'garage' && (
        <UpgradeShop
          coins={stats.coins}
          upgrades={upgrades}
          selectedColorHex={selectedColorHex}
          onPurchase={handlePurchaseUpgrade}
          onSelectColor={handleSelectTruckColor}
          onClose={handleCloseGarage}
        />
      )}

      {/* Screen: Victory / Level Complete Modal */}
      {screenState === 'victory' && (
        <VictoryModal
          level={currentLevel}
          stats={victoryStats}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onOpenGarage={handleOpenGarage}
        />
      )}
    </div>
  );
}
