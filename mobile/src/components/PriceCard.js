import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import { canShowPrice } from '../services/conversation';
import { SpeakerIcon } from './icons';

export default function PriceCard({ price, historical = false, onListen }) {
  if (!canShowPrice(price)) {
    return null;
  }

  const product = typeof price.product === 'string' ? price.product.trim() : '';
  const market = typeof price.market === 'string' ? price.market.trim() : '';
  const subject = product && market ? `${product} · ${market}` : '';

  return (
    <View
      style={[styles.card, historical ? styles.historical : null]}
      testID={historical ? 'historical-price' : 'current-price'}
    >
      {subject ? <Text style={styles.subject}>{subject}</Text> : null}
      <Text style={styles.amountLine}>
        <Text
          style={[styles.amount, historical ? styles.amountHistorical : null]}
        >
          {price.amount}
        </Text>
        <Text style={styles.unit}>
          {' '}
          {price.currency}/{price.unit}
        </Text>
      </Text>
      <Text style={styles.date}>
        {COPY.collectedOn} {price.collectedOn}
      </Text>
      {!historical && onListen ? (
        <Pressable
          accessibilityRole="button"
          onPress={onListen}
          style={styles.listen}
          testID="listen-button"
        >
          <SpeakerIcon />
          <Text style={styles.listenText}>{COPY.listen}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    padding: 16,
  },
  historical: {
    backgroundColor: colors.alert,
    borderColor: colors.alert,
  },
  subject: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  amountLine: {
    marginTop: 4,
  },
  amount: {
    color: colors.primary,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
  unit: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  amountHistorical: {
    color: colors.historical,
  },
  date: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  listen: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: colors.primary,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listenText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
