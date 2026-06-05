import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Clipboard,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import MemberAvatar from '../../components/MemberAvatar';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import ProcessingIndicator from '../../components/ui/ProcessingIndicator';
import {
  useEvent,
  useEventMembers,
  useProcessingStatus,
  useStartProcessing,
} from '../../hooks/useEvents';
import { useAppStore } from '../../lib/store';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // Zustand Store actions
  const setUploadEventId = useAppStore((s) => s.setUploadEventId);
  const setUploadMode = useAppStore((s) => s.setUploadMode);
  const setActiveEventId = useAppStore((s) => s.setActiveEventId);

  // Queries
  const { data: event, isLoading: eventLoading, refetch: refetchEvent } = useEvent(id || '');
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useEventMembers(id || '');
  
  // Polling for processing status (enabled when event exists)
  const { data: procStatus, refetch: refetchStatus } = useProcessingStatus(id || '', !!id);
  const { mutateAsync: startProcessing, isPending: processPending } = useStartProcessing();

  // Keep Zustand active event synchronized
  useEffect(() => {
    if (id) {
      setActiveEventId(id);
      setUploadEventId(id);
    }
  }, [id]);

  const handleCopyCode = () => {
    if (event) {
      Clipboard.setString(event.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (event) {
      try {
        await Share.share({
          message: `Join my FaceSort event "${event.name}" using this invite code: ${event.invite_code}`,
        });
      } catch (error) {
        console.error('Error sharing code', error);
      }
    }
  };

  const handleUploadPhotos = () => {
    setUploadMode('photos');
    router.push('/event/upload');
  };

  const handleUploadSelfies = () => {
    setUploadMode('selfies');
    router.push('/event/upload');
  };

  const handleStartSort = async () => {
    if (!id) return;
    try {
      await startProcessing(id);
      refetchEvent();
      refetchStatus();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewGallery = () => {
    setActiveEventId(id || null);
    router.push('/(tabs)/gallery');
  };

  // Determine current active processing state
  const currentStatus = useMemo(() => {
    if (procStatus) return procStatus.status;
    return event?.status || 'pending';
  }, [procStatus, event]);

  const currentProgress = useMemo(() => {
    return procStatus?.progress || 0;
  }, [procStatus]);

  if (eventLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Fetching event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Event not found or has been deleted.</Text>
        <GradientButton title="Go Back" onPress={() => router.back()} style={styles.errorButton} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0b0a16', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Back and Share Row */}
        <View style={styles.navRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>➔ Back</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Share Code 📤</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Main Info */}
          <Animated.View entering={FadeInUp.duration(400)} style={styles.infoSection}>
            <Text style={styles.eventName}>{event.name}</Text>
            {event.description ? (
              <Text style={styles.eventDesc}>{event.description}</Text>
            ) : null}

            {/* Invite Code Showcase */}
            <Pressable onPress={handleCopyCode} style={styles.codeBadge}>
              <Text style={styles.codeLabel}>INVITE CODE:</Text>
              <Text style={styles.codeText}>{event.invite_code}</Text>
              <Text style={styles.copyLabel}>{copied ? '✅' : '📋'}</Text>
            </Pressable>
          </Animated.View>

          {/* AI Processing Card */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} style={styles.cardContainer}>
            <GlassCard padding="xl" showSheen style={styles.statusCard}>
              <Text style={styles.cardTitle}>FaceSort AI Pipeline</Text>
              
              <ProcessingIndicator
                status={currentStatus}
                progress={currentProgress}
                message={procStatus?.message || (currentStatus === 'completed' ? 'All photos processed successfully!' : undefined)}
              />

              {event.is_host && currentStatus !== 'processing' && (
                <View style={styles.hostControlContainer}>
                  <Text style={styles.hostNotice}>
                    ★ You are the host. Once everyone has uploaded their selfies and all group photos are in, click below to trigger AI matching.
                  </Text>
                  <GradientButton
                    title="Start AI Face Sorting"
                    onPress={handleStartSort}
                    loading={processPending}
                    variant="mixed"
                    style={styles.processButton}
                  />
                </View>
              )}

              {currentStatus === 'completed' && (
                <GradientButton
                  title="View My Personal Gallery"
                  onPress={handleViewGallery}
                  style={styles.galleryButton}
                />
              )}
            </GlassCard>
          </Animated.View>

          {/* Stats Bar */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.statsContainer}>
            <GlassCard padding="md" style={styles.statCard}>
              <Text style={styles.statValue}>{event.photo_count || 0}</Text>
              <Text style={styles.statLabel}>Group Photos</Text>
            </GlassCard>
            <GlassCard padding="md" style={styles.statCard}>
              <Text style={styles.statValue}>{members?.length || event.member_count || 0}</Text>
              <Text style={styles.statLabel}>Members Joined</Text>
            </GlassCard>
          </Animated.View>

          {/* Action Row */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.actionRow}>
            <Pressable onPress={handleUploadPhotos} style={styles.actionBox}>
              <GlassCard padding="lg" style={styles.actionGlassCard}>
                <Text style={styles.actionIcon}>📸</Text>
                <Text style={styles.actionTitle}>Upload Photos</Text>
                <Text style={styles.actionDesc}>Add group photos</Text>
              </GlassCard>
            </Pressable>

            <Pressable onPress={handleUploadSelfies} style={styles.actionBox}>
              <GlassCard padding="lg" style={styles.actionGlassCard}>
                <Text style={styles.actionIcon}>🤳</Text>
                <Text style={styles.actionTitle}>Register Face</Text>
                <Text style={styles.actionDesc}>Upload 2–5 selfies</Text>
              </GlassCard>
            </Pressable>
          </Animated.View>

          {/* Members Strip */}
          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Members ({members?.length || 0})</Text>
            {membersLoading ? (
              <ActivityIndicator color={Colors.primary} style={styles.memberLoader} />
            ) : members && members.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersContent}>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberItem}>
                    <MemberAvatar name={member.username} avatarUrl={member.avatar_url} size={48} />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.username}
                    </Text>
                    {member.is_host && <Text style={styles.hostBadge}>Host</Text>}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noMembersText}>No members joined yet.</Text>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
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
  loadingScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  errorScreen: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorButton: {
    width: 140,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    transform: [{ rotate: '180deg' }], // points left
  },
  shareButton: {
    alignSelf: 'flex-end',
  },
  shareButtonText: {
    ...Typography.captionMedium,
    color: Colors.accent,
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  infoSection: {
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.md,
  },
  eventName: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  eventDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 22,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    gap: Spacing.sm,
  },
  codeLabel: {
    ...Typography.smallMedium,
    color: Colors.textMuted,
  },
  codeText: {
    ...Typography.bodyMedium,
    color: Colors.primaryLight,
    fontWeight: '700',
    letterSpacing: 1,
  },
  copyLabel: {
    fontSize: 14,
  },
  cardContainer: {
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.md,
  },
  statusCard: {
    width: '100%',
  },
  cardTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  hostControlContainer: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  hostNotice: {
    ...Typography.small,
    color: Colors.warningLight,
    lineHeight: 18,
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
  processButton: {
    marginTop: Spacing.xs,
  },
  galleryButton: {
    marginTop: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading,
    fontSize: 24,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  actionBox: {
    flex: 1,
  },
  actionGlassCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  actionTitle: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  actionDesc: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  membersSection: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  memberLoader: {
    marginVertical: Spacing.md,
  },
  membersContent: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.lg,
  },
  memberItem: {
    alignItems: 'center',
    width: 60,
  },
  memberName: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    width: '100%',
    textAlign: 'center',
  },
  hostBadge: {
    ...Typography.small,
    fontSize: 9,
    color: Colors.primaryLight,
    backgroundColor: 'rgba(168,85,247,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: 2,
    fontWeight: '600',
  },
  noMembersText: {
    ...Typography.body,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.xxl,
  },
});
