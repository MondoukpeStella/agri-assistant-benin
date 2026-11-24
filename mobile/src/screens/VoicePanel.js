import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <View style={styles.stage}>
          {listening || processing ? (
            <>
              <HaloRing delay={0} />
              <HaloRing delay={500} />
              <HaloRing delay={1000} />
            </>
          ) : (
            <View style={styles.haloCalm} />
          )}
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

function HaloRing({ delay }) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.75],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 1],
    outputRange: [0.15, 0.55, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.halo, { opacity, transform: [{ scale }] }]}
      testID="mic-halo"
    />
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
  stage: {
    alignItems: 'center',
    height: 248,
    justifyContent: 'center',
    width: 248,
  },
  halo: {
    borderColor: 'rgba(8, 122, 61, 0.45)',
    borderRadius: 72,
    borderWidth: 12,
    height: 144,
    position: 'absolute',
    width: 144,
  },
  haloCalm: {
    backgroundColor: colors.mint,
    borderRadius: 84,
    height: 168,
    position: 'absolute',
    width: 168,
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
