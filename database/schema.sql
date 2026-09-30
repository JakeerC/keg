-- Source-Agnostic App Browser Schema
-- Execute this in the Supabase SQL Editor

-- 1. Sources (e.g., Homebrew, npm, etc.)
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- e.g., 'homebrew'
    display_name TEXT NOT NULL,
    api_base_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories (from CaskFlow and our LLM classifier)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- e.g., 'developer-tools'
    display_name TEXT NOT NULL,
    icon TEXT, -- e.g., 'chevron.left.forwardslash.chevron.right'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Resources (The apps/packages themselves)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE,
    kind TEXT NOT NULL, -- 'cli_tool' (formula) or 'gui_app' (cask)
    token TEXT NOT NULL, -- The package identifier (e.g., 'visual-studio-code', 'wget')
    display_name TEXT,
    description TEXT,
    homepage TEXT,
    license TEXT,
    latest_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, token)
);

-- 4. Resource Categories Mapping
CREATE TABLE resource_categories (
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(resource_id, category_id)
);

-- 5. Resource Icons
CREATE TABLE resource_icons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE UNIQUE,
    url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Analytics Snapshots (For timeseries / "Trending")
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    time_window TEXT NOT NULL, -- '30d', '90d', '365d'
    metric TEXT NOT NULL, -- 'install', 'install-on-request', 'cask-install'
    count BIGINT NOT NULL,
    captured_at DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(resource_id, time_window, metric, captured_at)
);

-- Indexes for performance
CREATE INDEX idx_resources_token ON resources(token);
CREATE INDEX idx_analytics_snapshots_resource_date ON analytics_snapshots(resource_id, captured_at);
CREATE INDEX idx_analytics_snapshots_window_metric ON analytics_snapshots(time_window, metric);

-- Set up Row Level Security (RLS) for public read access
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for public reads
CREATE POLICY "Public read access for sources" ON sources FOR SELECT USING (true);
CREATE POLICY "Public read access for categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read access for resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Public read access for resource_categories" ON resource_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for resource_icons" ON resource_icons FOR SELECT USING (true);
CREATE POLICY "Public read access for analytics_snapshots" ON analytics_snapshots FOR SELECT USING (true);

-- Initial 'homebrew' source seed
INSERT INTO sources (slug, display_name, api_base_url) 
VALUES ('homebrew', 'Homebrew', 'https://formulae.brew.sh/api/')
ON CONFLICT (slug) DO NOTHING;
