import React, { useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import GlassCard from '../../components/ui/GlassCard';
import GradientButton from '../../components/ui/GradientButton';
import { useImagePicker, useUploadPhotos } from '../../hooks/usePhotos';
import { useAppStore } from '../../lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 8;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - Spacing.xxl * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export default function UploadScreen() {
  const eventId = useAppStore((s) => s.upload.eventId);
  const mode = useAppStore((s) => s.upload.mode);
  const selectedPhotos = useAppStore((s) => s.upload.selectedPhotos);
  const isUploading = useAppStore((s) => s.upload.isUploading);
  const uploadProgress = useAppStore((s) => s.upload.uploadProgress);
  const uploadError = useAppStore((s) => s.upload.uploadError);
  const removeSelectedPhoto = useAppStore((s) => s.removeSelectedPhoto);
  const clearSelectedPhotos = useAppStore((s) => s.clearSelectedPhotos);

  const { pickImages, takePhoto } = useImagePicker();
  const { mutateAsync: uploadPhotos } = useUploadPhotos(eventId || '');

  const handleSelectFromGallery = async () => {
    try {
      const maxFiles = mode === 'selfies' ? 5 : 20;
      await pickImages(maxFiles);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCameraCapture = async () => {
    try {
      await takePhoto();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (selectedPhotos.length === 0 || !eventId) return;

    try {
      await uploadPhotos({ photos: selectedPhotos, mode });
      // On success, the hook automatically resets isUploading, progress and invalidates queries.
      // We will navigate back after a small success animation delay
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  const config = useMemo(() => {
    if (mode === 'selfies') {
      return {
        title: 'Face Registration',
        desc: 'Upload 2–5 clear selfies of yourself. Ensure good lighting and facing forward.',
        cta: 'Register Face',
        icon: '🤳',
      };
    }
    return {
      title: 'Upload Group Photos',
      desc: 'Add event group photos to sort. FaceSort AI will auto-detect friends appearing in them.',
      cta: 'Upload Group Photos',
      icon: '📸',
    };
  }, [mode]);

  const showSuccessOverlay = useMemo(() => {
    return uploadProgress === 100 && !isUploading;
  }, [uploadProgress, isUploading]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#090b17', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Nav Header */}
        <View style={styles.navRow}>
          <Pressable onPress={() => { clearSelectedPhotos(); router.back(); }} style={styles.backButton} disabled={isUploading}>
            <Text style={styles.backButtonText}>➔ Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Instructions */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.headerSection}>
            <Text style={styles.desc}>{config.desc}</Text>
          </Animated.View>

          {/* Upload Choices Panel */}
          {selectedPhotos.length === 0 && (
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.choiceContainer}>
              <Pressable onPress={handleSelectFromGallery} style={styles.choiceBox}>
                <GlassCard padding="xl" style={styles.choiceGlassCard}>
                  <Text style={styles.choiceIcon}>🖼️</Text>
                  <Text style={styles.choiceTitle}>Select from Gallery</Text>
                  <Text style={styles.choiceDesc}>Pick multiple images</Text>
                </GlassCard>
              </Pressable>

              <Pressable onPress={handleCameraCapture} style={styles.choiceBox}>
                <GlassCard padding="xl" style={styles.choiceGlassCard}>
                  <Text style={styles.choiceIcon}>📸</Text>
                  <Text style={styles.choiceTitle}>Take a Picture</Text>
                  <Text style={styles.choiceDesc}>Capture with camera</Text>
                </GlassCard>
              </Pressable>
            </Animated.View>
          )}

          {/* Selected Photos Grid */}
          {selectedPhotos.length > 0 && (
            <Animated.View entering={FadeIn.duration(300)} style={styles.gridSection}>
              <View style={styles.gridHeader}>
                <Text style={styles.gridTitle}>Selected ({selectedPhotos.length})</Text>
                <Pressable onPress={clearSelectedPhotos} disabled={isUploading}>
                  <Text style={styles.clearText}>Clear All</Text>
                </Pressable>
              </View>

              <View style={styles.gridContainer}>
                {selectedPhotos.map((photo, index) => (
                  <View key={photo.uri} style={styles.gridItem}>
                    <Image source={{ uri: photo.uri }} style={styles.gridImage} contentFit="cover" />
                    <Pressable
                      onPress={() => removeSelectedPhoto(photo.uri)}
                      style={styles.deleteBadge}
                      disabled={isUploading}
                    >
                      <Text style={styles.deleteIcon}>×</Text>
                    </Pressable>
                  </View>
                ))}

                {/* Plus button inside grid to add more */}
                {selectedPhotos.length < 20 && !isUploading && (
                  <Pressable onPress={handleSelectFromGallery} style={[styles.gridItem, styles.gridAddButton]}>
                    <Text style={styles.gridAddIcon}>+</Text>
                    <Text style={styles.gridAddText}>Add</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Upload Button and Progress Panel */}
        {selectedPhotos.length > 0 && (
          <View style={styles.actionContainer}>
            {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}

            {isUploading ? (
              <GlassCard padding="lg" style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Uploading Files...</Text>
                  <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                </View>
                
                {/* Progress bar background */}
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
                <Text style={styles.progressDetail}>
                  Please do not close the app or lock your screen.
                </Text>
              </GlassCard>
            ) : (
              <GradientButton
                title={`${config.cta} (${selectedPhotos.length})`}
                onPress={handleUpload}
                disabled={mode === 'selfies' && selectedPhotos.length < 2}
              />
            )}
            
            {mode === 'selfies' && selectedPhotos.length < 2 && (
              <Text style={styles.minWarning}>* Please upload at least 2 selfies for accurate face matching.</Text>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* Success Animation Overlay */}
      {showSuccessOverlay && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.successOverlay}>
          <Animated.View entering={ZoomIn.duration(400).springify()} style={styles.successBadge}>
            <Text style={styles.successOverlayIcon}>🎉</Text>
            <Text style={styles.successOverlayTitle}>Upload Completed!</Text>
            <Text style={styles.successOverlaySubtitle}>Successfully processed your images.</Text>
          </Animated.View>
        </Animated.View>
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
  headerTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  headerRight: {
    width: 60,
  },
  scrollContent: {
    paddingBottom: Spacing.massive,
  },
  headerSection: {
    paddingHorizontal: Spacing.xxl,
    marginVertical: Spacing.md,
  },
  desc: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  choiceContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
  choiceBox: {
    flex: 1,
  },
  choiceGlassCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
  choiceIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  choiceTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  choiceDesc: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  gridSection: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.lg,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gridTitle: {
    ...Typography.title,
    color: Colors.textPrimary,
  },
  clearText: {
    ...Typography.captionMedium,
    color: Colors.error,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  deleteBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239,68,68,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  deleteIcon: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 16,
    marginTop: -2,
  },
  gridAddButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridAddIcon: {
    fontSize: 28,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  gridAddText: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionContainer: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  errorText: {
    ...Typography.captionMedium,
    color: Colors.error,
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    textAlign: 'center',
    overflow: 'hidden',
  },
  progressCard: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  progressPercent: {
    ...Typography.bodyMedium,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressDetail: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  minWarning: {
    ...Typography.small,
    color: Colors.warningLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
    opacity: 0.8,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successBadge: {
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    width: '80%',
    ...Shadows.xl,
  },
  successOverlayIcon: {
    fontSize: 54,
    marginBottom: Spacing.md,
  },
  successOverlayTitle: {
    ...Typography.subheading,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  successOverlaySubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
