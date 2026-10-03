import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sourceCollectionId } = await request.json();

  // Fetch source collection (must be public or owned by the user)
  const { data: source } = await supabase
    .from('collections')
    .select('*')
    .eq('id', sourceCollectionId)
    .single();

  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (source.is_private && source.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create new collection
  const newSlug = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
  const { data: newCollection, error: insertError } = await supabase
    .from('collections')
    .insert({
      user_id: session.user.id,
      slug: newSlug,
      title: `${source.title} (Copy)`,
      description: source.description,
      emoji: source.emoji,
      gradient_from: source.gradient_from,
      gradient_to: source.gradient_to,
      is_private: true, // copies start private
    })
    .select('id, slug')
    .single();

  if (insertError || !newCollection) {
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
  }

  // Copy items
  const { data: sourceItems } = await supabase
    .from('collection_items')
    .select('resource_id, sort_order')
    .eq('collection_id', sourceCollectionId)
    .order('sort_order', { ascending: true });

  if (sourceItems && sourceItems.length > 0) {
    await supabase.from('collection_items').insert(
      sourceItems.map(item => ({
        collection_id: newCollection.id,
        resource_id: item.resource_id,
        sort_order: item.sort_order,
      }))
    );
  }

  return NextResponse.json({ slug: newCollection.slug, id: newCollection.id });
}
