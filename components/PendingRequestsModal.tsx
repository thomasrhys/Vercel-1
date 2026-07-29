// components/PendingRequestsModal.tsx
'use client';

import { useEffect } from 'react';
import PendingRequestsPanel from './PendingRequestsPanel';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingRequestsModal({ isOpen, onClose }: PendingRequestsModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Don't render anything if closed
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-background rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto z-10"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking content
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Friend Requests
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            aria-label="Close modal"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-foreground"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          <PendingRequestsPanel />
        </div>
      </div>
    </div>
  );
}
