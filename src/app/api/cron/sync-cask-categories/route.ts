
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyCronAuth } from '@/lib/cron-auth';
import { runIngestionJob, fetchWithTimeout } from '@/lib/ingestion-runner';
import {
  getCategoryDisplayName,
  normalizeCaskFlowCategory,
  parseCaskFlowCategoryInfo,
} from '@/lib/category-mapping';

export const revalidate = 0;
export const maxDuration = 300;

export async function GET(request: Request) {
  const authResponse = verifyCronAuth(request);
  if (authResponse) return authResponse;

  return runIngestionJob('sync-cask-categories', async (runId) => {
    type MappingPayload = {
      resource_id: string;
      category_id: string;
      is_primary: boolean;
    };
    type CaskFlowData = {
      tokenToCategory?: Record<string, unknown>;
      categories?: Record<string, { displayName?: unknown }>;
    };

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    let partial = false;
    let error_summary = '';

    console.log(`[${runId}] Fetching CaskFlow categories.json...`);
    const res = await fetchWithTimeout('https://github.com/alielsokary/CaskFlow/releases/latest/download/categories.json', 30000);
    const data = await res.json() as CaskFlowData;
    const tokenToCategory = data.tokenToCategory;
    if (!tokenToCategory || typeof tokenToCategory !== 'object' || Array.isArray(tokenToCategory)) {
      throw new Error('tokenToCategory missing from JSON');
    }

    // Resolve the source and kind before looking up tokens. Tokens are only
    // unique within a source, and a formula can otherwise receive a cask tag.
    const { data: source, error: sourceError } = await supabaseAdmin
      .from('sources')
      .select('id')
      .eq('slug', 'homebrew')
      .single();
    if (sourceError || !source) {
      throw new Error(`Homebrew source lookup failed: ${sourceError?.message || 'source not found'}`);
    }

    const { data: dbCategories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, slug');
    if (categoriesError) {
      throw new Error(`Category lookup failed: ${categoriesError.message}`);
    }
    const categoryMap = new Map(dbCategories?.map(category => [category.slug, category.id]));
    const categoryFailures = new Set<string>();
    const displayNameUpdates = new Set<string>();

    const ensureCategory = async (categoryKey: string): Promise<string | null> => {
      const slug = normalizeCaskFlowCategory(categoryKey);
      if (!slug) return null;

      const sourceDisplayName = data.categories?.[categoryKey]?.displayName;
      const existingId = categoryMap.get(slug);
      if (existingId) {
        // Repair rows created by the old importer, which used camelCase keys
        // such as "developerTools" as the display name.
        if (sourceDisplayName && !displayNameUpdates.has(slug)) {
          displayNameUpdates.add(slug);
          const { error } = await supabaseAdmin
            .from('categories')
            .update({ display_name: getCategoryDisplayName(slug, sourceDisplayName) })
            .eq('id', existingId);
          if (error) {
            failed++;
            partial = true;
            error_summary += `Category display-name update error for ${slug}: ${error.message}. `;
          }
        }
        return existingId;
      }
      const { data: newCategory, error } = await supabaseAdmin
        .from('categories')
        .upsert(
          { slug, display_name: getCategoryDisplayName(slug, sourceDisplayName) },
          { onConflict: 'slug' }
        )
        .select('id')
        .single();

      if (error || !newCategory) {
        if (!categoryFailures.has(slug)) {
          categoryFailures.add(slug);
          failed++;
          partial = true;
          error_summary += `Category upsert error for ${slug}: ${error?.message || 'category ID missing'}. `;
        }
        return null;
      }

      categoryMap.set(slug, newCategory.id);
      return newCategory.id;
    };

    const tokensToMap = Object.keys(tokenToCategory);
    console.log(`[${runId}] Mapping ${tokensToMap.length} Casks to Categories...`);
    const payload: MappingPayload[] = [];
    const mappingsByResource = new Map<string, MappingPayload[]>();

    // Chunk the tokens to keep each PostgREST request bounded.
    for (let i = 0; i < tokensToMap.length; i += 200) {
      const chunk = tokensToMap.slice(i, i + 200);
      const { data: resources, error } = await supabaseAdmin
        .from('resources')
        .select('id, token')
        .eq('source_id', source.id)
        .eq('kind', 'gui_app')
        .in('token', chunk);

      if (error) {
        console.error(`[${runId}] Error fetching chunk:`, error.message);
        failed += chunk.length;
        partial = true;
        error_summary += `DB fetch error: ${error.message}. `;
        continue;
      }
      if (!resources) continue;

      for (const resource of resources) {
        const categoryInfo = parseCaskFlowCategoryInfo(tokenToCategory[resource.token]);
        if (!categoryInfo) {
          skipped++;
          continue;
        }

        const categoryKeys = [categoryInfo.primary, ...categoryInfo.secondary];
        const uniqueCategoryKeys = [...new Set(categoryKeys.filter(category => normalizeCaskFlowCategory(category)))];
        const primarySlug = normalizeCaskFlowCategory(categoryInfo.primary);
        const primaryId = await ensureCategory(categoryInfo.primary);
        if (!primaryId) {
          skipped++;
          continue;
        }

        const resourceMappings: MappingPayload[] = [{
          resource_id: resource.id,
          category_id: primaryId,
          is_primary: true,
        }];

        for (const categoryKey of uniqueCategoryKeys) {
          if (normalizeCaskFlowCategory(categoryKey) === primarySlug) continue;
          const categoryId = await ensureCategory(categoryKey);
          if (categoryId) {
            resourceMappings.push({
              resource_id: resource.id,
              category_id: categoryId,
              is_primary: false,
            });
          }
        }

        payload.push(...resourceMappings);
        mappingsByResource.set(resource.id, resourceMappings);
      }
    }

    if (mappingsByResource.size === 0) {
      return { processed: 0, skipped, failed, partial, error_summary: error_summary || undefined };
    }

    // CaskFlow is authoritative for cask categories. Remove the old rows
    // before inserting the current primary/secondary set so reclassification
    // cannot leave multiple primary categories behind.
    const syncableResourceIds = new Set<string>();
    const resourceIds = [...mappingsByResource.keys()];
    for (let i = 0; i < resourceIds.length; i += 200) {
      const resourceChunk = resourceIds.slice(i, i + 200);
      const { error } = await supabaseAdmin
        .from('resource_categories')
        .delete()
        .in('resource_id', resourceChunk);

      if (error) {
        console.error(`[${runId}] Error clearing existing mappings:`, error.message);
        failed += resourceChunk.length;
        partial = true;
        error_summary += `Mapping cleanup error: ${error.message}. `;
        continue;
      }

      resourceChunk.forEach(resourceId => syncableResourceIds.add(resourceId));
    }

    const payloadToInsert = payload.filter(mapping => syncableResourceIds.has(mapping.resource_id));
    console.log(`[${runId}] Inserting ${payloadToInsert.length} categorizations...`);
    const chunkSize = 1000;

    for (let i = 0; i < payloadToInsert.length; i += chunkSize) {
      const chunk = payloadToInsert.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin
        .from('resource_categories')
        .upsert(chunk, { onConflict: 'resource_id,category_id' });

      if (error) {
        console.error(`[${runId}] Batch insert error:`, error.message);
        failed += chunk.length;
        partial = true;
        error_summary += `Batch upsert error: ${error.message}. `;
      } else {
        processed += chunk.length;
      }
    }

    return {
      processed,
      skipped,
      failed,
      partial,
      error_summary: error_summary || undefined,
    };
  });
}
