import type { GameConfigItem, ParsedGameConfig } from '#/utils/game-config';

import { ref } from 'vue';

import { getGameConfigApi } from '#/api/core/project';
import { parseGameConfig } from '#/utils/game-config';

interface GameConfigResponse {
  Data?: GameConfigResponse;
  GameSetting?: GameConfigItem[];
  [key: string]: unknown;
}

const gameConfig = ref<ParsedGameConfig>({
  GameTypeLangGroup: {},
  GroupPlatformGameType: {},
  games: {},
  goldSource: [],
  platformGameList: {},
  platformGameType: {},
});
const loading = ref(false);
let loaded = false;
let loadingPromise: null | Promise<ParsedGameConfig> = null;

function resolveGameSetting(data: unknown) {
  if (Array.isArray(data)) {
    return data as GameConfigItem[];
  }
  const response = data as GameConfigResponse;
  return response?.GameSetting || response?.Data?.GameSetting || [];
}

export function useGameConfig() {
  async function ensureGameConfig(force = false) {
    if (loaded && !force) {
      return gameConfig.value;
    }
    if (loadingPromise) {
      return loadingPromise;
    }

    if (force) loaded = false;
    loading.value = true;
    loadingPromise = getGameConfigApi()
      .then((data) => {
        const parsed = parseGameConfig(resolveGameSetting(data));
        gameConfig.value = parsed;
        loaded = Object.keys(parsed.games).length > 0;
        return parsed;
      })
      .finally(() => {
        loading.value = false;
        loadingPromise = null;
      });

    return loadingPromise;
  }

  return {
    ensureGameConfig,
    gameConfig,
    loading,
  };
}
