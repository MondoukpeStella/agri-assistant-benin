import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SproutMark } from '../components/icons';
import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { useScreenInsets } from '../layout/useScreenInsets';

export default function SplashScreen({ onStart }) {
  const insets = useScreenInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.paddingTop, paddingBottom: insets.paddingBottom },
      ]}
      testID="splash-screen"
    >
      <StatusBar style="dark" />
      <View style={styles.group}>
        <View testID="splash-logo">
          <SproutMark />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          {COPY.appName}
        </Text>
        <Text style={styles.tagline}>{COPY.splashTagline}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onStart}
          style={styles.button}
          testID="splash-start"
        >
          <Text style={styles.buttonText}>{COPY.splashStart}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  group: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  tagline: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginTop: 28,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
