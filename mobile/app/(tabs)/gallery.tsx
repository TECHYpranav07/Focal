import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import PhotoGrid from '../../components/ui/PhotoGrid';
import EmptyState from '../../components/ui/EmptyState';
import PhotoPreview from '../../components/PhotoPreview';
import { useEvents } from '../../hooks/useEvents';
import { useGallery } from '../../hooks/usePhotos';
import { useAppStore } from '../../lib/store';

export default function GalleryScreen() {
  const { data: events, isLoading: eventsLoading } = useEvents();
  const activeEventId = useAppStore((s) => s.activeEventId);
  const setActiveEventId = useAppStore((s) => s.setActiveEventId);
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ uri: string; confidence?: number } | null>(null);

  // Sync selected event with active event from store on load
  useEffect(() => {
    if (activeEventId) {
      setSelectedEventId(activeEventId);
    } else if (events && events.length > 0 && !selectedEventId) {
      // Default to first event
      setSelectedEventId(events[0].id);
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  // Load photos for the selected event
  const { data: photos, isLoading: photosLoading, refetch } = useGallery(selectedEventId || '');

  const handleEventSelect = (id: string) => {
    setSelectedEventId(id);
    setActiveEventId(id);
  };

  const handlePhotoPress = useCallback((photo: any) => {
    setPreviewPhoto({ uri: photo.uri, confidence: photo.confidence });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewPhoto(null);
  }, []);

  // Filter events to only show those that have processing status completed or active
  const selectableEvents = useMemo(() => {
    return events || [];
  }, [events]);

  const selectedEvent = useMemo(() => {
    return selectableEvents.find(e => e.id === selectedEventId) || null;
  }, [selectableEvents, selectedEventId]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#0a0a0f', '#0d0a15', '#0a0a0f']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.title}>Your Galleries</Text>
          <Text style={styles.subtitle}>Photos matching your registered face</Text>
        </Animated.View>

        {/* Event Selector Slider */}
        {selectableEvents.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.selectorScroll}
              contentContainerStyle={styles.selectorContent}
            >
              {selectableEvents.map((event) => {
                const isSelected = event.id === selectedEventId;
                return (
                  <Pressable
                    key={event.id}
                    onPress={() => handleEventSelect(event.id)}
                    style={[
                      styles.selectorItem,
                      isSelected && styles.selectorItemActive,
                    ]}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[Colors.primary, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text
                      style={[
                        styles.selectorText,
                        isSelected && styles.selectorTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {event.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        {/* Photos View */}
        <View style={styles.contentContainer}>
          {eventsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading your events...</Text>
            </View>
          ) : selectableEvents.length === 0 ? (
            <EmptyState
              icon="🖼️"
              title="No galleries found"
              message="Join an event and upload selfies to start seeing photos you appear in automatically!"
            />
          ) : selectedEventId && photosLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Scanning matching photos...</Text>
            </View>
          ) : photos && photos.length > 0 ? (
            <PhotoGrid
              photos={photos}
              onPhotoPress={handlePhotoPress}
              showConfidence={true}
              emptyMessage="No matching photos found in this event yet."
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="No matches yet"
              message={
                selectedEvent?.status === 'completed'
                  ? "We couldn't find any photos matching your registered face in this event."
                  : selectedEvent?.status === 'processing'
                  ? "FaceSort AI is currently matching faces! Check back in a few moments."
                  : "Photos haven't been processed yet. Upload selfies and ask the host to trigger sorting."
              }
            />
          )}
        </View>
      </SafeAreaView>

      {/* Full-screen Photo Preview */}
      {previewPhoto && (
        <PhotoPreview
          visible={true}
          uri={previewPhoto.uri}
          confidence={previewPhoto.confidence}
          onClose={handleClosePreview}
        />
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
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
  },
  title: {
    ...Typography.heading,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectorScroll: {
    maxHeight: 50,
    marginBottom: Spacing.lg,
  },
  selectorContent: {
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  selectorItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  selectorItemActive: {
    borderColor: 'transparent',
  },
  selectorText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  selectorTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
