(function () {
  "use strict";

  const DEFAULT_MAP_SIZE = 28;
  const MAP_SIZES = { small: 20, normal: 28, large: 36 };
  const GAME_VERSION = "v1.4.5.1-hotfix";
  const SAVE_SCHEMA_VERSION = 4;
  const SAVE_KEY = "mika-epohi-v1-state";
  const CAMERA_KEY = "mika-epohi-v12-camera";
  const TUTORIAL_KEY = "mika-epohi-v1-seen";
  const UPDATE_KEY = "mika-epohi-v145-alpha-seen";
  const DB_NAME = "epohi-game-db";
  const CAMPAIGN_STORE = "campaigns";
  const SAVE_STORE = "saves";
  const LEGACY_DB_STORE = "saves";
  const MIGRATION_KEY = "mika-epohi-v132-campaign-migrated";
  const ACTIVE_CAMPAIGN_KEY = "mika-epohi-v132-active-campaign";
  const ACTIVE_SAVE_KEY = "mika-epohi-v132-active-save";
  const LEGACY_ACTIVE_SLOT_KEY = "mika-epohi-v131-active-slot";
  const MANUAL_SAVE_IDS = ["manual-1", "manual-2", "manual-3"];
  const AUTOSAVE_IDS = ["autosave-1", "autosave-2", "autosave-3"];
  const CAMERA_MIN_SCALE = 0.8;
  const CAMERA_MAX_SCALE = 2;
  const CAMERA_DEFAULT_SCALE = 1.3;
  const CAMERA_ZOOM_STEP = 1.18;
  const CAMERA_TAP_SLOP = 7;

  window.EpohiConfig = {
    DEFAULT_MAP_SIZE,
    MAP_SIZES,
    GAME_VERSION,
    SAVE_SCHEMA_VERSION,
    SAVE_KEY,
    CAMERA_KEY,
    TUTORIAL_KEY,
    UPDATE_KEY,
    DB_NAME,
    CAMPAIGN_STORE,
    SAVE_STORE,
    LEGACY_DB_STORE,
    MIGRATION_KEY,
    ACTIVE_CAMPAIGN_KEY,
    ACTIVE_SAVE_KEY,
    LEGACY_ACTIVE_SLOT_KEY,
    MANUAL_SAVE_IDS,
    AUTOSAVE_IDS,
    CAMERA_MIN_SCALE,
    CAMERA_MAX_SCALE,
    CAMERA_DEFAULT_SCALE,
    CAMERA_ZOOM_STEP,
    CAMERA_TAP_SLOP
  };
})();
