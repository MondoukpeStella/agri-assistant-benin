import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';

export default function SettingsPanel({ onOpenHistory, onOpenLanguage }) {
  return (
    <View testID="settings-screen">
      <SettingsRow
        label={COPY.settingsHistory}
        onPress={onOpenHistory}
        testID="open-history"
      />
      <SettingsRow
        label={COPY.settingsLanguageAction}
        onPress={onOpenLanguage}
        testID="open-language"
      />
    </View>
  );
}

export function LanguageSettings({ language, onSave }) {
  const [selected, setSelected] = useState(language === 'fon' ? 'fon' : 'fr');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(selected);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View testID="language-settings">
      <Text accessibilityRole="header" style={styles.welcome}>
        {COPY.languageWelcome}
      </Text>
      <Text style={styles.subtitle}>{COPY.languageTitle}</Text>
      <LanguageChoice
        label={COPY.french}
        onPress={() => setSelected('fr')}
        selected={selected === 'fr'}
        testID="settings-fr"
      />
      <LanguageChoice
        label={COPY.fon}
        onPress={() => setSelected('fon')}
        selected={selected === 'fon'}
        testID="settings-fon"
      />
      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={save}
        style={styles.button}
        testID="settings-save"
      >
        <Text style={styles.buttonText}>{COPY.continue}</Text>
      </Pressable>
    </View>
  );
}

function SettingsRow({ label, onPress, testID }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.row}
      testID={testID}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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
  row: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  rowLabel: {
    color: colors.primary,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  chevron: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
  },
  welcome: {
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
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 56,
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
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 52,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
});
