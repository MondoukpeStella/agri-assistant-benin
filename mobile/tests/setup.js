jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON');
    const bind = (params) => (Array.isArray(params) ? params : []);
    return {
      execAsync: async (sql) => {
        db.exec(sql);
      },
      runAsync: async (sql, params) => {
        db.prepare(sql).run(...bind(params));
      },
      getAllAsync: async (sql, params) => db.prepare(sql).all(...bind(params)),
      getFirstAsync: async (sql, params) =>
        db.prepare(sql).get(...bind(params)) ?? null,
    };
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
