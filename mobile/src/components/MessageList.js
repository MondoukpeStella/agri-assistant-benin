import { StyleSheet, Text, View } from 'react-native';

import { COPY } from '../constants/copy';
import { colors } from '../constants/theme';
import PriceCard from './PriceCard';

export default function MessageList({ messages, onListen }) {
  return (
    <View testID="message-list">
      {messages.map((message) => {
        const user = message.role === 'user';
        return (
          <View
            key={message.id}
            style={[styles.message, user ? styles.messageUser : null]}
            testID={
              message.historical ? 'message-historical' : 'message-current'
            }
          >
            {message.historical ? (
              <Text style={styles.historical}>
                {COPY.historical}
                {message.createdAt ? ` · ${message.createdAt}` : ''}
              </Text>
            ) : null}
            {message.kind === 'price' ? (
              <View>
                {message.historical ? null : (
                  <Text style={styles.priceIntro}>{COPY.priceIntro}</Text>
                )}
                <PriceCard
                  historical={message.historical}
                  onListen={message.historical ? undefined : onListen}
                  price={message.price}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.bubble,
                  user ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[styles.text, user ? styles.userText : null]}>
                  {message.text}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginBottom: 12,
    maxWidth: '88%',
  },
  messageUser: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    backgroundColor: colors.assistant,
  },
  userBubble: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.surface,
  },
  priceIntro: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  historical: {
    color: colors.historical,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
});
