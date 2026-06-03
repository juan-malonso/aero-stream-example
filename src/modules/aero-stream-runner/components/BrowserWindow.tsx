import type { CSSProperties } from 'react';

import { Row } from '@/libs/ui';
import { colors, shadows, typography } from '@/styles/tokens';

interface BrowserWindowProperties {
  src: string;
}

export function BrowserWindow({ src }: BrowserWindowProperties) {
  return (
    <div style={browserStyle}>
      <div style={browserChromeStyle}>
        <Row gap="0.4rem" align="center">
          <span style={{ ...browserDotStyle, background: colors.red500 }} />
          <span style={{ ...browserDotStyle, background: colors.yellow500 }} />
          <span style={{ ...browserDotStyle, background: colors.green500 }} />
        </Row>
        <div style={addressBarStyle}>{src || 'about:blank'}</div>
      </div>
      <div style={iframeStageStyle}>
        {src ? (
          <iframe
            title="AeroStream Runner"
            src={src}
            style={iframeStyle}
            allow="camera; microphone; autoplay"
          />
        ) : (
          <div style={emptyPreviewStyle}>Create a session to load AeroStream Runner.</div>
        )}
      </div>
    </div>
  );
}

const browserStyle: CSSProperties = {
  background: colors.gray900,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '0.75rem',
  boxShadow: shadows.lg,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
};

const browserChromeStyle: CSSProperties = {
  alignItems: 'center',
  background: colors.gray100,
  borderBottom: `1px solid ${colors.gray300}`,
  display: 'grid',
  gridTemplateColumns: '80px minmax(0, 1fr)',
  gap: '0.75rem',
  padding: '0.7rem 0.85rem',
};

const browserDotStyle: CSSProperties = {
  borderRadius: '999px',
  display: 'inline-block',
  height: '0.75rem',
  width: '0.75rem',
};

const addressBarStyle: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '999px',
  color: colors.gray600,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.sm,
  overflow: 'hidden',
  padding: '0.45rem 0.75rem',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const iframeStageStyle: CSSProperties = {
  flex: '1 1 0%',
  minHeight: 0,
};

const iframeStyle: CSSProperties = {
  border: 0,
  height: '100%',
  width: '100%',
};

const emptyPreviewStyle: CSSProperties = {
  alignItems: 'center',
  background: colors.gray900,
  color: colors.gray300,
  display: 'flex',
  fontSize: typography.sizes.lg,
  fontWeight: typography.weights.semibold,
  height: '100%',
  justifyContent: 'center',
};
