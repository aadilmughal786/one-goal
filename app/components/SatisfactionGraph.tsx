// app/components/SatisfactionGraph.tsx
'use client';

import React from 'react';
import { DailyProgress } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { FiBarChart2 } from 'react-icons/fi';

interface SatisfactionGraphProps {
  dailyProgress: DailyProgress[];
}

const SatisfactionGraph: React.FC<SatisfactionGraphProps> = ({ dailyProgress }) => {
  if (!dailyProgress || dailyProgress.length === 0) {
    return (
      <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 text-center text-white/60 flex flex-col items-center justify-center min-h-[200px]">
        <FiBarChart2 className="mb-4 w-12 h-12 text-white/40" />
        <p>No daily progress recorded yet.</p>
        <p>Track your satisfaction levels to see trends!</p>
      </div>
    );
  }

  // Sort daily progress by date to ensure correct visualization
  const sortedProgress = [...dailyProgress].sort((a, b) => {
    const dateA =
      a.date instanceof Timestamp ? a.date.toDate().getTime() : new Date(a.date).getTime();
    const dateB =
      b.date instanceof Timestamp ? b.date.toDate().getTime() : new Date(b.date).getTime();
    return dateA - dateB;
  });

  const maxSatisfaction = 5; // Max possible satisfaction level
  const graphHeight = 200; // Fixed height for the graph SVG
  const barWidth = 20; // Width of each bar
  const barSpacing = 10; // Space between bars
  const totalWidth = sortedProgress.length * (barWidth + barSpacing);
  const viewBoxWidth = Math.max(totalWidth, 300); // Ensure a minimum viewBox width

  const averageSatisfaction =
    sortedProgress.reduce((sum, entry) => sum + entry.satisfactionLevel, 0) / sortedProgress.length;

  return (
    <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300">
      <h3 className="flex gap-2 justify-center items-center mb-6 text-xl font-bold text-center text-white">
        <FiBarChart2 className="w-6 h-6" /> Daily Satisfaction Trend
      </h3>

      <div className="overflow-x-auto relative pb-4">
        <svg
          width="100%"
          height={graphHeight}
          viewBox={`0 0 ${viewBoxWidth} ${graphHeight}`}
          preserveAspectRatio="xMinYMax meet"
        >
          {/* Y-axis labels and grid lines */}
          {[1, 2, 3, 4, 5].map(level => (
            <g key={`y-axis-${level}`}>
              <line
                x1="0"
                y1={graphHeight - (level / maxSatisfaction) * graphHeight}
                x2={viewBoxWidth}
                y2={graphHeight - (level / maxSatisfaction) * graphHeight}
                stroke="#ffffff10"
                strokeDasharray="2 2"
              />
              <text
                x="-5"
                y={graphHeight - (level / maxSatisfaction) * graphHeight + 5}
                fill="#ffffff50"
                fontSize="12"
                textAnchor="end"
              >
                {level}
              </text>
            </g>
          ))}

          {/* Average line */}
          <line
            x1="0"
            y1={graphHeight - (averageSatisfaction / maxSatisfaction) * graphHeight}
            x2={viewBoxWidth}
            y2={graphHeight - (averageSatisfaction / maxSatisfaction) * graphHeight}
            stroke="#60A5FA"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <text
            x="5"
            y={graphHeight - (averageSatisfaction / maxSatisfaction) * graphHeight - 5}
            fill="#60A5FA"
            fontSize="12"
          >
            Avg: {averageSatisfaction.toFixed(1)}
          </text>

          {/* Bars */}
          {sortedProgress.map((entry, index) => {
            const barHeight = (entry.satisfactionLevel / maxSatisfaction) * graphHeight;
            const xPos = index * (barWidth + barSpacing);
            const yPos = graphHeight - barHeight;

            // Determine bar color based on satisfaction level
            let barColor = '';
            if (entry.satisfactionLevel <= 1)
              barColor = '#EF4444'; // red
            else if (entry.satisfactionLevel <= 2)
              barColor = '#F97316'; // orange
            else if (entry.satisfactionLevel <= 3)
              barColor = '#F59E0B'; // yellow
            else if (entry.satisfactionLevel <= 4)
              barColor = '#84CC16'; // lime
            else barColor = '#22C55E'; // green

            const date =
              entry.date instanceof Timestamp ? entry.date.toDate() : new Date(entry.date);
            const dayLabel = date.toLocaleDateString('en-US', { day: 'numeric' });
            const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });

            return (
              <g key={index}>
                <rect
                  x={xPos}
                  y={yPos}
                  width={barWidth}
                  height={barHeight}
                  fill={barColor}
                  rx="3" // rounded corners for bars
                  ry="3"
                >
                  <title>{`${date.toLocaleDateString()}: ${entry.satisfactionLevel} (${entry.notes || 'No notes'})`}</title>
                </rect>
                <text
                  x={xPos + barWidth / 2}
                  y={graphHeight + 15} // Day label below the bar
                  fill="#ffffff80"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {dayLabel}
                </text>
                <text
                  x={xPos + barWidth / 2}
                  y={graphHeight + 30} // Month label below day label
                  fill="#ffffff50"
                  fontSize="8"
                  textAnchor="middle"
                >
                  {monthLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default SatisfactionGraph;
