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

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuth();

  const handleRegister = useCallback(async () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    try {
      await register(username.trim(), email.trim(), password, confirmPassword);
      router.replace('/(tabs)/home');
    } catch {
      // Error is handled by useAuth hook
    }
  }, [username, email, password, confirmPassword, register]);

  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length > 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#1a0a2e', '#0a0a0f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
            {/* Branding */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.branding}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[Colors.accent, Colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoIcon}>🚀</Text>
                </LinearGradient>
              </View>
              <Text style={styles.appName}>Join FaceSort</Text>
              <Text style={styles.tagline}>Create your account to get started</Text>
            </Animated.View>

            {/* Register Card */}
            <Animated.View entering={FadeInUp.duration(600).delay(300)}>
              <GlassCard showSheen style={styles.card}>
                <Text style={styles.cardTitle}>Create Account</Text>

                {error && (
                  <Pressable onPress={clearError}>
                    <View style={styles.errorBanner}>
                      <Text style={styles.errorText}>⚠️ {error}</Text>
                    </View>
                  </Pressable>
                )}

                <AnimatedInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon={<Text style={styles.inputIcon}>👤</Text>}
                />

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

                <AnimatedInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  icon={<Text style={styles.inputIcon}>🔐</Text>}
                  error={
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${Math.min(password.length * 12.5, 100)}%`,
                            backgroundColor:
                              password.length >= 12
                                ? Colors.success
                                : password.length >= 8
                                ? Colors.warning
                                : Colors.error,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.strengthText}>
                      {password.length >= 12
                        ? 'Strong'
                        : password.length >= 8
                        ? 'Good'
                        : 'Too weak'}
                    </Text>
                  </View>
                )}

                <GradientButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={isLoading}
                  disabled={!isFormValid}
                  variant="mixed"
                  size="lg"
                  style={styles.registerButton}
                />

                <Pressable
                  onPress={() => router.back()}
                  style={styles.loginLink}
                >
                  <Text style={styles.loginText}>
                    Already have an account?{' '}
                    <Text style={styles.loginHighlight}>Sign In</Text>
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
    paddingVertical: Spacing.xxl,
  },
  orb1: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(6, 182, 212, 0.10)',
  },
  orb2: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124, 58, 237, 0.10)',
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    ...Typography.heading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  card: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  cardTitle: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
    gap: Spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    ...Typography.small,
    color: Colors.textMuted,
    minWidth: 60,
  },
  registerButton: {
    marginTop: Spacing.sm,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  loginText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  loginHighlight: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
});
