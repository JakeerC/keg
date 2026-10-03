"use client";
import { useState } from 'react';
import { Download, Terminal, Copy, Check } from 'lucide-react';

type Resource = { token: string; kind: string; display_name: string | null };

export default function CollectionBrewfileExport({
  collectionId, resources
}: { collectionId: string; resources: Resource[] }) {
  const [showPlan, setShowPlan] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deduplicate by token just in case
  const uniqueResources = Array.from(new Map(resources.map(r => [r.token, r])).values());

  const cliTools = uniqueResources.filter(r => r.kind === 'cli_tool').sort((a,b) => a.token.localeCompare(b.token));
  const guiApps = uniqueResources.filter(r => r.kind === 'gui_app').sort((a,b) => a.token.localeCompare(b.token));

  const commands = [
    ...(cliTools.length > 0 ? [`brew install ${cliTools.map(t => t.token).join(' ')}`] : []),
    ...(guiApps.length > 0 ? [`brew install --cask ${guiApps.map(a => a.token).join(' ')}`] : []),
  ].join('\n');

  const copyCommands = async () => {
    await navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
      <a href={`/api/brewfile?collectionId=${collectionId}`} download="Brewfile">
        <button className="install-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={16} /> Export Brewfile
        </button>
      </a>
      <button onClick={() => setShowPlan(!showPlan)}
        className="install-btn"
        style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Terminal size={16} /> {showPlan ? 'Hide' : 'Preview'} Install Plan
      </button>

      {showPlan && (
        <div className="install-plan-panel" style={{ 
          width: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.2rem',
          marginTop: '1rem',
          fontFamily: 'SF Mono, Fira Code, monospace',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'center', fontSize: '0.9rem' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{cliTools.length} CLI tools · {guiApps.length} Mac apps</span>
            <button onClick={copyCommands} style={{ 
              background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '4px', padding: '0.4rem 0.8rem',
              color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', transition: 'background 0.2s'
            }}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <pre style={{ 
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '1rem',
            borderRadius: '8px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            fontSize: '0.85rem',
            color: '#a8e6cf',
            margin: 0
          }}>{commands}</pre>
        </div>
      )}
    </div>
  );
}
