import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import GlassCard from './ui/GlassCard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface EventData {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  status: 'active' | 'processing' | 'completed';
  member_count: number;
  photo_count: number;
  created_at: string;
  is_host: boolean;
}

interface EventCardProps {
  event: EventData;
  onPress: (event: EventData) => void;
  index?: number;
}

export default function EventCard({ event, onPress, index = 0 }: EventCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const getStatusConfig = () => {
    switch (event.status) {
      case 'active':
        return { label: 'Active', color: Colors.success, bgColor: 'rgba(16,185,129,0.15)' };
      case 'processing':
        return { label: 'Processing', color: Colors.accent, bgColor: 'rgba(6,182,212,0.15)' };
      case 'completed':
        return { label: 'Completed', color: Colors.primaryLight, bgColor: 'rgba(168,85,247,0.15)' };
    }
  };

  const statusConfig = getStatusConfig();
  const dateStr = new Date(event.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Animated.View entering={FadeInUp.delay(index * 80).duration(400).springify()}>
      <AnimatedPressable
        onPress={() => onPress(event)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        <GlassCard showSheen style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {event.name}
              </Text>
              {event.is_host && (
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>Host</Text>
                </View>
              )}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {event.description && (
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          )}

          <View style={styles.footer}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statText}>{event.member_count} members</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statIcon}>📸</Text>
                <Text style={styles.statText}>{event.photo_count} photos</Text>
              </View>
            </View>
            <Text style={styles.date}>{dateStr}</Text>
          </View>

          {/* Decorative gradient line at bottom */}
          <LinearGradient
            colors={[Colors.primary, Colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomLine}
          />
        </GlassCard>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.lg + 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.sm,
    gap: Spacing.sm,
  },
  name: {
    ...Typography.title,
    color: Colors.textPrimary,
    flex: 1,
  },
  hostBadge: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  hostBadgeText: {
    ...Typography.small,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.smallMedium,
  },
  description: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  date: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
});
