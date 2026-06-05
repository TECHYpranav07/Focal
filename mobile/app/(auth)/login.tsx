import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import AnimatedInput from '../../components/ui/AnimatedInput';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch {
      // Error is handled by useAuth hook
    }
  }, [email, password, login]);

  return (
    <View style={styles.screen}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#0a0a0f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative gradient orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo / Branding */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.branding}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[Colors.primary, Colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoIcon}>📸</Text>
                </LinearGradient>
              </View>
              <Text style={styles.appName}>FaceSort</Text>
              <Text style={styles.tagline}>AI-powered photo distribution</Text>
            </Animated.View>

            {/* Login Card */}
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <GlassCard showSheen style={styles.card}>
                <Text style={styles.cardTitle}>Welcome back</Text>
                <Text style={styles.cardSubtitle}>
                  Sign in to access your events
                </Text>

                {error && (
                  <Pressable onPress={clearError}>
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                  </Pressable>
                )}

                <AnimatedInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon={<Text style={styles.inputIcon}>✉️</Text>}
                />

                <AnimatedInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  icon={<Text style={styles.inputIcon}>🔒</Text>}
                  rightIcon={
                    <Text style={styles.inputIcon}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <GradientButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={!email.trim() || !password.trim()}
                  size="lg"
                  style={styles.loginButton}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  onPress={() => router.push('/(auth)/register')}
                  style={styles.registerLink}
                >
                  <Text style={styles.registerText}>
                    Don't have an account?{' '}
                    <Text style={styles.registerHighlight}>Register</Text>
                  </Text>
                </Pressable>
              </GlassCard>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  orb1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
  },
  orb2: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    ...Typography.hero,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  card: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },
  cardTitle: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
  },
  inputIcon: {
    fontSize: 18,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginHorizontal: Spacing.lg,
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  registerHighlight: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
});
