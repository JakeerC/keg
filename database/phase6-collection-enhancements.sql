-- Phase 6: Collection Enhancements for F2.1

-- Add updated_at to collections
ALTER TABLE collections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Allow owners to update sort_order on their collection items (needed for reordering)
CREATE POLICY "Users can update own collection items" ON collection_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
  );
