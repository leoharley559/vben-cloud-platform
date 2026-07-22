export interface GameConfigItem {
  Type?: string;
  Value?: string;
}

export interface GameInfo {
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
  platformGameList: Record<string, GameInfo>;
  platformGameType: Record<string, string>;
}

export function parseGameConfig(data: GameConfigItem[] | null | undefined) {
  const result: ParsedGameConfig = {
    GameTypeLangGroup: {},
    GroupPlatformGameType: {},
    games: {},
    goldSource: [],
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
  const name = config.platformGameType[apiFeeKey] || '';
  if (name) {
    for (const [gameId, game] of Object.entries(config.games)) {
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
        (name && itemName === name) ||
        itemName === apiFeeKey
      ) {
        return item.gameid ?? '';
      }
    }
  }
  return '';
}
