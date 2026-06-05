import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
  showSheen?: boolean;
}

export default function GlassCard({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  showSheen = false,
}: GlassCardProps) {
  const cardStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'outlined' && styles.outlined,
    { padding: Spacing[padding] },
    style,
  ];

  return (
    <View style={cardStyle}>
      {showSheen && (
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sheen}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  elevated: {
    backgroundColor: Colors.surfaceHover,
    ...Shadows.xl,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
  },
});
