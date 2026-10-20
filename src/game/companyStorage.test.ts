import { describe, test, expect, beforeEach } from 'bun:test';
import {
  loadCompanyProgress,
  saveCompanyProgress,
  DEFAULT_COMPANY_PROGRESS,
  SAVE_KEY,
  CURRENT_SAVE_VERSION,
} from './companyStorage.ts';
import { CONTRACTS, DISTRICTS } from './contracts.ts';
import { LEVELS } from './constants.ts';

// Mock localStorage for CLI test environment if undefined
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
    },
    length: 0,
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('CompanyStorage & Contracts Catalog', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('loadCompanyProgress returns default progress on empty localStorage', () => {
    const progress = loadCompanyProgress();
    expect(progress.version).toBe(CURRENT_SAVE_VERSION);
    expect(progress.coins).toBe(100);
    expect(progress.reputation).toBe(0);
    expect(progress.completedContractIds).toEqual([]);
    expect(progress.upgrades.bladeWidth).toBe(1);
  });

  test('saveCompanyProgress persists progress and loadCompanyProgress retrieves it', () => {
    const sample = {
      ...DEFAULT_COMPANY_PROGRESS,
      coins: 350,
      reputation: 80,
      completedContractIds: ['contract-pinecone-morning'],
      upgrades: { ...DEFAULT_COMPANY_PROGRESS.upgrades, enginePower: 3 },
    };

    const saved = saveCompanyProgress(sample);
    expect(saved).toBe(true);

    const loaded = loadCompanyProgress();
    expect(loaded.coins).toBe(350);
    expect(loaded.reputation).toBe(80);
    expect(loaded.completedContractIds).toEqual(['contract-pinecone-morning']);
    expect(loaded.upgrades.enginePower).toBe(3);
  });

  test('loadCompanyProgress safely handles corrupted JSON in localStorage', () => {
    localStorage.setItem(SAVE_KEY, 'invalid json {[[{');
    const loaded = loadCompanyProgress();
    expect(loaded).toEqual(DEFAULT_COMPANY_PROGRESS);
  });

  test('loadCompanyProgress sanitizes invalid field types and negative numbers', () => {
    const corruptData = {
      coins: -500, // should fallback to default
      reputation: 'high', // should fallback to default
      completedContractIds: [123, null, 'valid-contract-id'],
      upgrades: { bladeWidth: -2, enginePower: 4 },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(corruptData));

    const loaded = loadCompanyProgress();
    expect(loaded.coins).toBe(DEFAULT_COMPANY_PROGRESS.coins);
    expect(loaded.reputation).toBe(DEFAULT_COMPANY_PROGRESS.reputation);
    expect(loaded.completedContractIds).toEqual(['valid-contract-id']);
    expect(loaded.upgrades.bladeWidth).toBe(1);
    expect(loaded.upgrades.enginePower).toBe(4);
  });

  test('CONTRACTS catalog contains unique IDs and links only to existing levels', () => {
    const validLevelIds = LEVELS.map((l) => l.id);
    const contractIds = new Set<string>();

    for (const contract of CONTRACTS) {
      expect(contractIds.has(contract.id)).toBe(false);
      contractIds.add(contract.id);

      expect(validLevelIds).toContain(contract.locationId);
      expect(contract.targetPercent).toBeGreaterThan(0);
      expect(contract.rewardCoins).toBeGreaterThan(0);
      expect(contract.rewardReputation).toBeGreaterThan(0);
    }
  });

  test('DISTRICTS catalog links only to existing levels and references existing contract IDs', () => {
    const validLevelIds = LEVELS.map((l) => l.id);
    const validContractIds = CONTRACTS.map((c) => c.id);

    for (const district of DISTRICTS) {
      expect(validLevelIds).toContain(district.locationId);
      for (const contractId of district.unlockedContracts) {
        expect(validContractIds).toContain(contractId);
      }
    }
  });
});
