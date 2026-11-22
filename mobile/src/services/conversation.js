import { COPY, SUGGESTION_MAIZE, SUGGESTION_RICE } from '../constants/copy';

let nextMessageId = 1;

export function createConversation(messages = []) {
  return {
    draft: '',
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
  return { ...state, draft };
}

export function beginSend(state, rawText) {
  const text = String(rawText ?? state.draft ?? '').trim();
  if (!text || state.phase === 'sending') {
    return state;
  }
  return {
    ...state,
    draft: '',
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
  if (state.phase !== 'transcriptionConfirm') {
    return state;
  }
  return {
    ...state,
    phase: 'idle',
    pendingTranscription: null,
  };
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
      createMessage({ role: 'assistant', kind: 'text', text }),
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
    id: `m${nextMessageId}`,
    role: 'user',
    kind: 'text',
    text: '',
    price: null,
    historical: false,
    createdAt: null,
    ...fields,
  };
}

export const SUGGESTIONS = [SUGGESTION_MAIZE, SUGGESTION_RICE];
