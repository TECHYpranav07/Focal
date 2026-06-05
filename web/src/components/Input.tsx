import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  containerStyle?: React.CSSProperties;
}

export default function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  return (
    <div className="input-container" style={containerStyle}>
      <span className="input-label">{label}</span>
      <input
        className="form-input"
        style={style}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
