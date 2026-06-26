const DATABASE_NAME = "chatify-mini-apps";
const DATABASE_VERSION = 1;
const STORE_NAME = "pdf-results";

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const savePdfResult = async (result) => {
  const database = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(result);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};

export const getPdfResults = async () => {
  const database = await openDatabase();

  const results = await new Promise((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return results.sort((first, second) => second.createdAt - first.createdAt);
};

export const deletePdfResult = async (resultId) => {
  const database = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(resultId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};
