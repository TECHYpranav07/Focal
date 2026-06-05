import React from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  Dimensions,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface PhotoItem {
  id: string;
  uri: string;
  thumbnail_url?: string;
  confidence?: number;
}

interface PhotoGridProps {
  photos: PhotoItem[];
  onPhotoPress?: (photo: PhotoItem, index: number) => void;
  showConfidence?: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  emptyMessage?: string;
}

export default function PhotoGrid({
  photos,
  onPhotoPress,
  showConfidence = false,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  emptyMessage = 'No photos yet',
}: PhotoGridProps) {
  const handlePress = (photo: PhotoItem, index: number) => {
    if (selectable && onSelectionChange) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(photo.id)) {
        newSelected.delete(photo.id);
      } else {
        newSelected.add(photo.id);
      }
      onSelectionChange(newSelected);
    } else {
      onPhotoPress?.(photo, index);
    }
  };

  if (photos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: PhotoItem; index: number }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
        <Pressable
          onPress={() => handlePress(item, index)}
          style={[styles.photoItem, isSelected && styles.photoSelected]}
        >
          <Image
            source={{ uri: item.thumbnail_url || item.uri }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
            recyclingKey={item.id}
          />
          {showConfidence && item.confidence !== undefined && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          )}
          {selectable && isSelected && (
            <View style={styles.selectedOverlay}>
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  photoItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'flex-topright',
    justifyContent: 'flex-start',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  confidenceText: {
    ...Typography.small,
    color: Colors.successLight,
    fontWeight: '700',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.huge,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
});
