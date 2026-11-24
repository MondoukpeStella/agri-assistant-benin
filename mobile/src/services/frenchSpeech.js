import * as Speech from 'expo-speech';

import { COPY } from '../constants/copy';
import { canShowPrice, containsMoneyAmount } from './conversation';
import { publishedFrenchReply } from './publishedPrices';

const CLARIFY_PRODUCT = 'Précisez le produit : le maïs ou le riz.';
const UNSUPPORTED =
  'Je ne consulte pas ce produit. Je peux vous renseigner sur le maïs et le riz.';

const PRODUCT_LABEL = { maize: 'maïs', rice: 'riz' };
const MARKET_LABEL = { natitingou: 'Natitingou', savalou: 'Savalou' };

export function speechFor(result, language) {
  if (language !== 'fr' || !result) {
    return '';
  }
  if (result.kind === 'price') {
    return priceSpeech(result.price);
  }
  if (!result.speak) {
    return '';
  }
  if (result.kind === 'publishedPrice') {
    return String(result.text || '');
  }
  const text =
    result.kind === 'noValidatedData'
      ? COPY.noValidated
      : String(result.text || '');
  if (containsMoneyAmount(text)) {
    return COPY.noValidated;
  }
  return text;
}

export function answerFrenchLocally(text, priorMessages = []) {
  const current = readFrenchSlots(text);
  const carried = slotsToCarry(priorMessages);
  const outProduct = current.outProduct;
  const outMarket = current.outMarket;
  const product = outProduct ? null : current.product || carried.product;
  let market = null;
  if (current.market) {
    market = current.market;
  } else if (!outMarket) {
    market = carried.market;
  }
  if (outProduct) {
    return {
      status: 'unsupported_product',
      reply: UNSUPPORTED,
      product: null,
      market,
    };
  }
  if (outMarket && !market) {
    return {
      status: 'uncovered_market',
      reply: COPY.uncovered,
      product,
      market: null,
    };
  }
  if (!product && !market) {
    return {
      status: 'not_understood',
      reply: COPY.notUnderstood,
      product: null,
      market: null,
    };
  }
  if (!product) {
    return {
      status: 'clarification',
      reply: CLARIFY_PRODUCT,
      product: null,
      market,
    };
  }
  if (!market) {
    return {
      status: 'clarification',
      reply: COPY.clarificationFallback,
      product,
      market: null,
    };
  }
  const published = publishedFrenchReply(product, market);
  if (published) {
    return {
      status: 'published_price',
      reply: published,
      product,
      market,
    };
  }
  return {
    status: 'no_validated_price',
    reply: COPY.noValidated,
    product,
    market,
  };
}

export function speakFrench(result, language) {
  const text = speechFor(result, language);
  if (!text) {
    return;
  }
  Speech.stop();
  Speech.speak(text, { language: 'fr-FR' });
}

function readFrenchSlots(text) {
  const words = foldFrench(text).split(' ').filter(Boolean);
  const tokens = new Set(words);
  const namesOnly = words.every((word) =>
    ['mais', 'riz', 'le', 'la', 'du', 'de', 'des'].includes(word),
  );
  const outProduct = ['soja', 'soya', 'sorgho', 'mil'].some((word) =>
    tokens.has(word),
  );
  const outMarket = tokens.has('parakou') || tokens.has('cotonou');
  let product = null;
  if (tokens.has('riz') && !outProduct) {
    product = 'rice';
  } else if (
    tokens.has('mais') &&
    !tokens.has('riz') &&
    !outProduct &&
    (tokens.has('prix') || namesOnly)
  ) {
    product = 'maize';
  }
  let market = null;
  if (tokens.has('natitingou')) {
    market = 'natitingou';
  } else if (tokens.has('savalou')) {
    market = 'savalou';
  }
  return { product, market, outProduct, outMarket };
}

function slotsToCarry(priorMessages) {
  if (!Array.isArray(priorMessages) || priorMessages.length === 0) {
    return { product: null, market: null };
  }
  const last = priorMessages[priorMessages.length - 1];
  if (last?.role !== 'assistant') {
    return { product: null, market: null };
  }
  const previousQuestion = [...priorMessages]
    .reverse()
    .find((message) => message.role === 'user');
  const earlier = readFrenchSlots(previousQuestion?.text || '');
  const reply = String(last.text || '');
  if (reply.includes('Précisez le marché')) {
    return { product: earlier.product, market: null };
  }
  if (reply.includes('Précisez le produit')) {
    return { product: null, market: earlier.market };
  }
  return { product: null, market: null };
}

function foldFrench(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function priceSpeech(price) {
  if (!canShowPrice(price) || price.currency !== 'XOF') {
    return '';
  }
  const amount = price.amount.trim();
  const product = PRODUCT_LABEL[price.product];
  const market = MARKET_LABEL[price.market];
  if (!/^[1-9]\d*$/.test(amount) || !product || !market) {
    return '';
  }
  return `Le ${product} à ${market} : ${amount} XOF par ${price.unit.trim()}, collecté le ${price.collectedOn.trim()}.`;
}
