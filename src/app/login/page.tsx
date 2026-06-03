'use client';

import { type CSSProperties, type FormEvent, useState } from 'react';

import { colors, shadows, typography } from '@/styles/tokens';

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: `linear-gradient(180deg, ${colors.gray50} 0%, ${colors.gray200} 100%)`,
  padding: '1.5rem',
};

const panelStyle: CSSProperties = {
  width: 'min(100%, 380px)',
  display: 'grid',
  gap: '1rem',
  padding: '1.5rem',
  borderRadius: '8px',
  border: `1px solid ${colors.gray200}`,
  background: colors.white,
  boxShadow: shadows.lg,
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: colors.gray900,
  fontFamily: typography.fontFamily,
  fontSize: typography.sizes['2xl'],
  fontWeight: typography.weights.bold,
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: '2.75rem',
  borderRadius: '6px',
  border: `1px solid ${colors.gray300}`,
  padding: '0 0.875rem',
  fontSize: typography.sizes.base,
  color: colors.gray900,
  background: colors.white,
};

const buttonStyle: CSSProperties = {
  height: '2.75rem',
  border: 0,
  borderRadius: '6px',
  background: colors.gray900,
  color: colors.white,
  fontSize: typography.sizes.base,
  fontWeight: typography.weights.semibold,
  cursor: 'pointer',
};

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      window.location.replace('/home');
      return;
    }

    setToken('');
    setIsSubmitting(false);
  }

  return (
    <main style={pageStyle}>
      <form style={panelStyle} onSubmit={(event) => void handleSubmit(event)}>
        <h1 style={titleStyle}>AeroStream</h1>
        <input
          aria-label="Access token"
          autoComplete="current-password"
          autoFocus
          name="token"
          type="password"
          value={token}
          onChange={(event) => { setToken(event.target.value); }}
          style={inputStyle}
        />
        <button type="submit" disabled={isSubmitting || !token.trim()} style={buttonStyle}>
          Login
        </button>
      </form>
    </main>
  );
}
