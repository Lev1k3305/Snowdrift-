import { CompanyProgress, Contract, ContractResult, DistrictConfig } from './types.ts';

export const DISTRICTS: DistrictConfig[] = [
  {
    id: 'district-pinecone',
    name: 'Pinecone Residential Suburbs',
    description: 'Quiet cul-de-sacs and cozy residential driveways requiring regular snow clearing.',
    locationId: 'pinecone-lane',
    requiredReputation: 0,
    unlockedContracts: [
      'contract-pinecone-morning',
      'contract-pinecone-blizzard',
      'contract-pinecone-flawless',
    ],
  },
  {
    id: 'district-snowberry',
    name: 'Snowberry Commercial Village',
    description: 'High-traffic town square, local bakery alley, and village promenade.',
    locationId: 'snowberry-square',
    requiredReputation: 70,
    unlockedContracts: [
      'contract-snowberry-market',
      'contract-snowberry-blizzard',
      'contract-snowberry-express',
    ],
  },
  {
    id: 'district-frostpeak',
    name: 'Frostpeak Mountain Pass',
    description: 'Challenging alpine serpentine roads connecting high-altitude lodges.',
    locationId: 'frostpeak-pass',
    requiredReputation: 210,
    unlockedContracts: [
      'contract-frostpeak-night',
      'contract-frostpeak-summit',
      'contract-frostpeak-storm',
    ],
  },
];

export const CONTRACTS: Contract[] = [
  {
    id: 'contract-pinecone-morning',
    title: 'Morning Cul-de-sac Clear',
    clientName: 'Pinecone Neighborhood Watch',
    description: 'Clear the residential driveways and main street before the morning commute.',
    locationId: 'pinecone-lane',
    targetPercent: 80,
    rewardCoins: 120,
    rewardReputation: 25,
    penalty: {
      failureFeeCoins: 30,
      reputationLoss: 10,
      minPercentRequired: 50,
    },
    weather: 'light_snow',
    timeOfDay: 'morning',
    minReputationRequired: 0,
  },
  {
    id: 'contract-pinecone-blizzard',
    title: 'Suburban Snowdrift Emergency',
    clientName: 'Alpine Municipal Services',
    description: 'Heavy snowdrifts are blocking mail trucks in Pinecone Lane. Open all main routes!',
    locationId: 'pinecone-lane',
    targetPercent: 85,
    rewardCoins: 220,
    rewardReputation: 45,
    penalty: {
      failureFeeCoins: 50,
      reputationLoss: 15,
      minPercentRequired: 60,
    },
    weather: 'blizzard',
    timeOfDay: 'midday',
    minReputationRequired: 25,
  },
  {
    id: 'contract-pinecone-flawless',
    title: 'Pinecone Resident Showcase',
    clientName: 'Pinecone Homeowners Association',
    description: 'Deliver pristine driveway and curb clearance for the neighborhood HOA inspection.',
    locationId: 'pinecone-lane',
    targetPercent: 92,
    rewardCoins: 280,
    rewardReputation: 55,
    penalty: {
      failureFeeCoins: 60,
      reputationLoss: 18,
      minPercentRequired: 70,
    },
    weather: 'clear',
    timeOfDay: 'morning',
    minReputationRequired: 45,
  },
  {
    id: 'contract-snowberry-market',
    title: 'Winter Festival Marketplace',
    clientName: 'Snowberry Merchants Guild',
    description: 'Clear the town square and promenade so the weekend winter market can open.',
    locationId: 'snowberry-square',
    targetPercent: 85,
    rewardCoins: 350,
    rewardReputation: 60,
    penalty: {
      failureFeeCoins: 80,
      reputationLoss: 20,
      minPercentRequired: 65,
    },
    weather: 'clear',
    timeOfDay: 'midday',
    minReputationRequired: 70,
  },
  {
    id: 'contract-snowberry-blizzard',
    title: 'Snowberry Downtown Emergency',
    clientName: 'Snowberry Emergency Response',
    description: 'A sudden whiteout blizzard has blinded the commercial district. Open emergency bus lanes and fire hydrants.',
    locationId: 'snowberry-square',
    targetPercent: 88,
    rewardCoins: 520,
    rewardReputation: 95,
    penalty: {
      failureFeeCoins: 110,
      reputationLoss: 28,
      minPercentRequired: 65,
    },
    weather: 'blizzard',
    timeOfDay: 'sunset',
    minReputationRequired: 100,
  },
  {
    id: 'contract-snowberry-express',
    title: 'Clocktower Alley Rush',
    clientName: 'Snowberry Tourism Board',
    description: 'Fast clearing request around the clocktower and bakery district.',
    locationId: 'snowberry-square',
    targetPercent: 90,
    rewardCoins: 480,
    rewardReputation: 80,
    penalty: {
      failureFeeCoins: 100,
      reputationLoss: 25,
      minPercentRequired: 70,
    },
    weather: 'light_snow',
    timeOfDay: 'sunset',
    minReputationRequired: 130,
  },
  {
    id: 'contract-frostpeak-night',
    title: 'Alpine Lodge Highway Access',
    clientName: 'Frostpeak Resort Patrol',
    description: 'Night shift snow-plowing along winding serpentine mountain passes.',
    locationId: 'frostpeak-pass',
    targetPercent: 90,
    rewardCoins: 650,
    rewardReputation: 110,
    penalty: {
      failureFeeCoins: 150,
      reputationLoss: 35,
      minPercentRequired: 75,
    },
    weather: 'light_snow',
    timeOfDay: 'night',
    minReputationRequired: 210,
  },
  {
    id: 'contract-frostpeak-summit',
    title: 'Frostpeak Summit Ridge Patrol',
    clientName: 'Alpine Observatory Operations',
    description: 'High altitude clearing shift across narrow mountain ridges to keep research station supply lines open.',
    locationId: 'frostpeak-pass',
    targetPercent: 92,
    rewardCoins: 780,
    rewardReputation: 135,
    penalty: {
      failureFeeCoins: 170,
      reputationLoss: 40,
      minPercentRequired: 75,
    },
    weather: 'light_snow',
    timeOfDay: 'sunset',
    minReputationRequired: 260,
  },
  {
    id: 'contract-frostpeak-storm',
    title: 'Extreme Peak Storm Clearance',
    clientName: 'Mountain Safety Patrol',
    description: 'High altitude blizzard clearing operation to rescue stranded lodge visitors.',
    locationId: 'frostpeak-pass',
    targetPercent: 95,
    rewardCoins: 950,
    rewardReputation: 160,
    penalty: {
      failureFeeCoins: 200,
      reputationLoss: 50,
      minPercentRequired: 80,
    },
    weather: 'blizzard',
    timeOfDay: 'night',
    minReputationRequired: 320,
  },
];

