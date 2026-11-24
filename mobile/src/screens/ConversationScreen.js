import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Composer from '../components/Composer';
import { GearIcon, MicIcon } from '../components/icons';
import MessageList from '../components/MessageList';
import SuggestionList from '../components/SuggestionList';
import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import {
  applyDraftChange,
  beginListening,
  beginSend,
  beginTranscribing,
  cancelVoice,
  completeSend,
  completeVoiceQuestion,
  createConversation,
  revealTranscript,
  failSend,
  finishListening,
} from '../services/conversation';
import {
  requestFrenchAnswer,
  requestPriceConsultation,
} from '../services/conversationClient';
import {
  startFrenchRecording,
  stopFrenchRecording,
} from '../services/frenchRecorder';
import {
  answerFrenchLocally,
  speakFrench,
  speechFor,
} from '../services/frenchSpeech';
import { publishedObservations } from '../services/publishedPrices';
import { createDefaultHistoryStore } from '../storage/historyStore';
import { useScreenInsets } from '../layout/useScreenInsets';
import SettingsPanel, { LanguageSettings } from './SettingsPanel';
import VoicePanel from './VoicePanel';

async function defaultResult(text, language, priorMessages = []) {
  if (language === 'fr') {
    const local = answerFrenchLocally(text, priorMessages);
    if (local?.status === 'published_price') {
      return mapFrenchVoice(local);
    }
    const voice = (await requestFrenchAnswer(text)) || local;
    if (voice) {
      return mapFrenchVoice(voice);
    }
  }
  const result = await requestPriceConsultation();
  if (result?.type === 'not_connected') {
    return { kind: 'unavailable', persist: false };
  }
  return result?.kind ? result : { kind: 'unavailable' };
}

const VOICE_WAIT_MS = 700;
const SEARCH_WAIT_MS = 1400;
const KEYBOARD_EXTRA = 48;

function waitAtLeast(startedAt, minimum) {
  const remaining = minimum - (Date.now() - startedAt);
  if (remaining <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, remaining);
  });
}

function FonStage({ onStartVoice }) {
  const player = useAudioPlayer(require('../../assets/fon/instructions.mp4'));

  useEffect(() => {
    let active = true;
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    })
      .then(() => {
        if (active) {
          player.play();
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      player.pause();
    };
  }, [player]);

  return (
    <View style={styles.voiceStage}>
      <Text accessibilityRole="header" style={styles.fonTitle}>
        {COPY.fonGuideTitle}
      </Text>
      <Text style={styles.fonGuide}>{COPY.fonGuideStep1}</Text>
      <Text style={styles.fonGuide}>{COPY.fonGuideStep2}</Text>
      <Text style={styles.fonGuide}>{COPY.fonGuideStep3}</Text>
      <Text style={styles.fonLimit}>{COPY.fonGuideLimit}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void player.seekTo(0).then(() => {
            player.play();
          });
        }}
        style={styles.fonListen}
        testID="fon-intro-button"
      >
        <Text style={styles.fonListenText}>{COPY.fonListen}</Text>
      </Pressable>
      <View style={styles.voiceHalo}>
        <Pressable
          accessibilityLabel={COPY.voice}
          accessibilityRole="button"
          onPress={() => {
            player.pause();
            onStartVoice();
          }}
          style={styles.voiceMic}
          testID="voice-button"
        >
          <View style={styles.voiceIcon}>
            <MicIcon />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function mapFrenchVoice(voice) {
  if (voice.status === 'published_price') {
    return {
      kind: 'publishedPrice',
      text: voice.reply,
      observations: publishedObservations(voice.product, voice.market),
      speak: true,
    };
  }
  if (voice.status === 'no_validated_price') {
    return { kind: 'noValidatedData', speak: true };
  }
  if (voice.status === 'uncovered_market') {
    return { kind: 'marketUncovered', text: voice.reply, speak: true };
  }
  if (
    voice.status === 'clarification' ||
    voice.status === 'unsupported_product' ||
    voice.status === 'not_understood' ||
    voice.status === 'recognition_unavailable'
  ) {
    return { kind: 'clarification', text: voice.reply, speak: true };
  }
  return { kind: 'unavailable' };
}

