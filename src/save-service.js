(function () {
  "use strict";

  // Owns save request snapshots, slot rotation and write ordering. The UI
  // supplies current identity and presentation callbacks; no DOM is read here.
  function create(options) {
    let saveQueue = Promise.resolve();
    let autosaveWriteLock = Promise.resolve();
    let autoSaveImpl = null;

    function ensureCampaign(gameState, campaignId) {
      if (!gameState) return Promise.reject(new Error("Нет текущей партии"));
      if (campaignId) return options.getCampaign(campaignId).then(function (campaign) {
        return campaign || options.putCampaign(options.campaignFromState(gameState, gameState.partyName, campaignId));
      });
      const campaign = options.campaignFromState(gameState, gameState.partyName);
      options.onCampaignCreated(campaign.campaignId);
      return options.putCampaign(campaign);
    }

    function writeSnapshot(type, name, fixedSaveId, parentSaveId, prepared) {
      const currentState = options.getState();
      if (!currentState && !prepared) return Promise.resolve(null);
      if (type !== "autosave" && !options.canSaveNow()) {
        options.onBlocked();
        return Promise.resolve(null);
      }
      const identity = options.getIdentity();
      const snapshot = prepared ? prepared.snapshot : options.cloneState(currentState);
      const campaignId = prepared ? prepared.campaignId : identity.activeCampaignId;
      const parentTurn = prepared ? prepared.parentTurn : identity.loadedSaveTurn;
      if (!prepared) options.saveLegacySnapshot(snapshot);
      options.onStatus("saving");

      saveQueue = saveQueue.catch(function () {}).then(function () {
        return ensureCampaign(snapshot, campaignId).then(function (campaign) {
          const now = new Date().toISOString();
          const valid = options.validateSaveState(snapshot);
          if (!valid) throw new Error("Состояние повреждено и не сохранено");
          valid.partyName = campaign.name;
          const record = options.buildSaveRecord({
            type: type,
            name: name,
            fixedSaveId: fixedSaveId,
            parentSaveId: parentSaveId,
            campaign: campaign,
            gameState: valid,
            now: now,
            schemaVersion: options.schemaVersion,
            loadedSaveTurn: parentTurn
          });
          const write = type === "autosave"
            ? options.putRotatingAutosave(record, !!(prepared && prepared.rotate))
            : options.putSaveRecord(record);
          return write.then(function () {
            campaign.lastPlayedAt = now;
            campaign.status = valid.victory ? "victory" : "active";
            campaign.lastLoadedSaveId = record.saveId;
            campaign.mapSize = options.mapSizeCells(valid);
            if (options.getIdentity().activeCampaignId === campaign.campaignId) {
              options.onActiveSave(record.saveId, valid.turn);
            }
            return options.putCampaign(campaign).then(function () {
              options.onStatus("saved");
              return record;
            });
          });
        });
      }).catch(function (error) {
        options.onStatus("error");
        options.onError(error);
        throw error;
      });
      return saveQueue;
    }

    function saveAutosaveSlot(campaign, slotName, parentSaveId, prepared) {
      return writeSnapshot("autosave", slotName, campaign.campaignId + "-" + slotName, parentSaveId, prepared);
    }

    function autoSave(rotate) {
      if (autoSaveImpl) return autoSaveImpl(rotate);
      const gameState = options.getState();
      if (!gameState) return Promise.resolve(null);
      const identity = options.getIdentity();
      const snapshot = options.cloneState(gameState);
      const prepared = { snapshot: snapshot, campaignId: identity.activeCampaignId, parentTurn: identity.loadedSaveTurn, rotate: !!rotate };
      const parentSaveId = identity.loadedSaveId;
      options.saveLegacySnapshot(snapshot);
      autosaveWriteLock = autosaveWriteLock.catch(function () {}).then(function () {
        return ensureCampaign(snapshot, prepared.campaignId).then(function (campaign) {
          return saveAutosaveSlot(campaign, "autosave-1", parentSaveId, prepared);
        });
      });
      return autosaveWriteLock;
    }

    return {
      writeSnapshot: writeSnapshot,
      autoSave: autoSave,
      setAutoSaveForTests: function (implementation) { autoSaveImpl = implementation; }
    };
  }

  window.EpohiSaveService = { create: create };
})();
