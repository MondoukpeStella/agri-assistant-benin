import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + 16,
    paddingBottom: Math.max(insets.bottom, 16) + 12,
  };
}
