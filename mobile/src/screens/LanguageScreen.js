import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { useScreenInsets } from '../layout/useScreenInsets';

export default function LanguageScreen({ initialLanguage = 'fr', onContinue }) {
  const insets = useScreenInsets();
  const [selected, setSelected] = useState(
    initialLanguage === 'fon' ? 'fon' : 'fr',
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.paddingTop, paddingBottom: insets.paddingBottom },
      ]}
      testID="language-screen"
    >
      <ScrollView
        contentContainerStyle={styles.choices}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <Text accessibilityRole="header" style={styles.title}>
          {COPY.languageWelcome}
        </Text>
        <Text style={styles.subtitle}>{COPY.languageTitle}</Text>
        <LanguageChoice
          label={COPY.french}
          onPress={() => setSelected('fr')}
          selected={selected === 'fr'}
          testID="choice-fr"
        />
        <LanguageChoice
          label={COPY.fon}
          onPress={() => setSelected('fon')}
          selected={selected === 'fon'}
          testID="choice-fon"
        />
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => onContinue(selected)}
        style={styles.button}
        testID="language-continue"
      >
        <Text style={styles.buttonText}>{COPY.continue}</Text>
      </Pressable>
    </View>
  );
}

function LanguageChoice({ label, selected, onPress, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected ? styles.choiceSelected : null]}
      testID={testID}
    >
      <Text
        style={[styles.choiceText, selected ? styles.choiceTextSelected : null]}
      >
        {label}
      </Text>
    </Pressable>
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
  choices: {
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
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  choiceSelected: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.text,
    fontSize: 18,
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: colors.primary,
    fontWeight: '700',
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
