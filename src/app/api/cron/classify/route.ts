import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GoogleGenAI } from '@google/genai';

// The 17 standard CaskFlow categories + some extra
const CATEGORIES = [
  { slug: 'ai-llms', display_name: 'AI & LLMs' },
  { slug: 'audio-music', display_name: 'Audio & Music' },
  { slug: 'browsers', display_name: 'Browsers' },
  { slug: 'cloud-storage', display_name: 'Cloud & Storage' },
  { slug: 'communication', display_name: 'Communication' },
  { slug: 'design-graphics', display_name: 'Design & Graphics' },
  { slug: 'developer-tools', display_name: 'Developer Tools' },
  { slug: 'finance-crypto', display_name: 'Finance & Crypto' },
  { slug: 'games', display_name: 'Games' },
  { slug: 'menu-bar', display_name: 'Menu Bar' },
  { slug: 'productivity', display_name: 'Productivity' },
  { slug: 'science-education', display_name: 'Science & Education' },
  { slug: 'security-privacy', display_name: 'Security & Privacy' },
  { slug: 'utilities', display_name: 'Utilities' },
  { slug: 'video', display_name: 'Video' },
  { slug: 'web-development', display_name: 'Web Development' },
  { slug: 'uncategorized', display_name: 'Other / Uncategorized' }
];

export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    // 1. Ensure all categories exist in the DB and get their IDs
    for (const cat of CATEGORIES) {
      await supabaseAdmin.from('categories').upsert(
        { slug: cat.slug, display_name: cat.display_name },
        { onConflict: 'slug' }
      );
    }

    const { data: dbCategories } = await supabaseAdmin.from('categories').select('*');
    const categoryMap = new Map(dbCategories?.map(c => [c.slug, c.id]));

    // 2. Fetch up to 200 Formulae (CLI tools) and see which are uncategorized
    console.log('Fetching uncategorized resources...');
    const { data: resources, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select('id, token, description, homepage, resource_categories(category_id)')
      .eq('kind', 'cli_tool')
      .limit(300);

    if (fetchError || !resources) {
      throw new Error(`Failed to fetch resources: ${fetchError?.message}`);
    }

    // Filter in JS to find ones with no categories mapped
    const uncategorized = resources
      .filter(r => !r.resource_categories || r.resource_categories.length === 0)
      .slice(0, 50); // Increased batch size to 50 per run

    if (uncategorized.length === 0) {
      return NextResponse.json({ success: true, message: 'All fetched resources are already categorized.' });
    }

    console.log(`Classifying ${uncategorized.length} resources via Gemini...`);
    
    let successCount = 0;
    
    // 3. Classify each using Gemini
    for (const app of uncategorized) {
      const prompt = `
You are an expert software classifier. Categorize the following CLI tool into exactly one of the following category slugs:
[${CATEGORIES.map(c => c.slug).join(', ')}]

Tool Name: ${app.token}
Description: ${app.description || 'No description provided.'}
Homepage: ${app.homepage || 'No homepage provided.'}

Output ONLY the exact category slug from the list above. Do not output anything else. If you are entirely unsure, output 'uncategorized'.
`;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawOutput = response.text?.trim().toLowerCase() || 'uncategorized';
        // Ensure the model output is one of our valid slugs
        const chosenSlug = CATEGORIES.find(c => rawOutput.includes(c.slug))?.slug || 'uncategorized';
        const categoryId = categoryMap.get(chosenSlug);

        if (categoryId) {
          await supabaseAdmin.from('resource_categories').insert({
            resource_id: app.id,
            category_id: categoryId,
            is_primary: true
          });
          successCount++;
          console.log(`✅ Classified ${app.token} -> ${chosenSlug}`);
        }
      } catch (err) {
        console.error(`Failed to classify ${app.token}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully classified ${successCount} out of ${uncategorized.length} resources.` 
    });

  } catch (error: unknown) {
    console.error('Classification error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
