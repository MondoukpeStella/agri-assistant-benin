import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';

export default function LanguageScreen({ onSelect }) {
  return (
    <View style={styles.container} testID="language-screen">
      <Text accessibilityRole="header" style={styles.title}>
        {COPY.languageTitle}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelect('fr')}
        style={styles.choice}
        testID="choice-fr"
      >
        <Text style={styles.choiceText}>{COPY.french}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => onSelect('fon')}
        style={styles.choice}
        testID="choice-fon"
      >
        <Text style={styles.choiceText}>{COPY.fon}</Text>
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
    marginBottom: 24,
    textAlign: 'center',
  },
  choice: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  choiceText: {
    color: colors.text,
    fontSize: 20,
    textAlign: 'center',
  },
});
