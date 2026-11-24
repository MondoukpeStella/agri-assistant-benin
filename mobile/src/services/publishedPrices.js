const PRODUCT_LABEL = { maize: 'maïs', rice: 'riz' };
const MARKET_LABEL = { natitingou: 'Natitingou', savalou: 'Savalou' };
const COMMODITY_LABEL = {
  Maize: 'Maïs',
  'Maize (white)': 'Maïs blanc',
  'Maize (yellow)': 'Maïs jaune',
  'Rice (imported)': 'Riz importé',
  'Rice (local)': 'Riz local',
  'Rice (Broken, local)': 'Riz brisé local',
  'Rice (milled, local)': 'Riz usiné local',
  'Rice (paddy)': 'Riz paddy',
};

const PUBLISHED = [
  ['maize', 'natitingou', 'Maize (white)', '165', '2026-10-15'],
  ['maize', 'natitingou', 'Maize (yellow)', '176.5', '2026-10-15'],
  ['rice', 'natitingou', 'Rice (Broken, local)', '532', '2026-10-15'],
  ['rice', 'natitingou', 'Rice (imported)', '638', '2026-10-15'],
  ['rice', 'natitingou', 'Rice (local)', '370', '2026-10-15'],
  ['rice', 'natitingou', 'Rice (milled, local)', '374.25', '2026-10-15'],
  ['rice', 'natitingou', 'Rice (paddy)', '300', '2026-10-15'],
  ['maize', 'savalou', 'Maize (white)', '164', '2026-10-15'],
  ['maize', 'savalou', 'Maize (yellow)', '123', '2026-10-15'],
  ['rice', 'savalou', 'Rice (Broken, local)', '505.5', '2026-10-15'],
  ['rice', 'savalou', 'Rice (imported)', '718.25', '2026-10-15'],
  ['rice', 'savalou', 'Rice (local)', '452.5', '2026-10-15'],
  ['rice', 'savalou', 'Rice (milled, local)', '624.75', '2026-10-15'],
  ['rice', 'savalou', 'Rice (paddy)', '163.75', '2026-10-15'],
].map(([product, market, commodity, amount, collectedOn]) => ({
  product,
  market,
  commodity,
  amount,
  collectedOn,
  currency: 'XOF',
  unit: 'KG',
}));

export function publishedObservations(product, market) {
  const rows = PUBLISHED.filter(
    (row) => row.product === product && row.market === market,
  );
  if (rows.length === 0) {
    return [];
  }
  const newest = rows.reduce(
    (latest, row) => (row.collectedOn > latest ? row.collectedOn : latest),
    rows[0].collectedOn,
  );
  return rows
    .filter((row) => row.collectedOn === newest)
    .sort((left, right) => left.commodity.localeCompare(right.commodity))
    .map((row) => ({
      label: COMMODITY_LABEL[row.commodity] || row.commodity,
      market: MARKET_LABEL[row.market] || row.market,
      amount: row.amount,
      currency: row.currency,
      unit: row.unit,
      collectedOn: row.collectedOn,
    }));
}

export function publishedFrenchReply(product, market) {
  const rows = publishedObservations(product, market);
  if (rows.length === 0) {
    return '';
  }
  const lines = rows.map(
    (row) => `${row.label} : ${row.amount} ${row.currency}/${row.unit}.`,
  );
  return [
    `Prix publié par le PAM pour le ${PRODUCT_LABEL[product]} à ${rows[0].market}, collecté le ${rows[0].collectedOn}. Ce n'est pas le prix du jour.`,
    ...lines,
  ].join('\n');
}
