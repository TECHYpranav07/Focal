import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Clipboard } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import GlassCard from '../../components/ui/GlassCard';
import AnimatedInput from '../../components/ui/AnimatedInput';
import GradientButton from '../../components/ui/GradientButton';
import { useCreateEvent } from '../../hooks/useEvents';

export default function CreateEventScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<{ id: string; invite_code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutateAsync: createEvent, isPending } = useCreateEvent();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }
    setError(null);

    try {
      const response = await createEvent({ name, description });
      setCreatedEvent({ id: response.id, invite_code: response.invite_code });
    } catch (e: any) {
      setError(e.message || 'Failed to create event');
    }
  };

  const handleCopy = () => {
    if (createdEvent) {
      Clipboard.setString(createdEvent.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToEvent = () => {
    if (createdEvent) {
      router.replace(`/event/${createdEvent.id}`);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0f0a1c', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Back navigation */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>➔ Back</Text>
        </Pressable>

        <View style={styles.content}>
          {!createdEvent ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.formContainer}>
              <Text style={styles.title}>Create Event</Text>
              <Text style={styles.subtitle}>Host a new gathering and sort photos automatically</Text>

              <GlassCard padding="xl" style={styles.formCard}>
                {error && <Text style={styles.errorText}>{error}</Text>}

                <AnimatedInput
                  label="Event Name"
                  placeholder="e.g. Goa Trip 2026, Summer Wedding"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (error) setError(null);
                  }}
                  autoFocus
                />

                <View style={styles.inputGap} />

                <AnimatedInput
                  label="Description (Optional)"
                  placeholder="e.g. Reunion with university friends"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.buttonGap} />

                <GradientButton
                  title="Create Event"
                  onPress={handleCreate}
                  loading={isPending}
                />
              </GlassCard>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Event Created!</Text>
              <Text style={styles.successSubtitle}>
                Invite your friends by sharing this unique invite code
              </Text>

              <GlassCard padding="xl" style={styles.codeCard}>
                <Text style={styles.codeLabel}>INVITE CODE</Text>
                <Text style={styles.codeText}>{createdEvent.invite_code}</Text>

                <Pressable onPress={handleCopy} style={styles.copyButton}>
                  <Text style={styles.copyButtonText}>
                    {copied ? '✅ Copied!' : '📋 Copy to Clipboard'}
                  </Text>
                </Pressable>
              </GlassCard>

              <GradientButton
                title="Go to Event Detail"
                onPress={handleGoToEvent}
                style={styles.actionButton}
              />
            </Animated.View>
          )}
        </View>
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
  backButton: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    transform: [{ rotate: '180deg' }], // Arrow points left
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  formCard: {
    width: '100%',
  },
  errorText: {
    ...Typography.captionMedium,
    color: Colors.error,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputGap: {
    height: Spacing.lg,
  },
  buttonGap: {
    height: Spacing.xxl,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },
  codeCard: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.massive,
  },
  codeLabel: {
    ...Typography.smallMedium,
    color: Colors.textMuted,
    letterSpacing: 1.5,
  },
  codeText: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 4,
    marginVertical: Spacing.lg,
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: Spacing.md - 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  copyButtonText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  actionButton: {
    marginTop: Spacing.lg,
  },
});
