/**
 * Type definitions for Snowdrift 3D Snow-Plowing Game
 */

export type ScreenState = 'title' | 'playing' | 'paused' | 'victory' | 'garage';

export type TimeOfDay = 'morning' | 'midday' | 'sunset' | 'night';

export type WeatherType = 'clear' | 'light_snow' | 'blizzard';

export type TruckColorId = 'orange' | 'cyan' | 'red' | 'yellow' | 'green' | 'violet';

export interface TruckColorOption {
  id: TruckColorId;
  name: string;
  hex: string;
  bladeHex: string;
}

export interface UpgradeInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costs: number[]; // cost per level upgrade (index 0 is lvl 1 -> 2)
  getStatText: (level: number) => string;
}

export interface LevelConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  targetPercent: number; // e.g. 85 for 85% cleared to win
  isEndless?: boolean;
  timeOfDay: TimeOfDay;
  mapWidth: number;
  mapLength: number;
  snowDriftCount: number;
  residentHousesCount: number;
  decorDensity: number;
}

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
  type: 'house' | 'tree' | 'snowman' | 'lamp' | 'fence' | 'mailbox' | 'car' | 'pond';
  rotation?: number;
  wiggleTime?: number;
}

export interface SnowDriftData {
  id: number;
  x: number;
  z: number;
  radius: number;
  originalRadius: number;
  value: number;
  cleared: boolean;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  z: number;
  color: string;
  life: number; // 0 to 1
  scale: number;
}

export interface GameStats {
  score: number;
  coins: number;
  percentCleared: number;
  currentCombo: number;
  maxCombo: number;
  comboTimer: number; // 0 to 1 normalized
  speedKmh: number;
  boostGauge: number; // 0 to 1
  timeElapsed: number;
  weather: WeatherType;
  weatherTimeRemaining: number;
  tractionMultiplier: number;
  timeOfDay: TimeOfDay;
  timeOfDayClock: string; // e.g. "08:15 AM", "01:30 PM"
  timeOfDayProgress: number; // 0 to 1 continuous phase of the diurnal cycle
  isAutoTimeOfDay: boolean;
  truckPos?: { x: number; z: number; heading: number };
}
