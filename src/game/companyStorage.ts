import { CompanyProgress } from './types.ts';
import { TRUCK_COLORS } from './constants.ts';

export const SAVE_KEY = 'snowdrift_company_progress_v1';
export const CURRENT_SAVE_VERSION = 1;

export const DEFAULT_COMPANY_PROGRESS: CompanyProgress = {
  version: CURRENT_SAVE_VERSION,
  companyName: 'Alpine Clear Co.',
  coins: 100,
  reputation: 0,
  completedContractIds: [],
  activeContractId: null,
  upgrades: {
    bladeWidth: 1,
    enginePower: 1,
    studdedTires: 1,
    heatedBlade: 1,
    saltSpreader: 1,
    turboBoost: 1,
  },
  selectedColorHex: TRUCK_COLORS[0].hex,
  selectedBladeHex: TRUCK_COLORS[0].bladeHex,
  lastUpdated: Date.now(),
};

/**
 * Validates and safely parses saved company progress from localStorage.
 * If data is corrupt, missing, or invalid, returns safe default values.
 */
export function loadCompanyProgress(): CompanyProgress {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { ...DEFAULT_COMPANY_PROGRESS };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_COMPANY_PROGRESS };
    }

    // Validate version and sanitize fields safely
    const coins = typeof parsed.coins === 'number' && !isNaN(parsed.coins) && parsed.coins >= 0
      ? parsed.coins
      : DEFAULT_COMPANY_PROGRESS.coins;

    const reputation = typeof parsed.reputation === 'number' && !isNaN(parsed.reputation) && parsed.reputation >= 0
      ? parsed.reputation
      : DEFAULT_COMPANY_PROGRESS.reputation;

    const completedContractIds = Array.isArray(parsed.completedContractIds)
      ? parsed.completedContractIds.filter((id: unknown) => typeof id === 'string')
      : [];

    const activeContractId = typeof parsed.activeContractId === 'string'
      ? parsed.activeContractId
      : null;

    const upgrades = { ...DEFAULT_COMPANY_PROGRESS.upgrades };
    if (parsed.upgrades && typeof parsed.upgrades === 'object') {
      for (const [key, val] of Object.entries(parsed.upgrades)) {
        if (typeof val === 'number' && !isNaN(val) && val >= 1) {
          upgrades[key] = Math.floor(val);
        }
      }
    }

    const selectedColorHex = typeof parsed.selectedColorHex === 'string' && parsed.selectedColorHex.startsWith('#')
      ? parsed.selectedColorHex
      : DEFAULT_COMPANY_PROGRESS.selectedColorHex;

    const selectedBladeHex = typeof parsed.selectedBladeHex === 'string' && parsed.selectedBladeHex.startsWith('#')
      ? parsed.selectedBladeHex
      : DEFAULT_COMPANY_PROGRESS.selectedBladeHex;

    const companyName = typeof parsed.companyName === 'string' && parsed.companyName.trim().length > 0
      ? parsed.companyName.trim()
      : DEFAULT_COMPANY_PROGRESS.companyName;

    return {
      version: CURRENT_SAVE_VERSION,
      companyName,
      coins,
      reputation,
      completedContractIds,
      activeContractId,
      upgrades,
      selectedColorHex,
      selectedBladeHex,
      lastUpdated: typeof parsed.lastUpdated === 'number' ? parsed.lastUpdated : Date.now(),
    };
  } catch (e) {
    console.warn('Snowdrift: Failed to load company progress from localStorage. Using defaults.', e);
    return { ...DEFAULT_COMPANY_PROGRESS };
  }
}

/**
 * Persists company progress to localStorage safely.
 */
export function saveCompanyProgress(progress: CompanyProgress): boolean {
  try {
    const dataToSave: CompanyProgress = {
      ...progress,
      version: CURRENT_SAVE_VERSION,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (e) {
    console.warn('Snowdrift: Failed to save company progress to localStorage.', e);
    return false;
  }
}
