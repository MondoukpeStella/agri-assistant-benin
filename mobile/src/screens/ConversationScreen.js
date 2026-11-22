import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Composer from '../components/Composer';
import MessageList from '../components/MessageList';
import SuggestionList from '../components/SuggestionList';
import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import {
  beginSend,
  cancelTranscription,
  completeSend,
  createConversation,
  failSend,
  markVoiceUnavailable,
  setDraft,
  stageTranscription,
} from '../services/conversation';
import { requestPriceConsultation } from '../services/conversationClient';

async function defaultResult() {
  const result = await requestPriceConsultation();
  if (result?.type === 'not_connected') {
    return { kind: 'unavailable' };
  }
  return result?.kind ? result : { kind: 'unavailable' };
}

export default function ConversationScreen({
  language,
  initialState,
  resolveResult = defaultResult,
  onStageTranscription,
}) {
  const [state, setState] = useState(
    () => initialState ?? createConversation(),
  );
  const sendingRef = useRef(state.phase === 'sending');
  const sending = state.phase === 'sending';

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
        return result?.kind === 'networkError'
          ? failSend(started)
          : completeSend(started, result);
      });
    } finally {
      sendingRef.current = false;
    }
  }

  function confirmTranscription() {
    submit(state.pendingTranscription);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      testID="conversation-screen"
    >
      <ScrollView
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        testID="message-scroll"
      >
        {state.messages.length === 0 ? (
          <Text style={styles.empty}>{COPY.empty}</Text>
        ) : null}
        <MessageList messages={state.messages} />
        {state.phase === 'sending' ? (
          <Text style={styles.notice}>{COPY.loading}</Text>
        ) : null}
        {state.notice === 'network' ? (
          <Text style={styles.notice}>{COPY.network}</Text>
        ) : null}
        {state.notice === 'voiceUnavailable' ? (
          <Text style={styles.notice}>{COPY.voicePending}</Text>
        ) : null}
        {state.phase === 'transcriptionConfirm' ? (
          <View testID="transcription-confirm">
            <Text style={styles.notice}>{COPY.confirmTitle}</Text>
            <Text style={styles.transcript}>{state.pendingTranscription}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={confirmTranscription}
              testID="confirm-button"
            >
              <Text style={styles.action}>{COPY.confirm}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setState((current) => cancelTranscription(current))
              }
              testID="repeat-button"
            >
              <Text style={styles.action}>{COPY.repeat}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <SuggestionList disabled={sending} onSelect={submit} />
        {state.notice === 'network' ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => submit(state.draft)}
            testID="retry-button"
          >
            <Text style={styles.action}>{COPY.retry}</Text>
          </Pressable>
        ) : null}
        <Composer
          draft={state.draft}
          language={language}
          onChangeDraft={(value) =>
            setState((current) => setDraft(current, value))
          }
          onSend={() => submit()}
          onVoice={() =>
            setState((current) =>
              onStageTranscription
                ? stageTranscription(current, onStageTranscription())
                : markVoiceUnavailable(current),
            )
          }
          sending={sending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messages: {
    paddingBottom: 12,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  notice: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  transcript: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  footer: {
    paddingBottom: 16,
  },
  action: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
});
