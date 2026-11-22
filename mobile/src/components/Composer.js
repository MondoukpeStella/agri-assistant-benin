import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { ArrowIcon, MicIcon } from './icons';

export default function Composer({
  language,
  draft,
  draftGeneration = 0,
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
          key={draftGeneration}
          multiline
          onChangeText={onChangeDraft}
          placeholder={COPY.draftLabel}
          placeholderTextColor={colors.muted}
          style={styles.input}
          testID="draft-input"
          value={draft}
        />
      ) : null}
      {showText ? (
        <Pressable
          accessibilityLabel={COPY.send}
          accessibilityRole="button"
          disabled={sending}
          onPress={onSend}
          style={[styles.send, sending ? styles.disabled : null]}
          testID="send-button"
        >
          <ArrowIcon />
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={COPY.voice}
        accessibilityRole="button"
        onPress={onVoice}
        style={styles.mic}
        testID="voice-button"
      >
        <MicIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    paddingTop: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  send: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  mic: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  disabled: {
    opacity: 0.5,
  },
});