/**
 * Evaluates contract results against actual game outcome and current company progress.
 * Guarantees zero negative balance and deterministic single-payout results.
 */
export function evaluateContractResult(
  contract: Contract,
  finalPercent: number,
  startingCoins: number,
  endingCoins: number,
  currentCompanyProgress: CompanyProgress
): { result: ContractResult; updatedProgress: CompanyProgress } {
  const success = finalPercent >= contract.targetPercent;
  const gameplayCoins = Math.max(0, endingCoins - startingCoins);

  const applyPenalty = !success && finalPercent < contract.penalty.minPercentRequired;

  const baseRewardCoins = success ? contract.rewardCoins : 0;
  const rewardReputation = success ? contract.rewardReputation : 0;
  const penaltyCoins = applyPenalty ? contract.penalty.failureFeeCoins : 0;
  const penaltyReputation = applyPenalty ? contract.penalty.reputationLoss : 0;

  const netCoinsGained = baseRewardCoins + gameplayCoins - penaltyCoins;
  const netReputationGained = rewardReputation - penaltyReputation;

  const updatedCoins = Math.max(0, currentCompanyProgress.coins + netCoinsGained);
  const updatedReputation = Math.max(0, currentCompanyProgress.reputation + netReputationGained);

  const newCompleted = [...currentCompanyProgress.completedContractIds];
  if (success && !newCompleted.includes(contract.id)) {
    newCompleted.push(contract.id);
  }

  const result: ContractResult = {
    contract,
    success,
    finalPercent,
    targetPercent: contract.targetPercent,
    baseRewardCoins,
    rewardReputation,
    gameplayCoins,
    penaltyCoins,
    penaltyReputation,
    netCoinsGained,
    netReputationGained,
    updatedCoins,
    updatedReputation,
  };

  const updatedProgress: CompanyProgress = {
    ...currentCompanyProgress,
    coins: updatedCoins,
    reputation: updatedReputation,
    completedContractIds: newCompleted,
    activeContractId: null,
  };

  return { result, updatedProgress };
}

export type ContractUnlockStatus = 'completed' | 'active' | 'locked' | 'available';

/**
 * Returns contract unlock state based on company progress.
 */
export function getContractStatus(
  contract: Contract,
  progress: CompanyProgress
): ContractUnlockStatus {
  if (progress.completedContractIds.includes(contract.id)) {
    return 'completed';
  }
  if (progress.activeContractId === contract.id) {
    return 'active';
  }
  const minRep = contract.minReputationRequired ?? 0;
  if (progress.reputation < minRep) {
    return 'locked';
  }
  return 'available';
}

