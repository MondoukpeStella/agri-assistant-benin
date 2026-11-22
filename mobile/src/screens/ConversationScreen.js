import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
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
  cancelVoice,
  completeSend,
  createConversation,
  failSend,
  finishListening,
} from '../services/conversation';
import { requestPriceConsultation } from '../services/conversationClient';
import { createDefaultHistoryStore } from '../storage/historyStore';
import { useScreenInsets } from '../layout/useScreenInsets';
import SettingsPanel, { LanguageSettings } from './SettingsPanel';
import VoicePanel from './VoicePanel';

async function defaultResult() {
  const result = await requestPriceConsultation();
  if (result?.type === 'not_connected') {
    return { kind: 'unavailable', persist: false };
  }
  return result?.kind ? result : { kind: 'unavailable' };
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
    let active = true;
    openStore()
      .then((store) => store.load(new Date().toISOString()))
      .then((result) => {
        if (!active) {
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
        if (active) {
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
        if (!active) {
          return;
        }
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
    setLanguage(nextLanguage);
    setPanel(null);
  }

  function closePanel() {
    setPanel((current) =>
      current === 'history' || current === 'language' ? 'settings' : null,
    );
  }

  function startVoice() {
    setState((current) => beginListening(current));
  }

  async function submit(rawText) {
    const text = String(rawText ?? state.draft ?? '').trim();
    if (!text || sendingRef.current || state.phase === 'sending') {
      return;
    }
    sendingRef.current = true;
    setState((current) => beginSend(current, text));
    try {
      const result = await Promise.resolve(resolveResult(text));
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
          onCancel={() => setState((current) => cancelVoice(current))}
          onConfirm={() => submit(state.pendingTranscription)}
          onStop={() =>
            setState((current) =>
              finishListening(
                current,
                onStageTranscription ? onStageTranscription() : '',
              ),
            )
          }
          phase={state.phase}
          transcript={state.pendingTranscription}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
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
              onListen={() =>
                setState((current) =>
                  current.notice === 'listenUnavailable'
                    ? current
                    : { ...current, notice: 'listenUnavailable' },
                )
              }
            />
            {sending ? (
              <Text style={styles.loading}>{COPY.loading}</Text>
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
            {language === 'fon' ? (
              <View style={styles.voiceStage}>
                <View style={styles.voiceHalo}>
                  <Pressable
                    accessibilityLabel={COPY.voice}
                    accessibilityRole="button"
                    onPress={startVoice}
                    style={styles.voiceMic}
                    testID="voice-button"
                  >
                    <View style={styles.voiceIcon}>
                      <MicIcon />
                    </View>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
      {panel || language !== 'fr' ? null : (
        <View style={[styles.footer, { paddingBottom: insets.paddingBottom }]}>
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
  loading: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
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
    paddingTop: 24,
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
