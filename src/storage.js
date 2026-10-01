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


  function getCampaigns(storageAvailable) { return storageAvailable ? dbTx(CAMPAIGN_STORE, "readonly", function(store){ return requestAll(store.getAll()); }) : Promise.resolve([]); }
  function getCampaign(id, storageAvailable) { return storageAvailable && id ? dbTx(CAMPAIGN_STORE, "readonly", function(store){ return requestPromise(store.get(id)); }) : Promise.resolve(null); }
  function putCampaign(c) { return dbTx(CAMPAIGN_STORE, "readwrite", function(store){ store.put(c); }).then(function(){ return c; }); }
  function deleteCampaign(id) { return dbTx([CAMPAIGN_STORE, SAVE_STORE], "readwrite", function(stores){ stores[0].delete(id); const idx=stores[1].index("campaignId"); idx.openCursor(IDBKeyRange.only(id)).onsuccess=function(e){ const cur=e.target.result; if(cur){ cur.delete(); cur.continue(); } }; }); }
  function getCampaignSaves(campaignId, storageAvailable) { return storageAvailable && campaignId ? dbTx(SAVE_STORE, "readonly", function(store){ return requestAll(store.index("campaignId").getAll(campaignId)); }).then(function(list){ return list.sort(function(a,b){ return String(b.updatedAt).localeCompare(String(a.updatedAt)); }); }) : Promise.resolve([]); }
  function getSaveRecord(id, storageAvailable) { return storageAvailable && id ? dbTx(SAVE_STORE, "readonly", function(store){ return requestPromise(store.get(id)); }) : Promise.resolve(null); }
  function putSaveRecord(record) { return dbTx(SAVE_STORE, "readwrite", function(store){ store.put(record); }).then(function(){ return record; }); }
  function putRotatingAutosave(record, rotate) {
    return dbTx(SAVE_STORE, "readwrite", function (store) {
      const request = store.index("campaignId").getAll(record.campaignId);
      request.onsuccess = function () {
        const saves = request.result || [];
        const slot = function (number) { return record.campaignId + "-autosave-" + number; };
        const first = saves.find(function (save) { return save.saveId === slot(1); });
        const second = saves.find(function (save) { return save.saveId === slot(2); });
        const sameTurn = saves.some(function (save) { return save.type === "autosave" && save.turn === record.turn; });
        if (rotate && !sameTurn && first) {
          if (second) store.put(Object.assign({}, second, { id:slot(3), saveId:slot(3), name:"autosave-3" }));
          store.put(Object.assign({}, first, { id:slot(2), saveId:slot(2), name:"autosave-2" }));
        }
        store.put(record);
      };
    }).then(function () { return record; });
  }
  function deleteSaveRecord(id) { return dbTx(SAVE_STORE, "readwrite", function(store){ store.delete(id); }); }

  window.EpohiStorage = {
    safeGet,
    safeSet,
    openDb,
    dbTx,
    requestPromise,
    requestAll,
    getCampaigns,
    getCampaign,
    putCampaign,
    deleteCampaign,
    getCampaignSaves,
    getSaveRecord,
    putSaveRecord,
    putRotatingAutosave,
    deleteSaveRecord
  };
})();
