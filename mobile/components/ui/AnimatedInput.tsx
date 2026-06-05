import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  Pressable,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors, Typography, BorderRadius, Spacing, Shadows } from '../../constants/theme';

interface AnimatedInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export default function AnimatedInput({
  label,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  containerStyle,
  value,
  onFocus,
  onBlur,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusProgress = useSharedValue(0);

  const handleFocus = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      focusProgress.value = withTiming(1, { duration: 200 });
      onFocus?.(e);
    },
    [focusProgress, onFocus]
  );

  const handleBlur = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      focusProgress.value = withTiming(0, { duration: 200 });
      onBlur?.(e);
    },
    [focusProgress, onBlur]
  );

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.10)', 'rgba(124,58,237,0.50)']
    );
    const backgroundColor = interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.08)']
    );
    return { borderColor, backgroundColor };
  });

  const hasValue = value !== undefined && value !== '';
  const isActive = isFocused || hasValue;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <AnimatedView
          style={[
            styles.container,
            containerAnimatedStyle,
            error ? styles.errorBorder : undefined,
          ]}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View style={styles.inputWrapper}>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {label}
            </Text>
            <TextInput
              ref={inputRef}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={[
                styles.input,
                icon ? undefined : styles.inputNoIcon,
              ]}
              placeholderTextColor={Colors.textMuted}
              selectionColor={Colors.primary}
              cursorColor={Colors.primary}
              {...props}
            />
          </View>
          {rightIcon && (
            <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
              {rightIcon}
            </Pressable>
          )}
        </AnimatedView>
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
    ...Shadows.sm,
  },
  iconContainer: {
    marginRight: Spacing.md,
    width: 24,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  labelActive: {
    color: Colors.primaryLight,
    fontSize: 11,
  },
  input: {
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
    margin: 0,
    height: 24,
  },
  inputNoIcon: {
    paddingLeft: 0,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  errorBorder: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.small,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
