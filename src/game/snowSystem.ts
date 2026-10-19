import * as THREE from 'three';
import { SnowDriftData } from './types.ts';

export interface SnowPlowResult {
  cellsClearedDelta: number;
  driftsHit: SnowDriftData[];
  isPlowingSnow: boolean;
  isDeepSnow: boolean;
}

export class SnowSystem {
  private scene: THREE.Scene;
  private mapWidth: number;
  private mapLength: number;

  // Ground and road
  private roadMesh: THREE.Mesh;
  private snowMesh: THREE.Mesh;
  private snowGeo: THREE.PlaneGeometry;

  // Dynamic canvas texture for the snow layer
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private snowTexture: THREE.CanvasTexture;

  // Snow depth geometry configuration
  private snowSegments: number = 72; // 73x73 = 5,329 vertices for responsive 3D heightmap
  private initialSnowHeight: number = 0.28; // 28cm of fluffy fresh snow
  private normalUpdateCounter: number = 0;

  // Grid for tracking gradual snow depth
  private gridResolution: number = 96;
  private roadGrid: Uint8Array; // 1 = drivable road, 0 = non-road / obstacle
  private snowDepthGrid: Uint8Array; // 255 = full unplowed depth, 0 = clean asphalt
  private totalRoadCells: number = 0;
  private totalInitialDepth: number = 0;
  private currentRemainingDepth: number = 0;

  // 3D Snow Drift mounds
  private drifts: SnowDriftData[] = [];
  private driftMeshes: Map<number, THREE.Mesh> = new Map();
  private performanceMode: 'turbo' | 'balanced' | 'high' = 'balanced';
  private textureFrameCounter: number = 0;

  public setPerformanceMode(mode: 'turbo' | 'balanced' | 'high') {
    this.performanceMode = mode;
  }

  constructor(scene: THREE.Scene, mapWidth: number, mapLength: number) {
    this.scene = scene;
    this.mapWidth = mapWidth;
    this.mapLength = mapLength;

    // 1. Create Base Road Ground (Dark wet asphalt / cobblestones)
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 1024;
    roadCanvas.height = 1024;
    const rCtx = roadCanvas.getContext('2d')!;

    // Dark slate asphalt base
    rCtx.fillStyle = '#1e293b';
    rCtx.fillRect(0, 0, 1024, 1024);

    // Subtle road cobblestone & grit texture
    for (let i = 0; i < 24000; i++) {
      const rx = Math.random() * 1024;
      const ry = Math.random() * 1024;
      rCtx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 23, 42, 0.45)' : 'rgba(51, 65, 85, 0.35)';
      rCtx.fillRect(rx, ry, 2, 2);
    }

    // Road markings & avenue layout
    rCtx.strokeStyle = 'rgba(254, 240, 138, 0.35)'; // yellow center divider
    rCtx.lineWidth = 4;
    rCtx.setLineDash([22, 18]);
    rCtx.beginPath();
    rCtx.moveTo(512, 60);
    rCtx.lineTo(512, 964);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(60, 512);
    rCtx.lineTo(964, 512);
    rCtx.stroke();
    rCtx.setLineDash([]);

    // Driveway borders
    rCtx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    rCtx.lineWidth = 3;
    rCtx.strokeRect(430, 430, 164, 164); // town square center ring

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.colorSpace = THREE.SRGBColorSpace;

