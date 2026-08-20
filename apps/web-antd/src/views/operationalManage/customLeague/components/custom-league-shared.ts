import type { GameInfo } from '#/utils/game-config';





/* ==================== 开关 / 状态 ==================== */

export const ACTIVE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '开启', value: 1 },
  { label: '关闭', value: 0 },
];

export function formatCustomLeagueActive(value?: boolean | number | string) {
  return Number(value) === 1 || value === true ? '开启' : '关闭';
}

/* ==================== 场馆 / 赛事（对齐旧站 store/modules/match.js） ==================== */

/** 旧站 openMatchTypes：1304 SABA体育 / 1303 FB体育 / 1200 Sabong */
const OPEN_MATCH_TYPES: Record<
  string,
  { id: number; platformType: 'Sabong' | 'Sports'; srcType: number }
> = {
  1200: { id: 1200, platformType: 'Sabong', srcType: 300 },
  1303: { id: 1303, platformType: 'Sports', srcType: 8 },
  1304: { id: 1304, platformType: 'Sports', srcType: 7 },
};

export interface MatchSportItem {
  id: number;
  name: string;
}

export interface MatchListEntry {
  id: number;
  name: string;
  platformType: 'Sabong' | 'Sports';
  sports: MatchSportItem[];
  srcType: number;
}

export interface MatchSourceOption {
  id: number | string;
  name: string;
  platformType?: 'Sabong' | 'Sports';
}

/** 对齐旧站 match/matchList：按 ParentId 归类场馆下的体育赛事(sports) */
export function buildMatchList(
  games: Record<string, GameInfo> = {},
): MatchListEntry[] {
  const matchTypes: Record<string, MatchListEntry> = {};
  for (const [id, config] of Object.entries(OPEN_MATCH_TYPES)) {
    matchTypes[id] = {
      ...config,
      name: games[id]?.gameName || '',
      sports: [],
    };
  }
  for (const game of Object.values(games)) {
    const parentId = String(game.ParentId ?? '');
    const parent = matchTypes[parentId];
    if (!parent) {
      continue;
    }
    const code = Number.parseInt(String(game.gameCode ?? ''), 10);
    if (!Number.isNaN(code)) {
      parent.sports.push({ id: code, name: game.gameName || String(code) });
    }
  }
  return Object.values(matchTypes);
}

/** 仅体育赛事（SABA/FB）场馆 */
export function buildMatchListSport(
  games: Record<string, GameInfo> = {},
): MatchListEntry[] {
  return buildMatchList(games).filter((item) => item.platformType === 'Sports');
}

/** 场馆筛选列表：对齐旧站 match/matchSource（含“全部”） */
export function buildMatchSource(
  games: Record<string, GameInfo> = {},
): MatchSourceOption[] {
  const list = buildMatchList(games).map((entry) => ({
    id: entry.srcType,
    name: entry.name,
    platformType: entry.platformType,
  }));
  return [{ id: '', name: '全部' }, ...list];
}

/** 根据场馆 srcType 获取其体育赛事列表（含“全部”），对齐旧站 match/getSportsBySrc */
export function getSportsBySrc(
  games: Record<string, GameInfo> = {},
  srcType?: number | string,
): MatchSourceOption[] {
  if (srcType === undefined || srcType === null || srcType === '') {
    return [];
  }
  const src = buildMatchListSport(games).find(
    (item) => item.srcType === Number(srcType),
  );
  if (!src) {
    return [];
  }
  return [{ id: '', name: '全部' }, ...src.sports];
}

/* ==================== 多语言 LangText ==================== */

export interface LeagueLangEntry {
  LangGroupId: number;
  LeagueShortName: string;
}

/** 解析 LangText（JSON 字符串/数组/对象）为 {langGroupId: {LangGroupId, LeagueShortName}} */
export function parseLangText(raw: unknown): Record<string, LeagueLangEntry> {
  if (!raw) {
    return {};
  }
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    if (!raw.trim()) {
      return {};
    }
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (Array.isArray(parsed)) {
    return Object.fromEntries(
      (parsed as Array<Record<string, unknown>>).map((item) => [
        String(item.LangGroupId ?? ''),
        {
          LangGroupId: Number(item.LangGroupId ?? 0),
          LeagueShortName: String(item.LeagueShortName ?? ''),
        },
      ]),
    );
  }
  if (parsed && typeof parsed === 'object') {
    return Object.fromEntries(
      Object.entries(parsed as Record<string, Record<string, unknown>>).map(
        ([key, item]) => [
          key,
          {
            LangGroupId: Number(item.LangGroupId ?? key),
            LeagueShortName: String(item.LeagueShortName ?? ''),
          },
        ],
      ),
    );
  }
  return {};
}

