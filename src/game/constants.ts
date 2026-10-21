import { LevelConfig, TruckColorOption, UpgradeInfo } from './types.ts';

export const TRUCK_COLORS: TruckColorOption[] = [
  { id: 'orange', name: 'Alpine Orange', hex: '#f97316', bladeHex: '#ea580c' },
  { id: 'cyan', name: 'Glacier Teal', hex: '#06b6d4', bladeHex: '#0891b2' },
  { id: 'yellow', name: 'Highway Yellow', hex: '#eab308', bladeHex: '#ca8a04' },
  { id: 'red', name: 'Cranberry Red', hex: '#e11d48', bladeHex: '#be123c' },
  { id: 'green', name: 'Spruce Green', hex: '#10b981', bladeHex: '#059669' },
  { id: 'violet', name: 'Twilight Plum', hex: '#8b5cf6', bladeHex: '#7c3aed' },
];

export const UPGRADES: Record<string, UpgradeInfo> = {
  bladeWidth: {
    id: 'bladeWidth',
    name: 'Blade Width',
    description: 'Wider blade clears wider paths in a single pass.',
    icon: 'shovel',
    maxLevel: 4,
    costs: [100, 300, 600],
    getStatText: (lvl) => {
      const widths = ['1.8m Standard', '2.5m Steel Blade', '3.3m Heavy V-Plow', '4.2m Industrial Wing'];
      return widths[lvl - 1] || `${(1.8 + (lvl - 1) * 0.8).toFixed(1)}m`;
    },
  },
  enginePower: {
    id: 'enginePower',
    name: 'Engine Power',
    description: 'Increases top speed and plow pushing torque through heavy snow.',
    icon: 'gauge',
    maxLevel: 4,
    costs: [120, 350, 700],
    getStatText: (lvl) => {
      const speeds = ['130 HP (28 km/h)', '190 HP (36 km/h)', '270 HP (45 km/h)', '360 HP Turbo (55 km/h)'];
      return speeds[lvl - 1];
    },
  },
  studdedTires: {
    id: 'studdedTires',
    name: 'Snow Grip Tires',
    description: 'Enhances steering responsiveness and prevents sliding on icy pavement.',
    icon: 'disc',
    maxLevel: 3,
    costs: [75, 200],
    getStatText: (lvl) => {
      const grips = ['Standard Rubber', 'Siped Winter Tread', 'Tungsten Carbide Studs'];
      return grips[lvl - 1];
    },
  },
  heatedBlade: {
    id: 'heatedBlade',
    name: 'Heated De-Icer',
    description: 'Thermal coils melt snow instantly, yielding high-value bonus snowflake coins.',
    icon: 'flame',
    maxLevel: 3,
    costs: [200, 500],
    getStatText: (lvl) => {
      const bonuses = ['Unheated (+0%)', 'Electric Coils (+25% Coins)', 'Superheated Radiant (+60% Coins)'];
      return bonuses[lvl - 1];
    },
  },
  saltSpreader: {
    id: 'saltSpreader',
    name: 'Salt Spreader',
    description: 'Rear spreader drops salt crystals, widening your cleared trail and extending combo time.',
    icon: 'sparkles',
    maxLevel: 3,
    costs: [80, 220],
    getStatText: (lvl) => {
      const salters = ['None', 'Tailgate Hopper (Combo +2s)', 'Dual Spinner (Auto-Salting + Combo +4s)'];
      return salters[lvl - 1];
    },
  },
  turboBoost: {
    id: 'turboBoost',
    name: 'Nitro Turbo Boost',
    description: 'Hold SPACE or BOOST for a supersonic snow-clearing burst.',
    icon: 'zap',
    maxLevel: 3,
    costs: [90, 240],
    getStatText: (lvl) => {
      const boosts = ['Standard 2s Boost', 'High Capacity 3.5s', 'Twin Supercharger 5s Burst'];
      return boosts[lvl - 1];
    },
  },
};

export const LEVELS: LevelConfig[] = [
  {
    id: 'pinecone-lane',
    name: 'Pinecone Lane',
    subtitle: 'Cozy Cul-de-Sac',
    description: 'Clear the residential avenue and neighbors\' driveways after a fresh morning snowfall.',
    targetPercent: 80,
    timeOfDay: 'morning',
    mapWidth: 64,
    mapLength: 64,
    snowDriftCount: 16,
    residentHousesCount: 6,
    decorDensity: 1.0,
  },
  {
    id: 'snowberry-square',
    name: 'Snowberry Village',
    subtitle: 'Town Square & Market',
    description: 'The villagers need the clocktower square, bakery alley, and frozen pond promenade cleared for the winter festival!',
    targetPercent: 85,
    timeOfDay: 'midday',
    mapWidth: 80,
    mapLength: 80,
    snowDriftCount: 26,
    residentHousesCount: 10,
    decorDensity: 1.3,
  },
  {
    id: 'frostpeak-pass',
    name: 'Frostpeak Pass',
    subtitle: 'Alpine Mountain Lodge',
    description: 'High altitude mountain roads with deep drifts and winding serpentine turns under the winter stars.',
    targetPercent: 90,
    timeOfDay: 'night',
    mapWidth: 92,
    mapLength: 92,
    snowDriftCount: 36,
    residentHousesCount: 12,
    decorDensity: 1.5,
  },
  {
    id: 'endless-chill',
    name: 'Endless Snow Day',
    subtitle: 'Zen Free Roam',
    description: 'Gentle, continuous powdery snowfall. No timers, no pressure — pure satisfying snow-plowing bliss.',
    targetPercent: 999, // Endless
    isEndless: true,
    timeOfDay: 'sunset',
    mapWidth: 80,
    mapLength: 80,
    snowDriftCount: 30,
    residentHousesCount: 8,
    decorDensity: 1.2,
  },
];
