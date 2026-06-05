import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors, BorderRadius, Spacing, Typography } from '../constants/theme';

interface MemberAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: number;
  showName?: boolean;
}

const AVATAR_COLORS = [
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function MemberAvatar({
  name,
  avatarUrl,
  size = 40,
  showName = false,
}: MemberAvatarProps) {
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatar,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor + '30',
              borderColor: bgColor + '50',
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: size * 0.35,
                color: bgColor,
              },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
      {showName && (
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );
}

interface MemberAvatarGroupProps {
  members: Array<{ id: string; username: string; avatar_url?: string }>;
  maxDisplay?: number;
  size?: number;
}

export function MemberAvatarGroup({
  members,
  maxDisplay = 5,
  size = 36,
}: MemberAvatarGroupProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = members.length - maxDisplay;

  return (
    <View style={styles.groupContainer}>
      {displayMembers.map((member, index) => (
        <View
          key={member.id}
          style={[
            styles.groupItem,
            { marginLeft: index === 0 ? 0 : -(size * 0.25), zIndex: displayMembers.length - index },
          ]}
        >
          <MemberAvatar
            name={member.username}
            avatarUrl={member.avatar_url}
            size={size}
          />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.remainingBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.25),
            },
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: size * 0.3 }]}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 2,
    borderColor: Colors.border,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
  name: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    maxWidth: 60,
    textAlign: 'center',
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: Colors.background,
    borderRadius: BorderRadius.full,
  },
  remainingBadge: {
    backgroundColor: Colors.surfaceHover,
    borderWidth: 2,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
