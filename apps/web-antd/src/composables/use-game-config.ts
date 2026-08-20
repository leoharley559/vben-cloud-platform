import type { GameConfigItem, ParsedGameConfig } from '#/utils/game-config';

import { ref } from 'vue';

import { getGameConfigApi } from '#/api/core/project';
import venueConfig from '#/config/venue-config.json';
import { parseGameConfig } from '#/utils/game-config';

interface GameConfigResponse {
  Data?: GameConfigResponse;
  GameSetting?: GameConfigItem[];
  platformGameTypeAll?: Record<string, string> | string;
  respond?: GameConfigResponse;
  [key: string]: unknown;
}

const STORAGE_GAME_CONFIG = 'gameConfig';
const STORAGE_PLATFORM_ALL = 'platformGameTypeAll';

const emptyConfig = (): ParsedGameConfig => ({
  GameTypeLangGroup: {},
  GroupPlatformGameType: {},
  games: {},
  goldSource: [],
  platformGameTypeAll: {},
  platformGameList: {},
  platformGameType: {},
});

const gameConfig = ref<ParsedGameConfig>(hydrateFromStorage());
const loading = ref(false);
let loaded =
  Object.keys(gameConfig.value.games).length > 0 ||
  Object.keys(gameConfig.value.platformGameTypeAll).length > 0 ||
  Object.keys(gameConfig.value.platformGameType).length > 0;
let loadingPromise: null | Promise<ParsedGameConfig> = null;

function hydrateFromStorage(): ParsedGameConfig {
  const parsed = emptyConfig();
  try {
    const rawGames = localStorage.getItem(STORAGE_GAME_CONFIG);
    if (rawGames) {
      const cached = JSON.parse(rawGames) as Partial<ParsedGameConfig>;
      Object.assign(parsed, {
        GameTypeLangGroup: cached.GameTypeLangGroup || {},
        GroupPlatformGameType: cached.GroupPlatformGameType || {},
        games: cached.games || {},
        goldSource: cached.goldSource || [],
        platformGameList: cached.platformGameList || {},
        platformGameType: cached.platformGameType || {},
      });
    }
  } catch {
    // ignore broken cache
  }
  try {
    const rawAll = localStorage.getItem(STORAGE_PLATFORM_ALL);
    if (rawAll) {
      const all = JSON.parse(rawAll) as Record<string, string>;
      if (all && typeof all === 'object' && !Array.isArray(all)) {
        parsed.platformGameTypeAll = all;
      }
    }
  } catch {
    // ignore broken cache
  }
  return parsed;
}

function persistGameConfig(config: ParsedGameConfig) {
  try {
    localStorage.setItem(
      STORAGE_GAME_CONFIG,
      JSON.stringify({
        GameTypeLangGroup: config.GameTypeLangGroup,
        GroupPlatformGameType: config.GroupPlatformGameType,
        games: config.games,
        goldSource: config.goldSource,
        platformGameList: config.platformGameList,
        platformGameType: config.platformGameType,
      }),
    );
    localStorage.setItem(
      STORAGE_PLATFORM_ALL,
      JSON.stringify(config.platformGameTypeAll || {}),
    );
  } catch {
    // ignore quota / private mode
  }
}

function resolveGameSetting(data: unknown) {
  if (Array.isArray(data)) {
    return data as GameConfigItem[];
  }
  const response = data as GameConfigResponse;
  return (
    response?.GameSetting ||
    response?.Data?.GameSetting ||
    response?.respond?.GameSetting ||
    []
  );
}

/** 对齐旧站 fnGetGameConfig：Data.platformGameTypeAll 为 JSON 字符串 */
function resolvePlatformGameTypeAll(data: unknown): Record<string, string> {
  if (!data || typeof data !== 'object') return {};
  const response = data as Record<string, unknown>;
  const nestedCandidates = [response.Data, response.respond, response].filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === 'object' && !Array.isArray(item),
  );

  let raw: unknown;
  for (const source of nestedCandidates) {
    raw = source.platformGameTypeAll ?? source.PlatformGameTypeAll ?? raw;
    if (raw) break;
  }

  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return normalizeNameMap(raw as Record<string, unknown>);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeNameMap(parsed as Record<string, unknown>);
      }
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeNameMap(raw: Record<string, unknown>) {
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined || value === null || value === '') continue;
    map[String(key)] = String(value);
  }
  return map;
}

function looksLikeAbbreviation(name: string) {
  return /^[A-Za-z0-9_.-]{1,16}$/.test(name.trim());
}

