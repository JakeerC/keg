import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsChart from '../src/components/AnalyticsChart';

// Mock Recharts to avoid SVG/DOM rendering issues in JSDOM
vi.mock('recharts', () => {
  const OriginalRecharts = vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    XAxis: () => <div data-testid="xaxis" />,
    YAxis: () => <div data-testid="yaxis" />,
    Bar: () => <div data-testid="bar" />,
    Tooltip: () => <div data-testid="tooltip" />,
    CartesianGrid: () => <div data-testid="grid" />,
  };
});

describe('AnalyticsChart', () => {
  it('renders "No analytics data available" when data is empty', () => {
    render(<AnalyticsChart data={[]} />);
    expect(screen.getByText('No analytics data available.')).toBeTruthy();
  });

  it('renders chart components when data is provided', () => {
    render(<AnalyticsChart data={[{ name: '30d', installs: 1500 }]} />);
    expect(screen.getByTestId('responsive-container')).toBeTruthy();
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
    expect(screen.getByTestId('xaxis')).toBeTruthy();
    expect(screen.getByTestId('yaxis')).toBeTruthy();
    expect(screen.getByTestId('bar')).toBeTruthy();
  });
});
