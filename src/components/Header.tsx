'use client';

import React, { useState, type CSSProperties } from 'react';
import { colors, typography } from '@/styles/tokens';
import { Row } from '@/components/ui';

interface HeaderProps {
  activeTab: 'builder' | 'live';
  setActiveTab: (tab: 'builder' | 'live') => void;
}

interface NavItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ label, isActive, onClick }: NavItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const navItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 1.5rem',
    height: '100%',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: isActive ? colors.blue600 : (isHovered ? colors.gray600 : colors.gray500),
    borderBottom: isActive ? `3px solid ${colors.blue600}` : (isHovered ? `3px solid ${colors.gray300}` : '3px solid transparent'),
    transition: 'all 0.2s ease',
    backgroundColor: isHovered ? colors.gray50 : 'transparent',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    outline: 'none',
  };

  return (
    <button
      style={navItemStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label}
    </button>
  );
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  React.useEffect(() => {
    // Force dark mode on mount
    document.body.classList.add('dark');
  }, []);

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    height: '4rem',
    borderBottom: `1px solid ${colors.gray200}`,
    backgroundColor: colors.white,
    position: 'sticky',
    top: 0,
    zIndex: 50,
  };

  const titleStyle: CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: colors.gray800,
    marginRight: '2rem',
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '4rem' }}>
        <h1 style={{ ...titleStyle, letterSpacing: '-0.025em', display: 'flex', gap: '0.4rem', alignItems: 'center', margin: 0 }}>
          <div style={{ color: colors.blue600, fontWeight: 800 }}>Aero</div>
          <div style={{ color: colors.gray600, fontWeight: 300 }}>Stream</div>
        </h1>

        <nav style={{ display: 'flex', height: '100%', alignItems: 'center', gap: '0.5rem' }}>
          <NavItem
            label="Workflow Builder"
            isActive={activeTab === 'builder'}
            onClick={() => setActiveTab('builder')}
          />
          <NavItem
            label="Live Environment"
            isActive={activeTab === 'live'}
            onClick={() => setActiveTab('live')}
          />
        </nav>
      </div>
      <Row>
        <button
          onClick={toggleTheme}
          style={{
            padding: '0.4rem 1rem',
            border: `1px solid ${colors.gray300}`,
            backgroundColor: 'transparent',
            color: colors.gray700,
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.gray100; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </button>
      </Row>
    </header>
  );
}