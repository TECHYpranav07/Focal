import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import EventCard, { EventData } from '../../components/EventCard';
import EmptyState from '../../components/ui/EmptyState';
import MemberAvatar from '../../components/MemberAvatar';
import { useEvents } from '../../hooks/useEvents';
import { useAuthContext } from '../../lib/auth';

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { data: events, isLoading, refetch, isRefetching } = useEvents();

  const handleEventPress = useCallback(
    (event: EventData) => {
      router.push(`/event/${event.id}`);
    },
    []
  );

  const handleCreateEvent = useCallback(() => {
    router.push('/event/create');
  }, []);

  const handleJoinEvent = useCallback(() => {
    router.push('/event/join');
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0f0a1a', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Welcome back{user?.username ? ',' : ''}
            </Text>
            <Text style={styles.username}>{user?.username || 'User'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <MemberAvatar
              name={user?.username || 'U'}
              avatarUrl={user?.avatar_url}
              size={44}
            />
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.quickActions}>
          <Pressable onPress={handleCreateEvent} style={styles.quickAction}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.quickActionGradient}
            >
              <Text style={styles.quickActionIcon}>✨</Text>
              <Text style={styles.quickActionLabel}>Create Event</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleJoinEvent} style={styles.quickAction}>
            <LinearGradient
              colors={[Colors.accent, '#0891b2']}
              style={styles.quickActionGradient}
            >
              <Text style={styles.quickActionIcon}>🔗</Text>
              <Text style={styles.quickActionLabel}>Join Event</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Events List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Events</Text>
          {events && events.length > 0 && (
            <Text style={styles.eventCount}>{events.length}</Text>
          )}
        </View>

        <ScrollView
          style={styles.eventsList}
          contentContainerStyle={styles.eventsContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
              progressBackgroundColor={Colors.surface}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 100).duration(300)}
                  style={styles.skeleton}
                >
                  <View style={styles.skeletonHeader}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonBadge} />
                  </View>
                  <View style={styles.skeletonBody} />
                  <View style={styles.skeletonFooter}>
                    <View style={styles.skeletonStat} />
                    <View style={styles.skeletonStat} />
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : events && events.length > 0 ? (
            events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={handleEventPress}
                index={index}
              />
            ))
          ) : (
            <EmptyState
              icon="🎉"
              title="No events yet"
              message="Create your first event or join one with an invite code to get started."
              actionLabel="Create Event"
              onAction={handleCreateEvent}
            />
          )}
        </ScrollView>
      </SafeAreaView>

      {/* FAB */}
      {events && events.length > 0 && (
        <Pressable onPress={handleCreateEvent} style={styles.fab}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight]}
            style={styles.fabGradient}
          >
            <Text style={styles.fabIcon}>+</Text>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  greeting: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  username: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionLabel: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  eventCount: {
    ...Typography.smallMedium,
    color: Colors.primary,
    backgroundColor: 'rgba(124,58,237,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.huge + 40,
  },
  loadingContainer: {
    gap: Spacing.md,
  },
  skeleton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  skeletonTitle: {
    width: '50%',
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonBadge: {
    width: 70,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  skeletonBody: {
    width: '80%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: Spacing.md,
  },
  skeletonFooter: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  skeletonStat: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: Spacing.xxl,
    ...Shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '300',
    marginTop: -2,
  },
});
