import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import ConfidenceBadge from './ui/ConfidenceBadge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PhotoPreviewProps {
  visible: boolean;
  uri: string;
  confidence?: number;
  onClose: () => void;
  onDownload?: () => void;
}

export default function PhotoPreview({
  visible,
  uri,
  confidence,
  onClose,
  onDownload,
}: PhotoPreviewProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View entering={ZoomIn.duration(300).springify()} style={styles.content}>
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />

          {confidence !== undefined && (
            <View style={styles.confidenceContainer}>
              <ConfidenceBadge confidence={confidence} size="lg" showLabel />
            </View>
          )}
        </Animated.View>

        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.actionButton}>
            <Text style={styles.actionIcon}>✕</Text>
          </Pressable>
          {onDownload && (
            <Pressable onPress={onDownload} style={styles.actionButton}>
              <Text style={styles.actionIcon}>⬇</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: '100%',
  },
  confidenceContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl + 10,
  },
  actions: {
    position: 'absolute',
    top: Spacing.huge + 20,
    right: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionIcon: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
});
