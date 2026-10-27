const DB_NAME = 'daymark-local';
const DB_VERSION = 2;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('This browser does not support IndexedDB.'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('habits')) {
        const habits = db.createObjectStore('habits', { keyPath: 'id' });
        habits.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('habitCompletions')) {
        const completions = db.createObjectStore('habitCompletions', { keyPath: 'id' });
        completions.createIndex('habitId', 'habitId');
        completions.createIndex('date', 'date');
      }
      if (!db.objectStoreNames.contains('habitExclusions')) {
        const exclusions = db.createObjectStore('habitExclusions', { keyPath: 'id' });
        exclusions.createIndex('habitId', 'habitId');
      }
      if (!db.objectStoreNames.contains('tasks')) {
        const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
        tasks.createIndex('dueDate', 'dueDate'); tasks.createIndex('createdAt', 'createdAt'); tasks.createIndex('completed', 'completed');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local database.'));
  });
}

async function transaction(storeNames, mode, work) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores = Object.fromEntries(storeNames.map(name => [name, tx.objectStore(name)]));
    let result;
    try { result = work(stores); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Local database operation failed.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Local database operation was cancelled.')); };
  });
}
function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export const localDateKey = (date = new Date()) => {
  const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
export const makeId = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export async function getHabits() { return transaction(['habits'], 'readonly', s => requestResult(s.habits.getAll())); }
export async function saveHabit(habit) { await transaction(['habits'], 'readwrite', s => s.habits.put(habit)); return habit; }
export async function removeHabit(habitId) {
  await transaction(['habits', 'habitCompletions', 'habitExclusions'], 'readwrite', s => {
    s.habits.delete(habitId);
    for (const name of ['habitCompletions', 'habitExclusions']) {
      const req = s[name].index('habitId').openCursor(IDBKeyRange.only(habitId));
      req.onsuccess = () => { const cursor = req.result; if (cursor) { cursor.delete(); cursor.continue(); } };
    }
  });
}
export async function getCompletions() { return transaction(['habitCompletions'], 'readonly', s => requestResult(s.habitCompletions.getAll())); }
export async function setHabitCompletion(habitId, date, completed) {
  const id = `${habitId}::${date}`;
  await transaction(['habitCompletions'], 'readwrite', s => completed ? s.habitCompletions.put({ id, habitId, date, completedAt: new Date().toISOString() }) : s.habitCompletions.delete(id));
}
export async function getExclusions() { return transaction(['habitExclusions'], 'readonly', s => requestResult(s.habitExclusions.getAll())); }
export async function setExclusion(habitId, date, excluded) {
  const id = `${habitId}::${date}`;
  await transaction(['habitExclusions'], 'readwrite', s => excluded ? s.habitExclusions.put({ id, habitId, date }) : s.habitExclusions.delete(id));
}