export default function ConversationScreen({
  language: languageProp,
  initialState,
  resolveResult = defaultResult,
  onStageTranscription,
  onChangeLanguage,
  historyStore = null,
}) {
  const [state, setState] = useState(
    () => initialState ?? createConversation(),
  );
  const [language, setLanguage] = useState(languageProp);
  const [historyProblem, setHistoryProblem] = useState(null);
  const insets = useScreenInsets();
  const [panel, setPanel] = useState(null);
  const sendingRef = useRef(state.phase === 'sending');
  const recordingAttempt = useRef(0);
  const historyGeneration = useRef(0);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const storePromiseRef = useRef(null);
  const openStore = useCallback(() => {
    if (!storePromiseRef.current) {
      storePromiseRef.current = Promise.resolve(
        historyStore ?? createDefaultHistoryStore(),
      );
    }
    return storePromiseRef.current;
  }, [historyStore]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const generation = historyGeneration.current;
    openStore()
      .then((store) => store.load(new Date().toISOString()))
      .then((result) => {
        if (!active || generation !== historyGeneration.current) {
          return;
        }
        if (!result?.ok) {
          setHistoryProblem('unavailable');
          return;
        }
        if (result.messages.length === 0) {
          return;
        }
        setState((current) => ({
          ...current,
          messages: mergeHistory(result.messages, current.messages),
        }));
      })
      .catch(() => {
        if (active && generation === historyGeneration.current) {
          setHistoryProblem('unavailable');
        }
      });
    return () => {
      active = false;
    };
  }, [openStore]);

  useEffect(() => {
    const turn = state.pendingSave;
    if (!turn) {
      return undefined;
    }
    let active = true;
    openStore()
      .then((store) => store.save(turn, new Date().toISOString()))
      .then((outcome) => {
        if (!active || outcome?.ok) {
          return;
        }
        setHistoryProblem(
          outcome.reason === 'full' || outcome.reason === 'write'
            ? 'full'
            : 'unavailable',
        );
      })
      .catch(() => {
        if (active) {
          setHistoryProblem('full');
        }
      });
    return () => {
      active = false;
    };
  }, [openStore, state.pendingSave]);
  const sending = state.phase === 'sending';
  const answering = state.phase === 'answering';
  const voiceOpen =
    state.phase === 'listening' ||
    state.phase === 'transcribing' ||
    state.phase === 'transcriptionConfirm';

  async function saveLanguage(nextLanguage) {
    if (onChangeLanguage) {
      const saved = await onChangeLanguage(nextLanguage);
      if (saved === false) {
        return;
      }
    }
    if (nextLanguage !== language) {
      historyGeneration.current += 1;
      recordingAttempt.current += 1;
      void recorder.stop().catch(() => {});
      setState(createConversation());
      void openStore()
        .then((store) => (store.clear ? store.clear() : { ok: true }))
        .then((outcome) => {
          if (!outcome?.ok) {
            setHistoryProblem('unavailable');
          }
        })
        .catch(() => {
          setHistoryProblem('unavailable');
        });
    }
    setLanguage(nextLanguage);
    setPanel(null);
  }

  function closePanel() {
    setPanel((current) =>
      current === 'history' || current === 'language' ? 'settings' : null,
    );
  }

  function startVoice() {
    const attempt = recordingAttempt.current + 1;
    recordingAttempt.current = attempt;
    setState((current) => beginListening(current));
    if (language !== 'fr' || onStageTranscription) {
      return;
    }
    void startFrenchRecording(recorder).then((started) => {
      if (started && recordingAttempt.current !== attempt) {
        void recorder.stop().catch(() => {});
      }
    });
  }

  async function stopVoice() {
    const attempt = recordingAttempt.current + 1;
    recordingAttempt.current = attempt;
    const startedAt = Date.now();
    setState((current) => beginTranscribing(current));
    let text = '';
    if (onStageTranscription) {
      text = onStageTranscription();
    } else if (language === 'fr') {
      text = await stopFrenchRecording(recorder);
    }
    await waitAtLeast(startedAt, VOICE_WAIT_MS);
    if (recordingAttempt.current !== attempt) {
      return;
    }
    if (onStageTranscription || language !== 'fr') {
      setState((current) => finishListening(current, text));
      return;
    }
    const heard = String(text || '').trim();
    if (heard) {
      setState((current) => revealTranscript(current, heard));
      await waitAtLeast(Date.now(), SEARCH_WAIT_MS);
    }
    if (recordingAttempt.current !== attempt) {
      return;
    }
    const result = heard
      ? await Promise.resolve(resolveResult(heard, language, state.messages))
      : mapFrenchVoice({
          status: 'not_understood',
          reply: COPY.notUnderstood,
        });
    if (recordingAttempt.current !== attempt) {
      return;
    }
    setState((current) =>
      completeVoiceQuestion(current, heard, result ?? { kind: 'unavailable' }),
    );
    if (result?.kind !== 'networkError') {
      speakFrench(result, language);
    }
  }

  async function submit(rawText, { speak = false } = {}) {
    const text = String(rawText ?? state.draft ?? '').trim();
    if (!text || sendingRef.current || state.phase === 'sending') {
      return;
    }
    sendingRef.current = true;
    const startedAt = Date.now();
    setState((current) => beginSend(current, text));
    try {
      const result = await Promise.resolve(
        resolveResult(text, language, state.messages),
      );
      await waitAtLeast(startedAt, SEARCH_WAIT_MS);
      setState((current) => {
        const started =
          current.phase === 'sending' ? current : beginSend(current, text);
        if (started.phase !== 'sending') {
          return current;
        }
        if (result?.kind === 'networkError') {
          return failSend(started);
        }
        const next = completeSend(started, result);
        if (result?.persist === false) {
          return next;
        }
        const known = new Set(started.messages.map((message) => message.id));
        const added = next.messages.filter(
          (message) => !message.historical && !known.has(message.id),
        );
        if (added.length === 0) {
          return next;
        }
        return {
          ...next,
          pendingSave: { language, messages: added },
        };
      });
      if (speak && result?.kind !== 'networkError') {
        speakFrench(result, language);
      }
    } finally {
      sendingRef.current = false;
    }
  }

  const sentTexts = state.messages
    .filter((message) => message.role === 'user')
    .map((message) => message.text);
  if (sending && state.pendingText) {
    sentTexts.push(state.pendingText);
  }
  const visibleMessages =
    sending && state.pendingText
      ? [
          ...state.messages,
          {
            id: 'pending',
            role: 'user',
            kind: 'text',
            text: state.pendingText,
            historical: false,
          },
        ]
      : state.messages;
  const historicalMessages = state.messages.filter(
    (message) => message.historical,
  );

  if (voiceOpen) {
    return (
      <View style={styles.container} testID="conversation-screen">
        <StatusBar style="dark" />
        <VoicePanel
          onCancel={() => {
            recordingAttempt.current += 1;
            void recorder.stop().catch(() => {});
            setState((current) => cancelVoice(current));
          }}
          onConfirm={() => submit(state.pendingTranscription, { speak: true })}
          onStop={() => {
            void stopVoice();
          }}
          phase={state.phase}
          transcript={state.pendingTranscription}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.container,
        keyboardHeight
          ? {
              paddingBottom:
                (Platform.OS === 'android' ? keyboardHeight : 0) +
                KEYBOARD_EXTRA,
            }
          : null,
      ]}
      testID="conversation-screen"
    >
      <StatusBar style="light" />
      <View style={[styles.header, { paddingTop: insets.paddingTop }]}>
        <View style={styles.brand}>
          <Image
            accessible={false}
            resizeMode="contain"
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
          />
          <Text numberOfLines={1} style={styles.headerTitle}>
            {panel === 'history'
              ? COPY.historyTitle
              : panel === 'language'
                ? COPY.settingsLanguage
                : panel === 'settings'
                  ? COPY.settingsTitle
                  : COPY.appName}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={panel ? COPY.historyClose : COPY.settings}
          accessibilityRole="button"
          onPress={() => (panel ? closePanel() : setPanel('settings'))}
          style={panel ? styles.historyButton : styles.gearButton}
          testID="settings-button"
        >
          {panel ? (
            <Text style={styles.historyText}>{COPY.historyClose}</Text>
          ) : (
            <GearIcon />
          )}
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.messages,
          panel || language === 'fon'
            ? { paddingBottom: insets.paddingBottom }
            : null,
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={styles.scroll}
        testID="message-scroll"
      >
        {panel === 'settings' ? (
          <SettingsPanel
            onOpenHistory={() => setPanel('history')}
            onOpenLanguage={() => setPanel('language')}
          />
        ) : panel === 'language' ? (
          <LanguageSettings language={language} onSave={saveLanguage} />
        ) : panel === 'history' ? (
          <View testID="history-screen">
            {historyProblem === 'unavailable' ? (
              <Text style={styles.greeting}>{COPY.historyUnavailable}</Text>
            ) : historicalMessages.some((message) => message.text) ? (
              historicalMessages
                .filter((message) => message.text)
                .map((message) => (
                  <View key={message.id} style={styles.historyItem}>
                    <Text style={styles.historyItemText}>{message.text}</Text>
                    {message.createdAt ? (
                      <Text style={styles.historyNote}>
                        {COPY.historical} · {message.createdAt}
                      </Text>
                    ) : null}
                  </View>
                ))
            ) : (
              <Text style={styles.greeting}>{COPY.historyEmpty}</Text>
            )}
            {historyProblem === 'full' ? (
              <Text style={styles.historyNote}>{COPY.historyStorageFull}</Text>
            ) : null}
            <Text style={styles.historyNote}>{COPY.historyNote}</Text>
          </View>
        ) : (
          <>
            {language === 'fr' ? (
              <>
                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantText}>{COPY.greeting}</Text>
                </View>
                <SuggestionList
                  disabled={sending}
                  onSelect={submit}
                  sentTexts={sentTexts}
                />
              </>
            ) : null}
            <MessageList
              messages={visibleMessages}
              onListen={() => {
                const currentPrice = [...visibleMessages]
                  .reverse()
                  .find(
                    (message) =>
                      message.kind === 'price' && !message.historical,
                  );
                const spoken = speechFor(
                  { kind: 'price', price: currentPrice?.price, speak: true },
                  language,
                );
                if (!spoken) {
                  setState((current) =>
                    current.notice === 'listenUnavailable'
                      ? current
                      : { ...current, notice: 'listenUnavailable' },
                  );
                  return;
                }
                speakFrench(
                  { kind: 'price', price: currentPrice.price, speak: true },
                  language,
                );
              }}
            />
            {sending || answering ? (
              <View style={styles.assistantBubble} testID="price-search">
                <Text style={styles.assistantText}>{COPY.loading}</Text>
              </View>
            ) : null}
            {state.notice === 'network' ? (
              <Text style={styles.error}>{COPY.network}</Text>
            ) : null}
            {visibleMessages.some(
              (message) => message.text === COPY.uncovered,
            ) ? (
              <View style={styles.marketRow}>
                {[COPY.marketNatitingou, COPY.marketSavalou].map((market) => (
                  <Pressable
                    accessibilityRole="button"
                    key={market}
                    onPress={() =>
                      setState((current) =>
                        applyDraftChange(
                          current,
                          market,
                          current.draftGeneration,
                        ),
                      )
                    }
                    style={styles.marketChip}
                    testID={
                      market === COPY.marketSavalou
                        ? 'market-savalou'
                        : 'market-natitingou'
                    }
                  >
                    <Text style={styles.marketChipText}>{market}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {language === 'fr' && state.notice === 'network' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => submit(state.draft)}
                testID="retry-button"
              >
                <Text style={styles.retry}>{COPY.retry}</Text>
              </Pressable>
            ) : null}
            {language === 'fon' ? <FonStage onStartVoice={startVoice} /> : null}
          </>
        )}
      </ScrollView>
      {panel || language !== 'fr' ? null : (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: keyboardHeight > 0 ? 20 : insets.paddingBottom,
            },
          ]}
        >
          <Composer
            draft={state.draft}
            draftGeneration={state.draftGeneration}
            language={language}
            onChangeDraft={(value) => {
              const generation = state.draftGeneration;
              setState((current) =>
                applyDraftChange(current, value, generation),
              );
            }}
            onSend={() => submit()}
            onVoice={startVoice}
            sending={sending}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function mergeHistory(loaded, current) {
  const currentIds = new Set(current.map((message) => message.id));
  return [
    ...loaded.filter((message) => !currentIds.has(message.id)),
    ...current,
  ];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
  },
  brand: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  headerLogo: {
    height: 22,
    width: 22,
  },
  headerTitle: {
    color: colors.surface,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  gearButton: {
    alignItems: 'center',
    borderColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  historyButton: {
    borderColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  historyText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  messages: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.assistant,
    borderRadius: 18,
    marginBottom: 12,
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  greeting: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
  },
  error: {
    backgroundColor: colors.error,
    borderRadius: 16,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retry: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    color: colors.surface,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    overflow: 'hidden',
    paddingVertical: 14,
    textAlign: 'center',
  },
  marketRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  marketChip: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  marketChipText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  historyItem: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  historyItemText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  voiceStage: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 12,
  },
  fonTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  fonGuide: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  fonLimit: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 16,
    textAlign: 'center',
  },
  fonListen: {
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fonListenText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  voiceHalo: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 84,
    height: 168,
    justifyContent: 'center',
    width: 168,
  },
  voiceMic: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 56,
    height: 112,
    justifyContent: 'center',
    width: 112,
  },
  voiceIcon: {
    transform: [{ scale: 2.4 }],
  },
  historyNote: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
