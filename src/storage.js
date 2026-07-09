(function () {
  "use strict";

  if (!window.EpohiConfig) {
    throw new Error("EpohiConfig must be loaded before storage.js");
  }

  const {
    DB_NAME,
    CAMPAIGN_STORE,
    SAVE_STORE
  } = window.EpohiConfig;

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (error) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (error) { return false; }
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB недоступна")); return; }
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = function () {
        const db = request.result;
        if (!db.objectStoreNames.contains(CAMPAIGN_STORE)) db.createObjectStore(CAMPAIGN_STORE, { keyPath: "campaignId" });
        if (!db.objectStoreNames.contains(SAVE_STORE)) {
          const saves = db.createObjectStore(SAVE_STORE, { keyPath: "saveId" });
          saves.createIndex("campaignId", "campaignId", { unique: false });
        } else {
          const tx = request.transaction;
          const saves = tx.objectStore(SAVE_STORE);
          if (!saves.indexNames.contains("campaignId")) saves.createIndex("campaignId", "campaignId", { unique: false });
        }
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error("Ошибка IndexedDB")); };
    });
  }

  function dbTx(stores, mode, worker) {
    return openDb().then(function (db) { return new Promise(function (resolve, reject) {
      const tx = db.transaction(stores, mode); const access = Array.isArray(stores) ? stores.map(function(n){ return tx.objectStore(n); }) : tx.objectStore(stores); let result;
      tx.oncomplete = function(){ db.close(); resolve(result); }; tx.onerror = function(){ db.close(); reject(tx.error || new Error("Ошибка хранилища")); };
      result = worker(access);
    }); });
  }
  function requestPromise(req) { return new Promise(function (resolve, reject) { req.onsuccess=function(){ resolve(req.result || null); }; req.onerror=function(){ reject(req.error); }; }); }
  function requestAll(req) { return new Promise(function (resolve, reject) { req.onsuccess=function(){ resolve(req.result || []); }; req.onerror=function(){ reject(req.error); }; }); }

  window.EpohiStorage = {
    safeGet,
    safeSet,
    openDb,
    dbTx,
    requestPromise,
    requestAll
  };
})();
