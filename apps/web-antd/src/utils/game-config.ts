import venueConfig from '#/config/venue-config.json';

export interface GameConfigItem {
  Type?: string;
  Value?: string;
}

export interface GameInfo {
  apiId?: number | string;
  ApiFee?: number | string;
  gameCode?: number | string;
  gameName?: string;
  ParentId?: number | string;
  resType?: number;
  rooms?: Record<string, string>;
  [key: string]: unknown;
}

export interface GoldSourceItem {
  Key?: number | string;
  Name?: string;
}

export interface GroupPlatformGameTypeItem {
  gametypes?: Array<Record<string, unknown>>;
  id?: number | string;
  name?: string;
  [key: string]: unknown;
}

export interface GameTypeLanguage {
  Lang?: string;
  Name?: string;
  [key: string]: unknown;
}

export interface GameTypeLangGroupItem {
  Classify?: number | string;
  Langs?: GameTypeLanguage[];
  [key: string]: unknown;
}

export interface ParsedGameConfig {
  GameTypeLangGroup: Record<string, GameTypeLangGroupItem>;
  GroupPlatformGameType: Record<string, GroupPlatformGameTypeItem>;
  games: Record<string, GameInfo>;
  goldSource: GoldSourceItem[];
  /** 全部场馆键值（含已关闭），对齐旧站 platformGameTypeAll */
  platformGameTypeAll: Record<string, string>;
  platformGameList: Record<string, GameInfo>;
  platformGameType: Record<string, string>;
}

export function parseGameConfig(data: GameConfigItem[] | null | undefined) {
  const result: ParsedGameConfig = {
    GameTypeLangGroup: {},
    GroupPlatformGameType: {},
    games: {},
    goldSource: [],
    platformGameTypeAll: {},
    platformGameList: {},
    platformGameType: {},
  };

  if (!data?.length) {
    return result;
  }

  for (const item of data) {
    if (item.Type === 'games' && item.Value) {
      try {
        result.games = JSON.parse(item.Value) as Record<string, GameInfo>;
        const platformGameList: Record<string, GameInfo> = {};
        for (const [key, game] of Object.entries(result.games)) {
          if (Number(game.resType) === 8) {
            platformGameList[key] = game;
          }
        }
        result.platformGameList = platformGameList;
      } catch {
        result.games = {};
        result.platformGameList = {};
      }
    } else if (item.Type === 'goldSource' && item.Value) {
      try {
        result.goldSource = JSON.parse(item.Value) as GoldSourceItem[];
      } catch {
        result.goldSource = [];
      }
    } else if (item.Type === 'platformGameType' && item.Value) {
      try {
        result.platformGameType = JSON.parse(item.Value) as Record<
          string,
          string
        >;
      } catch {
        result.platformGameType = {};
      }
    } else if (item.Type === 'GroupPlatformGameType' && item.Value) {
      try {
        result.GroupPlatformGameType = JSON.parse(item.Value) as Record<
          string,
          GroupPlatformGameTypeItem
        >;
      } catch {
        result.GroupPlatformGameType = {};
      }
    } else if (item.Type === 'GameTypeLangGroup' && item.Value) {
      try {
        result.GameTypeLangGroup = JSON.parse(item.Value) as Record<
          string,
          GameTypeLangGroupItem
        >;
      } catch {
        result.GameTypeLangGroup = {};
      }
    }
  }

  return result;
}

export function formatGameName(
  gameId?: number | string,
  games: Record<string, GameInfo> = {},
) {
  if (gameId === undefined || gameId === null || gameId === '') {
    return '-';
  }
  if (Number(gameId) === 0) {
    return '-';
  }
  if (Number(gameId) === -1) {
    return '线下';
  }
  const game = games[String(gameId)];
  return game?.gameName || String(gameId);
}

function isVenueAbbreviation(name: string) {
  return /^[A-Za-z0-9_.-]{1,16}$/.test(name.trim());
}

/** 对齐旧站 gamePlatform：val == key 宽松匹配 */
function lookupPlatformName(
  map: Record<string, string> | undefined,
  key: string,
) {
  if (!map) return '';
  if (map[key]) return map[key];
  for (const [mapKey, value] of Object.entries(map)) {
    if (mapKey == key) return value;
  }
  return '';
}

/** 按场馆编码/简称取 Description（dj → DB电竞）。不要用 GameId：venue-config 的 GameId 与当前平台可能不一致 */
function lookupVenueDescriptionByCode(key: string, shortName = '') {
  const venues = venueConfig.venues || [];
  const upperKey = key.toUpperCase();
  const upperShort = shortName.toUpperCase();
  const hit = venues.find(
    (item) =>
      String(item.VenueName).toUpperCase() === upperKey ||
      String(item.VenueCode).toUpperCase() === upperKey ||
      (upperShort &&
        (String(item.VenueName).toUpperCase() === upperShort ||
          String(item.VenueCode).toUpperCase() === upperShort)),
  );
  return String(hit?.Description || '').trim();
}

