
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../utils';

interface ChartDisplayProps {
  data: { name: string; value: number; color: string }[];
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const x = cx + (outerRadius + 25) * Math.cos(-midAngle * RADIAN);
  const y = cy + (outerRadius + 25) * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="#334155" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-[9px] font-bold uppercase tracking-tight"
    >
      {`${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export const ChartDisplay: React.FC<ChartDisplayProps> = ({ data }) => {
  const validData = data.filter(d => d.value > 0);

  if (validData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-300 font-black italic uppercase tracking-widest">No Data</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={5}
            dataKey="value"
            label={renderCustomizedLabel}
            labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            animationDuration={1000}
          >
            {validData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
              padding: '10px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={30}
            formatter={(value) => <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
