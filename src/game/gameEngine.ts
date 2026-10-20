import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { synthAudio } from '../audio/synthAudio.ts';
import { LEVELS, TRUCK_COLORS, UPGRADES } from './constants.ts';
import { ParticleSystem } from './particleSystem.ts';
import {
  createAlpineChalet,
  createFenceSegment,
  createMailbox,
  createSnowman,
  createSnowPineTree,
  createSnowPlowTruck,
  createStreetlamp,
  glowWindowMat,
} from './proceduralModels.ts';
import { SnowSystem } from './snowSystem.ts';
import { CompanyProgress, FloatingText, GameStats, LevelConfig, Obstacle, PerformanceMode, ScreenState, TimeOfDay, WeatherType } from './types.ts';

// Pre-allocated reusable math vectors for zero GC in render loop
const _tempScreenVec = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _lookTarget = new THREE.Vector3();
const _trailRight = new THREE.Vector3();
const _trailLeftPos = new THREE.Vector3();
const _trailRightPos = new THREE.Vector3();

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  // Subsystems
  private snowSystem: SnowSystem | null = null;
  private particleSystem: ParticleSystem | null = null;
  private plowTrailTimer: number = 0;

  // Truck object & kinematics
  private truckGroup: THREE.Group | null = null;
  private truckBeacon: THREE.Mesh | null = null;
  private truckWheels: THREE.Mesh[] = [];
  private truckPos = new THREE.Vector3(0, 0, 0);
  private truckHeading: number = 0; // radians
  private truckSpeed: number = 0; // m/s
  private steerAngle: number = 0;

  // Upgrades & Customization
  private upgrades: Record<string, number> = {
    bladeWidth: 1,
    enginePower: 1,
    studdedTires: 1,
    heatedBlade: 1,
    saltSpreader: 1,
    turboBoost: 1,
  };
  private selectedTruckColor: string = TRUCK_COLORS[0].hex;
  private selectedBladeColor: string = TRUCK_COLORS[0].bladeHex;

  // Level & Environment
  private currentLevelIndex: number = 0;
  private currentLevel: LevelConfig = LEVELS[0];
  private obstacles: Obstacle[] = [];
  private obstacleMeshes: THREE.Object3D[] = [];
  private chimneyPositions: THREE.Vector3[] = [];
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Dynamic Weather system
  private weather: WeatherType = 'light_snow';
  private weatherTimer: number = 35;
  private weatherDuration: number = 35;
  private targetFogDensity: number = 0.012;
  private targetLightIntensity: number = 2.4;
  private weatherTractionMultiplier: number = 1.0;
  private weatherCycleList: WeatherType[] = ['light_snow', 'blizzard', 'light_snow', 'clear'];
  private weatherCycleIndex: number = 0;

  // Dynamic Sun Position & Soft Shadow parameters
  private truckContactShadow: THREE.Mesh | null = null;
  private currentSunOffset = new THREE.Vector3(28, 38, 24);
  private targetSunOffset = new THREE.Vector3(28, 38, 24);
  private currentShadowRadius: number = 3.8;
  private targetShadowRadius: number = 3.8;
  private targetSunColor = new THREE.Color(0xfff5ea);
  private targetContactShadowOpacity: number = 0.45;
  private targetContactShadowScale = new THREE.Vector2(1.1, 1.25);

  // Time-of-Day Progression System (Morning -> Midday -> Sunset -> Deep Blue Night)
  private timeOfDayProgressionMode: 'auto' | TimeOfDay = 'auto';
  private timeOfDayCycleDuration: number = 150; // 150 seconds for a full 24h diurnal journey
  private timeOfDayPhase: number = 0.08; // 0.0 to 1.0 continuous diurnal phase
  private levelStartPhaseOffset: number = 0.08;
  private timeOfDayKey: TimeOfDay = 'morning';
  private inGameClockString: string = '08:00 AM';

  // Environmental lighting targets
  private targetSkyColor = new THREE.Color(0xdce7f3);
  private targetFogColor = new THREE.Color(0xdce7f3);
  private targetHemiSkyColor = new THREE.Color(0xe0f2fe);
  private targetHemiGroundColor = new THREE.Color(0x475569);
  private targetHemiIntensity: number = 1.2;

  // Village streetlamps, chalets, and truck headlights
  private streetLampLights: THREE.PointLight[] = [];
  private streetLampBulbMats: THREE.MeshStandardMaterial[] = [];
  private truckHeadlightSpot: THREE.SpotLight | null = null;
  private truckHeadlightLensMat: THREE.MeshStandardMaterial | null = null;
  private targetLampIntensity: number = 0.0;
  private targetLampBulbEmissive: number = 0.0;
  private targetWindowEmissive: number = 0.4;
  private targetHeadlightIntensity: number = 0.0;
  private targetHeadlightLensEmissive: number = 0.5;

  // Game state
  private screenState: ScreenState = 'title';
  private score: number = 0;
  private coins: number = 100; // start with a small bonus for early fun
  private combo: number = 1.0;
  private comboTimer: number = 0;
  private comboMaxTimer: number = 3.5;
  private maxComboThisRun: number = 1.0;
  private boostGauge: number = 1.0; // 0 to 1
  private isBoosting: boolean = false;
  private levelElapsedTime: number = 0;
  private hornCooldown: number = 0;
  private smokeTimer: number = 0;

  // Performance & Mobile optimization
  private performanceMode: PerformanceMode = 'turbo';
  private measuredFps: number = 60;
  private fpsHistory: number[] = [];
  private autoTuneCounter: number = 0;

  // Floating score popups
  private floatingTexts: FloatingText[] = [];
  private nextTextId: number = 1;

  // Input state
  private keys: Record<string, boolean> = {};
  private virtualJoystick = { x: 0, y: 0 };
  private touchBoost: boolean = false;
  private touchHorn: boolean = false;

  // Callbacks to UI
  private onStatsUpdate?: (stats: GameStats) => void;
  private onVictory?: (stats: { percent: number; coins: number; maxCombo: number }) => void;
  private onFloatingTextUpdate?: (texts: FloatingText[]) => void;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onStatsUpdate?: (stats: GameStats) => void;
      onVictory?: (stats: { percent: number; coins: number; maxCombo: number }) => void;
      onFloatingTextUpdate?: (texts: FloatingText[]) => void;
    }
  ) {
    this.container = container;
    this.onStatsUpdate = callbacks?.onStatsUpdate;
    this.onVictory = callbacks?.onVictory;
    this.onFloatingTextUpdate = callbacks?.onFloatingTextUpdate;

    // 1. Setup Three.js Scene & Renderer
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 300);
    this.camera.position.set(28, 32, 28);
    this.camera.lookAt(0, 0, 0);

    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
      ('ontouchstart' in window && window.innerWidth <= 1024);

    let initialMode: PerformanceMode = 'balanced';
    try {
      const saved = localStorage.getItem('snowplow_performance_mode') as PerformanceMode;
      if (saved === 'turbo' || saved === 'balanced' || saved === 'high') {
        initialMode = saved;
      } else if (isMobile) {
        initialMode = 'turbo';
      }
    } catch {
      if (isMobile) initialMode = 'turbo';
    }
    this.performanceMode = initialMode;

    const initialPixelRatio = isHeadless
      ? 1
      : this.performanceMode === 'turbo'
      ? 1.0
      : this.performanceMode === 'balanced'
      ? Math.min(window.devicePixelRatio, 1.25)
      : Math.min(window.devicePixelRatio, 1.75);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.performanceMode !== 'turbo',
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(initialPixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type =
      this.performanceMode === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Studio Reflection Map
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 3. Lighting Rig
    this.setupLighting();

    // 4. Particle System with Adaptive Quality
    this.particleSystem = new ParticleSystem(this.scene);
    this.particleSystem.setQuality(
      this.performanceMode === 'turbo' ? 'low' : this.performanceMode === 'balanced' ? 'medium' : 'high'
    );

    // 5. Load Level
    this.loadLevel(0);

    // 6. Bind Listeners
    this.bindEvents();

    // 7. Start Render Loop
    this.tick = this.tick.bind(this);
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  private setupLighting() {
    const shadowDim =
      this.performanceMode === 'turbo' ? 512 : this.performanceMode === 'balanced' ? 1024 : 2048;

    // Directional Key Sun Light
    this.dirLight = new THREE.DirectionalLight(0xfff5ea, 2.2);
    this.dirLight.position.set(30, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = shadowDim;
    this.dirLight.shadow.mapSize.height = shadowDim;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 120;
    const d = 32;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.025;
    this.dirLight.shadow.radius = this.currentShadowRadius;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    // Cool Sky / Warm Ground Hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0xcfd8dc, 0x374151, 1.2);
    this.scene.add(this.hemiLight);

    // Horizon winter fog
    this.scene.fog = new THREE.FogExp2(0xb6c9dc, 0.012);
  }

  /**
   * Continuous diurnal progression system:
   * Smoothly transitions lighting color palettes, sun elevation, soft shadows,
   * streetlamps, and chalet windows from crisp golden morning -> bright noon -> alpenglow sunset -> deep blue night.
   */
  private updateTimeOfDayProgression(dt: number) {
    if (this.screenState === 'playing' && this.timeOfDayProgressionMode === 'auto') {
      // Advance diurnal phase based on match elapsed time
      this.timeOfDayPhase = (this.levelStartPhaseOffset + (this.levelElapsedTime / this.timeOfDayCycleDuration)) % 1.0;
    }

    // Determine named phase
    const p = this.timeOfDayPhase;
    if (p >= 0.88 || p < 0.18) {
      this.timeOfDayKey = 'morning';
    } else if (p >= 0.18 && p < 0.46) {
      this.timeOfDayKey = 'midday';
    } else if (p >= 0.46 && p < 0.72) {
      this.timeOfDayKey = 'sunset';
    } else {
      this.timeOfDayKey = 'night';
    }

    // Convert normalized phase to in-game clock time (0.0 = 06:00 AM)
    const totalMinutes = Math.round(((p + 0.25) % 1.0) * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = Math.floor((totalMinutes % 60) / 5) * 5;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = (h % 12) || 12;
    this.inGameClockString = `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;

    // Define 5 keyframe stops for the diurnal color journey
    const keyframes = [
      {
        phase: 0.04,
        sunColor: 0xffd8b0, // warm morning peach
        sunOffset: new THREE.Vector3(34, 22, 20),
        sunIntensity: 2.2,
        skyColor: 0xdde7f5, // pastel morning azure
        fogColor: 0xdde7f5,
        fogDensity: 0.011,
        hemiSky: 0xc7dcfc,
        hemiGround: 0x5c4a3e,
        hemiIntensity: 1.15,
        shadowRadius: 2.8,
        contactShadowOpacity: 0.52,
        lampIntensity: 0.8,
        lampBulbEmissive: 0.6,
        windowEmissive: 0.8,
        headlightIntensity: 0.8,
      },
      {
        phase: 0.26,
        sunColor: 0xfff9f0, // brilliant crisp winter sunlight
        sunOffset: new THREE.Vector3(18, 44, 16),
        sunIntensity: 2.7,
        skyColor: 0xdce7f3, // crisp high alpine daylight
        fogColor: 0xdce7f3,
        fogDensity: 0.009,
        hemiSky: 0xe0f2fe,
        hemiGround: 0x475569,
        hemiIntensity: 1.3,
        shadowRadius: 1.6,
        contactShadowOpacity: 0.62,
        lampIntensity: 0.0,
        lampBulbEmissive: 0.1,
        windowEmissive: 0.35,
        headlightIntensity: 0.0,
      },
      {
        phase: 0.52,
        sunColor: 0xfb923c, // radiant golden amber alpenglow
        sunOffset: new THREE.Vector3(38, 14, -20),
        sunIntensity: 2.5,
        skyColor: 0xfbcfe8, // rose-peach sunset
        fogColor: 0xfbcfe8,
        fogDensity: 0.0125,
        hemiSky: 0xf472b6,
        hemiGround: 0x312e81,
        hemiIntensity: 1.25,
        shadowRadius: 2.2,
        contactShadowOpacity: 0.6,
        lampIntensity: 2.0,
        lampBulbEmissive: 1.4,
        windowEmissive: 1.2,
        headlightIntensity: 2.6,
      },
      {
        phase: 0.68,
        sunColor: 0xc084fc, // rich purple-magenta dusk horizon
        sunOffset: new THREE.Vector3(30, 10, -26),
        sunIntensity: 1.5,
        skyColor: 0x2e1065, // deep amethyst twilight
        fogColor: 0x2e1065,
        fogDensity: 0.014,
        hemiSky: 0x4f46e5,
        hemiGround: 0x1e1b4b,
        hemiIntensity: 1.05,
        shadowRadius: 4.2,
        contactShadowOpacity: 0.48,
        lampIntensity: 3.0,
        lampBulbEmissive: 2.0,
        windowEmissive: 1.5,
        headlightIntensity: 4.2,
      },
      {
        phase: 0.85,
        sunColor: 0x60a5fa, // magical silvery cobalt moonlight
        sunOffset: new THREE.Vector3(16, 36, 18),
        sunIntensity: 1.15,
        skyColor: 0x080e1c, // deep midnight navy
        fogColor: 0x080e1c,
        fogDensity: 0.015,
        hemiSky: 0x1e3a8a,
        hemiGround: 0x030712,
        hemiIntensity: 0.85,
        shadowRadius: 3.5,
        contactShadowOpacity: 0.42,
        lampIntensity: 3.4, // lanterns glowing bright in the dark snow
        lampBulbEmissive: 2.4,
        windowEmissive: 1.8,
        headlightIntensity: 5.0, // bright warm headlights cutting forward
      },
    ];

    // Find interpolation pair with circular wrap-around
    let k0 = keyframes[keyframes.length - 1];
    let k1 = keyframes[0];
    let t = 0;

    for (let i = 0; i < keyframes.length; i++) {
      const nextIdx = (i + 1) % keyframes.length;
      const curr = keyframes[i];
      const next = keyframes[nextIdx];

      if (next.phase > curr.phase) {
        if (p >= curr.phase && p < next.phase) {
          k0 = curr;
          k1 = next;
          t = (p - curr.phase) / (next.phase - curr.phase);
          break;
        }
      } else {
        // Wrap around 1.0 -> 0.0
        if (p >= curr.phase || p < next.phase) {
          k0 = curr;
          k1 = next;
          const span = (1.0 - curr.phase) + next.phase;
          const offset = p >= curr.phase ? p - curr.phase : (1.0 - curr.phase) + p;
          t = offset / span;
          break;
        }
      }
    }

    // Interpolate base lighting targets
    const cSun0 = new THREE.Color(k0.sunColor);
    const cSun1 = new THREE.Color(k1.sunColor);
    this.targetSunColor.copy(cSun0).lerp(cSun1, t);

    const cSky0 = new THREE.Color(k0.skyColor);
    const cSky1 = new THREE.Color(k1.skyColor);
    this.targetSkyColor.copy(cSky0).lerp(cSky1, t);

    const cFog0 = new THREE.Color(k0.fogColor);
    const cFog1 = new THREE.Color(k1.fogColor);
    this.targetFogColor.copy(cFog0).lerp(cFog1, t);

    const cHemiSky0 = new THREE.Color(k0.hemiSky);
    const cHemiSky1 = new THREE.Color(k1.hemiSky);
    this.targetHemiSkyColor.copy(cHemiSky0).lerp(cHemiSky1, t);

    const cHemiGrd0 = new THREE.Color(k0.hemiGround);
    const cHemiGrd1 = new THREE.Color(k1.hemiGround);
    this.targetHemiGroundColor.copy(cHemiGrd0).lerp(cHemiGrd1, t);

    this.targetSunOffset.copy(k0.sunOffset).lerp(k1.sunOffset, t);
    this.targetLightIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t);
    this.targetHemiIntensity = THREE.MathUtils.lerp(k0.hemiIntensity, k1.hemiIntensity, t);
    this.targetFogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t);
    this.targetShadowRadius = THREE.MathUtils.lerp(k0.shadowRadius, k1.shadowRadius, t);
    this.targetContactShadowOpacity = THREE.MathUtils.lerp(k0.contactShadowOpacity, k1.contactShadowOpacity, t);

    this.targetLampIntensity = THREE.MathUtils.lerp(k0.lampIntensity, k1.lampIntensity, t);
    this.targetLampBulbEmissive = THREE.MathUtils.lerp(k0.lampBulbEmissive, k1.lampBulbEmissive, t);
    this.targetWindowEmissive = THREE.MathUtils.lerp(k0.windowEmissive, k1.windowEmissive, t);
    this.targetHeadlightIntensity = THREE.MathUtils.lerp(k0.headlightIntensity, k1.headlightIntensity, t);
    this.targetHeadlightLensEmissive = THREE.MathUtils.lerp(0.4, 2.5, this.targetHeadlightIntensity / 5.0);

    // Weather effects modulation on top of diurnal palette
    if (this.weather === 'blizzard') {
      this.targetFogDensity *= 2.1;
      this.targetLightIntensity *= 0.58;
      this.targetSunColor.lerp(new THREE.Color(0x94a3b8), 0.55);
      this.targetSkyColor.lerp(new THREE.Color(0x1e293b), 0.5);
      this.targetFogColor.lerp(new THREE.Color(0x1e293b), 0.5);
      this.targetShadowRadius = Math.max(this.targetShadowRadius, 6.8);
      this.targetLampIntensity *= 1.25; // lamps pierce through snowstorm
      this.targetHeadlightIntensity = Math.max(this.targetHeadlightIntensity, 3.5);
    } else if (this.weather === 'clear') {
      this.targetFogDensity *= 0.65;
      this.targetLightIntensity *= 1.15;
      this.targetShadowRadius *= 0.85;
    }

    // Sync ambient sound system
    synthAudio.setTimeOfDay(this.timeOfDayKey);
  }

  private initLevelTimeOfDay(time: TimeOfDay) {
    if (time === 'morning') this.levelStartPhaseOffset = 0.04;
    else if (time === 'midday') this.levelStartPhaseOffset = 0.26;
    else if (time === 'sunset') this.levelStartPhaseOffset = 0.52;
    else if (time === 'night') this.levelStartPhaseOffset = 0.85;
    else this.levelStartPhaseOffset = 0.04;

    this.timeOfDayPhase = this.levelStartPhaseOffset;
    this.timeOfDayProgressionMode = 'auto';
    this.updateTimeOfDayProgression(0);

    // Immediate snap to initial level lighting state
    this.currentSunOffset.copy(this.targetSunOffset);
    this.currentShadowRadius = this.targetShadowRadius;
    if (this.dirLight) {
      this.dirLight.color.copy(this.targetSunColor);
      this.dirLight.intensity = this.targetLightIntensity;
      this.dirLight.position.copy(this.truckPos).add(this.currentSunOffset);
      this.dirLight.target.position.copy(this.truckPos);
      this.dirLight.target.updateMatrixWorld();
    }
    if (this.hemiLight) {
      this.hemiLight.color.copy(this.targetHemiSkyColor);
      this.hemiLight.groundColor.copy(this.targetHemiGroundColor);
      this.hemiLight.intensity = this.targetHemiIntensity;
    }
    this.scene.background = this.targetSkyColor.clone();
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.targetFogColor);
      this.scene.fog.density = this.targetFogDensity;
    }
  }

  /**
   * Load or reload a level
   */
  public initCompanyProgress(progress: CompanyProgress) {
    this.coins = progress.coins;
    this.upgrades = { ...progress.upgrades };
    this.selectedTruckColor = progress.selectedColorHex;
    this.selectedBladeColor = progress.selectedBladeHex;
    this.rebuildTruck();
  }

  public loadLevel(levelIndex: number) {
    this.currentLevelIndex = levelIndex;
    this.currentLevel = LEVELS[levelIndex] || LEVELS[0];

    // Reset stats
    this.score = 0;
    this.combo = 1.0;
    this.comboTimer = 0;
    this.maxComboThisRun = 1.0;
    this.boostGauge = 1.0;
    this.levelElapsedTime = 0;
    this.truckPos.set(0, 0, 0);
    this.truckHeading = 0;
    this.truckSpeed = 0;

    // Reset weather to gentle light snow
    this.weather = 'light_snow';
    this.weatherTimer = 35;
    this.weatherDuration = 35;
    this.targetFogDensity = 0.012;
    this.targetLightIntensity = 2.4;
    this.weatherTractionMultiplier = 1.0;
    this.particleSystem?.setWeather('light_snow');
    this.streetLampLights = [];
    this.streetLampBulbMats = [];
    this.initLevelTimeOfDay(this.currentLevel.timeOfDay);

    // 1. Rebuild Snow System
    if (this.snowSystem) {
      this.snowSystem.dispose();
    }
    this.snowSystem = new SnowSystem(this.scene, this.currentLevel.mapWidth, this.currentLevel.mapLength);
    this.snowSystem.setPerformanceMode(this.performanceMode);

    // 2. Clear old props and obstacles
    this.obstacleMeshes.forEach((m) => {
      this.scene.remove(m);
    });
    this.obstacleMeshes = [];
    this.obstacles = [];
    this.chimneyPositions = [];

    // 3. Build village props for this level
    this.buildVillageEnvironment();

    // 4. Rebuild Plow Truck with current upgrades
    this.rebuildTruck();
  }

  private buildVillageEnvironment() {
    const { mapWidth, mapLength, snowDriftCount, residentHousesCount } = this.currentLevel;
    const halfW = mapWidth / 2 - 6;
    const halfL = mapLength / 2 - 6;

    // A. Houses and Driveways along streets
    const houseCoords: Array<{ x: number; z: number; rot: number }> = [
      { x: -14, z: -16, rot: 0 },
      { x: 14, z: -16, rot: Math.PI },
      { x: -14, z: 16, rot: 0 },
      { x: 14, z: 16, rot: Math.PI },
      { x: -22, z: -4, rot: Math.PI / 2 },
      { x: 22, z: -4, rot: -Math.PI / 2 },
      { x: -22, z: 8, rot: Math.PI / 2 },
      { x: 22, z: 8, rot: -Math.PI / 2 },
      { x: -12, z: -26, rot: 0 },
      { x: 12, z: -26, rot: Math.PI },
      { x: -12, z: 26, rot: 0 },
      { x: 12, z: 26, rot: Math.PI },
    ];

    const actualHousesCount = Math.min(residentHousesCount, houseCoords.length);
    for (let i = 0; i < actualHousesCount; i++) {
      const coord = houseCoords[i];
      const chalet = createAlpineChalet(i);
      chalet.position.set(coord.x, 0, coord.z);
      chalet.rotation.y = coord.rot;
      this.scene.add(chalet);
      this.obstacleMeshes.push(chalet);

      this.obstacles.push({
        x: coord.x,
        z: coord.z,
        radius: 2.8,
        type: 'house',
      });

      // Save chimney position for smoke
      if (chalet.userData.chimneyWorldPos) {
        const chimPos = chalet.localToWorld(chalet.userData.chimneyWorldPos.clone());
        this.chimneyPositions.push(chimPos);
      }

      // Add a mailbox near driveway
      const mailbox = createMailbox();
      const mbOffset = new THREE.Vector3(coord.x > 0 ? -4.5 : 4.5, 0, coord.z + (i % 2 === 0 ? 3 : -3));
      mailbox.position.copy(mbOffset);
      this.scene.add(mailbox);
      this.obstacleMeshes.push(mailbox);
      this.obstacles.push({ x: mbOffset.x, z: mbOffset.z, radius: 0.6, type: 'mailbox' });

      // Add wooden fence segments
      const fence = createFenceSegment(4.5);
      fence.position.set(coord.x + (coord.x > 0 ? 3.5 : -3.5), 0, coord.z);
      fence.rotation.y = Math.PI / 2;
      this.scene.add(fence);
      this.obstacleMeshes.push(fence);
    }

    // B. Cozy Snow-covered Pine Trees (scattered naturally in yards and borders)
    const treeCount = Math.floor(residentHousesCount * 3.5);
    for (let i = 0; i < treeCount; i++) {
      let tx = (Math.random() - 0.5) * (mapWidth - 12);
      let tz = (Math.random() - 0.5) * (mapLength - 12);

      // Keep trees off center road avenue
      if (Math.abs(tx) < 5 || Math.abs(tz) < 5) {
        tx += tx > 0 ? 8 : -8;
      }

      const tree = createSnowPineTree(0.9 + Math.random() * 0.5, i);
      tree.position.set(tx, 0, tz);
      this.scene.add(tree);
      this.obstacleMeshes.push(tree);

      this.obstacles.push({
        x: tx,
        z: tz,
        radius: 1.1,
        type: 'tree',
      });
    }

    // C. Streetlamps with warm ambient glow along the roads
    const lampCoords = [
      { x: -5.5, z: -14 },
      { x: 5.5, z: -14 },
      { x: -5.5, z: 14 },
      { x: 5.5, z: 14 },
      { x: -14, z: -5.5 },
      { x: 14, z: -5.5 },
      { x: -14, z: 5.5 },
      { x: 14, z: 5.5 },
    ];

    lampCoords.forEach((lp) => {
      const lamp = createStreetlamp();
      lamp.group.position.set(lp.x, 0, lp.z);
      this.scene.add(lamp.group);
      this.obstacleMeshes.push(lamp.group);
      this.streetLampLights.push(lamp.light);
      this.streetLampBulbMats.push(lamp.bulbMat);

      this.obstacles.push({
        x: lp.x,
        z: lp.z,
        radius: 0.5,
        type: 'lamp',
      });
    });

    // D. Friendly Snowmen in front yards!
    for (let i = 0; i < 4; i++) {
      const smX = (i % 2 === 0 ? -9 : 9) + (Math.random() - 0.5) * 2;
      const smZ = (i < 2 ? -9 : 9) + (Math.random() - 0.5) * 2;
      const snowman = createSnowman();
      snowman.position.set(smX, 0, smZ);
      snowman.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(snowman);
      this.obstacleMeshes.push(snowman);

      this.obstacles.push({
        x: smX,
        z: smZ,
        radius: 0.8,
        type: 'snowman',
      });
    }

    // E. 3D Snow Drift Mounds on roads and corners
    const driftPositions: Array<{ x: number; z: number; radius: number }> = [];
    for (let i = 0; i < snowDriftCount; i++) {
      // Drifts scattered along roads, road intersections, and driveway aprons
      let dx = 0;
      let dz = 0;
      if (Math.random() > 0.5) {
        dx = (Math.random() - 0.5) * 6; // on vertical road
        dz = (Math.random() - 0.5) * (mapLength - 16);
      } else {
        dx = (Math.random() - 0.5) * (mapWidth - 16);
        dz = (Math.random() - 0.5) * 6; // on horizontal road
      }

      // Avoid spawning directly on truck start (0, 0)
      if (Math.hypot(dx, dz) < 4.5) {
        dx += 6;
      }

      driftPositions.push({
        x: dx,
        z: dz,
        radius: 1.0 + Math.random() * 0.9,
      });
    }

    this.snowSystem?.populateDrifts(driftPositions);
  }

  public rebuildTruck() {
    if (this.truckGroup) {
      this.scene.remove(this.truckGroup);
    }

    const bladeLvl = this.upgrades.bladeWidth || 1;
    const hasHeater = (this.upgrades.heatedBlade || 1) >= 2;
    const hasSalter = (this.upgrades.saltSpreader || 1) >= 2;

    const truck = createSnowPlowTruck(
      bladeLvl,
      this.selectedTruckColor,
      this.selectedBladeColor,
      hasHeater,
      hasSalter
    );

    this.truckGroup = truck.group;
    this.truckBeacon = truck.beacon;
    this.truckWheels = truck.wheels;
    this.truckContactShadow = truck.contactShadow;
    this.truckHeadlightSpot = truck.headlightSpot;
    this.truckHeadlightLensMat = truck.headlightLensMat;
    this.truckGroup.position.copy(this.truckPos);
    this.truckGroup.rotation.y = this.truckHeading;
    this.scene.add(this.truckGroup);
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      synthAudio.ensureStarted();

      if (e.code === 'KeyH') {
        this.triggerHorn();
      }
      if (e.code === 'KeyC') {
        this.cycleWeather();
      }
      if (e.code === 'KeyT') {
        this.cycleTimeOfDay();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.isBoosting = false;
    });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  public setVirtualJoystick(x: number, y: number) {
    this.virtualJoystick.x = x;
    this.virtualJoystick.y = y;
  }

  public setTouchBoost(active: boolean) {
    this.touchBoost = active;
  }

  public triggerHorn() {
    if (this.hornCooldown <= 0) {
      synthAudio.playHorn();
      this.hornCooldown = 0.8;

      // Add a happy floating "HONK!" note
      this.addFloatingText('BEEP BEEP! 🎺', this.truckPos.x, 2.8, this.truckPos.z, '#fde047');

      // Wiggle nearby snowmen!
      this.obstacles.forEach((obs) => {
        if (obs.type === 'snowman') {
          const d = Math.hypot(obs.x - this.truckPos.x, obs.z - this.truckPos.z);
          if (d < 12) {
            obs.wiggleTime = 1.0;
          }
        }
      });
    }
  }

  public setScreenState(state: ScreenState) {
    this.screenState = state;
    if (state === 'playing') {
      synthAudio.ensureStarted();
    }
  }

  public getScreenState(): ScreenState {
    return this.screenState;
  }

  public setTruckColor(colorHex: string, bladeHex: string) {
    this.selectedTruckColor = colorHex;
    this.selectedBladeColor = bladeHex;
    this.rebuildTruck();
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const currentLvl = this.upgrades[upgradeId] || 1;
    const info = UPGRADES[upgradeId];
    if (!info || currentLvl >= info.maxLevel) return false;

    const cost = info.costs[currentLvl - 1];
    if (this.coins < cost) return false;

    this.coins -= cost;
    this.upgrades[upgradeId] = currentLvl + 1;
    synthAudio.playUpgradeSound();

    if (upgradeId === 'bladeWidth' || upgradeId === 'heatedBlade' || upgradeId === 'saltSpreader') {
      this.rebuildTruck();
    }
    return true;
  }

  public getUpgrades(): Record<string, number> {
    return { ...this.upgrades };
  }

  public getCoins(): number {
    return this.coins;
  }

  public cycleWeather(forcedWeather?: WeatherType) {
    if (forcedWeather) {
      this.weather = forcedWeather;
    } else {
      this.weatherCycleIndex = (this.weatherCycleIndex + 1) % this.weatherCycleList.length;
      this.weather = this.weatherCycleList[this.weatherCycleIndex];
    }

    if (this.weather === 'blizzard') {
      this.weatherDuration = 28;
      this.weatherTimer = 28;
      this.targetFogDensity = 0.026;
      this.targetLightIntensity = 1.35;
      this.weatherTractionMultiplier = 0.68;
      this.addFloatingText('BLIZZARD WARNING! 🌨️ 1.5x Bonus', this.truckPos.x, 3.2, this.truckPos.z, '#38bdf8');
    } else if (this.weather === 'clear') {
      this.weatherDuration = 38;
      this.weatherTimer = 38;
      this.targetFogDensity = 0.005;
      this.targetLightIntensity = 2.9;
      this.weatherTractionMultiplier = 1.15;
      this.addFloatingText('CLEAR SKIES ☀️ High Traction', this.truckPos.x, 3.2, this.truckPos.z, '#fde047');
    } else {
      // light_snow
      this.weatherDuration = 35;
      this.weatherTimer = 35;
      this.targetFogDensity = 0.012;
      this.targetLightIntensity = 2.3;
      this.weatherTractionMultiplier = 1.0;
      this.addFloatingText('LIGHT SNOWFALL ❄️', this.truckPos.x, 3.2, this.truckPos.z, '#e2e8f0');
    }

    this.updateTimeOfDayProgression(0);
    this.particleSystem?.setWeather(this.weather);
    synthAudio.setWeather(this.weather);
  }

  public getWeather(): WeatherType {
    return this.weather;
  }

  private addFloatingText(text: string, x: number, y: number, z: number, color: string = '#ffffff') {
    const item: FloatingText = {
      id: this.nextTextId++,
      text,
      x,
      y,
      z,
      color,
      life: 0,
      scale: 1.0,
    };
    this.floatingTexts.push(item);
  }

  /**
   * Main game loop tick
   */
  private tick() {
    this.animationFrameId = requestAnimationFrame(this.tick);

    const rawDelta = this.clock.getDelta();
    const dt = Math.min(rawDelta, 0.05);

    // Measure FPS and auto-tune graphics for low-end / older devices
    const currentFps = rawDelta > 0 ? Math.min(120, 1 / rawDelta) : 60;
    this.fpsHistory.push(currentFps);
    if (this.fpsHistory.length > 45) this.fpsHistory.shift();
    this.measuredFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

    this.autoTuneCounter++;
    if (this.autoTuneCounter % 180 === 0 && this.performanceMode !== 'turbo') {
      if (this.measuredFps < 22) {
        this.setPerformanceMode('turbo');
      }
    }

    if (this.screenState === 'playing') {
      this.levelElapsedTime += dt;

      // Dynamic weather cycle progression
      this.weatherTimer -= dt;
      if (this.weatherTimer <= 0) {
        this.cycleWeather();
      }

      this.updatePhysics(dt);
      this.updateSnowClearing(dt);
    } else if (this.screenState === 'title') {
      // Atmospheric cinematic orbit on title screen
      const t = this.clock.getElapsedTime() * 0.12;
      this.camera.position.x = Math.sin(t) * 36;
      this.camera.position.z = Math.cos(t) * 36;
      this.camera.position.y = 26 + Math.sin(t * 0.5) * 3;
      this.camera.lookAt(0, 2, 0);
    }

    // Smoothly transition fog density for atmospheric visibility
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, this.targetFogDensity, 1.4, dt);
    }
    if (this.dirLight) {
      this.dirLight.intensity = THREE.MathUtils.damp(this.dirLight.intensity, this.targetLightIntensity, 1.4, dt);
    }

    // Update ambient effects (smoke, particles, flashing beacon)
    this.updateAmbientEffects(dt);

    // Update dynamic sun position, directional soft shadows, and truck contact shadow
    this.updateDynamicLightingAndShadows(dt);

    // Update floating texts
    this.updateFloatingTexts(dt);

    // Camera follow truck during play
    if (this.screenState === 'playing' || this.screenState === 'paused' || this.screenState === 'victory') {
      this.updateCamera(dt);
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  private updatePhysics(dt: number) {
    if (!this.truckGroup) return;

    // Upgrades modifiers
    const engineLvl = this.upgrades.enginePower || 1;
    const gripLvl = this.upgrades.studdedTires || 1;
    const boostLvl = this.upgrades.turboBoost || 1;
    const boostMult = 1.6 + (boostLvl - 1) * 0.2;

    // Dynamic weather traction & grip calculation
    const gripBonus = (gripLvl - 1) * 0.12;
    let effectiveTraction = this.weatherTractionMultiplier;
    if (this.weather === 'blizzard') {
      // Slippery ice & deep snowdrifts: studded tires provide vital grip
      effectiveTraction = Math.min(1.0, this.weatherTractionMultiplier + gripBonus);
    } else if (this.weather === 'clear') {
      // Dry crisp pavement: excellent traction
      effectiveTraction = this.weatherTractionMultiplier + gripBonus * 0.5;
    }

    const maxSpeed = (7.5 + (engineLvl - 1) * 2.2) * (this.weather === 'blizzard' ? 0.9 : (this.weather === 'clear' ? 1.08 : 1.0));
    const accelRate = (12.0 + (engineLvl - 1) * 3.5) * Math.max(0.75, effectiveTraction);
    const turnRate = (2.4 + (gripLvl - 1) * 0.45) * Math.max(0.65, effectiveTraction);
    // Lower traction results in lower drag coefficient = more drift/sliding momentum!
    const dragCoeff = 0.94 - (1 - Math.min(1, effectiveTraction)) * 0.045 - (gripLvl - 1) * 0.015;

    // Input checks
    const moveForward = this.keys['KeyW'] || this.keys['ArrowUp'] || this.virtualJoystick.y < -0.2;
    const moveBackward = this.keys['KeyS'] || this.keys['ArrowDown'] || this.virtualJoystick.y > 0.2;
    const steerLeft = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.virtualJoystick.x < -0.2;
    const steerRight = this.keys['KeyD'] || this.keys['ArrowRight'] || this.virtualJoystick.x > 0.2;
    const boostPressed = this.keys['Space'] || this.keys['ShiftLeft'] || this.touchBoost;

    // Boost logic
    if (boostPressed && this.boostGauge > 0.05 && moveForward) {
      if (!this.isBoosting) {
        synthAudio.playBoost();
      }
      this.isBoosting = true;
      this.boostGauge = Math.max(0, this.boostGauge - dt * (0.35 / boostLvl));
    } else {
      this.isBoosting = false;
      this.boostGauge = Math.min(1.0, this.boostGauge + dt * 0.18);
    }

    // Acceleration & Braking
    const targetTopSpeed = maxSpeed * (this.isBoosting ? boostMult : 1.0);
    if (moveForward) {
      this.truckSpeed += accelRate * dt;
      if (this.truckSpeed > targetTopSpeed) this.truckSpeed = targetTopSpeed;
    } else if (moveBackward) {
      this.truckSpeed -= accelRate * 0.65 * dt;
      if (this.truckSpeed < -maxSpeed * 0.45) this.truckSpeed = -maxSpeed * 0.45;
    } else {
      this.truckSpeed *= Math.pow(dragCoeff, dt * 60);
      if (Math.abs(this.truckSpeed) < 0.05) this.truckSpeed = 0;
    }

    // Steering
    let steerDir = 0;
    if (steerLeft) steerDir += 1;
    if (steerRight) steerDir -= 1;
    if (Math.abs(this.virtualJoystick.x) > 0.2) steerDir = -this.virtualJoystick.x;

    if (Math.abs(this.truckSpeed) > 0.1) {
      const dirFactor = this.truckSpeed > 0 ? 1 : -1;
      this.truckHeading += steerDir * turnRate * dt * dirFactor * Math.min(1.2, Math.abs(this.truckSpeed) / 4);
    }

    // Move truck forward
    const forwardX = -Math.sin(this.truckHeading);
    const forwardZ = -Math.cos(this.truckHeading);

    const prevPos = this.truckPos.clone();
    this.truckPos.x += forwardX * this.truckSpeed * dt;
    this.truckPos.z += forwardZ * this.truckSpeed * dt;

    // Boundary constraints
    const halfW = this.currentLevel.mapWidth / 2 - 2;
    const halfL = this.currentLevel.mapLength / 2 - 2;
    this.truckPos.x = Math.max(-halfW, Math.min(halfW, this.truckPos.x));
    this.truckPos.z = Math.max(-halfL, Math.min(halfL, this.truckPos.z));

    // Collision with static obstacles (houses, trees, lamps)
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      const dist = Math.hypot(this.truckPos.x - obs.x, this.truckPos.z - obs.z);
      const minDistance = obs.radius + 1.2;

      if (dist < minDistance) {
        // Crash / bump bounce!
        const pushAngle = Math.atan2(this.truckPos.z - obs.z, this.truckPos.x - obs.x);
        this.truckPos.x = obs.x + Math.cos(pushAngle) * minDistance;
        this.truckPos.z = obs.z + Math.sin(pushAngle) * minDistance;

        if (Math.abs(this.truckSpeed) > 1.5) {
          synthAudio.playBumpSound();
          this.truckSpeed = -this.truckSpeed * 0.35;
          // Drop combo on heavy obstacle crash
          if (this.combo > 2.0) {
            this.combo = 1.0;
            this.addFloatingText('BUMP! Combo Lost', this.truckPos.x, 2.5, this.truckPos.z, '#ef4444');
          }
        }
      }
    }

    // Update 3D truck orientation and wheels
    this.truckGroup.position.copy(this.truckPos);
    this.truckGroup.rotation.y = this.truckHeading;

    // Roll wheels
    const wheelRot = (this.truckSpeed * dt) / 0.48;
    this.truckWheels.forEach((w) => {
      w.rotation.x += wheelRot;
    });

    // Audio Engine modulation
    const normSpeed = Math.abs(this.truckSpeed) / maxSpeed;
    synthAudio.updateEngine(normSpeed, this.isBoosting);

    if (this.hornCooldown > 0) {
      this.hornCooldown -= dt;
    }
  }

  private updateSnowClearing(dt: number) {
    if (!this.snowSystem || !this.truckGroup) return;

    const bladeLvl = this.upgrades.bladeWidth || 1;
    const bladeWidth = 2.0 + (bladeLvl - 1) * 0.75;
    const hasHeater = (this.upgrades.heatedBlade || 1) >= 2;
    const hasSalter = (this.upgrades.saltSpreader || 1) >= 2;
    const salterLvl = this.upgrades.saltSpreader || 1;

    // Blade world position in front of truck
    const forward = new THREE.Vector3(-Math.sin(this.truckHeading), 0, -Math.cos(this.truckHeading));
    const bladePos = this.truckPos.clone().add(forward.clone().multiplyScalar(2.0));

    // Execute snow clearing pass
    const result = this.snowSystem.plowAt(
      bladePos,
      this.truckHeading,
      bladeWidth,
      Math.abs(this.truckSpeed),
      hasHeater,
      hasSalter
    );

    // Audio crunch intensity modulated by snow depth
    const crunchVolume = result.isDeepSnow ? 1.0 : (result.isPlowingSnow ? 0.65 : 0);
    synthAudio.setSnowPlowing(result.isPlowingSnow ? Math.min(1, Math.abs(this.truckSpeed) / 3.5) * crunchVolume : 0);

    // Snow spray particles (boosted volume when slicing deep snow)
    if (result.isPlowingSnow && Math.abs(this.truckSpeed) > 0.8) {
      this.particleSystem?.emitSnowSpray(
        bladePos,
        forward,
        this.truckHeading,
        Math.abs(this.truckSpeed) * (result.isDeepSnow ? 1.4 : 1.0),
        hasHeater
      );
    }

    // Deep snow resistance (unless Nitro Boost is firing)
    if (result.isDeepSnow && !this.isBoosting && Math.abs(this.truckSpeed) > 1.2) {
      const engineLvl = this.upgrades.enginePower || 1;
      const resistance = 0.988 + (engineLvl - 1) * 0.003;
      this.truckSpeed *= resistance;
    }

    // Lingering plow trail particles showing path traveled
    if (Math.abs(this.truckSpeed) > 0.35) {
      this.plowTrailTimer += dt;
      if (this.plowTrailTimer >= 0.065) {
        this.plowTrailTimer = 0;
        _trailRight.set(-forward.z, 0, forward.x);
        const halfWidth = bladeWidth * 0.45;
        _trailLeftPos.copy(this.truckPos).addScaledVector(_trailRight, -halfWidth);
        _trailRightPos.copy(this.truckPos).addScaledVector(_trailRight, halfWidth);
        this.particleSystem?.emitPlowTrail(
          _trailLeftPos,
          _trailRightPos,
          Math.abs(this.truckSpeed),
          hasHeater,
          hasSalter
        );
      }
    }

    // Salter grains and boost trail
    if (hasSalter && Math.abs(this.truckSpeed) > 0.8) {
      const rearPos = this.truckPos.clone().add(forward.clone().multiplyScalar(-1.8));
      this.particleSystem?.emitSaltGrains(rearPos, Math.abs(this.truckSpeed));
    }

    if (this.isBoosting) {
      const exhaustPos = this.truckPos.clone().add(new THREE.Vector3(0.68, 1.5, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.truckHeading));
      this.particleSystem?.emitBoostTrail(exhaustPos, forward.clone().negate());
    }

    // Handle cleared cells & Combo progression
    if (result.cellsClearedDelta > 0) {
      // Heated blade bonus
      const heaterMultiplier = hasHeater ? (this.upgrades.heatedBlade === 3 ? 1.6 : 1.25) : 1.0;
      // Blizzard weather provides 1.5x score and coin bonus for plowing in extreme conditions!
      const blizzardMultiplier = this.weather === 'blizzard' ? 1.5 : 1.0;
      const coinGain = Math.max(1, Math.round(result.cellsClearedDelta * 0.4 * heaterMultiplier * blizzardMultiplier * this.combo));

      this.score += Math.round(result.cellsClearedDelta * 10 * blizzardMultiplier * this.combo);
      this.coins += coinGain;

      // Reset combo timer (extended by salt spreader)
      const baseComboTime = 3.0 + (salterLvl - 1) * 1.5;
      this.comboTimer = baseComboTime;
      this.comboMaxTimer = baseComboTime;

      // Increase combo
      const prevComboTier = Math.floor(this.combo);
      this.combo = Math.min(10.0, Number((this.combo + result.cellsClearedDelta * 0.008).toFixed(2)));
      const newComboTier = Math.floor(this.combo);

      if (this.combo > this.maxComboThisRun) {
        this.maxComboThisRun = this.combo;
      }

      // Play combo milestone chime when crossing integer thresholds
      if (newComboTier > prevComboTier) {
        synthAudio.playComboChime(newComboTier);
        this.addFloatingText(`COMBO x${newComboTier}! ✨`, bladePos.x, 2.6, bladePos.z, '#38bdf8');
      }

      if (Math.random() < 0.15) {
        synthAudio.playSnowFlakeChime();
      }
    } else {
      // Combo decay timer when not clearing snow
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          if (this.combo > 1.5) {
            this.addFloatingText('Combo Expired', this.truckPos.x, 2.2, this.truckPos.z, '#94a3b8');
          }
          this.combo = 1.0;
        }
      }
    }

    // Handle Drifts Hit
    if (result.driftsHit.length > 0) {
      result.driftsHit.forEach((d) => {
        const blizzardMult = this.weather === 'blizzard' ? 1.5 : 1.0;
        const bonusCoins = Math.round(d.value * this.combo * blizzardMult);
        this.coins += bonusCoins;
        this.score += Math.round(d.value * 20 * blizzardMult);
        synthAudio.playSnowFlakeChime(1.4);
        this.addFloatingText(`+${bonusCoins} DRIFT CLEARED! ❄️`, d.x, 2.2, d.z, '#38bdf8');
      });
    }

    // Check Victory Condition
    const percent = this.snowSystem.getPercentCleared();
    if (!this.currentLevel.isEndless && percent >= this.currentLevel.targetPercent) {
      synthAudio.playVictoryFanfare();
      this.setScreenState('victory');
      if (this.onVictory) {
        this.onVictory({
          percent,
          coins: this.coins,
          maxCombo: this.maxComboThisRun,
        });
      }
    }

    // Notify UI stats
    if (this.onStatsUpdate) {
      const gripLvl = this.upgrades.studdedTires || 1;
      const gripBonus = (gripLvl - 1) * 0.12;
      let effectiveTraction = this.weatherTractionMultiplier;
      if (this.weather === 'blizzard') {
        effectiveTraction = Math.min(1.0, this.weatherTractionMultiplier + gripBonus);
      } else if (this.weather === 'clear') {
        effectiveTraction = this.weatherTractionMultiplier + gripBonus * 0.5;
      }

      this.onStatsUpdate({
        score: this.score,
        coins: this.coins,
        percentCleared: percent,
        currentCombo: this.combo,
        maxCombo: this.maxComboThisRun,
        comboTimer: this.comboMaxTimer > 0 ? this.comboTimer / this.comboMaxTimer : 0,
        speedKmh: Math.round(Math.abs(this.truckSpeed) * 3.6),
        boostGauge: this.boostGauge,
        timeElapsed: this.levelElapsedTime,
        weather: this.weather,
        weatherTimeRemaining: Math.max(0, Math.round(this.weatherTimer)),
        tractionMultiplier: Number(effectiveTraction.toFixed(2)),
        timeOfDay: this.timeOfDayKey,
        timeOfDayClock: this.inGameClockString,
        timeOfDayProgress: this.timeOfDayPhase,
        isAutoTimeOfDay: this.timeOfDayProgressionMode === 'auto',
        performanceMode: this.performanceMode,
        fps: Math.round(this.measuredFps),
        truckPos: {
          x: this.truckPos.x,
          z: this.truckPos.z,
          heading: this.truckHeading,
        },
      });
    }
  }

  private updateAmbientEffects(dt: number) {
    // 1. Chimney smoke puffs every 0.6 seconds
    this.smokeTimer += dt;
    if (this.smokeTimer > 0.6) {
      this.smokeTimer = 0;
      this.chimneyPositions.forEach((cp) => {
        this.particleSystem?.emitChimneySmoke(cp);
      });
    }

    // 2. Flashing warning beacon on roof
    if (this.truckBeacon) {
      this.truckBeacon.rotation.y += dt * 8;
      const pulse = 1.0 + Math.sin(this.clock.getElapsedTime() * 12) * 0.4;
      if (this.truckBeacon.material instanceof THREE.MeshStandardMaterial) {
        this.truckBeacon.material.emissiveIntensity = pulse * 1.5;
      }
    }

    // 3. Update falling snow and dynamic particles centered around camera/truck
    this.particleSystem?.update(dt, this.truckPos);
  }

  private updateDynamicLightingAndShadows(dt: number) {
    if (!this.dirLight) return;

    // 1. Advance continuous time-of-day progression and compute lighting targets
    this.updateTimeOfDayProgression(dt);

    // 2. Smoothly interpolate sun position and shadow blur radius
    this.currentSunOffset.lerp(this.targetSunOffset, dt * 2.0);
    this.currentShadowRadius = THREE.MathUtils.damp(this.currentShadowRadius, this.targetShadowRadius, 2.0, dt);

    // 3. Center directional light and shadow camera on the plow truck
    this.dirLight.position.copy(this.truckPos).add(this.currentSunOffset);
    this.dirLight.target.position.copy(this.truckPos);
    this.dirLight.target.updateMatrixWorld();

    if (this.dirLight.shadow) {
      this.dirLight.shadow.radius = this.currentShadowRadius;
    }

    // 4. Smoothly interpolate directional sunlight color & intensity
    this.dirLight.color.lerp(this.targetSunColor, dt * 2.0);
    this.dirLight.intensity = THREE.MathUtils.damp(this.dirLight.intensity, this.targetLightIntensity, 2.0, dt);

    // 5. Smoothly interpolate hemisphere ambient fill light
    if (this.hemiLight) {
      this.hemiLight.color.lerp(this.targetHemiSkyColor, dt * 2.0);
      this.hemiLight.groundColor.lerp(this.targetHemiGroundColor, dt * 2.0);
      this.hemiLight.intensity = THREE.MathUtils.damp(this.hemiLight.intensity, this.targetHemiIntensity, 2.0, dt);
    }

    // 6. Smoothly shift sky background & horizon winter fog
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(this.targetSkyColor, dt * 2.0);
    } else {
      this.scene.background = this.targetSkyColor.clone();
    }
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(this.targetFogColor, dt * 2.0);
      this.scene.fog.density = THREE.MathUtils.damp(this.scene.fog.density, this.targetFogDensity, 2.0, dt);
    }

    // 7. Modulate village streetlamp pointlights and glowing bulbs
    for (let i = 0; i < this.streetLampLights.length; i++) {
      this.streetLampLights[i].intensity = THREE.MathUtils.damp(
        this.streetLampLights[i].intensity,
        this.targetLampIntensity,
        2.5,
        dt
      );
    }
    for (let i = 0; i < this.streetLampBulbMats.length; i++) {
      this.streetLampBulbMats[i].emissiveIntensity = THREE.MathUtils.damp(
        this.streetLampBulbMats[i].emissiveIntensity,
        this.targetLampBulbEmissive,
        2.5,
        dt
      );
    }

    // 8. Modulate warm chalet window glow (shared material)
    glowWindowMat.emissiveIntensity = THREE.MathUtils.damp(
      glowWindowMat.emissiveIntensity,
      this.targetWindowEmissive,
      2.5,
      dt
    );

    // 9. Modulate truck forward headlights
    if (this.truckHeadlightSpot) {
      this.truckHeadlightSpot.intensity = THREE.MathUtils.damp(
        this.truckHeadlightSpot.intensity,
        this.targetHeadlightIntensity,
        3.0,
        dt
      );
    }
    if (this.truckHeadlightLensMat) {
      this.truckHeadlightLensMat.emissiveIntensity = THREE.MathUtils.damp(
        this.truckHeadlightLensMat.emissiveIntensity,
        this.targetHeadlightLensEmissive,
        3.0,
        dt
      );
    }

    // 10. Dynamic contact shadow underneath the plow truck
    if (this.truckContactShadow) {
      const sunWorldDirX = this.currentSunOffset.x;
      const sunWorldDirZ = this.currentSunOffset.z;
      const sunDistH = Math.hypot(sunWorldDirX, sunWorldDirZ) || 1;
      const normSunX = sunWorldDirX / sunDistH;
      const normSunZ = sunWorldDirZ / sunDistH;

      // Transform sun horizontal vector into truck local coordinate frame
      const localAngle = -this.truckHeading;
      const localSunX = normSunX * Math.cos(localAngle) - normSunZ * Math.sin(localAngle);
      const localSunZ = normSunX * Math.sin(localAngle) + normSunZ * Math.cos(localAngle);

      // Low sun creates extended elongated shadow offset opposite the sun
      const sunElevation = Math.max(10, Math.min(50, this.currentSunOffset.y));
      const stretchFactor = (46 - sunElevation) / 36;

      this.truckContactShadow.position.set(
        -localSunX * 0.42 * (1 + stretchFactor * 0.8),
        0.05,
        -localSunZ * 0.62 * (1 + stretchFactor * 0.8)
      );

      this.truckContactShadow.scale.set(
        this.targetContactShadowScale.x,
        1,
        this.targetContactShadowScale.y * (1 + stretchFactor * 0.5)
      );

      const mat = this.truckContactShadow.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = THREE.MathUtils.damp(mat.opacity, this.targetContactShadowOpacity, 2.0, dt);
      }
    }
  }

  private updateCamera(dt: number) {
    // Smooth isometric camera follow
    _camOffset.set(22, 26, 22);
    if (this.isBoosting) {
      _camOffset.multiplyScalar(1.15); // subtle zoom out during high speed boost
    }

    _targetCamPos.copy(this.truckPos).add(_camOffset);
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetCamPos.x, 3.8, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetCamPos.y, 3.8, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetCamPos.z, 3.8, dt);

    _lookTarget.copy(this.truckPos).setY(this.truckPos.y + 0.8);
    this.camera.lookAt(_lookTarget);
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt * 1.2;
      ft.y += dt * 1.6;

      if (ft.life >= 1.0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.onFloatingTextUpdate) {
      this.onFloatingTextUpdate([...this.floatingTexts]);
    }
  }

  public getScreenCoordinates(pos: { x: number; y: number; z: number }): { x: number; y: number } | null {
    if (!this.container) return null;
    _tempScreenVec.set(pos.x, pos.y, pos.z).project(this.camera);
    // Discard objects behind the camera plane
    if (_tempScreenVec.z > 1) return null;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    return {
      x: ((_tempScreenVec.x + 1) * w) / 2,
      y: ((-_tempScreenVec.y + 1) * h) / 2,
    };
  }

  /**
   * Set specific time of day or dynamic cycle mode
   */
  public setTimeOfDay(mode: 'auto' | TimeOfDay) {
    this.timeOfDayProgressionMode = mode;
    if (mode !== 'auto') {
      if (mode === 'morning') this.timeOfDayPhase = 0.04;
      else if (mode === 'midday') this.timeOfDayPhase = 0.26;
      else if (mode === 'sunset') this.timeOfDayPhase = 0.52;
      else if (mode === 'night') this.timeOfDayPhase = 0.85;
      this.timeOfDayKey = mode;
      this.updateTimeOfDayProgression(0);
      const labels: Record<TimeOfDay, string> = {
        morning: 'Morning Dawn 🌅',
        midday: 'Midday Noon ☀️',
        sunset: 'Sunset Dusk 🌆',
        night: 'Deep Blue Night 🌙',
      };
      this.addFloatingText(`Time of Day: ${labels[mode]}`, this.truckPos.x, 3.2, this.truckPos.z, '#fde047');
    } else {
      this.addFloatingText('Time of Day: DYNAMIC CYCLE 🔄', this.truckPos.x, 3.2, this.truckPos.z, '#38bdf8');
    }
  }

  /**
   * Cycle through Time of Day modes (Auto -> Morning -> Midday -> Sunset -> Night)
   */
  public cycleTimeOfDay() {
    const modes: Array<'auto' | TimeOfDay> = ['auto', 'morning', 'midday', 'sunset', 'night'];
    const curIdx = modes.indexOf(this.timeOfDayProgressionMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    this.setTimeOfDay(nextMode);
  }

  /**
   * Snapshot data for the real-time Minimap
   */
  public getMinimapData() {
    return {
      snowData: this.snowSystem?.getMinimapGrid(),
      truckPos: {
        x: this.truckPos.x,
        z: this.truckPos.z,
        heading: this.truckHeading,
      },
      obstacles: this.obstacles,
      mapWidth: this.currentLevel.mapWidth,
      mapLength: this.currentLevel.mapLength,
      timeOfDay: this.timeOfDayKey,
    };
  }

  public getTimeOfDayMode(): 'auto' | TimeOfDay {
    return this.timeOfDayProgressionMode;
  }

  public getPerformanceMode(): PerformanceMode {
    return this.performanceMode;
  }

  public setPerformanceMode(mode: PerformanceMode) {
    this.performanceMode = mode;
    try {
      localStorage.setItem('snowplow_performance_mode', mode);
    } catch {
      // ignore
    }

    const pr =
      mode === 'turbo'
        ? 1.0
        : mode === 'balanced'
        ? Math.min(window.devicePixelRatio, 1.25)
        : Math.min(window.devicePixelRatio, 1.75);

    this.renderer.setPixelRatio(pr);

    const shadowDim = mode === 'turbo' ? 512 : mode === 'balanced' ? 1024 : 2048;
    if (this.dirLight) {
      this.dirLight.shadow.mapSize.set(shadowDim, shadowDim);
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
    }
    this.renderer.shadowMap.type =
      mode === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;

    this.particleSystem?.setQuality(
      mode === 'turbo' ? 'low' : mode === 'balanced' ? 'medium' : 'high'
    );
    this.snowSystem?.setPerformanceMode(mode);

    const labels: Record<PerformanceMode, string> = {
      turbo: '⚡ ТУРБО (Для старых телефонов)',
      balanced: '⚖️ БАЛАНС',
      high: '✨ ВЫСОКОЕ КАЧЕСТВО',
    };
    this.addFloatingText(
      `Графика: ${labels[mode]}`,
      this.truckPos.x,
      3.2,
      this.truckPos.z,
      '#38bdf8'
    );
  }

  public cyclePerformanceMode() {
    const modes: PerformanceMode[] = ['turbo', 'balanced', 'high'];
    const curIdx = modes.indexOf(this.performanceMode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    this.setPerformanceMode(nextMode);
  }

  public dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.snowSystem?.dispose();
    this.particleSystem?.dispose();
    this.renderer.dispose();
  }
}