/** venue-config Description：本环境中文全称（VenueName 多为 TY/PG） */
function lookupVenueDescription(key: string, shortName = '', gameId = '') {
  const byCode = lookupVenueDescriptionByCode(key, shortName);
  if (byCode) return byCode;
  const venues = venueConfig.venues || [];
  const hit = venues.find(
    (item) => String(item.GameId) === key || String(item.GameId) === gameId,
  );
  return String(hit?.Description || '').trim();
}

/** 接口若直接返回 TY/PG 等简称，仅按当前平台字典反查 ID，不用 venue-config.GameId */
function resolveVenueKey(key: string, cfg: ParsedGameConfig) {
  if (
    cfg.platformGameType?.[key] ||
    cfg.platformGameTypeAll?.[key] ||
    cfg.games?.[key] ||
    cfg.platformGameList?.[key]
  ) {
    return key;
  }
  const upper = key.toUpperCase();
  for (const map of [cfg.platformGameType, cfg.platformGameTypeAll]) {
    for (const [id, name] of Object.entries(map || {})) {
      if (
        isVenueAbbreviation(String(name)) &&
        String(name).toUpperCase() === upper
      ) {
        return String(id);
      }
    }
  }
  return key;
}

/**
 * 场馆名称展示。
 *
 * 注意：games.gameName / platformGameType 在本环境多为简写（如 TY、PG），
 * 游戏记录列表的「场馆名称」来自列表接口 VendorCode（全称），不是本地字典。
 * 报表 GameType 为 ApiFee 编码，对齐旧站 gamePlatform：
 * platformGameTypeAll（/api/game/info）→ Group.gamename → venue-config Description →
 * games.gameName → platformGameType。
 */
export function formatVenueName(
  gameType?: null | number | string,
  config?: null | ParsedGameConfig,
) {
  if (gameType === undefined || gameType === null || gameType === '') {
    return '-';
  }
  if (Number(gameType) === 0) {
    return '-';
  }
  if (Number(gameType) === -1) {
    return '线下';
  }

  const originalKey = String(gameType);
  const byCode = lookupVenueDescriptionByCode(originalKey);
  if (byCode) return byCode;

  const cfg = config || {
    GameTypeLangGroup: {},
    GroupPlatformGameType: {},
    games: {},
    goldSource: [],
    platformGameTypeAll: {},
    platformGameList: {},
    platformGameType: {},
  };

  const key = resolveVenueKey(originalKey, cfg);

  const shortName = lookupPlatformName(cfg.platformGameType, key);
  const byApi = findGameByApiFee(key, cfg);
  const gameId = String(
    (byApi ? findGameIdOf(byApi, cfg) : '') ||
      findGameIdByApiFee(gameType, cfg) ||
      '',
  );

  // 1. 旧站 gamePlatform：platformGameTypeAll（全称，含已关闭场馆）
  const fromAll = lookupPlatformName(cfg.platformGameTypeAll, key);
  if (fromAll && !isVenueAbbreviation(fromAll)) return fromAll;

  // 2. venue-config Description（本环境中文全称）
  const fromDesc = lookupVenueDescription(key, shortName || fromAll, gameId);
  if (fromDesc) return fromDesc;

  if (fromAll) return fromAll;

  // 3. GroupPlatformGameType.gamename
  const groupHit = findGroupVenue(key, cfg);
  if (groupHit?.gamename && !isVenueAbbreviation(groupHit.gamename)) {
    return groupHit.gamename;
  }

  // 4. 按 apiId 找到 gameId 后，再用 Group / Description
  if (gameId) {
    const byGameId = findGroupVenue(gameId, cfg);
    if (byGameId?.gamename && !isVenueAbbreviation(byGameId.gamename)) {
      return byGameId.gamename;
    }
    const descById = lookupVenueDescription(gameId, shortName, gameId);
    if (descById) return descById;
  }

  // 5. ApiFee → platformGameType 简写 → 反查 Group 更长名称
  if (shortName) {
    for (const group of Object.values(cfg.GroupPlatformGameType || {})) {
      for (const item of group.gametypes || []) {
        const name = String(item.gamename ?? '').trim();
        if (
          name &&
          (name === shortName ||
            name.includes(shortName) ||
            shortName.includes(name)) &&
          name.length >= shortName.length
        ) {
          return name;
        }
      }
    }
  }

  // 6. games / platformGameList（可能仍是简写）
  const fromGames = cfg.games[key]?.gameName || '';
  const fromPlatformList = cfg.platformGameList[key]?.gameName || '';
  const fromApiName = byApi?.gameName || '';
  for (const name of [fromApiName, fromGames, fromPlatformList]) {
    if (name && !isVenueAbbreviation(name)) return name;
  }

  if (gameId) {
    const name =
      cfg.games[gameId]?.gameName ||
      cfg.platformGameList[gameId]?.gameName ||
      '';
    if (name) {
      const desc = lookupVenueDescription(gameId, name, gameId);
      if (desc) return desc;
      return name;
    }
  }

  // 7. 简写兜底
  return (
    shortName ||
    fromApiName ||
    fromGames ||
    fromPlatformList ||
    groupHit?.gamename ||
    key
  );
}

