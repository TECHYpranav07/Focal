import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme';

interface ConfidenceBadgeProps {
  confidence: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ConfidenceBadge({
  confidence,
  size = 'md',
  showLabel = false,
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  const getColor = () => {
    if (percentage >= 90) return Colors.success;
    if (percentage >= 70) return Colors.successLight;
    if (percentage >= 50) return Colors.warning;
    return Colors.error;
  };

  const getLabel = () => {
    if (percentage >= 90) return 'High';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Fair';
    return 'Low';
  };

  const color = getColor();
  const sizeStyles = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
  };
  const textSizeStyles = {
    sm: styles.textSm,
    md: styles.textMd,
    lg: styles.textLg,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { borderColor: color + '40' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, textSizeStyles[size], { color }]}>
        {percentage}%
      </Text>
      {showLabel && (
        <Text style={[styles.label, { color: color + 'CC' }]}>
          {getLabel()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sizeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sizeMd: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sizeLg: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 2,
  },
});
