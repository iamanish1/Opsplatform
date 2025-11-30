'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

interface ScoreRingProps {
  score: number;
  badge: 'RED' | 'YELLOW' | 'GREEN';
}

const getBadgeColor = (badge: string) => {
  switch (badge) {
    case 'GREEN':
      return '#22C55E';
    case 'YELLOW':
      return '#FACC15';
    case 'RED':
      return '#EF4444';
    default:
      return '#64748B';
  }
};

export function ScoreRing({ score, badge }: ScoreRingProps) {
  const data = [
    {
      name: 'score',
      value: score,
      fill: getBadgeColor(badge),
    },
  ];

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            fill={getBadgeColor(badge)}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold">{score}</div>
        <div className="text-sm text-muted-foreground">out of 100</div>
      </div>
    </div>
  );
}

