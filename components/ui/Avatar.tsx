import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ScottyDog from '@/components/ScottyDog';
import { UI_COLORS } from '@/constants/gamification';
import { radii } from '@/constants/tokens';

export interface AvatarProps {
  /** Optional emoji character to display */
  emoji?: string;
  /** Optional custom photo/image URI */
  imageUri?: string;
  /** Avatar diameter in px (default: 44) */
  size?: number;
  /** Optional press handler; if provided, wraps avatar in a TouchableOpacity */
  onPress?: () => void;
  /** Whether to show a colored circular border (default: true) */
  showBorder?: boolean;
  /** Border color when showBorder is true (default: UI_COLORS.cmuRed) */
  borderColor?: string;
  /** Whether default ScottyDog avatar should be animated (default: false) */
  animated?: boolean;
  /** Optional container style overrides */
  style?: StyleProp<ViewStyle>;
}

/**
 * Avatar
 *
 * Circular avatar component supporting photo URI, emoji, or fallback ScottyDog mascot.
 * Rendering priority: imageUri -> emoji -> ScottyDog.
 */
function AvatarComponent({
  emoji,
  imageUri,
  size = 44,
  onPress,
  showBorder = true,
  borderColor = UI_COLORS.cmuRed,
  animated = false,
  style,
}: AvatarProps) {
  const containerStyles = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: radii.round,
      borderWidth: showBorder ? 2 : 0,
      borderColor: showBorder ? borderColor : 'transparent',
    },
    style,
  ];

  let content: React.ReactNode;

  if (imageUri) {
    content = (
      <ExpoImage
        source={{ uri: imageUri }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  } else if (emoji) {
    content = (
      <Text
        style={[
          styles.emojiText,
          {
            fontSize: Math.round(size * 0.48),
          },
        ]}
      >
        {emoji}
      </Text>
    );
  } else {
    content = <ScottyDog size={size} animated={animated} />;
  }

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: UI_COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emojiText: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});

export default memo(AvatarComponent);
