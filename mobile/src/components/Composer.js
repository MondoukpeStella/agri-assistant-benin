import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';

export default function Composer({
  language,
  draft,
  sending,
  onChangeDraft,
  onSend,
  onVoice,
}) {
  const showText = language === 'fr';

  return (
    <View style={styles.row} testID="composer">
      {showText ? (
        <TextInput
          accessibilityLabel={COPY.draftLabel}
          editable={!sending}
          multiline
          onChangeText={onChangeDraft}
          placeholder={COPY.draftLabel}
          style={styles.input}
          testID="draft-input"
          value={draft}
        />
      ) : null}
      {showText ? (
        <Pressable
          accessibilityRole="button"
          disabled={sending}
          onPress={onSend}
          style={styles.button}
          testID="send-button"
        >
          <Text style={styles.buttonText}>{COPY.send}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={COPY.voice}
        onPress={onVoice}
        style={styles.button}
        testID="voice-button"
      >
        <Text style={styles.buttonText}>{COPY.voice}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