function preferVenueName(existing: string | undefined, candidate: string) {
  const next = candidate.trim();
  if (!next) return existing || '';
  if (!existing) return next;
  if (looksLikeAbbreviation(existing) && !looksLikeAbbreviation(next)) {
    return next;
  }
  if (!looksLikeAbbreviation(existing) && looksLikeAbbreviation(next)) {
    return existing;
  }
  return next.length >= existing.length ? next : existing;
}

/** 用 GroupPlatformGameType.gamename 构建 ApiFee/gameId → 名称 */
function buildVenueNameMapFromGroups(config: ParsedGameConfig) {
  const map: Record<string, string> = {};
  for (const group of Object.values(config.GroupPlatformGameType || {})) {
    for (const item of group.gametypes || []) {
      const name = String(item.gamename ?? '').trim();
      if (!name) continue;
      for (const raw of [item.gamecode, item.gameid, item.apiId, item.ApiFee]) {
        if (raw !== undefined && raw !== null && raw !== '') {
          const key = String(raw);
          map[key] = preferVenueName(map[key], name);
        }
      }
    }
  }
  return map;
}

/**
 * venue-config.json 的 Description 为本环境场馆中文全称
 *（VenueName/gameName 多为 TY、PG 等简写）
 */
function enrichWithVenueConfigDescriptions(
  map: Record<string, string>,
  config: ParsedGameConfig,
) {
  const venues = venueConfig.venues || [];
  const byGameId = new Map(
    venues.map((item) => [String(item.GameId), item] as const),
  );
  const byVenueName = new Map(
    venues.map((item) => [String(item.VenueName).toUpperCase(), item] as const),
  );
  const byVenueCode = new Map(
    venues.map((item) => [String(item.VenueCode).toUpperCase(), item] as const),
  );

  for (const venue of venues) {
    const desc = String(venue.Description || '').trim();
    if (!desc) continue;
    map[String(venue.GameId)] = preferVenueName(
      map[String(venue.GameId)],
      desc,
    );
  }

  for (const [apiFee, shortName] of Object.entries(
    config.platformGameType || {},
  )) {
    const hit =
      byVenueName.get(String(shortName).toUpperCase()) ||
      byVenueCode.get(String(shortName).toUpperCase());
    if (hit?.Description) {
      map[apiFee] = preferVenueName(map[apiFee], hit.Description);
    }
  }

  for (const [gameId, game] of Object.entries(config.games || {})) {
    const shortName = String(game.gameName || '').trim();
    const hit =
      byGameId.get(gameId) ||
      byVenueName.get(shortName.toUpperCase()) ||
      byVenueCode.get(shortName.toUpperCase());
    const desc = String(hit?.Description || '').trim();
    if (!desc) continue;
    map[gameId] = preferVenueName(map[gameId], desc);
    for (const raw of [game.apiId, game.ApiFee, game.gameCode]) {
      if (raw !== undefined && raw !== null && raw !== '') {
        const key = String(raw);
        map[key] = preferVenueName(map[key], desc);
      }
    }
  }

  return map;
}

function finalizePlatformGameTypeAll(
  fromApi: Record<string, string>,
  config: ParsedGameConfig,
) {
  // 接口全称优先；Group 与 venue-config 仅补缺失或替换明显简写
  let map: Record<string, string> = { ...fromApi };
  const fromGroup = buildVenueNameMapFromGroups(config);
  for (const [key, name] of Object.entries(fromGroup)) {
    map[key] = preferVenueName(map[key], name);
  }
  map = enrichWithVenueConfigDescriptions(map, config);
  return map;
}

function applyParsedConfig(
  data: unknown,
  gameSetting: GameConfigItem[],
): ParsedGameConfig {
  const parsed = parseGameConfig(gameSetting);
  parsed.platformGameTypeAll = finalizePlatformGameTypeAll(
    resolvePlatformGameTypeAll(data),
    parsed,
  );
  gameConfig.value = parsed;
  loaded =
    Object.keys(parsed.games).length > 0 ||
    Object.keys(parsed.platformGameTypeAll).length > 0 ||
    Object.keys(parsed.platformGameType).length > 0;
  persistGameConfig(parsed);
  return parsed;
}

export function resetGameConfigCache() {
  loaded = false;
  loadingPromise = null;
  gameConfig.value = emptyConfig();
  try {
    localStorage.removeItem(STORAGE_GAME_CONFIG);
    localStorage.removeItem(STORAGE_PLATFORM_ALL);
  } catch {
    // ignore
  }
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
      .then((data) => applyParsedConfig(data, resolveGameSetting(data)))
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
