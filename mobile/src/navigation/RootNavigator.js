import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';
import ConversationScreen from '../screens/ConversationScreen';
import IntroScreen from '../screens/IntroScreen';
import LanguageScreen from '../screens/LanguageScreen';
import { readLanguage, saveLanguage } from '../storage/languageStorage';

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState(null);
  const [step, setStep] = useState('language');

  useEffect(() => {
    let active = true;
    readLanguage().then((stored) => {
      if (!active) {
        return;
      }
      if (stored) {
        setLanguage(stored);
        setStep('conversation');
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  async function chooseLanguage(nextLanguage) {
    try {
      await saveLanguage(nextLanguage);
    } catch {
      return;
    }
    setLanguage(nextLanguage);
    setStep('intro');
  }

  if (!ready) {
    return (
      <View style={styles.loading} testID="language-loading">
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (step === 'language') {
    return <LanguageScreen onSelect={chooseLanguage} />;
  }

  if (step === 'intro') {
    return (
      <IntroScreen
        language={language}
        onStart={() => setStep('conversation')}
      />
    );
  }

  return <ConversationScreen language={language} />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
