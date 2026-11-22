import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { SUGGESTIONS } from '../services/conversation';

export default function SuggestionList({
  onSelect,
  disabled = false,
  sentTexts = [],
}) {
  const visible = SUGGESTIONS.filter(
    (suggestion) => !sentTexts.includes(suggestion),
  );
  if (visible.length === 0) {
    return null;
  }

  return (
    <View testID="suggestions">
      {visible.map((suggestion) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    color: colors.primary,
    fontSize: 16,
    lineHeight: 22,
  },
});
