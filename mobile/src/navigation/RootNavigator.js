import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../constants/theme';
import ConversationScreen from '../screens/ConversationScreen';
import IntroScreen from '../screens/IntroScreen';
import LanguageScreen from '../screens/LanguageScreen';
import SplashScreen from '../screens/SplashScreen';
import { readLanguage, saveLanguage } from '../storage/languageStorage';

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState(null);
  const [step, setStep] = useState('splash');

  useEffect(() => {
    let active = true;
    readLanguage().then((stored) => {
      if (!active) {
        return;
      }
      if (stored) {
        setLanguage(stored);
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
    setStep(language === nextLanguage ? 'conversation' : 'intro');
  }

  async function changeLanguage(nextLanguage) {
    try {
      await saveLanguage(nextLanguage);
    } catch {
      return false;
    }
    setLanguage(nextLanguage);
    return true;
  }

  if (!ready) {
    return (
      <View style={styles.loading} testID="language-loading">
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (step === 'splash') {
    return <SplashScreen onStart={() => setStep('language')} />;
  }

  if (step === 'language') {
    return (
      <LanguageScreen
        initialLanguage={language ?? 'fr'}
        onContinue={chooseLanguage}
      />
    );
  }

  if (step === 'intro') {
    return (
      <IntroScreen
        language={language}
        onStart={() => setStep('conversation')}
      />
    );
  }

  return (
    <ConversationScreen language={language} onChangeLanguage={changeLanguage} />
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
