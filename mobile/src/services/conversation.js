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

export function containsMoneyAmount(text) {
  return /\d/.test(text) && /fcfa|xof/i.test(text);
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

export function beginTranscribing(state) {
  if (state.phase !== 'listening') {
    return state;
  }
  return {
    ...state,
    phase: 'transcribing',
    notice: null,
  };
}

export function finishListening(state, rawText) {
  if (state.phase !== 'listening' && state.phase !== 'transcribing') {
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

export function revealTranscript(state, question) {
  if (
    state.phase !== 'transcribing' &&
    state.phase !== 'transcriptionConfirm'
  ) {
    return state;
  }
  const asked = String(question ?? '').trim();
  if (!asked) {
    return state;
  }
  return {
    ...state,
    draft: '',
    pendingText: null,
    pendingTranscription: null,
    phase: 'answering',
    notice: null,
    messages: [
      ...state.messages,
      createMessage({ role: 'user', kind: 'text', text: asked }),
    ],
  };
}

export function completeVoiceQuestion(state, question, result) {
  if (
    state.phase !== 'transcribing' &&
    state.phase !== 'transcriptionConfirm' &&
    state.phase !== 'answering'
  ) {
    return state;
  }
  const asked = String(question ?? '').trim();
  const last = state.messages[state.messages.length - 1];
  const alreadyShown =
    Boolean(asked) && last?.role === 'user' && last.text === asked;
  const base = {
    ...state,
    draft: '',
    pendingText: null,
    pendingTranscription: null,
    messages:
      asked && !alreadyShown
        ? [
            ...state.messages,
            createMessage({ role: 'user', kind: 'text', text: asked }),
          ]
        : state.messages,
  };
  return applyResult(base, result);
}

function applyResult(state, result) {
  const kind = result?.kind ?? 'unavailable';
  const observations = publishedObservationsOf(result);
  if (kind === 'publishedPrice' && observations.length > 0) {
    return {
      ...state,
      phase: 'publishedPrice',
      notice: null,
      messages: [
        ...state.messages,
        createMessage({
          role: 'assistant',
          kind: 'publishedPrice',
          text: COPY.notCurrentPrice,
          observations,
        }),
      ],
    };
  }
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

function publishedObservationsOf(result) {
  if (!Array.isArray(result?.observations)) {
    return [];
  }
  return result.observations.filter(
    (row) =>
      row &&
      typeof row.label === 'string' &&
      row.label.trim() !== '' &&
      typeof row.market === 'string' &&
      row.market.trim() !== '' &&
      typeof row.amount === 'string' &&
      row.amount.trim() !== '' &&
      typeof row.currency === 'string' &&
      row.currency.trim() !== '' &&
      typeof row.unit === 'string' &&
      row.unit.trim() !== '' &&
      typeof row.collectedOn === 'string' &&
      row.collectedOn.trim() !== '',
  );
}

function messageFor(kind, result) {
  const supplied = result?.text?.trim() || '';
  if (kind === 'publishedPrice') {
    return supplied;
  }
  if (containsMoneyAmount(supplied)) {
    return COPY.noValidated;
  }
  if (kind === 'clarification') {
    return supplied || COPY.clarificationFallback;
  }
  if (kind === 'marketUncovered') {
    return supplied || COPY.uncovered;
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