    const groundGeo = new THREE.PlaneGeometry(mapWidth, mapLength, 16, 16);
    groundGeo.rotateX(-Math.PI / 2);

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.45, // wet sheen
      metalness: 0.2,
    });

    this.roadMesh = new THREE.Mesh(groundGeo, roadMat);
    this.roadMesh.position.set(0, 0, 0);
    this.roadMesh.receiveShadow = true;
    this.scene.add(this.roadMesh);

    // 2. Create Dynamic 3D Snow Depth Mesh on top
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d')!;

    this.resetSnowCanvas();

    this.snowTexture = new THREE.CanvasTexture(this.canvas);
    this.snowTexture.colorSpace = THREE.SRGBColorSpace;
    this.snowTexture.anisotropy = 4;

    const snowMat = new THREE.MeshStandardMaterial({
      map: this.snowTexture,
      transparent: true,
      alphaTest: 0.03,
      roughness: 0.9,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.snowGeo = new THREE.PlaneGeometry(mapWidth, mapLength, this.snowSegments, this.snowSegments);
    this.snowGeo.rotateX(-Math.PI / 2);

    this.initSnowHeights();

    this.snowMesh = new THREE.Mesh(this.snowGeo, snowMat);
    this.snowMesh.position.set(0, 0, 0);
    this.snowMesh.receiveShadow = true;
    this.snowMesh.castShadow = true;
    this.scene.add(this.snowMesh);

    // 3. Grids for tracking gradual depth
    this.roadGrid = new Uint8Array(this.gridResolution * this.gridResolution);
    this.snowDepthGrid = new Uint8Array(this.gridResolution * this.gridResolution);

    this.setupRoadGrid();
  }

  private initSnowHeights() {
    const pos = this.snowGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      // Soft organic powdery noise across the snow surface
      const noise =
        Math.sin(vx * 0.35) * Math.cos(vz * 0.35) * 0.04 +
        Math.sin(vx * 0.8 + vz * 0.6) * 0.02;
      pos.setY(i, this.initialSnowHeight + noise);
    }
    pos.needsUpdate = true;
    this.snowGeo.computeVertexNormals();
  }

  private resetSnowCanvas() {
    // Fill snow with soft winter white and subtle sparkles
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.fillRect(0, 0, 1024, 1024);

    // Add gentle powdery noise
    this.ctx.fillStyle = 'rgba(224, 242, 254, 0.4)';
    for (let i = 0; i < 5000; i++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      const sr = 1 + Math.random() * 3.5;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private setupRoadGrid() {
    this.totalRoadCells = 0;
    this.totalInitialDepth = 0;
    this.currentRemainingDepth = 0;

    const res = this.gridResolution;
    const center = Math.floor(res / 2);
    const roadWidthCells = 14;

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const idx = y * res + x;
        // Check if inside main avenues, town square, or driveways
        const inMainVertical = Math.abs(x - center) <= roadWidthCells / 2 && y >= 4 && y < res - 4;
        const inMainHorizontal = Math.abs(y - center) <= roadWidthCells / 2 && x >= 4 && x < res - 4;
        const inSquare = Math.abs(x - center) <= roadWidthCells * 1.4 && Math.abs(y - center) <= roadWidthCells * 1.4;

        const inDriveway =
          (x % 16 >= 6 && x % 16 <= 9 && (y < center - 6 || y > center + 6) && y > 6 && y < res - 6) ||
          (y % 16 >= 6 && y % 16 <= 9 && (x < center - 6 || x > center + 6) && x > 6 && x < res - 6);

        if (inMainVertical || inMainHorizontal || inSquare || inDriveway) {
          this.roadGrid[idx] = 1;
          this.snowDepthGrid[idx] = 255; // 100% full unplowed depth
          this.totalRoadCells++;
          this.totalInitialDepth += 255;
          this.currentRemainingDepth += 255;
        } else {
          this.roadGrid[idx] = 0;
          this.snowDepthGrid[idx] = 255;
        }
      }
    }
  }

  /**
   * Spawn 3D fluffy snowdrift mounds
   */
  public populateDrifts(drifts: Array<{ x: number; z: number; radius: number }>) {
    // Clear old drifts
    this.driftMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      this.scene.remove(mesh);
    });
    this.driftMeshes.clear();
    this.drifts = [];

    const driftMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.9,
      metalness: 0.02,
      flatShading: true,
    });

    drifts.forEach((d, i) => {
      const driftData: SnowDriftData = {
        id: i,
        x: d.x,
        z: d.z,
        radius: d.radius,
        originalRadius: d.radius,
        value: Math.round(d.radius * 25),
        cleared: false,
      };
      this.drifts.push(driftData);

      // Low-poly sculpted fluffy snow pile
      const geo = new THREE.CylinderGeometry(d.radius * 0.4, d.radius, 0.75, 10, 2);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        const vy = pos.getY(j);
        if (vy > 0) {
          pos.setY(j, vy + Math.sin(j * 3) * 0.15);
        }
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, driftMat);
      mesh.position.set(d.x, 0.35, d.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.driftMeshes.set(i, mesh);
    });
  }

  /**
   * World (x, z) to Canvas (cx, cy)
   */
  private worldToCanvas(x: number, z: number): { cx: number; cy: number } {
    const u = (x + this.mapWidth / 2) / this.mapWidth;
    const v = (z + this.mapLength / 2) / this.mapLength;
    return {
      cx: Math.max(0, Math.min(1024, u * 1024)),
      cy: Math.max(0, Math.min(1024, v * 1024)),
    };
  }

  /**
   * World (x, z) to Grid cell (gx, gy)
   */
  private worldToGrid(x: number, z: number): { gx: number; gy: number } {
    const u = (x + this.mapWidth / 2) / this.mapWidth;
    const v = (z + this.mapLength / 2) / this.mapLength;
    return {
      gx: Math.floor(u * this.gridResolution),
      gy: Math.floor(v * this.gridResolution),
    };
  }

  /**
   * Plow snow with gradual 3D depth reduction and multi-pass clearing
   */
  public plowAt(
    bladePos: THREE.Vector3,
    bladeAngle: number,
    bladeWidth: number,
    plowSpeed: number,
    isHeated: boolean = false,
    hasSalter: boolean = false
  ): SnowPlowResult {
    const result: SnowPlowResult = {
      cellsClearedDelta: 0,
      driftsHit: [],
      isPlowingSnow: false,
      isDeepSnow: false,
    };

    if (plowSpeed < 0.3) return result;

    const { cx, cy } = this.worldToCanvas(bladePos.x, bladePos.z);
    const canvasBladeWidth = (bladeWidth / this.mapWidth) * 1024;
    const radius = Math.max(14, canvasBladeWidth * 0.65 * (isHeated ? 1.25 : 1.0));

    // 1. Gradual Canvas Shading Reduction
    // Instead of instant 100% removal, each pass gradually thins the snow layer
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    // Alpha carve rate: heated blade cuts through in 1-2 passes, standard blade in 2-3 passes
    this.ctx.globalAlpha = isHeated ? 0.8 : 0.45;

    const grad = this.ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = grad;

    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // If salter active, also clear rear trail
    if (hasSalter) {
      const rearPos = bladePos.clone().add(
        new THREE.Vector3(-Math.sin(bladeAngle) * 2.2, 0, -Math.cos(bladeAngle) * 2.2)
      );
      const r = this.worldToCanvas(rearPos.x, rearPos.z);
      this.ctx.globalAlpha = 0.6;
      this.ctx.beginPath();
      this.ctx.arc(r.cx, r.cy, radius * 0.75, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // Throttled canvas texture upload to avoid choking mobile GPU memory bus
    this.textureFrameCounter++;
    const textureSyncFreq = this.performanceMode === 'turbo' ? 3 : (this.performanceMode === 'balanced' ? 2 : 1);
    if (this.textureFrameCounter % textureSyncFreq === 0) {
      this.snowTexture.needsUpdate = true;
    }

    // 2. Physical 3D Snow Heightmap Displacement (Optimized Spatial Bounding Box)
    const pos = this.snowGeo.attributes.position;
    const bladeRadius = bladeWidth * 0.58;
    const bladeRadiusSq = bladeRadius * bladeRadius;
    const bermRadiusSq = Math.pow(bladeRadius * 1.35, 2);

    const minX = bladePos.x - bladeRadius * 1.35;
    const maxX = bladePos.x + bladeRadius * 1.35;
    const minZ = bladePos.z - bladeRadius * 1.35;
    const maxZ = bladePos.z + bladeRadius * 1.35;

    let verticesModified = false;
    const speedRatio = Math.min(1.4, Math.max(0.7, plowSpeed / 3.0));
    const carveHeightRate = (isHeated ? 0.22 : 0.11) * speedRatio;

    // PlaneGeometry creates a grid of (snowSegments + 1) vertices along X and Z
    const cols = this.snowSegments + 1;
    const colMin = Math.max(0, Math.floor(((minX + this.mapWidth / 2) / this.mapWidth) * this.snowSegments));
    const colMax = Math.min(this.snowSegments, Math.ceil(((maxX + this.mapWidth / 2) / this.mapWidth) * this.snowSegments));
    const rowMin = Math.max(0, Math.floor(((minZ + this.mapLength / 2) / this.mapLength) * this.snowSegments));
    const rowMax = Math.min(this.snowSegments, Math.ceil(((maxZ + this.mapLength / 2) / this.mapLength) * this.snowSegments));

    for (let r = rowMin; r <= rowMax; r++) {
      const rowOffset = r * cols;
      for (let c = colMin; c <= colMax; c++) {
        const i = rowOffset + c;
        const vx = pos.getX(i);
        const vz = pos.getZ(i);

        const distSq = (vx - bladePos.x) * (vx - bladePos.x) + (vz - bladePos.z) * (vz - bladePos.z);
        if (distSq <= bladeRadiusSq) {
          const curY = pos.getY(i);
          if (curY > 0.02) {
            if (curY > 0.15) {
              result.isDeepSnow = true;
            }
            // Sinks downward as snow is scooped away
            const newY = Math.max(0.016, curY - carveHeightRate);
            pos.setY(i, newY);
            verticesModified = true;
            result.isPlowingSnow = true;
          }
        } else if (distSq <= bermRadiusSq) {
          // Displaced snow forms a subtle raised snowbank ridge along the road edges
          const curY = pos.getY(i);
          if (curY > 0.05 && curY < 0.44) {
            pos.setY(i, Math.min(0.44, curY + 0.012));
            verticesModified = true;
          }
        }
      }
    }

    if (verticesModified) {
      pos.needsUpdate = true;
      this.normalUpdateCounter++;
      const normalFreq = this.performanceMode === 'turbo' ? 12 : (this.performanceMode === 'balanced' ? 6 : 3);
      if (this.normalUpdateCounter % normalFreq === 0) {
        this.snowGeo.computeVertexNormals();
      }
    }

    // 3. Grid Snow Depth Tracking & Scoring
    const { gx, gy } = this.worldToGrid(bladePos.x, bladePos.z);
    const cellRadius = Math.max(1, Math.ceil((bladeWidth / this.mapWidth) * this.gridResolution * 0.6));
    const depthCarve = (isHeated ? 140 : 80) * speedRatio;

    let totalCarvedInStep = 0;
    for (let dy = -cellRadius; dy <= cellRadius; dy++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx >= 0 && nx < this.gridResolution && ny >= 0 && ny < this.gridResolution) {
          const idx = ny * this.gridResolution + nx;
          if (this.roadGrid[idx] === 1) {
            const currentDepth = this.snowDepthGrid[idx];
            if (currentDepth > 0) {
              const reduce = Math.min(currentDepth, depthCarve);
              this.snowDepthGrid[idx] = currentDepth - reduce;
              this.currentRemainingDepth -= reduce;
              totalCarvedInStep += reduce;
              result.isPlowingSnow = true;
              if (currentDepth > 140) {
                result.isDeepSnow = true;
              }
            }
          }
        }
      }
    }

    if (totalCarvedInStep > 0) {
      // Delta proportional to actual snow volume displaced
      result.cellsClearedDelta = Math.max(1, Math.round(totalCarvedInStep / 110));
    }

    // 4. Check for 3D Snow Drift hits
    const hitRadius = bladeWidth * 0.75;
    for (let i = 0; i < this.drifts.length; i++) {
      const d = this.drifts[i];
      if (d.cleared) continue;

      const dist = Math.hypot(bladePos.x - d.x, bladePos.z - d.z);
      if (dist < hitRadius + d.radius) {
        d.radius -= 0.5;
        const mesh = this.driftMeshes.get(d.id);
        if (d.radius <= 0.4) {
          d.cleared = true;
          result.driftsHit.push(d);
          if (mesh) {
            mesh.visible = false;
          }
        } else if (mesh) {
          const scale = d.radius / d.originalRadius;
          mesh.scale.set(scale, scale * 0.6, scale);
        }
        result.isPlowingSnow = true;
        result.isDeepSnow = true;
      }
    }

    return result;
  }

  /**
   * Percentage of total snow volume cleared (0 to 100)
   */
  public getPercentCleared(): number {
    if (this.totalInitialDepth === 0) return 0;
    const cleared = this.totalInitialDepth - this.currentRemainingDepth;
    return Math.min(100, Math.round((cleared / this.totalInitialDepth) * 100));
  }

  /**
   * Snapshot data for the real-time Minimap
   */
  public getMinimapGrid(): {
    snowDepthGrid: Uint8Array;
    roadGrid: Uint8Array;
    gridResolution: number;
    mapWidth: number;
    mapLength: number;
    drifts: Array<{ x: number; z: number; cleared: boolean; radius: number }>;
  } {
    return {
      snowDepthGrid: this.snowDepthGrid,
      roadGrid: this.roadGrid,
      gridResolution: this.gridResolution,
      mapWidth: this.mapWidth,
      mapLength: this.mapLength,
      drifts: this.drifts.map((d) => ({
        x: d.x,
        z: d.z,
        cleared: d.cleared,
        radius: d.radius,
      })),
    };
  }

  /**
   * Reset the snow layer for level replay or reset
   */
  public reset() {
    this.resetSnowCanvas();
    this.snowTexture.needsUpdate = true;
    this.initSnowHeights();
    this.setupRoadGrid();
    this.drifts.forEach((d) => {
      d.cleared = false;
      d.radius = d.originalRadius;
      const mesh = this.driftMeshes.get(d.id);
      if (mesh) {
        mesh.visible = true;
        mesh.scale.set(1, 1, 1);
      }
    });
  }

  public dispose() {
    this.roadMesh.geometry.dispose();
    if (this.roadMesh.material instanceof THREE.Material) {
      this.roadMesh.material.dispose();
    }
    this.scene.remove(this.roadMesh);

    this.snowGeo.dispose();
    if (this.snowMesh.material instanceof THREE.Material) {
      this.snowMesh.material.dispose();
    }
    this.scene.remove(this.snowMesh);

    this.driftMeshes.forEach((m) => {
      m.geometry.dispose();
      if (m.material instanceof THREE.Material) m.material.dispose();
      this.scene.remove(m);
    });
    this.driftMeshes.clear();
  }
}
