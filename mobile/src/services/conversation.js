import { COPY, SUGGESTION_MAIZE, SUGGESTION_RICE } from '../constants/copy';

let nextMessageId = 1;

export function createConversation(messages = []) {
  return {
    draft: '',
    draftGeneration: 0,
    pendingText: null,
    pendingTranscription: null,
    phase: 'idle',
    notice: null,
    messages,
  };
}

export function canShowPrice(price) {
  if (!price || price.validated !== true) {
    return false;
  }
  if (typeof price.amount !== 'string' || price.amount.trim() === '') {
    return false;
  }
  return Boolean(price.currency && price.unit && price.collectedOn);
}

export function setDraft(state, draft) {
  if (state.phase === 'sending') {
    return state;
  }
  return { ...state, draft };
}

export function applyDraftChange(state, draft, generation) {
  if (generation !== state.draftGeneration) {
    return state;
  }
  return setDraft(state, draft);
}

export function beginSend(state, rawText) {
  const text = String(rawText ?? state.draft ?? '').trim();
  if (!text || state.phase === 'sending') {
    return state;
  }
  return {
    ...state,
    draft: '',
    draftGeneration: (state.draftGeneration ?? 0) + 1,
    pendingText: text,
    pendingTranscription: null,
    phase: 'sending',
    notice: null,
  };
}

export function failSend(state) {
  if (state.phase !== 'sending') {
    return state;
  }
  return {
    ...state,
    phase: 'networkError',
    draft: state.pendingText ?? '',
    pendingText: null,
    notice: 'network',
  };
}

export function completeSend(state, result) {
  if (state.phase !== 'sending' || !state.pendingText) {
    return state;
  }
  const withUser = {
    ...state,
    draft: '',
    pendingText: null,
    messages: [
      ...state.messages,
      createMessage({ role: 'user', kind: 'text', text: state.pendingText }),
    ],
  };
  return applyResult(withUser, result);
}

export function submitText(state, rawText, result) {
  const started = beginSend(state, rawText);
  if (started === state) {
    return state;
  }
  if (result?.kind === 'networkError') {
    return failSend(started);
  }
  return completeSend(started, result ?? { kind: 'unavailable' });
}

export function markVoiceUnavailable(state) {
  return {
    ...state,
    notice: 'voiceUnavailable',
    phase: state.phase === 'sending' ? state.phase : 'idle',
  };
}

const voicePhases = ['listening', 'transcribing', 'transcriptionConfirm'];

export function beginListening(state) {
  if (state.phase === 'sending' || voicePhases.includes(state.phase)) {
    return state;
  }
  return {
    ...state,
    phase: 'listening',
    notice: null,
    pendingTranscription: null,
  };
}

export function finishListening(state, rawText) {
  if (state.phase !== 'listening') {
    return state;
  }
  const text = String(rawText ?? '').trim();
  if (!text) {
    return {
      ...state,
      phase: 'idle',
      notice: 'voiceUnavailable',
      pendingTranscription: null,
    };
  }
  return {
    ...state,
    phase: 'transcriptionConfirm',
    pendingTranscription: text,
    notice: null,
  };
}

export function cancelVoice(state) {
  if (!voicePhases.includes(state.phase)) {
    return state;
  }
  return {
    ...state,
    phase: 'idle',
    pendingTranscription: null,
    notice: null,
  };
}

export function stageTranscription(state, rawText) {
  const text = String(rawText ?? '').trim();
  if (!text || state.phase === 'sending') {
    return state;
  }
  return {
    ...state,
    phase: 'transcriptionConfirm',
    pendingTranscription: text,
    notice: null,
  };
}

export function cancelTranscription(state) {
  return cancelVoice(state);
}

function applyResult(state, result) {
  const kind = result?.kind ?? 'unavailable';
  if (kind === 'price' && canShowPrice(result.price)) {
    return {
      ...state,
      phase: 'price',
      notice: null,
      messages: [
        ...state.messages,
        createMessage({
          role: 'assistant',
          kind: 'price',
          responseStatus: 'price',
          price: { ...result.price, historical: false },
          historical: false,
        }),
      ],
    };
  }

  const text = messageFor(kind, result);
  const phase = kind === 'price' ? 'noValidatedData' : kind;
  return {
    ...state,
    phase,
    notice: phase,
    messages: [
      ...state.messages,
      createMessage({
        role: 'assistant',
        kind: 'text',
        text,
        responseStatus: kind,
      }),
    ],
  };
}

function messageFor(kind, result) {
  if (kind === 'clarification') {
    return result.text?.trim() || COPY.clarificationFallback;
  }
  if (kind === 'marketUncovered') {
    return result.text?.trim() || COPY.uncovered;
  }
  if (kind === 'noValidatedData' || kind === 'price') {
    return COPY.noValidated;
  }
  return COPY.unavailable;
}

function createMessage(fields) {
  nextMessageId += 1;
  return {
    id: `m${nextMessageId}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    role: 'user',
    kind: 'text',
    text: '',
    price: null,
    historical: false,
    createdAt: null,
    responseStatus: 'question',
    ...fields,
  };
}

export const SUGGESTIONS = [SUGGESTION_MAIZE, SUGGESTION_RICE];
