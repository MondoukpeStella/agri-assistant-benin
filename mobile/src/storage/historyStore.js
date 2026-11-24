import * as SQLite from 'expo-sqlite';

import { createHistoryRepository } from './historyRepository';

export async function createDefaultHistoryStore() {
  const database = await SQLite.openDatabaseAsync('agri-history.db');
  await database.execAsync('PRAGMA foreign_keys = ON');
  return createHistoryRepository(wrapExpoDatabase(database));
}

function wrapExpoDatabase(database) {
  return {
    async getUserVersion() {
      const row = await database.getFirstAsync('PRAGMA user_version');
      return row?.user_version ?? 0;
    },
    async setUserVersion(version) {
      const next = Number(version);
      if (!Number.isInteger(next) || next < 0) {
        throw new Error('version');
      }
      await database.execAsync(`PRAGMA user_version = ${next}`);
    },
    async exec(sql) {
      await database.execAsync(sql);
    },
    async run(sql, params = []) {
      await database.runAsync(sql, params);
    },
    async all(sql, params = []) {
      return database.getAllAsync(sql, params);
    },
  };
}