/**
 * Calculates remaining reputation needed to unlock a contract.
 */
export function getContractReputationRemaining(
  contract: Contract,
  currentReputation: number
): number {
  const required = contract.minReputationRequired ?? 0;
  return Math.max(0, required - currentReputation);
}

export interface DistrictUnlockInfo {
  isUnlocked: boolean;
  requiredReputation: number;
  remainingReputation: number;
  completedCount: number;
  totalContracts: number;
}

/**
 * Derives district unlock status and contract completion info.
 */
export function getDistrictStatus(
  district: DistrictConfig,
  progress: CompanyProgress
): DistrictUnlockInfo {
  const isUnlocked = progress.reputation >= district.requiredReputation;
  const remainingReputation = Math.max(0, district.requiredReputation - progress.reputation);
  const districtContracts = CONTRACTS.filter((c) =>
    district.unlockedContracts.includes(c.id)
  );
  const completedCount = districtContracts.filter((c) =>
    progress.completedContractIds.includes(c.id)
  ).length;

  return {
    isUnlocked,
    requiredReputation: district.requiredReputation,
    remainingReputation,
    completedCount,
    totalContracts: districtContracts.length,
  };
}

export interface ReputationMilestone {
  nextThreshold: number;
  remainingReputation: number;
  targetName: string;
  type: 'contract' | 'district' | 'max';
}

/**
 * Derives the next reputation milestone target for unlock progression.
 */
export function getNextReputationMilestone(progress: CompanyProgress): ReputationMilestone {
  const currentRep = progress.reputation;

  const lockedDistricts = DISTRICTS.filter((d) => d.requiredReputation > currentRep);
  const lockedContracts = CONTRACTS.filter(
    (c) => (c.minReputationRequired ?? 0) > currentRep
  );

  if (lockedDistricts.length === 0 && lockedContracts.length === 0) {
    return {
      nextThreshold: currentRep,
      remainingReputation: 0,
      targetName: 'Maximum Progression',
      type: 'max',
    };
  }

  let lowestThreshold = Infinity;
  let targetName = '';
  let milestoneType: 'contract' | 'district' = 'contract';

  for (const d of lockedDistricts) {
    if (d.requiredReputation < lowestThreshold) {
      lowestThreshold = d.requiredReputation;
      targetName = d.name;
      milestoneType = 'district';
    }
  }

  for (const c of lockedContracts) {
    const minRep = c.minReputationRequired ?? 0;
    if (minRep < lowestThreshold) {
      lowestThreshold = minRep;
      targetName = c.title;
      milestoneType = 'contract';
    }
  }

  return {
    nextThreshold: lowestThreshold,
    remainingReputation: Math.max(0, lowestThreshold - currentRep),
    targetName,
    type: milestoneType,
  };
}

/**
 * Identifies districts that became newly unlocked between two progress states.
 */
export function getNewlyUnlockedDistricts(
  prevProgress: CompanyProgress,
  newProgress: CompanyProgress
): DistrictConfig[] {
  return DISTRICTS.filter(
    (district) =>
      prevProgress.reputation < district.requiredReputation &&
      newProgress.reputation >= district.requiredReputation
  );
}

/**
 * Identifies contracts that became newly unlocked (transitioned from locked to available)
 * between two progress states.
 */
export function getNewlyUnlockedContracts(
  prevProgress: CompanyProgress,
  newProgress: CompanyProgress
): Contract[] {
  return CONTRACTS.filter((contract) => {
    const prevStatus = getContractStatus(contract, prevProgress);
    const newStatus = getContractStatus(contract, newProgress);
    return prevStatus === 'locked' && newStatus === 'available';
  });
}

/**
 * Finds the next available, uncompleted career contract following a given contract ID.
 */
export function getNextAvailableContract(
  currentContractId: string,
  progress: CompanyProgress
): Contract | null {
  const currentIndex = CONTRACTS.findIndex((c) => c.id === currentContractId);

  if (currentIndex !== -1) {
    // Search forward from current contract
    for (let i = currentIndex + 1; i < CONTRACTS.length; i++) {
      if (getContractStatus(CONTRACTS[i], progress) === 'available') {
        return CONTRACTS[i];
      }
    }
    // Search from start if needed
    for (let i = 0; i < currentIndex; i++) {
      if (getContractStatus(CONTRACTS[i], progress) === 'available') {
        return CONTRACTS[i];
      }
    }
  } else {
    // Fallback: search for first available contract
    for (const contract of CONTRACTS) {
      if (getContractStatus(contract, progress) === 'available') {
        return contract;
      }
    }
  }

  return null;
}
