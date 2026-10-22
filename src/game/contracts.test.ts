import { describe, test, expect, beforeEach } from 'bun:test';
import { CONTRACTS, DISTRICTS, evaluateContractResult } from './contracts.ts';
import { DEFAULT_COMPANY_PROGRESS } from './companyStorage.ts';

describe('Stage 4I — Career Reputation Progression & Unlock Sequence', () => {
  test('CONTRACTS minReputationRequired values match Stage 4I specifications', () => {
    const c1 = CONTRACTS.find((c) => c.id === 'contract-pinecone-morning');
    const c2 = CONTRACTS.find((c) => c.id === 'contract-pinecone-blizzard');
    const c3 = CONTRACTS.find((c) => c.id === 'contract-snowberry-market');
    const c4 = CONTRACTS.find((c) => c.id === 'contract-snowberry-express');
    const c5 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-night');
    const c6 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-storm');

    expect(c1?.minReputationRequired).toBe(0);
    expect(c2?.minReputationRequired).toBe(25);
    expect(c3?.minReputationRequired).toBe(70);
    expect(c4?.minReputationRequired).toBe(130);
    expect(c5?.minReputationRequired).toBe(210);
    expect(c6?.minReputationRequired).toBe(320);
  });

  test('DISTRICTS requiredReputation values match Stage 4I specifications', () => {
    const d1 = DISTRICTS.find((d) => d.id === 'district-pinecone');
    const d2 = DISTRICTS.find((d) => d.id === 'district-snowberry');
    const d3 = DISTRICTS.find((d) => d.id === 'district-frostpeak');

    expect(d1?.requiredReputation).toBe(0);
    expect(d2?.requiredReputation).toBe(70);
    expect(d3?.requiredReputation).toBe(210);
  });

  test('Linear progression unlocks next contract on single first-time completion without grinding', () => {
    let currentProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 0, coins: 100 };

    const c1 = CONTRACTS.find((c) => c.id === 'contract-pinecone-morning')!;
    const c2 = CONTRACTS.find((c) => c.id === 'contract-pinecone-blizzard')!;
    const c3 = CONTRACTS.find((c) => c.id === 'contract-snowberry-market')!;
    const c4 = CONTRACTS.find((c) => c.id === 'contract-snowberry-express')!;
    const c5 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-night')!;
    const c6 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-storm')!;

    const d1 = DISTRICTS.find((d) => d.id === 'district-pinecone')!;
    const d2 = DISTRICTS.find((d) => d.id === 'district-snowberry')!;
    const d3 = DISTRICTS.find((d) => d.id === 'district-frostpeak')!;

    // Initial state: 0 REP
    expect(currentProgress.reputation).toBe(0);
    expect(currentProgress.reputation >= c1.minReputationRequired!).toBe(true);
    expect(currentProgress.reputation >= c2.minReputationRequired!).toBe(false);
    expect(currentProgress.reputation >= d2.requiredReputation).toBe(false);

    // 1. Complete C1 (+25 REP)
    const res1 = evaluateContractResult(c1, c1.targetPercent, 100, 100, currentProgress);
    currentProgress = res1.updatedProgress;
    expect(currentProgress.reputation).toBe(25);
    expect(currentProgress.reputation >= c2.minReputationRequired!).toBe(true); // C2 unlocked!

    // 2. Complete C2 (+45 REP)
    const res2 = evaluateContractResult(c2, c2.targetPercent, 100, 100, currentProgress);
    currentProgress = res2.updatedProgress;
    expect(currentProgress.reputation).toBe(70);
    expect(currentProgress.reputation >= d2.requiredReputation).toBe(true); // District 2 unlocked!
    expect(currentProgress.reputation >= c3.minReputationRequired!).toBe(true); // C3 unlocked!
    expect(currentProgress.reputation >= c4.minReputationRequired!).toBe(false);

    // 3. Complete C3 (+60 REP)
    const res3 = evaluateContractResult(c3, c3.targetPercent, 100, 100, currentProgress);
    currentProgress = res3.updatedProgress;
    expect(currentProgress.reputation).toBe(130);
    expect(currentProgress.reputation >= c4.minReputationRequired!).toBe(true); // C4 unlocked!
    expect(currentProgress.reputation >= c5.minReputationRequired!).toBe(false);

    // 4. Complete C4 (+80 REP)
    const res4 = evaluateContractResult(c4, c4.targetPercent, 100, 100, currentProgress);
    currentProgress = res4.updatedProgress;
    expect(currentProgress.reputation).toBe(210);
    expect(currentProgress.reputation >= d3.requiredReputation).toBe(true); // District 3 unlocked!
    expect(currentProgress.reputation >= c5.minReputationRequired!).toBe(true); // C5 unlocked!
    expect(currentProgress.reputation >= c6.minReputationRequired!).toBe(false);

    // 5. Complete C5 (+110 REP)
    const res5 = evaluateContractResult(c5, c5.targetPercent, 100, 100, currentProgress);
    currentProgress = res5.updatedProgress;
    expect(currentProgress.reputation).toBe(320);
    expect(currentProgress.reputation >= c6.minReputationRequired!).toBe(true); // C6 unlocked!

    // 6. Complete C6 (+160 REP)
    const res6 = evaluateContractResult(c6, c6.targetPercent, 100, 100, currentProgress);
    currentProgress = res6.updatedProgress;
    expect(currentProgress.reputation).toBe(480);
    expect(currentProgress.completedContractIds).toHaveLength(6);
  });

  test('Existing contract rewards and penalty terms remain unchanged', () => {
    const c1 = CONTRACTS.find((c) => c.id === 'contract-pinecone-morning')!;
    expect(c1.rewardCoins).toBe(120);
    expect(c1.rewardReputation).toBe(25);
    expect(c1.penalty.failureFeeCoins).toBe(30);
    expect(c1.penalty.reputationLoss).toBe(10);
    expect(c1.penalty.minPercentRequired).toBe(50);

    const c6 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-storm')!;
    expect(c6.rewardCoins).toBe(950);
    expect(c6.rewardReputation).toBe(160);
    expect(c6.penalty.failureFeeCoins).toBe(200);
    expect(c6.penalty.reputationLoss).toBe(50);
    expect(c6.penalty.minPercentRequired).toBe(80);
  });
});
