"use client";
import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Tag, Edit3, Bookmark, Archive, CheckCircle2 } from 'lucide-react';

export default function ResourceAnnotation({ resourceId, initialAnnotation }: { 
  resourceId: string, 
  initialAnnotation: any 
}) {
  const [note, setNote] = useState(initialAnnotation?.note || '');
  const [installState, setInstallState] = useState(initialAnnotation?.install_state || 'planned');
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createSupabaseBrowser();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveAnnotation = async (updates: any) => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // We can use upsert on the unique constraint (user_id, resource_id)
    await supabase.from('user_resource_annotations').upsert({
      user_id: session.user.id,
      resource_id: resourceId,
      ...updates,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,resource_id' });
    
    setIsSaving(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      saveAnnotation({ note: val, install_state: installState });
    }, 1000);
  };

  const cycleInstallState = () => {
    const states = ['planned', 'installed', 'archived'];
    const nextIdx = (states.indexOf(installState) + 1) % states.length;
    const nextState = states[nextIdx];
    setInstallState(nextState);
    saveAnnotation({ note, install_state: nextState });
  };

  const getStateBadgeProps = () => {
    switch (installState) {
      case 'installed': return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', icon: <CheckCircle2 size={14} />, label: 'Installed' };
      case 'archived': return { bg: 'rgba(156,163,175,0.15)', color: '#9ca3af', icon: <Archive size={14} />, label: 'Archived' };
      case 'planned':
      default: return { bg: 'var(--bg-green-muted)', color: 'var(--accent-green)', icon: <Bookmark size={14} />, label: 'Planned' };
    }
  };

  const badgeProps = getStateBadgeProps();

  return (
    <div className="annotation-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Edit3 size={16} /> My Notes
        </h3>
        <button onClick={cycleInstallState} style={{ 
          background: badgeProps.bg, color: badgeProps.color, 
          border: 'none', borderRadius: '12px', padding: '0.3rem 0.8rem', 
          fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem',
          cursor: 'pointer', transition: 'all 0.2s'
        }}>
          {badgeProps.icon} {badgeProps.label}
        </button>
      </div>
      <textarea
        placeholder="Add personal notes, configuration tips, or reasons you use this app..."
        value={note}
        onChange={handleNoteChange}
        style={{
          width: '100%', background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)',
          borderRadius: '8px', color: 'var(--text-primary)', padding: '0.8rem', fontSize: '0.95rem',
          resize: 'vertical', minHeight: '80px', boxSizing: 'border-box'
        }}
      />
      {isSaving && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'right' }}>Saving...</div>}
    </div>
  );
}
