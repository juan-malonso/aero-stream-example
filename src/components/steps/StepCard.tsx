import React from 'react';
import { colors, typography } from '@/styles/tokens';

interface StepCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  message?: string;
  onReject?: () => void;
}

export function StepCard({ children, title, subtitle, description, message, onReject }: StepCardProps) {
  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', fontFamily: typography.fontFamily, boxSizing: 'border-box', padding: '1rem' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '90%', height: '100%', maxHeight: '90%', backgroundColor: colors.white, borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {onReject && (
          <button
            onClick={() => { onReject(); }}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: colors.gray500, padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Close"
          >
            <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}

        {(title ?? subtitle ?? description ?? message) && (
          <div style={{ padding: '0.75rem', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
            {title && <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: colors.gray800, margin: 0 }}>{title}</h2>}
            {subtitle && <h3 style={{ fontSize: '0.85rem', fontWeight: 500, color: colors.gray600, marginTop: '0.375rem', marginBottom: 0 }}>{subtitle}</h3>}
            {description && <p style={{ fontSize: '0.7rem', color: colors.gray500, marginTop: '0.375rem', marginBottom: 0 }}>{description}</p>}
            {message && <p style={{ fontSize: '0.7rem', color: colors.gray600, marginTop: '0.375rem', marginBottom: 0 }}>{message}</p>}
          </div>
        )}
        
        <div style={{ width: '100%', flexGrow: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}