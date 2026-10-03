import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { collectionId, resourceId, direction } = await request.json();

  // Verify ownership
  const { data: collection } = await supabase
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', session.user.id)
    .single();
    
  if (!collection) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Get all items ordered
  const { data: items } = await supabase
    .from('collection_items')
    .select('resource_id, sort_order')
    .eq('collection_id', collectionId)
    .order('sort_order', { ascending: true });

  if (!items) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const idx = items.findIndex(i => i.resource_id === resourceId);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) {
    return NextResponse.json({ error: 'Invalid move' }, { status: 400 });
  }

  // Swap sort_order values
  const a = items[idx], b = items[swapIdx];
  await Promise.all([
    supabase.from('collection_items').update({ sort_order: b.sort_order })
      .eq('collection_id', collectionId).eq('resource_id', a.resource_id),
    supabase.from('collection_items').update({ sort_order: a.sort_order })
      .eq('collection_id', collectionId).eq('resource_id', b.resource_id),
  ]);

  return NextResponse.json({ ok: true });
}