/** 补齐每个开放语言群组的 LangText 数据，已有数据优先保留 */
export function ensureLeagueLangMap(
  langGroupIds: Array<number | string>,
  existing?: Record<string, LeagueLangEntry>,
): Record<string, LeagueLangEntry> {
  const src = existing || {};
  const ids = langGroupIds.length > 0 ? langGroupIds : [1];
  return Object.fromEntries(
    ids.map((id) => [
      String(id),
      {
        LangGroupId: Number(id),
        LeagueShortName: src[String(id)]?.LeagueShortName || '',
      },
    ]),
  );
}

/** 按当前语言群组展示联赛简称，取不到时回退到第一个已填写的语言 */
export function resolveLeagueShortName(
  raw: unknown,
  preferredLangGroupId?: number | string,
) {
  const lang = parseLangText(raw);
  if (
    preferredLangGroupId !== undefined &&
    lang[String(preferredLangGroupId)]?.LeagueShortName
  ) {
    return lang[String(preferredLangGroupId)]!.LeagueShortName;
  }
  const first = Object.values(lang).find((item) => item.LeagueShortName);
  return first?.LeagueShortName || '';
}

/* ==================== 联赛赛事下拉（旧站 item[language] 兼容） ==================== */

/** 兼容旧站联赛列表项按语言代码取名：item['zh_CN'] 等，取不到时回退常见字段 */
export function resolveLeagueOptionLabel(
  item: Record<string, unknown>,
  languageKey?: string,
) {
  if (languageKey && item[languageKey]) {
    return String(item[languageKey]);
  }
  return String(
    item.CompetitionName ||
      item.Name ||
      item.LeagueName ||
      item.CompetitionId ||
      item.Id ||
      '-',
  );
}

export function resolveLeagueOptionValue(
  item: Record<string, unknown>,
): number | string {
  const value = item.CompetitionId ?? item.Id ?? '';
  return value as number | string;
}

/* ==================== 语言群组 ==================== */

export function resolveLangGroupIds(
  projectConfig?: null | {
    LangGroup?: Array<{ Default?: boolean; Id: number }>;
  },
): number[] {
  const groups = projectConfig?.LangGroup || [];
  const ids = groups
    .map((group) => Number(group.Id))
    .filter((id) => !Number.isNaN(id));
  return ids.length > 0 ? ids : [1];
}

export function resolveDefaultLangGroupId(
  projectConfig?: null | {
    LangGroup?: Array<{ Default?: boolean; Id: number }>;
  },
): number {
  const groups = projectConfig?.LangGroup || [];
  const found = groups.find((group) => group.Default);
  if (found) {
    return Number(found.Id);
  }
  return Number(groups[0]?.Id) || 1;
}

/* ==================== 产品包 PackageIds ==================== */

export function csvToNumberArray(value?: number[] | string): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter((item) => !Number.isNaN(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map(Number)
      .filter((item) => !Number.isNaN(item));
  }
  return [];
}

/* ==================== 日期时间字符串（旧站 yyyy-MM-dd HH:mm:ss） ==================== */

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** unix 秒时间戳 -> 'YYYY-MM-DD HH:mm:ss'，0/空返回空字符串 */
export function unixToDateTimeString(value?: number | string) {
  const numeric = Number(value);
  if (!numeric) {
    return '';
  }
  const date = new Date(numeric * 1000);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 兼容详情接口可能返回 unix 秒 或 已格式化字符串 两种形态 */
export function toDateTimeString(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'number') {
    return unixToDateTimeString(value);
  }
  const str = String(value);
  return /^\d+$/.test(str) ? unixToDateTimeString(Number(str)) : str;
}

export {formatOperationDateTime as formatCustomLeagueDateTime} from '#/utils/operation-status';