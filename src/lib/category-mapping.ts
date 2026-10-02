const CASKFLOW_TO_DB_MAP: Record<string, string> = {
  ai: 'ai-llms',
  videoMedia: 'video',
  other: 'uncategorized',
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'ai-llms': 'AI & LLMs',
  video: 'Video',
  uncategorized: 'Other / Uncategorized',
};

export type CaskFlowCategoryInfo = {
  primary: string;
  secondary: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Convert CaskFlow's camelCase category keys into Keg's stable URL slugs. */
export function normalizeCaskFlowCategory(category: string): string {
  const trimmed = category.trim();
  if (!trimmed) return '';

  return CASKFLOW_TO_DB_MAP[trimmed]
    || trimmed.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** Support both the current v2 object format and the older string format. */
export function parseCaskFlowCategoryInfo(value: unknown): CaskFlowCategoryInfo | null {
  if (typeof value === 'string') {
    const primary = value.trim();
    return primary ? { primary, secondary: [] } : null;
  }

  if (!isRecord(value) || typeof value.primary !== 'string') return null;

  const primary = value.primary.trim();
  if (!primary) return null;

  const secondary = Array.isArray(value.secondary)
    ? value.secondary.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
    : [];

  return { primary, secondary };
}

export function getCategoryDisplayName(slug: string, sourceDisplayName?: unknown): string {
  if (typeof sourceDisplayName === 'string' && sourceDisplayName.trim()) {
    return sourceDisplayName.trim();
  }

  if (CATEGORY_DISPLAY_NAMES[slug]) return CATEGORY_DISPLAY_NAMES[slug];

  return slug
    .split('-')
    .map(word => word ? word[0].toUpperCase() + word.slice(1) : word)
    .join(' ');
}

/** Parse a classifier response without accepting a slug embedded in arbitrary text. */
export function parseClassifierCategory(output: string, validSlugs: readonly string[]): string {
  const normalized = output.trim().replace(/^['"`]+|['"`]+$/g, '').trim();
  return validSlugs.includes(normalized) ? normalized : 'uncategorized';
}
