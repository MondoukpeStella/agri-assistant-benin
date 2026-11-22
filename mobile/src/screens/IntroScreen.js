import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';

export default function IntroScreen({ language, onStart }) {
  const french = language === 'fr';

  return (
    <View style={styles.container} testID="intro-screen">
      <Text accessibilityRole="header" style={styles.title}>
        {french ? COPY.introTitle : COPY.fon}
      </Text>
      {french ? (
        <Text style={styles.body}>{COPY.intro}</Text>
      ) : (
        <Text accessibilityLabel={COPY.fonIntroLabel} style={styles.symbol}>
          ▶
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        style={styles.button}
        testID="start-button"
      >
        <Text style={styles.buttonText}>{french ? COPY.start : 'OK'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 24,
    textAlign: 'center',
  },
  symbol: {
    color: colors.text,
    fontSize: 48,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
