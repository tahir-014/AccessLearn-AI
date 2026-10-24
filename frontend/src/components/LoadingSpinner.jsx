import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading content...', size = 'md' }) {
  const sizeMap = {
    sm: '1.25rem',
    md: '2rem',
    lg: '3rem',
  };

  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className="loading-container" 
      role="status" 
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '0.75rem',
        color: 'var(--text-secondary)'
      }}
    >
      <Loader2 
        style={{ 
          width: iconSize, 
          height: iconSize, 
          animation: 'spin 1s linear infinite',
          color: 'var(--primary)' 
        }} 
        aria-hidden="true" 
      />
      <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
