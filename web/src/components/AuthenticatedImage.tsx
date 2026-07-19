import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';

interface AuthenticatedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackText?: string;
  spinnerSize?: number;
}

export default function AuthenticatedImage({
  src,
  alt = 'Image',
  className = '',
  style,
  fallbackText = 'Failed to load image',
  spinnerSize = 24,
  ...props
}: AuthenticatedImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If there is no src, or if it's already a blob/data URI
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setObjectUrl(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    const fetchImage = async () => {
      try {
        const response = await axios.get(src, {
          responseType: 'blob',
        });
        
        if (isMounted) {
          const blob = response.data;
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load authenticated image: ${src}`, err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
      if (objectUrl && !src.startsWith('blob:') && !src.startsWith('data:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  // Revoke previous blob url if src changes
  useEffect(() => {
    return () => {
      if (objectUrl && !src.startsWith('blob:') && !src.startsWith('data:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl, src]);

  if (loading) {
    return (
      <div
        className="animate-shimmer"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: '100px',
          backgroundColor: '#1f2937',
          color: '#6b7280',
          borderRadius: 'inherit',
          ...style,
        }}
      >
        <div
          style={{
            width: `${spinnerSize}px`,
            height: `${spinnerSize}px`,
            border: '2px solid rgba(245, 158, 11, 0.1)',
            borderTopColor: 'var(--accent-amber)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          height: '100%',
          minHeight: '100px',
          backgroundColor: '#111827',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          fontSize: '12px',
          padding: '12px',
          textAlign: 'center',
          borderRadius: 'inherit',
          ...style,
        }}
      >
        <AlertCircle size={20} />
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        ...style,
      }}
      {...props}
    />
  );
}
