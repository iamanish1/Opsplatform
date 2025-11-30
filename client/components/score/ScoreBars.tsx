'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Category {
  name: string;
  value: number;
}

interface ScoreBarsProps {
  categories: Category[];
}

const getColor = (value: number) => {
  if (value >= 8) return '#22C55E'; // Green
  if (value >= 6) return '#FACC15'; // Yellow
  if (value >= 4) return '#FB923C'; // Orange
  return '#EF4444'; // Red
};

export function ScoreBars({ categories }: ScoreBarsProps) {
  const data = categories.map(cat => ({
    name: cat.name,
    value: cat.value,
    color: getColor(cat.value),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 10]} />
        <YAxis dataKey="name" type="category" width={120} />
        <Tooltip />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

