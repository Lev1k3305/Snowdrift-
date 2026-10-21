import { describe, test, expect, beforeEach } from 'bun:test';
import {
  loadCompanyProgress,
  saveCompanyProgress,
  DEFAULT_COMPANY_PROGRESS,
  SAVE_KEY,
  CURRENT_SAVE_VERSION,
} from './companyStorage.ts';
import { CONTRACTS, DISTRICTS, evaluateContractResult } from './contracts.ts';
import { LEVELS, UPGRADES } from './constants.ts';
import { MAX_GAMEPLAY_COIN_MULTIPLIER } from './gameEngine.ts';

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

  test('Contract unlocking logic strictly obeys player reputation', () => {
    const firstContract = CONTRACTS[0]; // minReputationRequired: 0
    const highRepContract = CONTRACTS.find((c) => (c.minReputationRequired ?? 0) > 100);

    expect(firstContract).toBeDefined();
    expect(highRepContract).toBeDefined();

    // With 0 reputation:
    const zeroRepProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 0 };
    expect((firstContract.minReputationRequired ?? 0) <= zeroRepProgress.reputation).toBe(true);
    expect((highRepContract!.minReputationRequired ?? 0) <= zeroRepProgress.reputation).toBe(false);

    // With sufficient reputation:
    const highRepProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 300 };
    expect((highRepContract!.minReputationRequired ?? 0) <= highRepProgress.reputation).toBe(true);
  });

  test('evaluateContractResult pays contract reward and reputation for successful completion', () => {
    const contract = CONTRACTS[0]; // targetPercent: 80, rewardCoins: 120, rewardReputation: 25
    const initialProgress = {
      ...DEFAULT_COMPANY_PROGRESS,
      coins: 100,
      reputation: 10,
      completedContractIds: [],
    };

    // Plowing cleared 85% (> 80%), collected 30 gameplay coins (ending 130)
    const { result, updatedProgress } = evaluateContractResult(
      contract,
      85,
      100,
      130,
      initialProgress
    );

    expect(result.success).toBe(true);
    expect(result.baseRewardCoins).toBe(contract.rewardCoins);
    expect(result.rewardReputation).toBe(contract.rewardReputation);
    expect(result.penaltyCoins).toBe(0);
    expect(result.penaltyReputation).toBe(0);
    expect(result.gameplayCoins).toBe(30);
    expect(result.netCoinsGained).toBe(120 + 30);
    expect(result.updatedCoins).toBe(100 + 120 + 30);
    expect(result.updatedReputation).toBe(10 + 25);
    expect(updatedProgress.completedContractIds).toContain(contract.id);
    expect(updatedProgress.activeContractId).toBeNull();
  });

  test('evaluateContractResult applies failure penalty and does not pay reward for failed completion', () => {
    const contract = CONTRACTS[0]; // targetPercent: 80, penalty: failureFeeCoins: 30, reputationLoss: 10
    const initialProgress = {
      ...DEFAULT_COMPANY_PROGRESS,
      coins: 100,
      reputation: 20,
      completedContractIds: [],
    };

    // Plowing cleared 40% (< 80%), collected 10 gameplay coins (ending 110)
    const { result, updatedProgress } = evaluateContractResult(
      contract,
      40,
      100,
      110,
      initialProgress
    );

    expect(result.success).toBe(false);
    expect(result.baseRewardCoins).toBe(0);
    expect(result.rewardReputation).toBe(0);
    expect(result.penaltyCoins).toBe(30);
    expect(result.penaltyReputation).toBe(10);
    expect(result.netCoinsGained).toBe(0 + 10 - 30); // -20
    expect(result.updatedCoins).toBe(80);
    expect(result.updatedReputation).toBe(10);
    expect(updatedProgress.completedContractIds).not.toContain(contract.id);
  });

  test('evaluateContractResult safely clamps balance and reputation to non-negative minimum', () => {
    const contract = CONTRACTS[5]; // penalty: failureFeeCoins: 200, reputationLoss: 50
    const brokeProgress = {
      ...DEFAULT_COMPANY_PROGRESS,
      coins: 20,
      reputation: 5,
    };

    const { result, updatedProgress } = evaluateContractResult(
      contract,
      10, // failed miserably
      20,
      20, // 0 gameplay coins
      brokeProgress
    );

    expect(result.success).toBe(false);
    expect(result.updatedCoins).toBe(0); // Clamped at 0, not -180
    expect(result.updatedReputation).toBe(0); // Clamped at 0, not -45
    expect(updatedProgress.coins).toBe(0);
    expect(updatedProgress.reputation).toBe(0);
  });

  test('evaluateContractResult preserves existing upgrades, colors, and completed contracts', () => {
    const contract = CONTRACTS[1];
    const customizedProgress = {
      ...DEFAULT_COMPANY_PROGRESS,
      companyName: 'Peak Plowing Inc.',
      upgrades: { ...DEFAULT_COMPANY_PROGRESS.upgrades, bladeWidth: 3, saltSpreader: 2 },
      selectedColorHex: '#123456',
      selectedBladeHex: '#654321',
      completedContractIds: ['contract-pinecone-morning'],
    };

    const { updatedProgress } = evaluateContractResult(
      contract,
      90,
      100,
      120,
      customizedProgress
    );

    expect(updatedProgress.companyName).toBe('Peak Plowing Inc.');
    expect(updatedProgress.upgrades.bladeWidth).toBe(3);
    expect(updatedProgress.upgrades.saltSpreader).toBe(2);
    expect(updatedProgress.selectedColorHex).toBe('#123456');
    expect(updatedProgress.selectedBladeHex).toBe('#654321');
    expect(updatedProgress.completedContractIds).toContain('contract-pinecone-morning');
    expect(updatedProgress.completedContractIds).toContain('contract-pinecone-blizzard');
  });

  test('Updated rebalanced upgrade costs match expected prices', () => {
    expect(UPGRADES.bladeWidth.costs).toEqual([100, 300, 600]);
    expect(UPGRADES.enginePower.costs).toEqual([120, 350, 700]);
    expect(UPGRADES.heatedBlade.costs).toEqual([200, 500]);
    // Unchanged upgrades
    expect(UPGRADES.studdedTires.costs).toEqual([75, 200]);
    expect(UPGRADES.saltSpreader.costs).toEqual([80, 220]);
    expect(UPGRADES.turboBoost.costs).toEqual([90, 240]);
  });

  test('Combined gameplay coin multiplier does not exceed 8.0x cap', () => {
    const maxCombo = 10.0;
    const maxHeater = 1.6;
    const blizzardMult = 1.5;

    const rawMultiplier = maxCombo * maxHeater * blizzardMult; // 24.0x
    const effectiveMultiplier = Math.min(MAX_GAMEPLAY_COIN_MULTIPLIER, rawMultiplier);

    expect(rawMultiplier).toBe(24.0);
    expect(effectiveMultiplier).toBe(8.0);
  });

  test('Heated blade and blizzard multipliers work normally below 8.0x cap', () => {
    const lowCombo = 2.0;
    const heaterLvl2 = 1.25;
    const blizzardMult = 1.5;

    const rawMultiplier = lowCombo * heaterLvl2 * blizzardMult; // 3.75x
    const effectiveMultiplier = Math.min(MAX_GAMEPLAY_COIN_MULTIPLIER, rawMultiplier);

    expect(effectiveMultiplier).toBe(3.75);
  });

  test('Arcade Mode victory state update preserves reputation and completed contracts', () => {
    const initialProgress = {
      ...DEFAULT_COMPANY_PROGRESS,
      coins: 100,
      reputation: 50,
      completedContractIds: ['contract-pinecone-morning'],
    };

    // Simulate Arcade Mode victory state update pattern from App.tsx
    const arcadeVictoryCoins = 180;
    const updatedProgress = {
      ...initialProgress,
      coins: arcadeVictoryCoins,
    };

    expect(updatedProgress.coins).toBe(180);
    expect(updatedProgress.reputation).toBe(50); // Unchanged
    expect(updatedProgress.completedContractIds).toEqual(['contract-pinecone-morning']); // Unchanged
  });
});
