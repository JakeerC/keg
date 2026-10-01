"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsChart({ data }: { data: { name: string, installs: number }[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>No analytics data available.</div>;
  }

  // Format Y-axis ticks
  const formatYAxis = (tickItem: number) => {
    if (tickItem >= 1000000) return (tickItem / 1000000).toFixed(1) + 'M';
    if (tickItem >= 1000) return (tickItem / 1000).toFixed(1) + 'K';
    return tickItem.toString();
  };

  return (
    <div style={{ width: '100%', height: 300, marginTop: '2rem' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            tickFormatter={formatYAxis}
          />
          <Tooltip 
            cursor={{ fill: 'var(--bg-main)' }}
            contentStyle={{ 
              backgroundColor: 'var(--bg-card)', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(10px)'
            }}
            formatter={(value: any) => [new Intl.NumberFormat().format(value || 0), 'Installs']}
          />
          <Bar dataKey="installs" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} maxBarSize={60} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
