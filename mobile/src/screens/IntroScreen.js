import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { useScreenInsets } from '../layout/useScreenInsets';

export default function IntroScreen({ language, onStart }) {
  const french = language === 'fr';
  const insets = useScreenInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.paddingTop, paddingBottom: insets.paddingBottom },
      ]}
      testID="intro-screen"
    >
      <ScrollView contentContainerStyle={styles.body} style={styles.scroll}>
        {french ? (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {COPY.introTitle}
            </Text>
            <Text style={styles.subtitle}>{COPY.intro}</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{COPY.introStep1Title}</Text>
              <Text style={styles.cardBody}>{COPY.introStep1}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{COPY.introStep2Title}</Text>
              <Text style={styles.cardBody}>{COPY.introStep2}</Text>
            </View>
          </>
        ) : (
          <Text accessibilityLabel={COPY.fonIntroLabel} style={styles.symbol}>
            ▶
          </Text>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    padding: 24,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  body: {
    paddingBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.mint,
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardBody: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  symbol: {
    color: colors.primary,
    fontSize: 48,
    marginTop: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginBottom: 12,
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
