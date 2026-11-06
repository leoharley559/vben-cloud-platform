import venueConfig from '#/config/venue-config.json';

export interface GameConfigItem {
  Type?: string;
  Value?: string;
}

export interface GameInfo {
  [key: string]: unknown;
  ApiFee?: number | string;
  apiId?: number | string;
  gameCode?: number | string;
  gameName?: string;
  IsOpen?: number | string;
  ParentId?: number | string;
  resType?: number;
  rooms?: Record<string, string>;
}

export interface GoldSourceItem {
  Key?: number | string;
  Name?: string;
}

export interface GroupPlatformGameTypeItem {
  [key: string]: unknown;
  gametypes?: Array<Record<string, unknown>>;
  id?: number | string;
  name?: string;
}

export interface GameTypeLanguage {
  [key: string]: unknown;
  Lang?: string;
  Name?: string;
}

export interface GameTypeLangGroupItem {
  [key: string]: unknown;
  Classify?: number | string;
  IsOpen?: number | string;
  Langs?: GameTypeLanguage[];
}

export interface ParsedGameConfig {
  games: Record<string, GameInfo>;
  GameTypeLangGroup: Record<string, GameTypeLangGroupItem>;
  goldSource: GoldSourceItem[];
  GroupPlatformGameType: Record<string, GroupPlatformGameTypeItem>;
  platformGameList: Record<string, GameInfo>;
  platformGameType: Record<string, string>;
  /** 全部场馆键值（含已关闭），对齐旧站 platformGameTypeAll */
  platformGameTypeAll: Record<string, string>;
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

function namesCorrespond(full: string, short: string) {
  const left = full.trim().toLowerCase();
  const right = short.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  // 简称至少 2 位，避免单字母把无关英文名配进来
  if (right.length < 2) return false;
  return left.includes(right) || right.includes(left);
}

/**
 * 按场馆编码或简称取中文名（dj → DB电竞）。
 * 不用 venue-config.GameId：这份配置里的数字 ID 和当前平台对不上。
 */
export function matchVenueDescription(...names: Array<string | undefined>) {
  const wanted = new Set(
    names
      .map((name) => String(name || '').trim().toUpperCase())
      .filter(Boolean),
  );
  if (wanted.size === 0) return '';
  for (const item of venueConfig.venues || []) {
    const aliases = [
      item.VenueName,
      item.VenueCode,
      ...((item as { Aliases?: string[] }).Aliases || []),
    ];
    const hit = aliases.some((alias) =>
      wanted.has(String(alias || '').trim().toUpperCase()),
    );
    if (hit) return String(item.Description || '').trim();
  }
  return '';
}

/** 全称必须和本平台简称对得上，才允许覆盖场馆自己的名字 */
function belongsToVenue(name: string, ownName: string, shortName: string) {
  if (!name || isVenueAbbreviation(name)) return false;
  if (!ownName && !shortName) return true;
  return namesCorrespond(name, ownName) || namesCorrespond(name, shortName);
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
  const byCode = matchVenueDescription(originalKey);
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
  const ownName = String(
    cfg.games[key]?.gameName || cfg.platformGameList[key]?.gameName || '',
  ).trim();
  const byOwn = matchVenueDescription(ownName, shortName);
  if (byOwn) return byOwn;

  const byApi = findGameByApiFee(key, cfg);
  const gameId = String(
    (byApi ? findGameIdOf(byApi, cfg) : '') ||
      findGameIdByApiFee(gameType, cfg) ||
      '',
  );

  // 全称必须和本平台场馆名对得上，避免英文名盖掉另一个场馆
  const fromAll = lookupPlatformName(cfg.platformGameTypeAll, key);
  if (!ownName && !shortName) {
    const byAll = matchVenueDescription(fromAll);
    if (byAll) return byAll;
  }
  if (
    fromAll &&
    belongsToVenue(fromAll, ownName, shortName)
  ) {
    return fromAll;
  }

  if (ownName && !isVenueAbbreviation(ownName)) return ownName;

  const groupHit = findGroupVenue(key, cfg);
  if (groupHit?.gamename && belongsToVenue(groupHit.gamename, ownName, shortName)) {
    return groupHit.gamename;
  }

  if (gameId && gameId !== key) {
    const byGameId = findGroupVenue(gameId, cfg);
    const linkedName = String(
      cfg.games[gameId]?.gameName ||
        cfg.platformGameList[gameId]?.gameName ||
        '',
    ).trim();
    const byLinked = matchVenueDescription(linkedName);
    if (byLinked) return byLinked;
    if (
      byGameId?.gamename &&
      belongsToVenue(byGameId.gamename, linkedName, shortName)
    ) {
      return byGameId.gamename;
    }
    if (linkedName) return linkedName;
  }

  if (shortName) {
    for (const group of Object.values(cfg.GroupPlatformGameType || {})) {
      for (const item of group.gametypes || []) {
        const name = String(item.gamename ?? '').trim();
        if (name && namesCorrespond(name, shortName)) return name;
      }
    }
  }

  const fromGames = cfg.games[key]?.gameName || '';
  const fromPlatformList = cfg.platformGameList[key]?.gameName || '';
  const fromApiName = byApi?.gameName || '';
  for (const name of [fromApiName, fromGames, fromPlatformList]) {
    if (name && !isVenueAbbreviation(name)) return name;
  }

  const fallback =
    shortName ||
    fromApiName ||
    fromGames ||
    fromPlatformList ||
    groupHit?.gamename ||
    key;
  return matchVenueDescription(fallback) || fallback;
}

/**
 * 对齐游戏记录场馆下拉：以本平台 gameName 为准。
 * 全称只有包含这个名字时才采用。字典里没有这个场馆时显示「未知场馆」，不猜分类。
 */
export function formatPlatformGameLabel(
  gameId?: null | number | string,
  config?: null | ParsedGameConfig,
) {
  if (gameId === undefined || gameId === null || gameId === '') {
    return '-';
  }
  const key = String(gameId);
  const game = config?.platformGameList?.[key] || config?.games?.[key];
  const shortName = String(game?.gameName || '').trim();
  if (!shortName) {
    return '未知场馆';
  }
  const fullName = formatVenueName(gameId, config);
  if (
    fullName &&
    fullName !== '-' &&
    fullName !== shortName &&
    fullName !== key &&
    (fullName.includes(shortName) || shortName.includes(fullName))
  ) {
    return fullName;
  }
  return shortName;
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
