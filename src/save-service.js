(function () {
  "use strict";

  // Owns save request snapshots, slot rotation and write ordering. The UI
  // supplies current identity and presentation callbacks; no DOM is read here.
  function create(options) {
    let saveQueue = Promise.resolve();
    let autosaveWriteLock = Promise.resolve();
    let lastAutosaveMeta = null;
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
          return options.putSaveRecord(record).then(function () {
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
      const prepared = { snapshot: snapshot, campaignId: identity.activeCampaignId, parentTurn: identity.loadedSaveTurn };
      const parentSaveId = identity.loadedSaveId;
      options.saveLegacySnapshot(snapshot);
      autosaveWriteLock = autosaveWriteLock.catch(function () {}).then(function () {
        return ensureCampaign(snapshot, prepared.campaignId).then(function (campaign) {
          return options.getCampaignSaves(campaign.campaignId).then(function (saves) {
            const currentTurn = snapshot.turn;
            const autos = saves.filter(function (save) { return save.type === "autosave"; });
            const sameTurn = autos.find(function (save) { return save.campaignId === campaign.campaignId && save.turn === currentTurn; });
            const shouldRotate = !!rotate && !sameTurn && !(lastAutosaveMeta && lastAutosaveMeta.campaignId === campaign.campaignId && lastAutosaveMeta.turn === currentTurn);
            if (!shouldRotate) return saveAutosaveSlot(campaign, "autosave-1", parentSaveId, prepared);
            const bySlot = {};
            autos.forEach(function (save) {
              if (save.saveId === campaign.campaignId + "-autosave-1") bySlot[1] = save;
              if (save.saveId === campaign.campaignId + "-autosave-2") bySlot[2] = save;
            });
            const ops = [options.deleteSaveRecord(campaign.campaignId + "-autosave-3")];
            if (bySlot[2] && bySlot[2].turn !== currentTurn) {
              const moved2 = Object.assign({}, bySlot[2], { id:campaign.campaignId+"-autosave-3", saveId:campaign.campaignId+"-autosave-3", name:"autosave-3" });
              ops.push(options.deleteSaveRecord(bySlot[2].saveId).then(function () { return options.putSaveRecord(moved2); }));
            }
            if (bySlot[1] && bySlot[1].turn !== currentTurn) {
              const moved1 = Object.assign({}, bySlot[1], { id:campaign.campaignId+"-autosave-2", saveId:campaign.campaignId+"-autosave-2", name:"autosave-2" });
              ops.push(options.deleteSaveRecord(bySlot[1].saveId).then(function () { return options.putSaveRecord(moved1); }));
            }
            return Promise.all(ops).then(function () {
              lastAutosaveMeta = { campaignId: campaign.campaignId, turn: currentTurn };
              return saveAutosaveSlot(campaign, "autosave-1", parentSaveId, prepared);
            });
          });
        });
      });
      return autosaveWriteLock;
    }

    return {
      writeSnapshot: writeSnapshot,
      autoSave: autoSave,
      resetRotation: function () { lastAutosaveMeta = null; },
      setAutoSaveForTests: function (implementation) { autoSaveImpl = implementation; }
    };
  }

  window.EpohiSaveService = { create: create };
})();
