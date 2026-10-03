-- Starter pack collections (owned by a system user or NULL user_id if preferred)
-- Uses subqueries to resolve resource IDs by token

DO $$
DECLARE
  v_source_id UUID;
  v_collection_id UUID;
BEGIN
  SELECT id INTO v_source_id FROM sources WHERE slug = 'homebrew';

  -- 1. Web Development
  INSERT INTO collections (slug, title, description, emoji, gradient_from, gradient_to, is_featured, is_private, sort_order, user_id)
  VALUES ('starter-web-dev', 'Web Development', 'Essential tools for building modern web apps', '🌐',
          'hsl(220, 80%, 55%)', 'hsl(260, 80%, 50%)', true, false, 1,
          (SELECT id FROM auth.users LIMIT 1))
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_collection_id;

  IF v_collection_id IS NOT NULL THEN
    INSERT INTO collection_items (collection_id, resource_id, sort_order)
    SELECT v_collection_id, r.id, row_number() OVER ()
    FROM resources r WHERE r.source_id = v_source_id
      AND r.token IN ('node', 'git', 'visual-studio-code', 'docker', 'figma',
                       'iterm2', 'postman', 'firefox', 'google-chrome', 'httpie')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. Writing & Notes
  INSERT INTO collections (slug, title, description, emoji, gradient_from, gradient_to, is_featured, is_private, sort_order, user_id)
  VALUES ('starter-writing', 'Writing & Notes', 'Apps for writers, note-takers, and knowledge workers', '✍️',
          'hsl(30, 80%, 60%)', 'hsl(50, 80%, 50%)', true, false, 2,
          (SELECT id FROM auth.users LIMIT 1))
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_collection_id;

  IF v_collection_id IS NOT NULL THEN
    INSERT INTO collection_items (collection_id, resource_id, sort_order)
    SELECT v_collection_id, r.id, row_number() OVER ()
    FROM resources r WHERE r.source_id = v_source_id
      AND r.token IN ('obsidian', 'notion', 'typora', 'mark-text', 'macdown',
                       'grammarly-desktop', 'zettlr', 'logseq')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Mac Essentials
  INSERT INTO collections (slug, title, description, emoji, gradient_from, gradient_to, is_featured, is_private, sort_order, user_id)
  VALUES ('starter-mac-essentials', 'Mac Essentials', 'Must-have utilities every Mac user should install', '🍎',
          'hsl(340, 80%, 55%)', 'hsl(10, 80%, 50%)', true, false, 3,
          (SELECT id FROM auth.users LIMIT 1))
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_collection_id;

  IF v_collection_id IS NOT NULL THEN
    INSERT INTO collection_items (collection_id, resource_id, sort_order)
    SELECT v_collection_id, r.id, row_number() OVER ()
    FROM resources r WHERE r.source_id = v_source_id
      AND r.token IN ('rectangle', 'alt-tab', 'raycast', 'the-unarchiver',
                       'appcleaner', 'stats', 'iina', 'keepingyouawake',
                       'hiddenbar', 'monitorcontrol')
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Terminal & CLI Power User
  INSERT INTO collections (slug, title, description, emoji, gradient_from, gradient_to, is_featured, is_private, sort_order, user_id)
  VALUES ('starter-terminal', 'Terminal Power User', 'Level up your command line', '⚡',
          'hsl(160, 80%, 45%)', 'hsl(200, 80%, 50%)', true, false, 4,
          (SELECT id FROM auth.users LIMIT 1))
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_collection_id;

  IF v_collection_id IS NOT NULL THEN
    INSERT INTO collection_items (collection_id, resource_id, sort_order)
    SELECT v_collection_id, r.id, row_number() OVER ()
    FROM resources r WHERE r.source_id = v_source_id
      AND r.token IN ('fzf', 'ripgrep', 'bat', 'eza', 'fd', 'jq',
                       'tldr', 'zoxide', 'starship', 'tmux')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
