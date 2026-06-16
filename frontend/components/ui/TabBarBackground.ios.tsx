import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  return <View style={StyleSheet.absoluteFill} />;
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
