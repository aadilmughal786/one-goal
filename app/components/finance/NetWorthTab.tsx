// app/components/finance/NetWorthTab.tsx
'use client';

import { useGoalStore } from '@/store/useGoalStore';
import { useNetWorthStore } from '@/store/useNetWorthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Asset, AssetType, Liability, LiabilityType } from '@/types';
import React, { useMemo, useState } from 'react';
import {
  FaBuilding,
  FaCar,
  FaCashRegister,
  FaHome,
  FaLandmark,
  FaMoneyBillWave,
  FaQuestionCircle,
} from 'react-icons/fa';
import {
  FiArrowDown,
  FiArrowUp,
  FiCreditCard,
  FiEdit,
  FiPlus,
  FiTrash2,
  FiTrendingUp,
} from 'react-icons/fi';
import AssetModal from './AssetModal';
import LiabilityModal from './LiabilityModal';

const assetIcons: { [key in AssetType]: React.ElementType } = {
  [AssetType.CASH]: FaCashRegister,
  [AssetType.BANK_ACCOUNT]: FaLandmark,
  [AssetType.INVESTMENT]: FiTrendingUp,
  [AssetType.REAL_ESTATE]: FaHome,
  [AssetType.VEHICLE]: FaCar,
  [AssetType.OTHER]: FaQuestionCircle,
};

const liabilityIcons: { [key in LiabilityType]: React.ElementType } = {
  [LiabilityType.LOAN]: FaMoneyBillWave,
  [LiabilityType.CREDIT_CARD]: FiCreditCard,
  [LiabilityType.MORTGAGE]: FaBuilding,
  [LiabilityType.OTHER]: FaQuestionCircle,
};

const ItemCard = ({
  item,
  isAsset,
  onEdit,
  onDelete,
}: {
  item: Asset | Liability;
  isAsset: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const Icon = isAsset
    ? assetIcons[item.type as AssetType]
    : liabilityIcons[item.type as LiabilityType];
  const iconColor = isAsset ? 'text-green-500' : 'text-red-500';

  return (
    <div className="flex gap-4 items-center p-4 rounded-xl border bg-bg-secondary border-border-primary group">
      <Icon className={`text-2xl ${iconColor}`} />
      <div className="flex-grow">
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm capitalize text-text-secondary">{item.type.replace('_', ' ')}</p>
      </div>
      <p className="text-lg font-semibold">${item.amount.toFixed(2)}</p>
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button onClick={onEdit} className="p-2 text-text-secondary hover:text-text-primary">
          <FiEdit />
        </button>
        <button onClick={onDelete} className="p-2 text-text-secondary hover:text-red-500">
          <FiTrash2 />
        </button>
      </div>
    </div>
  );
};

const NetWorthTab = () => {
  const { appState } = useGoalStore();
  const { deleteAsset, deleteLiability } = useNetWorthStore();
  const { showConfirmation } = useNotificationStore();

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Asset | Liability | null>(null);

  const financeData = useMemo(() => {
    if (!appState?.activeGoalId) return null;
    return appState.goals[appState.activeGoalId]?.financeData;
  }, [appState]);

  const assets = useMemo(() => financeData?.assets || [], [financeData]);
  const liabilities = useMemo(() => financeData?.liabilities || [], [financeData]);

  const totalAssets = useMemo(() => assets.reduce((sum, asset) => sum + asset.amount, 0), [assets]);
  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, liability) => sum + liability.amount, 0),
    [liabilities]
  );
  const netWorth = totalAssets - totalLiabilities;

  const handleOpenAssetModal = (asset: Asset | null) => {
    setItemToEdit(asset);
    setIsAssetModalOpen(true);
  };

  const handleOpenLiabilityModal = (liability: Liability | null) => {
    setItemToEdit(liability);
    setIsLiabilityModalOpen(true);
  };

  const handleDelete = (item: Asset | Liability, isAsset: boolean) => {
    showConfirmation({
      title: `Delete ${isAsset ? 'Asset' : 'Liability'}?`,
      message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      action: () => (isAsset ? deleteAsset(item.id) : deleteLiability(item.id)),
    });
  };

  return (
    <>
      <div className="space-y-8">
        <div className="p-8 text-center rounded-2xl border bg-bg-secondary border-border-primary">
          <h2 className="text-xl font-semibold text-text-secondary">Your Net Worth</h2>
          <p
            className={`text-6xl font-bold my-2 ${netWorth >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            ${netWorth.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Assets Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="flex gap-2 items-center text-2xl font-bold text-green-500">
                <FiArrowUp /> Assets
              </h3>
              <button
                onClick={() => handleOpenAssetModal(null)}
                className="flex gap-2 items-center px-3 py-1 text-sm font-semibold text-green-500 rounded-lg bg-green-500/20 hover:bg-green-500/30"
              >
                <FiPlus /> Add Asset
              </button>
            </div>
            <div className="p-4 rounded-xl border bg-bg-secondary border-border-primary">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Assets</span>
                <span>${totalAssets.toFixed(2)}</span>
              </div>
            </div>
            {assets.map(asset => (
              <ItemCard
                key={asset.id}
                item={asset}
                isAsset={true}
                onEdit={() => handleOpenAssetModal(asset)}
                onDelete={() => handleDelete(asset, true)}
              />
            ))}
          </div>

          {/* Liabilities Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="flex gap-2 items-center text-2xl font-bold text-red-500">
                <FiArrowDown /> Liabilities
              </h3>
              <button
                onClick={() => handleOpenLiabilityModal(null)}
                className="flex gap-2 items-center px-3 py-1 text-sm font-semibold text-red-500 rounded-lg bg-red-500/20 hover:bg-red-500/30"
              >
                <FiPlus /> Add Liability
              </button>
            </div>
            <div className="p-4 rounded-xl border bg-bg-secondary border-border-primary">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Liabilities</span>
                <span>${totalLiabilities.toFixed(2)}</span>
              </div>
            </div>
            {liabilities.map(liability => (
              <ItemCard
                key={liability.id}
                item={liability}
                isAsset={false}
                onEdit={() => handleOpenLiabilityModal(liability)}
                onDelete={() => handleDelete(liability, false)}
              />
            ))}
          </div>
        </div>
      </div>
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        itemToEdit={itemToEdit as Asset | null}
      />
      <LiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => setIsLiabilityModalOpen(false)}
        itemToEdit={itemToEdit as Liability | null}
      />
    </>
  );
};

export default NetWorthTab;
