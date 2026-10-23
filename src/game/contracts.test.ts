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

import {
  getContractStatus,
  getContractReputationRemaining,
  getDistrictStatus,
  getNextReputationMilestone,
} from './contracts.ts';

describe('Stage 4J — Career Hub Progression Clarity', () => {
  test('getContractStatus accurately distinguishes available, active, completed, and locked states', () => {
    const c1 = CONTRACTS.find((c) => c.id === 'contract-pinecone-morning')!; // minRep: 0
    const c2 = CONTRACTS.find((c) => c.id === 'contract-pinecone-blizzard')!; // minRep: 25

    // State A: Fresh profile (0 REP, 0 completed, no active)
    const freshProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 0 };
    expect(getContractStatus(c1, freshProgress)).toBe('available');
    expect(getContractStatus(c2, freshProgress)).toBe('locked');

    // State B: Active contract
    const activeProgress = { ...freshProgress, activeContractId: c1.id };
    expect(getContractStatus(c1, activeProgress)).toBe('active');

    // State C: Completed contract
    const completedProgress = { ...freshProgress, completedContractIds: [c1.id], reputation: 25 };
    expect(getContractStatus(c1, completedProgress)).toBe('completed');
    expect(getContractStatus(c2, completedProgress)).toBe('available');
  });

  test('getContractReputationRemaining calculates exact remaining reputation needed', () => {
    const c2 = CONTRACTS.find((c) => c.id === 'contract-pinecone-blizzard')!; // minRep: 25
    const c3 = CONTRACTS.find((c) => c.id === 'contract-snowberry-market')!; // minRep: 70
    const c6 = CONTRACTS.find((c) => c.id === 'contract-frostpeak-storm')!; // minRep: 320

    expect(getContractReputationRemaining(c2, 0)).toBe(25);
    expect(getContractReputationRemaining(c2, 10)).toBe(15);
    expect(getContractReputationRemaining(c2, 25)).toBe(0);
    expect(getContractReputationRemaining(c2, 50)).toBe(0);

    expect(getContractReputationRemaining(c3, 25)).toBe(45);
    expect(getContractReputationRemaining(c6, 210)).toBe(110);
  });

  test('getDistrictStatus computes unlock status and completed contract counts', () => {
    const d1 = DISTRICTS.find((d) => d.id === 'district-pinecone')!; // reqRep: 0
    const d2 = DISTRICTS.find((d) => d.id === 'district-snowberry')!; // reqRep: 70

    // Profile with 25 REP, C1 completed
    const progress = {
      ...DEFAULT_COMPANY_PROGRESS,
      reputation: 25,
      completedContractIds: ['contract-pinecone-morning'],
    };

    const status1 = getDistrictStatus(d1, progress);
    expect(status1.isUnlocked).toBe(true);
    expect(status1.requiredReputation).toBe(0);
    expect(status1.remainingReputation).toBe(0);
    expect(status1.completedCount).toBe(1);
    expect(status1.totalContracts).toBe(2);

    const status2 = getDistrictStatus(d2, progress);
    expect(status2.isUnlocked).toBe(false);
    expect(status2.requiredReputation).toBe(70);
    expect(status2.remainingReputation).toBe(45); // 70 - 25
    expect(status2.completedCount).toBe(0);
    expect(status2.totalContracts).toBe(2);
  });

  test('getNextReputationMilestone identifies next target threshold and remaining reputation', () => {
    // 0 REP: Next milestone is C2 (Suburban Snowdrift Emergency at 25 REP)
    const prog0 = { ...DEFAULT_COMPANY_PROGRESS, reputation: 0 };
    const m0 = getNextReputationMilestone(prog0);
    expect(m0.nextThreshold).toBe(25);
    expect(m0.remainingReputation).toBe(25);
    expect(m0.type).toBe('contract');
    expect(m0.targetName).toBe('Suburban Snowdrift Emergency');

    // 25 REP: Next milestone is Snowberry District / Snowberry Market at 70 REP
    const prog25 = { ...DEFAULT_COMPANY_PROGRESS, reputation: 25 };
    const m25 = getNextReputationMilestone(prog25);
    expect(m25.nextThreshold).toBe(70);
    expect(m25.remainingReputation).toBe(45);

    // 210 REP: Next milestone is C6 (Extreme Peak Storm Clearance at 320 REP)
    const prog210 = { ...DEFAULT_COMPANY_PROGRESS, reputation: 210 };
    const m210 = getNextReputationMilestone(prog210);
    expect(m210.nextThreshold).toBe(320);
    expect(m210.remainingReputation).toBe(110);
    expect(m210.type).toBe('contract');
    expect(m210.targetName).toBe('Extreme Peak Storm Clearance');
  });

  test('getNextReputationMilestone handles maximum progression edge case gracefully', () => {
    const maxProg = { ...DEFAULT_COMPANY_PROGRESS, reputation: 350 };
    const mMax = getNextReputationMilestone(maxProg);

    expect(mMax.type).toBe('max');
    expect(mMax.remainingReputation).toBe(0);
    expect(mMax.targetName).toBe('Maximum Progression');
    expect(mMax.nextThreshold).toBe(350);
  });
});

