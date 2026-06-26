const DATABASE_NAME = "chatify-local-chats";
const DATABASE_VERSION = 1;
const MESSAGE_STORE = "messages";
const CONVERSATION_STORE = "conversations";

const getConversationType = (conversation) =>
  conversation?.admin !== undefined ? "group" : "direct";

const getOwnerConversationKey = ({ ownerId, conversationId, conversationType }) =>
  `${ownerId}::${conversationType}::${conversationId}`;

const getOwnerMessageKey = ({ ownerId, messageId }) => `${ownerId}::${messageId}`;

const openDatabase = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(MESSAGE_STORE)) {
        const messageStore = database.createObjectStore(MESSAGE_STORE, {
          keyPath: "localKey",
        });
        messageStore.createIndex("ownerConversation", "ownerConversation");
        messageStore.createIndex("ownerMessage", "ownerMessage", { unique: true });
      }

      if (!database.objectStoreNames.contains(CONVERSATION_STORE)) {
        const conversationStore = database.createObjectStore(CONVERSATION_STORE, {
          keyPath: "localKey",
        });
        conversationStore.createIndex("ownerId", "ownerId");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const mergeMessages = (serverMessages = [], localMessages = []) => {
  const messagesById = new Map();

  [...localMessages, ...serverMessages].forEach((message) => {
    if (!message?._id) return;
    messagesById.set(message._id, message);
  });

  return [...messagesById.values()].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
};

export const mergeConversations = (serverConversations = [], localConversations = []) => {
  const conversationsById = new Map();

  localConversations.forEach((conversation) => {
    if (conversation?._id) conversationsById.set(conversation._id, conversation);
  });

  serverConversations.forEach((conversation) => {
    if (conversation?._id) conversationsById.set(conversation._id, conversation);
  });

  return [...conversationsById.values()];
};

export const saveLocalMessages = async ({ ownerId, conversation, messages }) => {
  if (
    !ownerId ||
    !conversation?._id ||
    !messages?.length ||
    typeof window === "undefined" ||
    !window.indexedDB
  ) return;

  const database = await openDatabase();
  const conversationId = conversation._id;
  const conversationType = getConversationType(conversation);
  const ownerConversation = getOwnerConversationKey({
    ownerId,
    conversationId,
    conversationType,
  });
  const storedAt = Date.now();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MESSAGE_STORE, CONVERSATION_STORE],
      "readwrite"
    );
    const messageStore = transaction.objectStore(MESSAGE_STORE);
    const conversationStore = transaction.objectStore(CONVERSATION_STORE);

    conversationStore.put({
      localKey: ownerConversation,
      ownerId,
      conversationId,
      conversationType,
      conversation,
      updatedAt: storedAt,
    });

    messages.forEach((message) => {
      if (!message?._id || message.isOptimistic) return;

      messageStore.put({
        ...message,
        localKey: `${ownerConversation}::${message._id}`,
        ownerId,
        ownerMessage: getOwnerMessageKey({ ownerId, messageId: message._id }),
        conversationId,
        conversationType,
        ownerConversation,
        storedAt,
      });
    });

    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};

export const getLocalMessages = async ({ ownerId, conversationId, conversationType }) => {
  if (
    !ownerId ||
    !conversationId ||
    !conversationType ||
    typeof window === "undefined" ||
    !window.indexedDB
  ) return [];

  const database = await openDatabase();
  const ownerConversation = getOwnerConversationKey({
    ownerId,
    conversationId,
    conversationType,
  });

  const messages = await new Promise((resolve, reject) => {
    const request = database
      .transaction(MESSAGE_STORE, "readonly")
      .objectStore(MESSAGE_STORE)
      .index("ownerConversation")
      .getAll(ownerConversation);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return messages.sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
};

export const getLocalConversations = async ({ ownerId, conversationType }) => {
  if (!ownerId || typeof window === "undefined" || !window.indexedDB) return [];

  const database = await openDatabase();
  const conversations = await new Promise((resolve, reject) => {
    const request = database
      .transaction(CONVERSATION_STORE, "readonly")
      .objectStore(CONVERSATION_STORE)
      .index("ownerId")
      .getAll(ownerId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  database.close();
  return conversations
    .filter((record) => !conversationType || record.conversationType === conversationType)
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map((record) => record.conversation);
};

export const deleteLocalMessage = async ({ ownerId, messageId }) => {
  if (!ownerId || !messageId || typeof window === "undefined" || !window.indexedDB) return;

  const database = await openDatabase();

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(MESSAGE_STORE, "readwrite");
    const messageStore = transaction.objectStore(MESSAGE_STORE);
    const ownerMessage = getOwnerMessageKey({ ownerId, messageId });
    const request = messageStore.index("ownerMessage").getKey(ownerMessage);

    request.onsuccess = () => {
      if (request.result) messageStore.delete(request.result);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};

export const deleteLocalConversation = async ({
  ownerId,
  conversationId,
  conversationType = "direct",
}) => {
  if (
    !ownerId ||
    !conversationId ||
    !conversationType ||
    typeof window === "undefined" ||
    !window.indexedDB
  ) return;

  const database = await openDatabase();
  const ownerConversation = getOwnerConversationKey({
    ownerId,
    conversationId,
    conversationType,
  });

  await new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [MESSAGE_STORE, CONVERSATION_STORE],
      "readwrite"
    );
    const messageStore = transaction.objectStore(MESSAGE_STORE);
    const conversationStore = transaction.objectStore(CONVERSATION_STORE);
    const request = messageStore.index("ownerConversation").getAllKeys(ownerConversation);

    request.onsuccess = () => {
      request.result.forEach((key) => messageStore.delete(key));
      conversationStore.delete(ownerConversation);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });

  database.close();
};
