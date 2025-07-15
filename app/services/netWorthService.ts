// app/services/netWorthService.ts
import { AppState, Asset, FinanceData, Liability } from '@/types';
import { ServiceError, ServiceErrorCode } from '@/utils/errors';
import { assetSchema, liabilitySchema } from '@/utils/schemas';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * @file app/services/netWorthService.ts
 * @description Service for managing assets, liabilities, and net worth snapshots.
 */

const generateUUID = () => crypto.randomUUID();

/**
 * A private helper to retrieve the finance data for a given goal.
 */
const getFinanceData = async (userId: string, goalId: string): Promise<FinanceData> => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    throw new ServiceError('User data not found.', ServiceErrorCode.NOT_FOUND);
  }

  const appState = docSnap.data() as AppState;
  const goal = appState.goals[goalId];

  if (!goal || !goal.financeData) {
    throw new ServiceError(
      `Finance data for goal ID ${goalId} not found.`,
      ServiceErrorCode.NOT_FOUND
    );
  }
  return goal.financeData;
};

// =================================================================//
//                      ASSET FUNCTIONS
// =================================================================//

export const addAsset = async (
  userId: string,
  goalId: string,
  newAssetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Asset> => {
  const financeData = await getFinanceData(userId, goalId);
  const now = Timestamp.now();
  const newAsset: Asset = {
    ...newAssetData,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const validation = assetSchema.safeParse(newAsset);
  if (!validation.success) {
    throw new ServiceError(
      'New asset data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  const updatedAssets = [...financeData.assets, newAsset];
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.assets`]: updatedAssets,
    [`goals.${goalId}.updatedAt`]: now,
  });

  return newAsset;
};

export const updateAsset = async (
  userId: string,
  goalId: string,
  assetId: string,
  updates: Partial<Omit<Asset, 'id' | 'createdAt'>>
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedAssets = financeData.assets.map(a =>
    a.id === assetId ? { ...a, ...updates, updatedAt: Timestamp.now() } : a
  );

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.assets`]: updatedAssets,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

export const deleteAsset = async (
  userId: string,
  goalId: string,
  assetId: string
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedAssets = financeData.assets.filter(a => a.id !== assetId);

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.assets`]: updatedAssets,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

// =================================================================//
//                    LIABILITY FUNCTIONS
// =================================================================//

export const addLiability = async (
  userId: string,
  goalId: string,
  newLiabilityData: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Liability> => {
  const financeData = await getFinanceData(userId, goalId);
  const now = Timestamp.now();
  const newLiability: Liability = {
    ...newLiabilityData,
    id: generateUUID(),
    createdAt: now,
    updatedAt: now,
  };

  const validation = liabilitySchema.safeParse(newLiability);
  if (!validation.success) {
    throw new ServiceError(
      'New liability data is invalid.',
      ServiceErrorCode.VALIDATION_FAILED,
      validation.error
    );
  }

  const updatedLiabilities = [...financeData.liabilities, newLiability];
  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.liabilities`]: updatedLiabilities,
    [`goals.${goalId}.updatedAt`]: now,
  });

  return newLiability;
};

export const updateLiability = async (
  userId: string,
  goalId: string,
  liabilityId: string,
  updates: Partial<Omit<Liability, 'id' | 'createdAt'>>
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedLiabilities = financeData.liabilities.map(l =>
    l.id === liabilityId ? { ...l, ...updates, updatedAt: Timestamp.now() } : l
  );

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.liabilities`]: updatedLiabilities,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};

export const deleteLiability = async (
  userId: string,
  goalId: string,
  liabilityId: string
): Promise<void> => {
  const financeData = await getFinanceData(userId, goalId);
  const updatedLiabilities = financeData.liabilities.filter(l => l.id !== liabilityId);

  const userDocRef = doc(db, 'users', userId);
  await updateDoc(userDocRef, {
    [`goals.${goalId}.financeData.liabilities`]: updatedLiabilities,
    [`goals.${goalId}.updatedAt`]: Timestamp.now(),
  });
};
