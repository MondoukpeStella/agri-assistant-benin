jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-audio', () => {
  const player = {
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(async () => {}),
  };
  return {
    requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: false })),
    setAudioModeAsync: jest.fn(async () => {}),
    RecordingPresets: { HIGH_QUALITY: {} },
    useAudioPlayer: () => player,
    useAudioRecorder: () => ({
      uri: null,
      prepareToRecordAsync: jest.fn(async () => {}),
      record: jest.fn(),
      stop: jest.fn(async () => {}),
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
