import React from 'react';
import { Image } from 'react-native';
import { BONE_IMAGE } from '@/constants/shop';

export default function BoneIcon({ size = 22 }: { size?: number }) {
  return <Image source={BONE_IMAGE} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="bones" />;
}
