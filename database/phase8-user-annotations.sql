-- User notes and install state per resource
CREATE TABLE IF NOT EXISTS user_resource_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE NOT NULL,
    note TEXT,
    install_state TEXT CHECK (install_state IN ('planned', 'installed', 'archived')) DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_id)
);

ALTER TABLE user_resource_annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own annotations" ON user_resource_annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own annotations" ON user_resource_annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own annotations" ON user_resource_annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own annotations" ON user_resource_annotations FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_resource ON user_resource_annotations(user_id, resource_id);

-- User tags
CREATE TABLE IF NOT EXISTS user_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tags" ON user_tags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own tags" ON user_tags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own tags" ON user_tags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own tags" ON user_tags FOR DELETE USING (auth.uid() = user_id);

-- Resource-tag mapping
CREATE TABLE IF NOT EXISTS user_resource_tags (
    annotation_id UUID REFERENCES user_resource_annotations(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES user_tags(id) ON DELETE CASCADE,
    PRIMARY KEY(annotation_id, tag_id)
);

ALTER TABLE user_resource_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own resource tags" ON user_resource_tags FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_resource_annotations WHERE id = annotation_id AND user_id = auth.uid())
);
CREATE POLICY "Users insert own resource tags" ON user_resource_tags FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_resource_annotations WHERE id = annotation_id AND user_id = auth.uid())
);
CREATE POLICY "Users delete own resource tags" ON user_resource_tags FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_resource_annotations WHERE id = annotation_id AND user_id = auth.uid())
);
