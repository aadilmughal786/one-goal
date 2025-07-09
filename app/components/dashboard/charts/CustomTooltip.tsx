// app/components/dashboard/charts/CustomTooltip.tsx
'use client';

import React from 'react';
import { TooltipProps } from 'recharts';

export const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    // Handle Satisfaction Pie Chart
    if (
      payload[0] &&
      payload[0].dataKey === 'value' &&
      payload[0].payload &&
      payload[0].payload.percentage !== undefined
    ) {
      const data = payload[0];
      return (
        <div className="p-3 text-sm rounded-lg border shadow-xl bg-bg-primary border-border-primary">
          <p style={{ color: data.payload.color }}>
            {`${data.name}: ${data.payload.percentage.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    // Handle Satisfaction Distribution Bar Chart
    if (
      payload[0] &&
      payload[0].dataKey === 'percentage' && // This identifies the Bar Chart
      payload[0].payload &&
      payload[0].payload.name !== undefined
    ) {
      const data = payload[0];
      return (
        <div className="p-3 text-sm rounded-lg border shadow-xl bg-bg-primary border-border-primary">
          <p style={{ color: data.payload.color }}>
            {`${data.payload.name}: ${data.payload.percentage.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return (
      <div className="p-3 text-sm rounded-lg border shadow-xl bg-bg-primary border-border-primary">
        <p className="font-bold text-text-primary">{label}</p>
        {payload.map((entry, index) => {
          const value = entry.value;
          let displayValue: string;

          if (typeof value === 'number') {
            if (entry.dataKey === 'cumulativeHours') {
              displayValue = `${value.toFixed(1)} hrs`;
            } else if (entry.dataKey === 'avgTime' || entry.dataKey === 'timeSpent') {
              displayValue = `${value.toFixed(1)} mins`;
            } else if (entry.dataKey === 'weight') {
              displayValue = `${value.toFixed(1)}`;
            } else if (
              entry.dataKey === 'completionRate' ||
              entry.dataKey === 'successRate' ||
              entry.dataKey === 'percentage'
            ) {
              displayValue = `${value.toFixed(1)}%`;
            } else if (
              entry.dataKey === 'satisfaction' ||
              entry.dataKey === 'avgSatisfaction' ||
              entry.dataKey === 'movingAvg'
            ) {
              displayValue = value.toFixed(1);
            } else {
              displayValue = value.toFixed(2);
            }
          } else if (typeof value === 'string') {
            const parsed = parseFloat(value);
            displayValue = isNaN(parsed) ? value : parsed.toFixed(2);
          } else {
            displayValue = 'N/A';
          }

          return (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${displayValue}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};