function findGroupVenue(key: string, config: ParsedGameConfig) {
  for (const group of Object.values(config.GroupPlatformGameType || {})) {
    for (const item of group.gametypes || []) {
      if (
        String(item.gamecode ?? '') === key ||
        String(item.gameid ?? '') === key ||
        String(item.apiId ?? '') === key ||
        String(item.ApiFee ?? '') === key
      ) {
        const gamename = String(item.gamename ?? '').trim();
        if (gamename) {
          return { gamename, gameid: item.gameid };
        }
      }
    }
  }
  return undefined;
}

function findGameIdOf(target: GameInfo, config: ParsedGameConfig) {
  for (const [gameId, game] of Object.entries(config.platformGameList || {})) {
    if (game === target) return gameId;
  }
  for (const [gameId, game] of Object.entries(config.games || {})) {
    if (game === target) return gameId;
  }
  return '';
}

function findGameByApiFee(apiFeeKey: string, config: ParsedGameConfig) {
  const pools = [config.platformGameList, config.games];
  for (const pool of pools) {
    for (const game of Object.values(pool || {})) {
      if (
        String(game.apiId ?? '') === apiFeeKey ||
        String(game.ApiFee ?? '') === apiFeeKey ||
        String(game.gameCode ?? '') === apiFeeKey
      ) {
        return game;
      }
    }
  }
  return undefined;
}

export function formatGoldReason(
  reasonId?: number | string,
  goldSource: GoldSourceItem[] = [],
) {
  if (reasonId === undefined || reasonId === null || reasonId === '') {
    return '-';
  }
  const matched = goldSource.find(
    (item) => String(item.Key) === String(reasonId),
  );
  return matched?.Name || String(reasonId);
}

/** ApiFee key → 游戏 ID（对齐旧站 fnFindIdByProduct） */
/** 旧站百分比存储：50.5% → 5050 */
export function formatPercentToStorage(value: number | string) {
  const text = String(value ?? '').trim();
  if (!text) {
    return 0;
  }
  const parts = text.split('.');
  const yuan = Number.parseInt(parts[0] || '0', 10) * 100;
  let fen = 0;
  if (parts.length > 1) {
    fen += Number.parseInt(parts[1]!.slice(0, 1) || '0', 10) * 10;
    if (parts[1]!.length > 1) {
      fen += Number.parseInt(parts[1]!.slice(1, 2) || '0', 10);
    }
  }
  return yuan + fen;
}

/** 旧站百分比展示：5050 → 50.5 */
export function formatPercentFromStorage(value?: null | number | string) {
  if (value === '' || value === undefined || value === null) {
    return '';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return '';
  }
  return (num / 100).toFixed(2).replace(/\.?0+$/, '');
}

export function findGameIdByApiFee(
  apiFee: number | string | undefined,
  config: ParsedGameConfig,
) {
  if (apiFee === undefined || apiFee === null || apiFee === '') {
    return '';
  }
  const apiFeeKey = String(apiFee);

  // 直接按 apiId 反查
  const byApi = findGameByApiFee(apiFeeKey, config);
  if (byApi) {
    for (const [gameId, game] of Object.entries(
      config.platformGameList || {},
    )) {
      if (game === byApi) return gameId;
    }
    for (const [gameId, game] of Object.entries(config.games || {})) {
      if (game === byApi) return gameId;
    }
  }

  const name =
    config.platformGameTypeAll?.[apiFeeKey] ||
    config.platformGameType[apiFeeKey] ||
    '';
  if (name) {
    for (const [gameId, game] of Object.entries(config.games)) {
      if (game.gameName === name) {
        return gameId;
      }
    }
    for (const [gameId, game] of Object.entries(
      config.platformGameList || {},
    )) {
      if (game.gameName === name) {
        return gameId;
      }
    }
  }
  // 部分环境 games 字典不全，回退 GroupPlatformGameType（如 BTI → 1300）
  for (const group of Object.values(config.GroupPlatformGameType || {})) {
    for (const item of group.gametypes || []) {
      const code = String(item.gamecode ?? '');
      const itemName = String(item.gamename ?? '');
      if (
        code === apiFeeKey ||
        String(item.apiId ?? '') === apiFeeKey ||
        (name && itemName === name) ||
        itemName === apiFeeKey
      ) {
        return item.gameid ?? '';
      }
    }
  }
  return '';
}
