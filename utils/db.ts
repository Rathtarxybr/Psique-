import { openDB, DBSchema, IDBPDatabase } from 'idb';
// FIX: Add .ts extension to file path.
import { DocumentContent } from '../types.ts';

const DB_NAME = 'PsiqueDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

interface PsiqueDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: DocumentContent;
  };
}

let dbPromise: Promise<IDBPDatabase<PsiqueDB>> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = openDB<PsiqueDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
  return dbPromise;
};

export const saveDocumentContent = async (id: string, content: string, fileDataUrl: string): Promise<void> => {
  const db = await initDB();
  await db.put(STORE_NAME, { id, content, fileDataUrl });
};

export const getDocumentContent = async (id: string): Promise<DocumentContent | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deleteDocumentContent = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
};