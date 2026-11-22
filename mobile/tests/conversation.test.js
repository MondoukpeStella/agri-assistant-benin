import {
  beginSend,
  canShowPrice,
  createConversation,
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
    expect(started.pendingText).toBe('Prix du maïs à Natitingou');
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
