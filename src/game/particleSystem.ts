import * as THREE from 'three';

export interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface TrailParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  initialSize: number;
  maxSize: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;

  // Falling snow
  private snowPoints: THREE.Points;
  private snowMat: THREE.PointsMaterial;
  private snowGeo: THREE.BufferGeometry;
  private snowPositions: Float32Array;
  private snowVelocities: Float32Array;
  private snowCount: number = 1800;
  private activeSnowCount: number = 1800;
  private snowBounds = { x: 70, y: 35, z: 70 };

  // Weather parameters
  private weather: 'clear' | 'light_snow' | 'blizzard' = 'light_snow';
  private targetWindX: number = 0.5;
  private targetWindZ: number = 0.3;
  private targetFallSpeed: number = 2.2;
  private targetOpacity: number = 0.85;
  private targetSize: number = 0.35;

  // Dynamic spray and smoke particles
  private dynamicParticles: Particle[] = [];
  private dynamicMesh: THREE.InstancedMesh;
  private maxDynamicParticles: number = 600;
  private maxDynamicLimit: number = 600;

  // Lingering snow plow trail particles
  private trailParticles: TrailParticle[] = [];
  private trailMesh: THREE.InstancedMesh;
  private maxTrailParticles: number = 800;
  private maxTrailLimit: number = 800;

  private quality: 'low' | 'medium' | 'high' = 'high';

  private dummy: THREE.Object3D = new THREE.Object3D();
  private colorDummy: THREE.Color = new THREE.Color();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Falling snow points
    this.snowPositions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      const idx = i * 3;
      this.snowPositions[idx] = (Math.random() - 0.5) * this.snowBounds.x * 2;
      this.snowPositions[idx + 1] = Math.random() * this.snowBounds.y;
      this.snowPositions[idx + 2] = (Math.random() - 0.5) * this.snowBounds.z * 2;

      this.snowVelocities[idx] = (Math.random() - 0.5) * 0.8; // wind drift
      this.snowVelocities[idx + 1] = -(1.5 + Math.random() * 2.5); // fall speed
      this.snowVelocities[idx + 2] = (Math.random() - 0.5) * 0.8;
    }

    this.snowGeo = new THREE.BufferGeometry();
    this.snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));

    // Procedural round snowflake texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.5, 'rgba(235, 245, 255, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const snowTex = new THREE.CanvasTexture(canvas);
    snowTex.colorSpace = THREE.SRGBColorSpace;

    this.snowMat = new THREE.PointsMaterial({
      size: 0.35,
      map: snowTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.snowPoints = new THREE.Points(this.snowGeo, this.snowMat);
    this.scene.add(this.snowPoints);

    // 2. Instanced mesh for spray, puffs, and smoke
    const particleGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const particleMat = new THREE.MeshStandardMaterial({
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.9,
    });

    this.dynamicMesh = new THREE.InstancedMesh(particleGeo, particleMat, this.maxDynamicParticles);
    this.dynamicMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.dynamicMesh.instanceColor) {
      this.dynamicMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    this.scene.add(this.dynamicMesh);

    // Initialize instanced positions out of view
    for (let i = 0; i < this.maxDynamicParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.dynamicMesh.setMatrixAt(i, this.dummy.matrix);
      this.dynamicMesh.setColorAt(i, this.colorDummy.setHex(0xffffff));
    }
    this.dynamicMesh.instanceMatrix.needsUpdate = true;
    if (this.dynamicMesh.instanceColor) this.dynamicMesh.instanceColor.needsUpdate = true;

    // 3. Instanced mesh for lingering snow plow trails
    const trailGeo = new THREE.DodecahedronGeometry(0.3, 1);
    const trailMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    this.trailMesh = new THREE.InstancedMesh(trailGeo, trailMat, this.maxTrailParticles);
    this.trailMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (this.trailMesh.instanceColor) {
      this.trailMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }
    this.scene.add(this.trailMesh);

    for (let i = 0; i < this.maxTrailParticles; i++) {
      this.dummy.position.set(0, -999, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.trailMesh.setMatrixAt(i, this.dummy.matrix);
      this.trailMesh.setColorAt(i, this.colorDummy.setHex(0xffffff));
    }
    this.trailMesh.instanceMatrix.needsUpdate = true;
    if (this.trailMesh.instanceColor) this.trailMesh.instanceColor.needsUpdate = true;
  }

  /**
   * Spawn snow spray from plow blade
   */
  public emitSnowSpray(
    bladePos: THREE.Vector3,
    direction: THREE.Vector3,
    bladeAngle: number,
    plowSpeed: number,
    isHeated: boolean = false
  ) {
    if (plowSpeed < 0.8) return;

    const count = Math.min(6, Math.floor(plowSpeed * 0.7));
    const right = new THREE.Vector3(-direction.z, 0, direction.x);

    for (let i = 0; i < count; i++) {
      if (this.dynamicParticles.length >= this.maxDynamicParticles) {
        this.dynamicParticles.shift();
      }

      // Spray to both left and right sides, arcing up and outward
      const side = Math.random() > 0.5 ? 1 : -1;
      const offset = right.clone().multiplyScalar(side * (0.8 + Math.random() * 1.2));
      const spawnPos = bladePos.clone().add(offset);
      spawnPos.y += 0.2 + Math.random() * 0.3;

      const vel = right
        .clone()
        .multiplyScalar(side * (2.0 + Math.random() * 3.5 + plowSpeed * 0.3))
        .add(direction.clone().multiplyScalar(1.0 + Math.random() * 1.5))
        .add(new THREE.Vector3(0, 2.5 + Math.random() * 2.5, 0));

      const particleColor = isHeated
        ? new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.9) // steam cyan
        : new THREE.Color(0xffffff).lerp(new THREE.Color(0xdbeafe), Math.random() * 0.5);

      this.dynamicParticles.push({
        pos: spawnPos,
        vel,
        color: particleColor,
        size: 0.18 + Math.random() * 0.22,
        alpha: 0.9,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
      });
    }
  }

  /**
   * Emit chimney smoke puff
   */
  public emitChimneySmoke(chimneyPos: THREE.Vector3) {
    if (this.dynamicParticles.length >= this.maxDynamicParticles) {
      this.dynamicParticles.shift();
    }

    const pos = chimneyPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      0,
      (Math.random() - 0.5) * 0.2
    ));

    const vel = new THREE.Vector3(
      0.2 + (Math.random() - 0.5) * 0.3,
      1.2 + Math.random() * 0.6,
      0.1 + (Math.random() - 0.5) * 0.3
    );

    this.dynamicParticles.push({
      pos,
      vel,
      color: new THREE.Color(0xdfe6ed),
      size: 0.35 + Math.random() * 0.2,
      alpha: 0.6,
      life: 0,
      maxLife: 2.2 + Math.random() * 1.0,
    });
  }

  /**
   * Emit salt spreader grains behind truck
   */
  public emitSaltGrains(rearPos: THREE.Vector3, speed: number) {
    if (speed < 0.5) return;
    const count = 3;
    for (let i = 0; i < count; i++) {
      if (this.dynamicParticles.length >= this.maxDynamicParticles) {
        this.dynamicParticles.shift();
      }

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        0.5 + Math.random() * 0.4,
        (Math.random() - 0.5) * 2.2
      );

      this.dynamicParticles.push({
        pos: rearPos.clone().add(spread),
        vel: spread.clone().multiplyScalar(1.2).setY(-2.5),
        color: new THREE.Color(0x93c5fd), // sparkling crystal blue
        size: 0.12,
        alpha: 0.8,
        life: 0,
        maxLife: 0.5,
      });
    }
  }

  /**
   * Emit boost turbo flames/glow
   */
  public emitBoostTrail(exhaustPos: THREE.Vector3, backwardDir: THREE.Vector3) {
    const count = 2;
    for (let i = 0; i < count; i++) {
      if (this.dynamicParticles.length >= this.maxDynamicParticles) {
        this.dynamicParticles.shift();
      }

      const vel = backwardDir.clone().multiplyScalar(4 + Math.random() * 3).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.6, (Math.random() - 0.5) * 0.5)
      );

      this.dynamicParticles.push({
        pos: exhaustPos.clone(),
        vel,
        color: Math.random() > 0.4 ? new THREE.Color(0x38bdf8) : new THREE.Color(0xf59e0b),
        size: 0.24,
        alpha: 0.9,
        life: 0,
        maxLife: 0.3,
      });
    }
  }

  /**
   * Emit lingering trail particles behind the plow to visually show cleared path
   */
  public emitPlowTrail(
    leftTrackPos: THREE.Vector3,
    rightTrackPos: THREE.Vector3,
    speed: number,
    isHeated: boolean = false,
    hasSalter: boolean = false
  ) {
    if (speed < 0.3) return;

    // Track points across the blade span
    const points = [
      leftTrackPos,
      rightTrackPos,
      leftTrackPos.clone().lerp(rightTrackPos, 0.5) // center point for continuous trail coverage
    ];

    points.forEach((pt) => {
      if (this.trailParticles.length >= this.maxTrailParticles) {
        this.trailParticles.shift();
      }

      const spawnPos = pt.clone();
      spawnPos.y = 0.12 + Math.random() * 0.1;
      spawnPos.x += (Math.random() - 0.5) * 0.35;
      spawnPos.z += (Math.random() - 0.5) * 0.35;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2 + this.targetWindX * 0.08,
        0.06 + Math.random() * (isHeated ? 0.22 : 0.1), // gentle upward buoyant drift
        (Math.random() - 0.5) * 0.2 + this.targetWindZ * 0.08
      );

      let col = new THREE.Color(0xf1f5f9);
      if (isHeated) {
        // Lingering warm steam mist
        col = new THREE.Color(0xe0f2fe).lerp(new THREE.Color(0xfef3c7), 0.35);
      } else if (hasSalter && Math.random() > 0.55) {
        // Sparkling salt crystals
        col = new THREE.Color(0x93c5fd);
      }

      this.trailParticles.push({
        pos: spawnPos,
        vel,
        color: col,
        initialSize: 0.24 + Math.random() * 0.12,
        maxSize: 0.75 + Math.random() * 0.35,
        life: 0,
        maxLife: 2.8 + Math.random() * 1.5, // Lingers for 2.8 to 4.3 seconds!
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.6,
      });
    });
  }

  /**
   * Set the active weather condition
   */
  public setWeather(weather: 'clear' | 'light_snow' | 'blizzard') {
    this.weather = weather;
    if (weather === 'blizzard') {
      this.targetWindX = 12.0;
      this.targetWindZ = 5.5;
      this.targetFallSpeed = 5.2;
      this.targetOpacity = 0.95;
      this.targetSize = 0.48;
    } else if (weather === 'clear') {
      this.targetWindX = 0.2;
      this.targetWindZ = 0.1;
      this.targetFallSpeed = 0.8;
      this.targetOpacity = 0.2;
      this.targetSize = 0.2;
    } else {
      this.targetWindX = 0.8;
      this.targetWindZ = 0.4;
      this.targetFallSpeed = 2.2;
      this.targetOpacity = 0.85;
      this.targetSize = 0.35;
    }
  }

  /**
   * Adaptive performance quality mode for low-end / older phones
   */
  public setQuality(quality: 'low' | 'medium' | 'high') {
    this.quality = quality;
    if (quality === 'low') {
      this.activeSnowCount = 450;
      this.maxDynamicLimit = 120;
      this.maxTrailLimit = 150;
    } else if (quality === 'medium') {
      this.activeSnowCount = 900;
      this.maxDynamicLimit = 280;
      this.maxTrailLimit = 380;
    } else {
      this.activeSnowCount = 1800;
      this.maxDynamicLimit = 600;
      this.maxTrailLimit = 800;
    }
    this.snowGeo.setDrawRange(0, this.activeSnowCount);

    // Trim excess dynamic particles immediately if switching down
    if (this.dynamicParticles.length > this.maxDynamicLimit) {
      this.dynamicParticles.length = this.maxDynamicLimit;
    }
    if (this.trailParticles.length > this.maxTrailLimit) {
      this.trailParticles.length = this.maxTrailLimit;
    }
  }

  /**
   * Update all particle systems with instanced count optimization
   */
  public update(delta: number, centerTarget: THREE.Vector3) {
    const dt = Math.min(delta, 0.05);

    // Smoothly transition snowflake material opacity and size
    this.snowMat.opacity = THREE.MathUtils.damp(this.snowMat.opacity, this.targetOpacity, 2.5, dt);
    this.snowMat.size = THREE.MathUtils.damp(this.snowMat.size, this.targetSize, 2.5, dt);

    // 1. Update falling snow relative to truck/camera position
    const positions = this.snowPositions;
    const velocities = this.snowVelocities;
    const halfX = this.snowBounds.x;
    const halfZ = this.snowBounds.z;
    const maxY = this.snowBounds.y;

    const countToUpdate = this.activeSnowCount;
    for (let i = 0; i < countToUpdate; i++) {
      const idx = i * 3;

      // Gradually steer particle velocities towards current weather wind targets
      velocities[idx] = THREE.MathUtils.damp(velocities[idx], this.targetWindX + (Math.sin(i * 0.2) * 1.5), 1.8, dt);
      velocities[idx + 1] = THREE.MathUtils.damp(velocities[idx + 1], -this.targetFallSpeed - (Math.cos(i) * 0.8), 1.8, dt);
      velocities[idx + 2] = THREE.MathUtils.damp(velocities[idx + 2], this.targetWindZ + (Math.cos(i * 0.3) * 1.2), 1.8, dt);

      positions[idx] += velocities[idx] * dt;
      positions[idx + 1] += velocities[idx + 1] * dt;
      positions[idx + 2] += velocities[idx + 2] * dt;

      // Wrap around bounds centered at camera target
      if (positions[idx + 1] < 0) {
        positions[idx + 1] = maxY;
        positions[idx] = centerTarget.x + (Math.random() - 0.5) * halfX * 2;
        positions[idx + 2] = centerTarget.z + (Math.random() - 0.5) * halfZ * 2;
      }
      if (positions[idx] < centerTarget.x - halfX) positions[idx] += halfX * 2;
      if (positions[idx] > centerTarget.x + halfX) positions[idx] -= halfX * 2;
      if (positions[idx + 2] < centerTarget.z - halfZ) positions[idx + 2] += halfZ * 2;
      if (positions[idx + 2] > centerTarget.z + halfZ) positions[idx + 2] -= halfZ * 2;
    }
    this.snowGeo.attributes.position.needsUpdate = true;

    // 2. Update dynamic instanced particles
    for (let i = this.dynamicParticles.length - 1; i >= 0; i--) {
      const p = this.dynamicParticles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.dynamicParticles.splice(i, 1);
        continue;
      }

      p.pos.addScaledVector(p.vel, dt);
      p.vel.y -= 7.5 * dt; // gravity
      p.vel.multiplyScalar(0.96); // drag
    }

    // Update instanced mesh with dynamic draw count (only render active particles)
    const renderDynamicCount = Math.min(this.dynamicParticles.length, this.maxDynamicLimit);
    this.dynamicMesh.count = renderDynamicCount;

    for (let i = 0; i < renderDynamicCount; i++) {
      const p = this.dynamicParticles[i];
      const progress = p.life / p.maxLife;
      const currentScale = p.size * (1 - progress * 0.4);

      this.dummy.position.copy(p.pos);
      this.dummy.scale.set(currentScale, currentScale, currentScale);
      this.dummy.rotation.x += dt * 3;
      this.dummy.rotation.y += dt * 2;
      this.dummy.updateMatrix();
      this.dynamicMesh.setMatrixAt(i, this.dummy.matrix);

      this.colorDummy.copy(p.color).multiplyScalar(1 - progress * 0.3);
      this.dynamicMesh.setColorAt(i, this.colorDummy);
    }

    if (renderDynamicCount > 0 || this.dynamicParticles.length === 0) {
      this.dynamicMesh.instanceMatrix.needsUpdate = true;
      if (this.dynamicMesh.instanceColor) this.dynamicMesh.instanceColor.needsUpdate = true;
    }

    // 3. Update lingering snow plow trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const tp = this.trailParticles[i];
      tp.life += dt;

      if (tp.life >= tp.maxLife) {
        this.trailParticles.splice(i, 1);
        continue;
      }

      tp.pos.addScaledVector(tp.vel, dt);
      tp.vel.multiplyScalar(0.97); // gentle drag
      tp.rotation += tp.rotSpeed * dt;
    }

    const renderTrailCount = Math.min(this.trailParticles.length, this.maxTrailLimit);
    this.trailMesh.count = renderTrailCount;

    for (let i = 0; i < renderTrailCount; i++) {
      const tp = this.trailParticles[i];
      const progress = tp.life / tp.maxLife; // 0 to 1

      // Expands as it dissipates softly
      const currentScale = tp.initialSize + (tp.maxSize - tp.initialSize) * Math.sin(progress * Math.PI * 0.5);

      this.dummy.position.copy(tp.pos);
      this.dummy.scale.set(currentScale, currentScale * 0.45, currentScale);
      this.dummy.rotation.y = tp.rotation;
      this.dummy.updateMatrix();
      this.trailMesh.setMatrixAt(i, this.dummy.matrix);

      // Smooth fadeout as it lingers
      const fadeAlpha = Math.max(0, 1 - progress);
      this.colorDummy.copy(tp.color).multiplyScalar(fadeAlpha * 0.85);
      this.trailMesh.setColorAt(i, this.colorDummy);
    }

    if (renderTrailCount > 0 || this.trailParticles.length === 0) {
      this.trailMesh.instanceMatrix.needsUpdate = true;
      if (this.trailMesh.instanceColor) this.trailMesh.instanceColor.needsUpdate = true;
    }
  }

  public dispose() {
    this.snowGeo.dispose();
    if (this.snowPoints.material instanceof THREE.Material) {
      this.snowPoints.material.dispose();
    }
    this.scene.remove(this.snowPoints);

    this.dynamicMesh.geometry.dispose();
    if (this.dynamicMesh.material instanceof THREE.Material) {
      this.dynamicMesh.material.dispose();
    }
    this.scene.remove(this.dynamicMesh);

    this.trailMesh.geometry.dispose();
    if (this.trailMesh.material instanceof THREE.Material) {
      this.trailMesh.material.dispose();
    }
    this.scene.remove(this.trailMesh);
  }
}
