import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import { useJoinEvent } from '../../hooks/useEvents';

export default function JoinEventScreen() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joinedEvent, setJoinedEvent] = useState<{ id: string; name: string } | null>(null);
  
  const inputRef = useRef<TextInput>(null);
  const { mutateAsync: joinEvent, isPending } = useJoinEvent();

  const handleTextChange = (text: string) => {
    // Keep uppercase alphanumeric only, max 6 chars
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(cleaned);
    if (error) setError(null);

    // Auto submit if complete
    if (cleaned.length === 6) {
      Keyboard.dismiss();
      submitJoin(cleaned);
    }
  };

  const submitJoin = async (submitCode: string) => {
    if (submitCode.length !== 6) {
      setError('Invite code must be exactly 6 characters');
      return;
    }

    try {
      const response = await joinEvent(submitCode);
      setJoinedEvent({ id: response.event.id, name: response.event.name });
    } catch (e: any) {
      setError(e.message || 'Failed to join event. Check the code and try again.');
    }
  };

  const handleGoToEvent = () => {
    if (joinedEvent) {
      router.replace(`/event/${joinedEvent.id}`);
    }
  };

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0c0a1b', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Back button */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>➔ Back</Text>
        </Pressable>

        <View style={styles.content}>
          {!joinedEvent ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
              <Text style={styles.title}>Join Event</Text>
              <Text style={styles.subtitle}>Enter the 6-character code shared by the host</Text>

              <GlassCard padding="xl" style={styles.card}>
                {error && <Text style={styles.errorText}>{error}</Text>}

                {/* Hidden input to facilitate standard keyboard inputs */}
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleTextChange}
                  style={styles.hiddenInput}
                  keyboardType="default"
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                />

                {/* Visible boxes */}
                <Pressable onPress={() => inputRef.current?.focus()} style={styles.boxesContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const char = code[index] || '';
                    const isCurrent = index === code.length;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.codeBox,
                          char !== '' && styles.codeBoxFilled,
                          isCurrent && styles.codeBoxActive,
                        ]}
                      >
                        <Text style={styles.codeText}>{char}</Text>
                      </View>
                    );
                  })}
                </Pressable>

                {isPending && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Validating invite code...</Text>
                  </View>
                )}

                <View style={styles.buttonGap} />

                <GradientButton
                  title="Join Event"
                  onPress={() => submitJoin(code)}
                  loading={isPending}
                  disabled={code.length !== 6}
                />
              </GlassCard>
            </Animated.View>
          ) : (
            <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.successContainer}>
              <Text style={styles.successIcon}>🤝</Text>
              <Text style={styles.successTitle}>Successfully Joined!</Text>
              <Text style={styles.successSubtitle}>
                You are now a member of <Text style={styles.eventName}>{joinedEvent.name}</Text>. 
                Upload selfies to register your face!
              </Text>

              <GradientButton
                title="Go to Event Details"
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
    transform: [{ rotate: '180deg' }], // points left
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  container: {
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
  card: {
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
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: Spacing.lg,
  },
  codeBox: {
    width: 44,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBoxFilled: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  codeBoxActive: {
    borderColor: Colors.primaryLight,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  buttonGap: {
    height: Spacing.xl,
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
    marginBottom: Spacing.massive,
    lineHeight: 22,
  },
  eventName: {
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  actionButton: {
    marginTop: Spacing.lg,
  },
});
