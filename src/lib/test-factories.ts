export function createTestUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    ...overrides,
  };
}

export function createTestResource(overrides = {}) {
  return {
    id: `resource-${Math.random().toString(36).substring(7)}`,
    source_id: 'homebrew',
    kind: 'formula',
    token: 'test-formula',
    name: 'Test Formula',
    description: 'A test formula',
    license: 'MIT',
    homepage: 'https://example.com',
    owner: 'test-owner',
    repo: 'test-repo',
    version: '1.0.0',
    outdated: false,
    deprecated: false,
    disabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestCollection(overrides = {}) {
  return {
    id: `collection-${Math.random().toString(36).substring(7)}`,
    user_id: 'test-user-id',
    name: 'Test Collection',
    slug: 'test-collection',
    description: 'A test collection',
    is_public: true,
    is_featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createTestAnalyticsSnapshot(overrides = {}) {
  return {
    id: `snapshot-${Math.random().toString(36).substring(7)}`,
    resource_id: 'test-resource-id',
    time_window: '30d',
    metric: 'install-on-request',
    count: 100,
    captured_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
