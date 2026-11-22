import { StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { canShowPrice } from '../services/conversation';

export default function PriceCard({
  price,
  historical = false,
  createdAt = null,
}) {
  if (!canShowPrice(price)) {
    return null;
  }

  return (
    <View
      style={[styles.card, historical ? styles.historical : null]}
      testID={historical ? 'historical-price' : 'current-price'}
    >
      <Text style={styles.badge}>
        {historical ? COPY.historical : 'Réponse actuelle'}
      </Text>
      {historical && createdAt ? (
        <Text style={styles.date}>{createdAt}</Text>
      ) : null}
      <Text style={styles.amount}>
        {price.amount} {price.currency} / {price.unit}
      </Text>
      <Text style={styles.date}>{price.collectedOn}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  historical: {
    borderColor: colors.historical,
  },
  badge: {
    color: colors.historical,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  amount: {
    color: colors.text,
    fontSize: 20,
    lineHeight: 28,
  },
  date: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
});
