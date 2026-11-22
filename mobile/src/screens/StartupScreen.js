import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { readPublicConfig } from '../constants/env';
import {
  APP_NAME,
  STARTUP_BACKEND_NOTE,
  STARTUP_MESSAGE,
  STARTUP_TITLE,
} from '../constants/startupCopy';

export default function StartupScreen() {
  const { appEnv } = readPublicConfig();

  return (
    <View style={styles.container} testID="startup-screen">
      <Text accessibilityRole="header" style={styles.name}>
        {APP_NAME}
      </Text>
      <Text style={styles.title}>{STARTUP_TITLE}</Text>
      <Text style={styles.message}>{STARTUP_MESSAGE}</Text>
      <Text style={styles.note}>{STARTUP_BACKEND_NOTE}</Text>
      <Text style={styles.env}>Configuration : {appEnv}</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  name: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: '#1C2B1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1C2B1F',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1C2B1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  note: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3D4F40',
    textAlign: 'center',
    marginBottom: 20,
  },
  env: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3D4F40',
    textAlign: 'center',
  },
});
