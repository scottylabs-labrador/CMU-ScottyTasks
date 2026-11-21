import React from 'react';
import { useRouter } from 'expo-router';
import HomeShop from '@/components/profile/HomeShop';

// Keep old links working; Home opens this same shop as an overlay directly.
export default function ShopScreen() {
  const router = useRouter();
  return <HomeShop onClose={() => router.replace('/(tabs)/scotty')} />;
}
