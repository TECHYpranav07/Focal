import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  showSheen?: boolean;
  className?: string;
}

export default function GlassCard({
  children,
  interactive = false,
  padding = 'lg',
  glow = false,
  className = '',
  style,
  ...props
}: GlassCardProps) {
  const paddingMap = {
    none: '0',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  };

  const combinedStyle: React.CSSProperties = {
    padding: paddingMap[padding],
    position: 'relative',
    ...(glow && {
      animation: 'pulseGlow 3s infinite',
      borderColor: 'var(--accent-purple)',
    }),
    ...style,
  };

  return (
    <div
      className={`glass-panel ${interactive ? 'glass-panel-interactive' : ''} ${className}`}
      style={combinedStyle}
      {...props}
    >
      {/* Light sheen overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 50%, transparent 100%)',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
      {children}
    </div>
  );
}
