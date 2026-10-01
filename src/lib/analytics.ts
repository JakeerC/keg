export const SUPPORTED_WINDOWS = ['30d', '90d', '365d'] as const;
export type TimeWindow = typeof SUPPORTED_WINDOWS[number];

export const METRIC_BY_KIND = {
  cli_tool: 'install-on-request',
  gui_app: 'cask-install'
} as const;

export type MetricKind = typeof METRIC_BY_KIND[keyof typeof METRIC_BY_KIND];
