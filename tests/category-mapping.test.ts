import { describe, expect, it } from 'vitest';
import {
  getCategoryDisplayName,
  normalizeCaskFlowCategory,
  parseCaskFlowCategoryInfo,
  parseClassifierCategory,
} from '../src/lib/category-mapping';

describe('category mapping', () => {
  it('normalizes CaskFlow category keys to the app slugs', () => {
    expect(normalizeCaskFlowCategory('developerTools')).toBe('developer-tools');
    expect(normalizeCaskFlowCategory('videoMedia')).toBe('video');
    expect(normalizeCaskFlowCategory('officeTools')).toBe('office-tools');
    expect(normalizeCaskFlowCategory('screensaverWallpaper')).toBe('screensaver-wallpaper');
    expect(normalizeCaskFlowCategory('other')).toBe('uncategorized');
  });

  it('reads primary and secondary categories from CaskFlow v2 data', () => {
    expect(parseCaskFlowCategoryInfo({
      primary: 'designGraphics',
      secondary: ['productivity', 'designGraphics'],
    })).toEqual({
      primary: 'designGraphics',
      secondary: ['productivity', 'designGraphics'],
    });
    expect(parseCaskFlowCategoryInfo('utilities')).toEqual({
      primary: 'utilities',
      secondary: [],
    });
    expect(parseCaskFlowCategoryInfo({ secondary: ['utilities'] })).toBeNull();
  });

  it('uses readable fallback labels for newly created categories', () => {
    expect(getCategoryDisplayName('developer-tools')).toBe('Developer Tools');
    expect(getCategoryDisplayName('video')).toBe('Video');
    expect(getCategoryDisplayName('office-tools', 'Office Tools')).toBe('Office Tools');
  });

  it('does not classify based on a slug embedded in arbitrary output', () => {
    const slugs = ['developer-tools', 'productivity', 'uncategorized'] as const;

    expect(parseClassifierCategory('developer-tools', slugs)).toBe('developer-tools');
    expect(parseClassifierCategory('`productivity`', slugs)).toBe('productivity');
    expect(parseClassifierCategory('The answer is developer-tools.', slugs)).toBe('uncategorized');
    expect(parseClassifierCategory('productivity or developer-tools', slugs)).toBe('uncategorized');
  });
});
