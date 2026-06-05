import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface ProcessingIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
}

export default function ProcessingIndicator({
  status,
  progress = 0,
  message,
}: ProcessingIndicatorProps) {
  const pulseAnim = useSharedValue(0);
  const barAnim = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    if (status === 'processing') {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
      barAnim.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      dot1.value = withRepeat(withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ), -1);
      dot2.value = withRepeat(withSequence(
        withDelay(200, withTiming(1, { duration: 400 })),
        withTiming(0, { duration: 400 })
      ), -1);
      dot3.value = withRepeat(withSequence(
        withDelay(400, withTiming(1, { duration: 400 })),
        withTiming(0, { duration: 400 })
      ), -1);
    }
  }, [status, pulseAnim, barAnim, dot1, dot2, dot3]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulseAnim.value, [0, 1], [0.5, 1]),
    transform: [{ scale: interpolate(pulseAnim.value, [0, 1], [0.98, 1.02]) }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot1.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot1.value, [0, 1], [0, -4]) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot2.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot2.value, [0, 1], [0, -4]) }],
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: interpolate(dot3.value, [0, 1], [0.3, 1]),
    transform: [{ translateY: interpolate(dot3.value, [0, 1], [0, -4]) }],
  }));

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: '⏳',
          label: message || 'Waiting to process',
          color: Colors.warning,
          bgColor: 'rgba(245, 158, 11, 0.1)',
        };
      case 'processing':
        return {
          icon: '⚡',
          label: message || 'Processing faces',
          color: Colors.accent,
          bgColor: 'rgba(6, 182, 212, 0.1)',
        };
      case 'completed':
        return {
          icon: '✅',
          label: message || 'Gallery ready!',
          color: Colors.success,
          bgColor: 'rgba(16, 185, 129, 0.1)',
        };
      case 'failed':
        return {
          icon: '❌',
          label: message || 'Processing failed',
          color: Colors.error,
          bgColor: 'rgba(239, 68, 68, 0.1)',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View style={[styles.container, status === 'processing' && pulseStyle]}>
      <View style={[styles.card, { backgroundColor: config.bgColor }]}>
        <View style={styles.header}>
          <Text style={styles.icon}>{config.icon}</Text>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: config.color }]}>
              {config.label}
            </Text>
            {status === 'processing' && (
              <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, { backgroundColor: config.color }, dot1Style]} />
                <Animated.View style={[styles.dot, { backgroundColor: config.color }, dot2Style]} />
                <Animated.View style={[styles.dot, { backgroundColor: config.color }, dot3Style]} />
              </View>
            )}
          </View>
        </View>

        {status === 'processing' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBar, { width: `${Math.max(progress, 5)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...Typography.bodyMedium,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
    gap: 3,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.captionMedium,
    color: Colors.accent,
    minWidth: 36,
    textAlign: 'right',
  },
});