import {
  getNewlyUnlockedDistricts,
  getNewlyUnlockedContracts,
  getNextAvailableContract,
} from './contracts.ts';

describe('Stage 4K — Career Contract Results UX', () => {
  test('Presentation of successful contract result is properly calculated without double payout', () => {
    const c1 = CONTRACTS[0]; // targetPercent: 80, rewardCoins: 120, rewardReputation: 25
    const initialProgress = { ...DEFAULT_COMPANY_PROGRESS, coins: 100, reputation: 0 };

    const { result, updatedProgress } = evaluateContractResult(
      c1,
      85, // 85% cleared >= 80% target
      100,
      130, // 30 gameplay coins
      initialProgress
    );

    expect(result.success).toBe(true);
    expect(result.finalPercent).toBe(85);
    expect(result.targetPercent).toBe(80);
    expect(result.baseRewardCoins).toBe(120);
    expect(result.gameplayCoins).toBe(30);
    expect(result.penaltyCoins).toBe(0);
    expect(result.penaltyReputation).toBe(0);
    expect(result.netCoinsGained).toBe(150);
    expect(result.netReputationGained).toBe(25);
    expect(result.updatedCoins).toBe(250);
    expect(result.updatedReputation).toBe(25);

    // Verify evaluation is deterministic and does not mutate initialProgress
    expect(initialProgress.coins).toBe(100);
    expect(initialProgress.reputation).toBe(0);
    expect(updatedProgress.coins).toBe(250);
    expect(updatedProgress.reputation).toBe(25);
  });

  test('Distinguishes failed contract without penalty versus failed contract with penalty', () => {
    const c1 = CONTRACTS[0]; // target: 80, penalty: failureFeeCoins: 30, reputationLoss: 10, minPercentRequired: 50
    const initialProgress = { ...DEFAULT_COMPANY_PROGRESS, coins: 100, reputation: 20 };

    // Failure WITHOUT penalty (75% cleared, target is 80%, minPercentRequired is 50%)
    const noPenaltyEval = evaluateContractResult(c1, 75, 100, 115, initialProgress);
    expect(noPenaltyEval.result.success).toBe(false);
    expect(noPenaltyEval.result.penaltyCoins).toBe(0);
    expect(noPenaltyEval.result.penaltyReputation).toBe(0);
    expect(noPenaltyEval.result.netCoinsGained).toBe(15); // 15 gameplay coins
    expect(noPenaltyEval.result.netReputationGained).toBe(0);

    // Failure WITH penalty (40% cleared < minPercentRequired 50%)
    const withPenaltyEval = evaluateContractResult(c1, 40, 100, 105, initialProgress);
    expect(withPenaltyEval.result.success).toBe(false);
    expect(withPenaltyEval.result.penaltyCoins).toBe(30);
    expect(withPenaltyEval.result.penaltyReputation).toBe(10);
    expect(withPenaltyEval.result.netCoinsGained).toBe(-25); // 5 gameplay - 30 penalty = -25
    expect(withPenaltyEval.result.netReputationGained).toBe(-10);
    expect(withPenaltyEval.result.updatedCoins).toBe(75);
    expect(withPenaltyEval.result.updatedReputation).toBe(10);
  });

  test('getNewlyUnlockedDistricts identifies districts newly unlocked after completion', () => {
    const c2 = CONTRACTS[1]; // target: 85, rewardReputation: 45
    const prevProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 25 }; // District 2 requires 70 REP

    const { updatedProgress } = evaluateContractResult(c2, 85, 100, 100, prevProgress);
    expect(updatedProgress.reputation).toBe(70);

    const newlyUnlocked = getNewlyUnlockedDistricts(prevProgress, updatedProgress);
    expect(newlyUnlocked).toHaveLength(1);
    expect(newlyUnlocked[0].id).toBe('district-snowberry');
  });

  test('getNewlyUnlockedContracts identifies contracts newly unlocked after completion', () => {
    const c1 = CONTRACTS[0]; // rewardReputation: 25
    const prevProgress = { ...DEFAULT_COMPANY_PROGRESS, reputation: 0 }; // C2 requires 25 REP

    const { updatedProgress } = evaluateContractResult(c1, 80, 100, 100, prevProgress);
    expect(updatedProgress.reputation).toBe(25);

    const newlyUnlocked = getNewlyUnlockedContracts(prevProgress, updatedProgress);
    expect(newlyUnlocked).toHaveLength(1);
    expect(newlyUnlocked[0].id).toBe('contract-pinecone-blizzard');
  });

  test('getNextAvailableContract returns next available contract in sequence', () => {
    const c1 = CONTRACTS[0];
    const c2 = CONTRACTS[1];

    // Progress where C2 is unlocked (25 REP)
    const progressWith25Rep = { ...DEFAULT_COMPANY_PROGRESS, reputation: 25, completedContractIds: ['contract-pinecone-morning'] };

    const nextFromC1 = getNextAvailableContract(c1.id, progressWith25Rep);
    expect(nextFromC1?.id).toBe(c2.id);
  });
});
