"use client";
import { useState } from 'react';
import { Plus } from 'lucide-react';
import CreateCollectionModal from './CreateCollectionModal';

export default function CreateCollectionButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="install-btn"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
      >
        <Plus size={18} /> New Collection
      </button>
      {showModal && (
        <CreateCollectionModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
