import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenAI } from '@google/genai'
import { verifyCronAuth } from '@/lib/cron-auth'
import { runIngestionJob } from '@/lib/ingestion-runner'
import { parseClassifierCategory } from '@/lib/category-mapping'

export const revalidate = 0
export const maxDuration = 300 // Vercel maximum duration

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
]

export async function GET(request: Request) {
  const authResponse = verifyCronAuth(request)
  if (authResponse) return authResponse

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  return runIngestionJob('classify-formulae', async (runId) => {
    let processed = 0
    let failed = 0
    let skipped = 0
    let error_summary = ''

    // 1. Ensure all categories exist in the DB and get their IDs
    for (const cat of CATEGORIES) {
      await supabaseAdmin
        .from('categories')
        .upsert(
          { slug: cat.slug, display_name: cat.display_name },
          { onConflict: 'slug' }
        )
    }

    const { data: dbCategories } = await supabaseAdmin
      .from('categories')
      .select('*')
    const categoryMap = new Map(dbCategories?.map((c) => [c.slug, c.id]))

    // 2. Fetch up
    console.log(`[${runId}] Fetching uncategorized resources...`)
    const { data: resources, error: fetchError } = await supabaseAdmin
      .from('resources')
      .select(
        'id, token, description, homepage, resource_categories(category_id)'
      )
      .eq('kind', 'cli_tool')
      .limit(300)

    if (fetchError || !resources) {
      throw new Error(`Failed to fetch resources: ${fetchError?.message}`)
    }

    // Filter in JS to find ones with no categories mapped
    const uncategorized = resources
      .filter(
        (r) => !r.resource_categories || r.resource_categories.length === 0
      )
      .slice(0, 50) // Process 50 at a time using a single batch request

    if (uncategorized.length === 0) {
      return { processed: 0, skipped: 0, failed: 0 }
    }

    console.log(
      `[${runId}] Classifying ${uncategorized.length} resources via Gemini batch request...`
    )

    const prompt = `
You are an expert software classifier. Categorize the following CLI tools into exactly one of the following category slugs:
[${CATEGORIES.map((c) => c.slug).join(', ')}]

Here are the tools:
${uncategorized.map((app) => `ID: ${app.token}\nDescription: ${app.description || 'No description provided.'}\nHomepage: ${app.homepage || 'No homepage provided.'}`).join('\n\n')}

Output ONLY a valid JSON object mapping each ID to its category slug. Example:
{
  "tool1": "developer-tools",
  "tool2": "uncategorized"
}
`

    try {
      let responseText: string | undefined;
      let retries = 5;
      let delay = 5000;
      
      while (retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json'
            }
          })
          responseText = response.text;
          break;
        } catch (apiError: unknown) {
          retries--;
          const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
          const isRetryable = errorMessage.includes('503') || errorMessage.includes('429');
          
          if (retries === 0 || !isRetryable) {
            throw apiError;
          }
          
          console.warn(`[${runId}] Gemini API error (retrying in ${delay}ms): ${errorMessage}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        }
      }

      const rawOutput = responseText?.trim() || '{}'
      let results: Record<string, string> = {}
      try {
        results = JSON.parse(rawOutput)
      } catch (_e) {
        throw new Error('Failed to parse Gemini JSON output: ' + rawOutput)
      }

      for (const app of uncategorized) {
        const chosenSlug = parseClassifierCategory(
          results[app.token] || 'uncategorized',
          CATEGORIES.map((category) => category.slug)
        )
        const categoryId = categoryMap.get(chosenSlug)

        if (categoryId) {
          const { error: insertError } = await supabaseAdmin
            .from('resource_categories')
            .insert({
              resource_id: app.id,
              category_id: categoryId,
              is_primary: true
            })
          if (insertError) {
            console.error(
              `[${runId}] DB insert failed for ${app.token}:`,
              insertError
            )
            failed++
            error_summary += `DB error for ${app.token}: ${insertError.message}. `
          } else {
            processed++
            console.log(
              `[${runId}] ✅ Classified ${app.token} -> ${chosenSlug}`
            )
          }
        } else {
          skipped++
        }
      }
    } catch (err) {
      console.error(`[${runId}] Failed batch classification:`, err)
      failed += uncategorized.length
      error_summary += `Batch API error: ${err instanceof Error ? err.message : String(err)}. `
    }

    return {
      processed,
      skipped,
      failed,
      partial: failed > 0,
      error_summary: error_summary || undefined
    }
  })
}
