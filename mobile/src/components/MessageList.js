import { StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import PriceCard from './PriceCard';

export default function MessageList({ messages }) {
  return (
    <View testID="message-list">
      {messages.map((message) => (
        <View
          key={message.id}
          style={styles.message}
          testID={message.historical ? 'message-historical' : 'message-current'}
        >
          {message.historical ? (
            <Text style={styles.historical}>
              {COPY.historical}
              {message.createdAt ? ` · ${message.createdAt}` : ''}
            </Text>
          ) : null}
          {message.kind === 'price' ? (
            <PriceCard
              price={message.price}
              historical={message.historical}
              createdAt={message.createdAt}
            />
          ) : (
            <Text style={styles.text}>{message.text}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginBottom: 12,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  historical: {
    color: colors.historical,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
});
