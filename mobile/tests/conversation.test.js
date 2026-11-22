import {
  applyDraftChange,
  beginListening,
  beginSend,
  canShowPrice,
  cancelVoice,
  createConversation,
  finishListening,
  submitText,
} from '../src/services/conversation';

const validPrice = {
  validated: true,
  amount: '200',
  currency: 'XOF',
  unit: 'kg',
  collectedOn: '2026-11-20',
};

describe('conversation state', () => {
  test('rejects an incomplete price', () => {
    expect(canShowPrice({ ...validPrice, unit: '' })).toBe(false);
    expect(canShowPrice({ ...validPrice, validated: false })).toBe(false);
    expect(canShowPrice(validPrice)).toBe(true);
  });

  test('ignores a second send while the first is still sending', () => {
    const started = beginSend(
      createConversation(),
      'Prix du maïs à Natitingou',
    );
    const second = beginSend(started, 'Prix du riz à Savalou');

    expect(second).toBe(started);
    expect(started.draft).toBe('');
    expect(started.pendingText).toBe('Prix du maïs à Natitingou');
  });

  test('clears the draft on send and ignores the previous field text', () => {
    const typed = { ...createConversation(), draft: 'Prix du riz à Savalou' };
    const started = beginSend(typed, typed.draft);
    const echoed = applyDraftChange(
      started,
      'Prix du riz à Savalou',
      typed.draftGeneration,
    );
    const sent = submitText(typed, typed.draft, { kind: 'unavailable' });

    expect(started.draft).toBe('');
    expect(echoed).toBe(started);
    expect(sent.draft).toBe('');
  });

  test('listens without inventing a transcription', () => {
    const listening = beginListening(createConversation());
    const cancelled = cancelVoice(listening);
    const empty = finishListening(listening, '');
    const heard = finishListening(listening, 'Prix du riz à Savalou');

    expect(listening.phase).toBe('listening');
    expect(listening.pendingTranscription).toBeNull();
    expect(cancelled.phase).toBe('idle');
    expect(empty.notice).toBe('voiceUnavailable');
    expect(empty.pendingTranscription).toBeNull();
    expect(heard.phase).toBe('transcriptionConfirm');
    expect(heard.pendingTranscription).toBe('Prix du riz à Savalou');
  });

  test('keeps the draft when the network fails and does not add a price', () => {
    const next = submitText(createConversation(), 'Prix du riz', {
      kind: 'networkError',
    });

    expect(next.phase).toBe('networkError');
    expect(next.draft).toBe('Prix du riz');
    expect(next.messages).toHaveLength(0);
  });

  test('records one user message and no amount when no price is available', () => {
    const next = submitText(createConversation(), 'Prix du maïs à Natitingou', {
      kind: 'unavailable',
    });

    expect(next.messages).toHaveLength(2);
    expect(next.messages[0].text).toBe('Prix du maïs à Natitingou');
    expect(next.messages[1].kind).toBe('text');
    expect(JSON.stringify(next)).not.toMatch(/XOF|FCFA/);
  });

  test('shows one validated price and refuses an incomplete one', () => {
    const shown = submitText(
      createConversation(),
      'Prix du maïs à Natitingou',
      {
        kind: 'price',
        price: validPrice,
      },
    );
    const hidden = submitText(createConversation(), 'Prix du riz à Savalou', {
      kind: 'price',
      price: { ...validPrice, collectedOn: '' },
    });

    expect(shown.messages[1].price.amount).toBe('200');
    expect(hidden.messages[1].kind).toBe('text');
    expect(hidden.messages[1].text).not.toMatch(/200/);
  });
});
