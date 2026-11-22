import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { SUGGESTIONS } from '../services/conversation';
import { colors } from '../constants/theme';

export default function SuggestionList({ onSelect, disabled = false }) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
      testID="suggestions"
    >
      {SUGGESTIONS.map((suggestion) => (
        <Pressable
          key={suggestion}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => onSelect(suggestion)}
          style={styles.chip}
          testID={
            suggestion.includes('riz') ? 'suggestion-rice' : 'suggestion-maize'
          }
        >
          <Text style={styles.label}>{suggestion}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
});
