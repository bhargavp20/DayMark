const DB_NAME = 'daymark-local';
const DB_VERSION = 2;
const STORE_NAMES = ['habits', 'habitCompletions', 'habitExclusions', 'tasks'];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open Daymark storage.'));
  });
}
function readAll(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not read backup data.'));
  });
}
export async function createBackup() {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE_NAMES, 'readonly');
    const values = await Promise.all(STORE_NAMES.map(name => readAll(tx.objectStore(name))));
    return {
      app: 'Daymark',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      data: Object.fromEntries(STORE_NAMES.map((name, i) => [name, values[i]])),
    };
  } finally { db.close(); }
}
export async function restoreBackup(backup) {
  if (!backup || backup.app !== 'Daymark' || backup.formatVersion !== 1 || !backup.data) {
    throw new Error('This is not a supported Daymark backup file.');
  }
  for (const name of STORE_NAMES) {
    if (!Array.isArray(backup.data[name])) throw new Error(`Backup is missing valid ${name} data.`);
  }
  const db = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAMES, 'readwrite');
      for (const name of STORE_NAMES) {
        const store = tx.objectStore(name);
        store.clear();
        for (const record of backup.data[name]) {
          if (!record || typeof record !== 'object' || typeof record.id !== 'string') {
            tx.abort();
            reject(new Error(`The backup contains an invalid record in ${name}.`));
            return;
          }
          store.put(record);
        }
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Restore failed. Your data may not have been changed.'));
      tx.onabort = () => reject(tx.error || new Error('Restore was cancelled.'));
    });
  } finally { db.close(); }
}
