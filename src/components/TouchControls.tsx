import React, { useRef, useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

interface TouchControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onBoostChange: (active: boolean) => void;
  onHonk: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onJoystickMove,
  onBoostChange,
  onHonk,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  const [isTouchCapable, setIsTouchCapable] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 1024
    );
  });

  useEffect(() => {
    const handleTouchDetect = () => {
      setIsTouchCapable(true);
    };
    window.addEventListener('touchstart', handleTouchDetect, { once: true });
    const pointerHandler = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setIsTouchCapable(true);
    };
    window.addEventListener('pointerdown', pointerHandler);
    return () => {
      window.removeEventListener('touchstart', handleTouchDetect);
      window.removeEventListener('pointerdown', pointerHandler);
    };
  }, []);

  const maxRadius = 45;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    touchIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && e.type !== 'pointerdown') return;
    if (touchIdRef.current !== null && e.pointerId !== touchIdRef.current) return;
    if (!joystickBaseRef.current) return;

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let clampedX = dx;
    let clampedY = dy;

    if (dist > maxRadius) {
      clampedX = (dx / dist) * maxRadius;
      clampedY = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: clampedX, y: clampedY });
    onJoystickMove(clampedX / maxRadius, clampedY / maxRadius);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (touchIdRef.current !== null && e.pointerId !== touchIdRef.current) return;
    setIsDragging(false);
    touchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  if (!isTouchCapable) return null;

  return (
    <div className="absolute inset-x-0 bottom-4 sm:bottom-6 pointer-events-none flex justify-between items-end px-4 sm:px-8 z-30 select-none">
      {/* Virtual Analog Joystick */}
      <div
        ref={joystickBaseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pointer-events-auto relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/80 border-2 border-slate-700/80 backdrop-blur-md flex items-center justify-center touch-none shadow-2xl active:border-cyan-400"
      >
        <div className="absolute inset-2 rounded-full border border-slate-800 pointer-events-none opacity-40 flex items-center justify-center">
          <div className="w-1 h-6 bg-slate-600 rounded-full" />
          <div className="w-6 h-1 bg-slate-600 rounded-full absolute" />
        </div>
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-400 border-2 border-white/60 shadow-lg transform transition-transform duration-75 flex items-center justify-center"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          <div className="w-4 h-4 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Action Buttons: Boost & Horn */}
      <div className="flex flex-col gap-3.5 pointer-events-auto items-end">
        {/* Nitro Boost Button (Hold) */}
        <button
          onPointerDown={() => onBoostChange(true)}
          onPointerUp={() => onBoostChange(false)}
          onPointerCancel={() => onBoostChange(false)}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-2xl border-2 border-amber-300 active:scale-90 transition select-none touch-none cursor-pointer"
        >
          <Zap className="w-6 h-6 fill-slate-950" />
          <span className="text-[10px] uppercase font-bold tracking-tight">Nitro</span>
        </button>

        {/* Horn Button */}
        <button
          onClick={onHonk}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800/90 text-cyan-300 border border-slate-600 flex items-center justify-center text-lg active:scale-90 transition select-none shadow-lg cursor-pointer"
        >
          🎺
        </button>
      </div>
    </div>
  );
};
