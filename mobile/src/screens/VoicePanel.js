import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MicIcon } from '../components/icons';
import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { useScreenInsets } from '../layout/useScreenInsets';

export default function VoicePanel({
  phase,
  transcript,
  onStop,
  onCancel,
  onConfirm,
}) {
  const insets = useScreenInsets();
  const listening = phase === 'listening';
  const processing = phase === 'transcribing';
  const title = listening
    ? COPY.voiceListening
    : processing
      ? COPY.voiceProcessing
      : COPY.confirmTitle;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.paddingTop, paddingBottom: insets.paddingBottom },
      ]}
      testID={
        listening
          ? 'voice-listening'
          : processing
            ? 'voice-processing'
            : 'transcription-confirm'
      }
    >
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.center}>
        <View
          style={[
            styles.halo,
            listening ? styles.haloListening : styles.haloCalm,
          ]}
        >
          {listening ? (
            <Pressable
              accessibilityLabel={COPY.voiceStop}
              accessibilityRole="button"
              onPress={onStop}
              style={styles.mic}
              testID="voice-stop"
            >
              <View style={styles.micIcon}>
                <MicIcon />
              </View>
            </Pressable>
          ) : (
            <View style={styles.mic}>
              <View style={styles.micIcon}>
                <MicIcon />
              </View>
            </View>
          )}
        </View>
        {listening ? <Text style={styles.hint}>{COPY.voiceStop}</Text> : null}
        {processing ? (
          <Text style={styles.hint}>{COPY.voiceProcessingHint}</Text>
        ) : null}
        {phase === 'transcriptionConfirm' ? (
          <View style={styles.heard}>
            <Text style={styles.hint}>{COPY.confirmHeard}</Text>
            <Text style={styles.quote}>« {transcript} »</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={styles.confirm}
              testID="confirm-button"
            >
              <Text style={styles.confirmText}>{COPY.confirm}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onCancel}
        style={styles.cancel}
        testID={
          phase === 'transcriptionConfirm' ? 'repeat-button' : 'voice-cancel'
        }
      >
        <Text style={styles.cancelText}>{COPY.repeat}</Text>
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
  },
  halo: {
    alignItems: 'center',
    borderRadius: 84,
    height: 168,
    justifyContent: 'center',
    width: 168,
  },
  haloListening: {
    backgroundColor: colors.error,
  },
  haloCalm: {
    backgroundColor: colors.mint,
  },
  mic: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 56,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  micIcon: {
    transform: [{ scale: 2.4 }],
  },
  hint: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 16,
    textAlign: 'center',
  },
  heard: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  quote: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  confirm: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginTop: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmText: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  cancel: {
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
