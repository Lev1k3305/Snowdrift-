import React, { useEffect, useRef, useState } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  MapPin,
  Crosshair,
  Layers,
  Sparkles,
  Move,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
} from 'lucide-react';
import { GameEngine } from '../game/gameEngine.ts';
import { TimeOfDay, LevelConfig } from '../game/types.ts';

type MinimapCorner = 'bottom-right' | 'top-left' | 'top-right';

interface MinimapProps {
  engine: GameEngine | null;
  percentCleared: number;
  timeOfDay: TimeOfDay;
  level?: LevelConfig;
  speedKmh?: number;
}

export const Minimap: React.FC<MinimapProps> = ({
  engine,
  percentCleared,
  timeOfDay,
  level,
  speedKmh = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('snowplow_minimap_expanded') === 'true';
    } catch {
      return false;
    }
  });

  const [corner, setCorner] = useState<MinimapCorner>(() => {
    try {
      const saved = localStorage.getItem('snowplow_minimap_corner');
      if (saved === 'bottom-right' || saved === 'top-left' || saved === 'top-right') {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'bottom-right';
  });

  const [showDriftLegend, setShowDriftLegend] = useState<boolean>(true);
  const trailRef = useRef<Array<{ x: number; z: number; time: number }>>([]);
  const lastHeadingRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; z: number }>({ x: 0, z: 0 });

  // Persist preferences
  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('snowplow_minimap_expanded', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const cycleCorner = () => {
    setCorner((prev) => {
      let next: MinimapCorner = 'bottom-right';
      if (prev === 'bottom-right') next = 'top-left';
      else if (prev === 'top-left') next = 'top-right';
      else next = 'bottom-right';

      try {
        localStorage.setItem('snowplow_minimap_corner', next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Keyboard shortcut: M to toggle expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        toggleExpanded();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main rendering loop
  useEffect(() => {
    let animId: number;

    const renderMinimap = () => {
      animId = requestAnimationFrame(renderMinimap);
      if (!canvasRef.current || !engine) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const data = engine.getMinimapData();
      if (!data) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Track player breadcrumb trail
      if (data.truckPos) {
        lastPosRef.current = { x: data.truckPos.x, z: data.truckPos.z };
        lastHeadingRef.current = data.truckPos.heading;

        const now = Date.now();
        const trail = trailRef.current;
        const lastP = trail[trail.length - 1];

        if (!lastP || Math.hypot(lastP.x - data.truckPos.x, lastP.z - data.truckPos.z) > 1.2) {
          trail.push({ x: data.truckPos.x, z: data.truckPos.z, time: now });
          // keep last 28 points
          if (trail.length > 28) trail.shift();
        }

        // Clean expired points (> 8 seconds)
        while (trail.length > 0 && now - trail[0].time > 8000) {
          trail.shift();
        }
      }

      // Background styling matching current diurnal mood
      let bgGradColor1 = '#090e1a';
      let bgGradColor2 = '#020617';
      let gridColor = 'rgba(56, 189, 248, 0.08)';
      let borderGlow = 'rgba(56, 189, 248, 0.25)';

      if (timeOfDay === 'morning') {
        bgGradColor1 = '#0f172a';
        bgGradColor2 = '#1e293b';
        gridColor = 'rgba(251, 191, 36, 0.09)';
        borderGlow = 'rgba(251, 191, 36, 0.35)';
      } else if (timeOfDay === 'midday') {
        bgGradColor1 = '#0c1527';
        bgGradColor2 = '#1e293b';
        gridColor = 'rgba(14, 165, 233, 0.12)';
        borderGlow = 'rgba(14, 165, 233, 0.35)';
      } else if (timeOfDay === 'sunset') {
        bgGradColor1 = '#1c102b';
        bgGradColor2 = '#0a0614';
        gridColor = 'rgba(244, 114, 182, 0.12)';
        borderGlow = 'rgba(244, 114, 182, 0.35)';
      } else {
        bgGradColor1 = '#030712';
        bgGradColor2 = '#080e1c';
        gridColor = 'rgba(59, 130, 246, 0.1)';
        borderGlow = 'rgba(59, 130, 246, 0.3)';
      }

      // 1. Radar background canvas gradient fill
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        width * 0.65
      );
      grad.addColorStop(0, bgGradColor1);
      grad.addColorStop(1, bgGradColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Coordinate transforms: world (-mapWidth/2 to +mapWidth/2) -> canvas
      const mapW = data.mapWidth || 64;
      const mapL = data.mapLength || 64;
      const pad = isExpanded ? 24 : 16;
      const innerW = width - pad * 2;
      const maxDim = Math.max(mapW, mapL);
      const isoScale = (innerW / maxDim) * 0.76;

      // Center of canvas
      const cx = width / 2;
      const cy = height / 2 - (isExpanded ? 4 : 2);

      const worldToIso = (wx: number, wz: number): { x: number; y: number } => {
        // 45 degree isometric projection
        const isoX = cx + (wx - wz) * isoScale * 0.7071;
        const isoY = cy + (wx + wz) * isoScale * 0.42;
        return { x: isoX, y: isoY };
      };

      const halfW = mapW / 2;
      const halfL = mapL / 2;
      const pTop = worldToIso(0, -halfL);
      const pRight = worldToIso(halfW, 0);
      const pBottom = worldToIso(0, halfL);
      const pLeft = worldToIso(-halfW, 0);

      // 2. 3D Isometric Diorama Extruded Slab (Base Elevation Depth)
      const slabDepth = isExpanded ? 9 : 6;

      // Left shaded slab facet
      ctx.beginPath();
      ctx.moveTo(pLeft.x, pLeft.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pBottom.x, pBottom.y + slabDepth);
      ctx.lineTo(pLeft.x, pLeft.y + slabDepth);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Right shaded slab facet (darker for 3D shadow effect)
      ctx.beginPath();
      ctx.moveTo(pBottom.x, pBottom.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pRight.x, pRight.y + slabDepth);
      ctx.lineTo(pBottom.x, pBottom.y + slabDepth);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Top isometric surface (snow diorama plateau)
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();

      const plateauGrad = ctx.createLinearGradient(pTop.x, pTop.y, pBottom.x, pBottom.y);
      plateauGrad.addColorStop(0, 'rgba(30, 41, 59, 0.75)');
      plateauGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
      ctx.fillStyle = plateauGrad;
      ctx.fill();
      ctx.strokeStyle = borderGlow;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Subtle Isometric Grid Lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      const gridStep = isExpanded ? 8 : 12;
      for (let s = -halfW + gridStep; s < halfW; s += gridStep) {
        const a = worldToIso(s, -halfL);
        const b = worldToIso(s, halfL);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        const c = worldToIso(-halfW, s);
        const d = worldToIso(halfW, s);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }

      // 4. Draw Road Network (Avenues, Town Square, and Driveways)
      // Main horizontal avenue
      const roadHalfW = 4.5;
      const h1 = worldToIso(-halfW, -roadHalfW);
      const h2 = worldToIso(halfW, -roadHalfW);
      const h3 = worldToIso(halfW, roadHalfW);
      const h4 = worldToIso(-halfW, roadHalfW);
      ctx.beginPath();
      ctx.moveTo(h1.x, h1.y);
      ctx.lineTo(h2.x, h2.y);
      ctx.lineTo(h3.x, h3.y);
      ctx.lineTo(h4.x, h4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(24, 32, 47, 0.95)';
      ctx.fill();

      // Main vertical avenue
      const v1 = worldToIso(-roadHalfW, -halfL);
      const v2 = worldToIso(roadHalfW, -halfL);
      const v3 = worldToIso(roadHalfW, halfL);
      const v4 = worldToIso(-roadHalfW, halfL);
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.lineTo(v3.x, v3.y);
      ctx.lineTo(v4.x, v4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(24, 32, 47, 0.95)';
      ctx.fill();

      // Center square / roundabout
      const sqRad = 7.5;
      const sq1 = worldToIso(-sqRad, -sqRad);
      const sq2 = worldToIso(sqRad, -sqRad);
      const sq3 = worldToIso(sqRad, sqRad);
      const sq4 = worldToIso(-sqRad, sqRad);
      ctx.beginPath();
      ctx.moveTo(sq1.x, sq1.y);
      ctx.lineTo(sq2.x, sq2.y);
      ctx.lineTo(sq3.x, sq3.y);
      ctx.lineTo(sq4.x, sq4.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(28, 38, 54, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Real-Time Cleared Snow Visualization
      // Shows where the player has plowed roads in real time
      if (data.snowData && data.snowData.snowDepthGrid) {
        const { snowDepthGrid, gridResolution } = data.snowData;
        const step = isExpanded ? 3 : 4;

        for (let gy = 0; gy < gridResolution; gy += step) {
          for (let gx = 0; gx < gridResolution; gx += step) {
            const idx = gy * gridResolution + gx;
            const depth = snowDepthGrid[idx];

            // If snow has been plowed here (depth lowered from 255)
            if (depth < 205) {
              const wx = ((gx + 0.5) / gridResolution - 0.5) * mapW;
              const wz = ((gy + 0.5) / gridResolution - 0.5) * mapL;
              const pt = worldToIso(wx, wz);

              const clearedRatio = (255 - depth) / 255;
              const dotSize = (isExpanded ? 2.2 : 1.7) * (0.8 + clearedRatio * 0.4);

              ctx.fillStyle = `rgba(56, 189, 248, ${0.25 + clearedRatio * 0.6})`;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 6. Draw Player's Recent Drift / Plow Tire Trail
      const trail = trailRef.current;
      if (trail.length > 1) {
        ctx.beginPath();
        for (let i = 0; i < trail.length; i++) {
          const pt = worldToIso(trail[i].x, trail[i].z);
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = isExpanded ? 2.0 : 1.5;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Draw Obstacles: Chalets, Pine Trees, and Streetlamps
      if (data.obstacles) {
        data.obstacles.forEach((obs) => {
          const pt = worldToIso(obs.x, obs.z);

          if (obs.type === 'house') {
            // Isometric 3D Chalet icon
            const hw = isExpanded ? 5 : 4;
            const hh = isExpanded ? 3.5 : 2.5;

            // Chalet timber walls
            ctx.fillStyle = '#92400e';
            ctx.fillRect(pt.x - hw, pt.y - hh, hw * 2, hh * 2);

            // Snowy A-frame roof top
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - hh - 3);
            ctx.lineTo(pt.x + hw + 1, pt.y - hh);
            ctx.lineTo(pt.x - hw - 1, pt.y - hh);
            ctx.closePath();
            ctx.fillStyle = '#f8fafc';
            ctx.fill();

            // Warm illuminated window dot
            ctx.fillStyle = timeOfDay === 'night' || timeOfDay === 'sunset' ? '#f59e0b' : '#fef08a';
            ctx.fillRect(pt.x - 1.2, pt.y - 0.5, 2.4, 2);
          } else if (obs.type === 'tree') {
            // Pine tree icon with snow tip
            const tr = isExpanded ? 2.5 : 1.8;
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, tr, 0, Math.PI * 2);
            ctx.fill();

            // Snow dust cap
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 1, tr * 0.45, 0, Math.PI * 2);
            ctx.fill();
          } else if (obs.type === 'lamp') {
            // Streetlamp post with glowing light pool
            const isDark = timeOfDay === 'night' || timeOfDay === 'sunset';
            if (isDark) {
              const lampGlow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, isExpanded ? 7 : 5);
              lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.45)');
              lampGlow.addColorStop(1, 'transparent');
              ctx.fillStyle = lampGlow;
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, isExpanded ? 7 : 5, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.fillStyle = isDark ? '#fbbf24' : '#94a3b8';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 8. Draw Snowdrifts (Remaining objectives to plow)
      if (data.snowData && data.snowData.drifts) {
        const pulse = 0.8 + Math.sin(Date.now() * 0.007) * 0.2;
        data.snowData.drifts.forEach((drift) => {
          if (!drift.cleared) {
            const pt = worldToIso(drift.x, drift.z);

            // Glowing diamond marker
            const sz = (isExpanded ? 3.4 : 2.5) * pulse;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - sz);
            ctx.lineTo(pt.x + sz, pt.y);
            ctx.lineTo(pt.x, pt.y + sz);
            ctx.lineTo(pt.x - sz, pt.y);
            ctx.closePath();

            ctx.fillStyle = '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      }

      // 9. Draw Player's Snow Plow Truck with Headlights, Heading Needle, and Beacon
      if (data.truckPos) {
        const pt = worldToIso(data.truckPos.x, data.truckPos.z);
        const heading = data.truckPos.heading;

        // Forward direction in 45-degree isometric projection:
        const fwX = -Math.sin(heading);
        const fwZ = -Math.cos(heading);
        const arrowIsoX = (fwX - fwZ) * 0.7071;
        const arrowIsoY = (fwX + fwZ) * 0.42;
        const arrowLen = Math.hypot(arrowIsoX, arrowIsoY) || 1;
        const normDirX = arrowIsoX / arrowLen;
        const normDirY = arrowIsoY / arrowLen;

        // A. Twin Headlight Cone Projection in isometric view
        const coneDist = isExpanded ? 24 : 16;
        const coneAngleSpread = 0.48;
        const tipX = pt.x + normDirX * coneDist;
        const tipY = pt.y + normDirY * coneDist;
        const perpX = -normDirY * (coneDist * coneAngleSpread);
        const perpY = normDirX * (coneDist * coneAngleSpread);

        const lightCone = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, coneDist);
        lightCone.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightCone.addColorStop(1, 'transparent');

        ctx.fillStyle = lightCone;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(tipX + perpX, tipY + perpY);
        ctx.lineTo(tipX - perpX, tipY - perpY);
        ctx.closePath();
        ctx.fill();

        // B. Pulsing radar ring
        const radarPulse = 1.0 + Math.sin(Date.now() * 0.008) * 0.35;
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (isExpanded ? 9 : 7) * radarPulse, 0, Math.PI * 2);
        ctx.stroke();

        // C. Directional needle pointing ahead
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = isExpanded ? 3.0 : 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + normDirX * (isExpanded ? 11 : 8.5), pt.y + normDirY * (isExpanded ? 11 : 8.5));
        ctx.stroke();

        // D. Truck Body Core Icon
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isExpanded ? 4.2 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // White cab center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isExpanded ? 1.6 : 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 10. Compass Rose (Top-Left corner of Canvas)
      const compX = isExpanded ? 24 : 18;
      const compY = isExpanded ? 24 : 18;
      const compRad = isExpanded ? 10 : 8;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.font = `${isExpanded ? '10px' : '8px'} monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', compX, compY - compRad - 4);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(compX, compY, compRad, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal crosshair
      ctx.beginPath();
      ctx.moveTo(compX, compY - compRad);
      ctx.lineTo(compX, compY + compRad);
      ctx.moveTo(compX - compRad, compY);
      ctx.lineTo(compX + compRad, compY);
      ctx.stroke();

      // North needle point (red tip)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(compX, compY - compRad);
      ctx.lineTo(compX - 2.5, compY);
      ctx.lineTo(compX + 2.5, compY);
      ctx.closePath();
      ctx.fill();
    };

    renderMinimap();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engine, timeOfDay, isExpanded]);

  const canvasDim = isExpanded ? 260 : 160;

  // Real-time telemetry calculations
  const headingDeg = Math.round(((-lastHeadingRef.current * 180) / Math.PI + 360) % 360);
  const getCardinal = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'N';
    if (deg < 67.5) return 'NE';
    if (deg < 112.5) return 'E';
    if (deg < 157.5) return 'SE';
    if (deg < 202.5) return 'S';
    if (deg < 247.5) return 'SW';
    if (deg < 292.5) return 'W';
    return 'NW';
  };

  // Position classes depending on selected corner
  const getCornerClasses = () => {
    switch (corner) {
      case 'bottom-right':
        return 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30';
      case 'top-left':
        return 'fixed top-24 left-4 sm:left-6 z-30';
      case 'top-right':
        return 'fixed top-24 right-4 sm:right-6 z-30';
      default:
        return 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30';
    }
  };

  return (
    <div
      className={`pointer-events-auto transition-all duration-300 ${getCornerClasses()}`}
    >
      <div
        className={`bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 transition-all duration-300 hover:border-cyan-500/50 ${
          isExpanded ? 'w-[284px]' : 'w-[184px]'
        }`}
      >
        {/* Minimap Top Header */}
        <div className="flex items-center justify-between px-1 text-slate-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              Minimap
            </span>
            <span className="text-[9px] font-mono text-slate-400 px-1 py-0.2 rounded bg-slate-800">
              ISO
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Real-time Cleared Badge */}
            <span className="text-[10px] font-mono text-cyan-300 tabular-nums font-bold mr-1">
              {percentCleared}%
            </span>

            {/* Corner Toggle */}
            <button
              onClick={cycleCorner}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition active:scale-95 cursor-pointer"
              title={`Switch Corner Position (Current: ${corner})`}
            >
              {corner === 'bottom-right' && <CornerDownRight className="w-3 h-3" />}
              {corner === 'top-left' && <CornerUpLeft className="w-3 h-3" />}
              {corner === 'top-right' && <CornerUpRight className="w-3 h-3" />}
            </button>

            {/* Expand / Minimize Toggle */}
            <button
              onClick={toggleExpanded}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
              title={isExpanded ? 'Compact Minimap (M)' : 'Expand Minimap (M)'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Isometric Radar Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-inner">
          <canvas
            ref={canvasRef}
            width={canvasDim}
            height={canvasDim}
            className="w-full aspect-square block cursor-crosshair select-none"
            title="Real-time Isometric Minimap: Orange = Plow Truck, Cyan = Cleared Roads & Drifts"
          />

          {/* Quick HUD Overlay Telemetry */}
          <div className="absolute top-1.5 right-1.5 flex flex-col items-end pointer-events-none text-[8px] font-mono text-slate-300 bg-slate-900/80 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-800">
            <span className="font-bold text-amber-300 tabular-nums">
              {headingDeg.toString().padStart(3, '0')}° {getCardinal(headingDeg)}
            </span>
            {isExpanded && (
              <span className="text-slate-400 tabular-nums text-[7.5px]">
                {lastPosRef.current.x.toFixed(1)}, {lastPosRef.current.z.toFixed(1)}
              </span>
            )}
          </div>

          {/* Compact Legend Indicator Badges */}
          {showDriftLegend && (
            <div className="absolute bottom-1 right-1.5 flex items-center gap-1.5 pointer-events-none text-[8px] font-mono bg-slate-900/85 backdrop-blur-xs px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" /> You
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" /> Drift
              </span>
            </div>
          )}
        </div>

        {/* Bottom Progress Bar & Target Indicator */}
        <div className="flex flex-col gap-1 px-0.5 pt-0.5">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>Plow Progress</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              {percentCleared}%
              {level && !level.isEndless && (
                <span className="text-slate-500 font-normal"> / {level.targetPercent}%</span>
              )}
            </span>
          </div>

          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 transition-all duration-200 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  level && !level.isEndless
                    ? (percentCleared / level.targetPercent) * 100
                    : percentCleared
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
