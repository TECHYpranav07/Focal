import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import MemberAvatar from '../../components/MemberAvatar';
import GlassCard from '../../components/ui/GlassCard';
import { useAuthContext } from '../../lib/auth';
import { useEvents } from '../../hooks/useEvents';

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const { data: events } = useEvents();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error', e);
    }
  }, [logout]);

  const hostedCount = events ? events.filter((e) => e.is_host).length : 0;
  const joinedCount = events ? events.filter((e) => !e.is_host).length : 0;

  const SettingRow = ({ icon, label, onPress, destructive = false }: any) => (
    <Pressable onPress={onPress} style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Text style={[styles.settingIcon, destructive && styles.settingIconDestructive]}>
          {icon}
        </Text>
        <Text style={[styles.settingLabel, destructive && styles.settingLabelDestructive]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.settingArrow, destructive && styles.settingArrowDestructive]}>
        ➔
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0c0b17', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.cardContainer}>
            <GlassCard padding="xl" showSheen style={styles.profileCard}>
              <View style={styles.avatarWrapper}>
                <MemberAvatar name={user?.username || 'U'} avatarUrl={user?.avatar_url} size={80} />
              </View>
              <Text style={styles.username}>{user?.username || 'User'}</Text>
              <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{hostedCount}</Text>
                  <Text style={styles.statLabel}>Hosted</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{joinedCount}</Text>
                  <Text style={styles.statLabel}>Joined</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Settings Section */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account</Text>
            <GlassCard padding="none" style={styles.settingsCard}>
              <SettingRow icon="👤" label="Edit Profile" onPress={() => {}} />
              <View style={styles.rowDivider} />
              <SettingRow icon="🔒" label="Privacy & Security" onPress={() => {}} />
              <View style={styles.rowDivider} />
              <SettingRow icon="🔔" label="Notification Settings" onPress={() => {}} />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <GlassCard padding="none" style={styles.settingsCard}>
              <SettingRow icon="🎨" label="Theme (Dark Glass)" onPress={() => {}} />
              <View style={styles.rowDivider} />
              <SettingRow icon="💾" label="Storage Management" onPress={() => {}} />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.settingsSection}>
            <GlassCard padding="none" style={styles.settingsCard}>
              <SettingRow icon="🚪" label="Sign Out" onPress={handleLogout} destructive={true} />
            </GlassCard>
          </Animated.View>

          <Text style={styles.versionText}>FaceSort App v1.0.0 (Expo SDK 56)</Text>
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
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  header: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  cardContainer: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  username: {
    ...Typography.subheading,
    color: Colors.textPrimary,
  },
  email: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    width: '100%',
    marginVertical: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  settingsSection: {
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.sm,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  settingIconDestructive: {
    color: Colors.error,
  },
  settingLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  settingLabelDestructive: {
    color: Colors.error,
  },
  settingArrow: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  settingArrowDestructive: {
    color: Colors.error + '99',
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: Spacing.xl,
  },
  versionText: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
