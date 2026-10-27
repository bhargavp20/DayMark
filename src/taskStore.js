import { makeId } from './habitStore.js';

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
        completions.createIndex('habitId', 'habitId'); completions.createIndex('date', 'date');
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
function runTransaction(mode, work) {
  return openDatabase().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(['tasks'], mode); const store = tx.objectStore('tasks'); let result;
    try { result = work(store); } catch (error) { db.close(); reject(error); return; }
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error || new Error('Task storage operation failed.')); };
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Task storage operation was cancelled.')); };
  }));
}
function requestResult(request) { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
export async function getTasks() { return runTransaction('readonly', store => requestResult(store.getAll())); }
export async function saveTask(task) { const record = { ...task, id: task.id || makeId(), updatedAt: new Date().toISOString() }; await runTransaction('readwrite', store => store.put(record)); return record; }
export async function deleteTask(id) { await runTransaction('readwrite', store => store.delete(id)); }
