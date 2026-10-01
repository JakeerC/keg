-- Phase 4: Analytics

-- Drop the view if it exists
DROP VIEW IF EXISTS latest_analytics_snapshots;

-- Create a view for the latest analytics snapshot for each resource, time_window, and metric
CREATE VIEW latest_analytics_snapshots AS
SELECT DISTINCT ON (resource_id, time_window, metric)
  id,
  resource_id,
  time_window,
  metric,
  count,
  captured_at
FROM analytics_snapshots
ORDER BY resource_id, time_window, metric, captured_at DESC;

-- Indexes for performance (idempotent creation)
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_latest ON analytics_snapshots(resource_id, time_window, metric, captured_at DESC);
