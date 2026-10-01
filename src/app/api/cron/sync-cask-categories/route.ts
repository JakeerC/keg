import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const revalidate = 0;

export async function GET() {
  try {
    console.log('Fetching CaskFlow categories.json...');
    const res = await fetch('https://github.com/alielsokary/CaskFlow/releases/latest/download/categories.json');
    if (!res.ok) throw new Error(`Failed to fetch categories.json: ${res.status}`);
    const data = await res.json();
    
    const tokenToCategory = data.tokenToCategory;
    if (!tokenToCategory) throw new Error('tokenToCategory missing from JSON');

    const CASKFLOW_TO_DB_MAP: Record<string, string> = {
      'ai': 'ai-llms',
      'videoMedia': 'video',
      'officeTools': 'office-tools',
      'other': 'uncategorized',
      'screensaverWallpaper': 'screensaver-wallpaper'
    };

    // 1. Fetch categories map from DB
    const { data: dbCategories } = await supabaseAdmin.from('categories').select('id, slug');
    const categoryMap = new Map(dbCategories?.map(c => [c.slug, c.id]));

    const tokensToMap = Object.keys(tokenToCategory);
    console.log(`Mapping ${tokensToMap.length} Casks to Categories...`);
    const payload = [];

    // Chunk the tokens to fetch their IDs from Supabase
    const tokenChunks = [];
    for (let i = 0; i < tokensToMap.length; i += 200) {
      tokenChunks.push(tokensToMap.slice(i, i + 200));
    }

    for (const chunk of tokenChunks) {
      const { data: resources, error } = await supabaseAdmin
        .from('resources')
        .select('id, token')
        .in('token', chunk);

      if (error) {
        console.error('Error fetching chunk:', error.message);
        continue;
      }
      if (!resources) continue;

      for (const resource of resources) {
        const catInfo = tokenToCategory[resource.token];
        if (!catInfo) continue;

        const primarySlug = (catInfo as { primary: string }).primary;
        const normalizedSlug = CASKFLOW_TO_DB_MAP[primarySlug] || primarySlug.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        
        let categoryId = categoryMap.get(normalizedSlug);
        if (!categoryId) {
           const { data: newCat } = await supabaseAdmin.from('categories')
              .insert({ slug: normalizedSlug, display_name: primarySlug })
              .select('id').single();
           if (newCat) {
              categoryId = newCat.id;
              categoryMap.set(normalizedSlug, categoryId);
           }
        }

        if (categoryId) {
          payload.push({
            resource_id: resource.id,
            category_id: categoryId,
            is_primary: true
          });
        }
      }
    }

    if (payload.length === 0) {
      return NextResponse.json({ success: true, message: 'No mappings found or nothing to insert.' });
    }

    // 4. Batch insert in chunks of 1000
    console.log(`Inserting ${payload.length} categorizations...`);
    let insertedCount = 0;
    const chunkSize = 1000;
    
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      
      const { error } = await supabaseAdmin
        .from('resource_categories')
        .upsert(chunk, { onConflict: 'resource_id,category_id' }); 
        
      if (error) {
        console.error('Batch insert error:', error.message);
      } else {
        insertedCount += chunk.length;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully mapped ${insertedCount} Casks to Categories from CaskFlow.` 
    });

  } catch (error: unknown) {
    console.error('Sync cask categories error:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
