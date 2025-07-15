// app/components/finance/charts/BudgetDistributionChart.tsx
'use client';

import { CustomTooltip } from '@/components/dashboard/charts/CustomTooltip';
import { Budget, Transaction } from '@/types';
import React, { useMemo } from 'react';
import { FaChartPie } from 'react-icons/fa';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface BudgetDistributionChartProps {
  budgets: Budget[];
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0'];

const BudgetDistributionChart: React.FC<BudgetDistributionChartProps> = ({
  budgets,
  transactions,
}) => {
  const chartData = useMemo(() => {
    const spendMap = new Map<string, number>();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        const currentSpend = spendMap.get(t.budgetId) || 0;
        spendMap.set(t.budgetId, currentSpend + t.amount);
      }
    });

    return budgets
      .map(budget => ({
        name: budget.category,
        value: spendMap.get(budget.id) || 0,
      }))
      .filter(item => item.value > 0); // Only show categories with spending
  }, [budgets, transactions]);

  if (chartData.length === 0) {
    return (
      <div className="py-10 text-center rounded-2xl border bg-bg-tertiary border-border-primary">
        <FaChartPie className="mx-auto mb-4 text-4xl text-text-muted" />
        <h3 className="text-lg font-semibold text-text-primary">Spending Distribution</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Log some expenses to see a breakdown of your spending by category.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border bg-bg-secondary border-border-primary">
      <h3 className="mb-4 text-2xl font-bold text-center text-text-primary">
        Spending Distribution
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetDistributionChart;
