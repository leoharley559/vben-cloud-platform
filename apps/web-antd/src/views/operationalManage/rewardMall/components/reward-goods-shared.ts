import { formatOperationDateTime } from '#/utils/operation-status';

/** 商品类型 1=实体商品 2=彩金 3=票券 */
export const PRODUCT_TYPE = {
  PHYSICAL: 1,
  CASH: 2,
  VOUCHER: 3,
} as const;

export const PRODUCT_TYPE_OPTIONS = [
  { label: '实体商品', value: PRODUCT_TYPE.PHYSICAL },
  { label: '彩金', value: PRODUCT_TYPE.CASH },
  { label: '票券', value: PRODUCT_TYPE.VOUCHER },
];

/** 商品限购周期 1=不限制 2=历史生涯 3=每月 4=每周 5=每天 */
export const LIMIT_WINDOW = {
  NONE: 1,
  LIFETIME: 2,
  MONTH: 3,
  WEEK: 4,
  DAY: 5,
} as const;

export const LIMIT_WINDOW_OPTIONS = [
  { label: '不限制', value: LIMIT_WINDOW.NONE },
  { label: '历史生涯', value: LIMIT_WINDOW.LIFETIME },
  { label: '每月', value: LIMIT_WINDOW.MONTH },
  { label: '每周', value: LIMIT_WINDOW.WEEK },
  { label: '每天', value: LIMIT_WINDOW.DAY },
];

/** 跳转类型 1:网址 2:活动接口 3:功能页面 4:公告接口 5:场馆接口 6:无 */
export const REDIRECT_TYPE = {
  URL: 1,
  ACTIVITY: 2,
  UI_PAGE: 3,
  NOTICE: 4,
  VENUE: 5,
  NONE: 6,
} as const;

export const REDIRECT_TYPE_OPTIONS = [
  { label: '网址', value: REDIRECT_TYPE.URL },
  { label: '活动接口', value: REDIRECT_TYPE.ACTIVITY },
  { label: '功能页面', value: REDIRECT_TYPE.UI_PAGE },
  { label: '公告接口', value: REDIRECT_TYPE.NOTICE },
  { label: '场馆接口', value: REDIRECT_TYPE.VENUE },
  { label: '无', value: REDIRECT_TYPE.NONE },
];

export const VIP_LEVEL_RANGE_OPTIONS = Array.from(
  { length: 16 },
  (_, level) => ({
    label: `VIP${level}`,
    value: level,
  }),
);

/** 排序操作类型 0=上移/下移(需 Id1+Id2) 1=置顶(Id1) 2=置底(Id1) */
export const SORT_SWITCH_TYPE = {
  SWAP: 0,
  TOP: 1,
  BOTTOM: 2,
} as const;

export function formatGoodsDateTime(value?: number | string) {
  return formatOperationDateTime(value);
}

export function formatEffectiveTime(row: {
  ProductValidEndTime?: number | string;
  ProductValidStartTime?: number | string;
}) {
  return `${formatGoodsDateTime(row.ProductValidStartTime)} ~ ${formatGoodsDateTime(row.ProductValidEndTime)}`;
}

export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (!value || value === 'null') {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function generateUid() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `uid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* ------------------------------------------------------------------ */
/* 语言群组                                                              */
/* ------------------------------------------------------------------ */

export function resolveLangGroupIds(
  projectConfig?: {
    LangGroup?: Array<{ Default?: boolean; Id: number }>;
  } | null,
): number[] {
  const groups = projectConfig?.LangGroup || [];
  const ids = groups
    .map((group) => Number(group.Id))
    .filter((id) => !Number.isNaN(id));
  return ids.length ? ids : [1];
}

export function resolveDefaultLangGroupId(
  projectConfig?: {
    LangGroup?: Array<{ Default?: boolean; Id: number }>;
  } | null,
): number {
  const groups = projectConfig?.LangGroup || [];
  const found = groups.find((group) => group.Default);
  if (found) {
    return Number(found.Id);
  }
  return Number(groups[0]?.Id) || 1;
}

/** 为每个语言群组补齐一份默认值，已有的值优先保留 */
export function ensureLangMap<T extends Record<string, unknown>>(
  langGroupIds: Array<number | string>,
  existing: Record<string, unknown> | undefined | null,
  factory: () => T,
): Record<string, T> {
  const src = (existing || {}) as Record<string, Partial<T>>;
  const ids = langGroupIds.length ? langGroupIds : [1];
  return Object.fromEntries(
    ids.map((id) => [String(id), { ...factory(), ...src[String(id)] } as T]),
  );
}

/** 把 {langGroupId: {...}} 转换为 [{...,LangGroupId}] (后端接收格式) */
export function langMapToArray<T extends Record<string, unknown>>(
  map: Record<string, T>,
): Array<T & { LangGroupId: number }> {
  return Object.entries(map).map(([id, val]) => ({
    ...val,
    LangGroupId: Number(id),
  }));
}

export function parseLangTextMap(raw: unknown) {
  if (!raw) {
    return {} as Record<string, Record<string, unknown>>;
  }
  if (typeof raw === 'string') {
    if (!raw.trim()) {
      return {};
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return Object.fromEntries(
          parsed.map((item) => [
            String(item.LangGroupId ?? item.Id ?? ''),
            item,
          ]),
        );
      }
      return parsed as Record<string, Record<string, unknown>>;
    } catch {
      return {};
    }
  }
  if (Array.isArray(raw)) {
    return Object.fromEntries(
      raw.map((item) => [String(item.LangGroupId ?? item.Id ?? ''), item]),
    );
  }
  return raw as Record<string, Record<string, unknown>>;
}

export function resolveProductName(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as { Name?: string } | undefined;
  return first?.Name || '';
}

export function resolveProductDesc(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as { Description?: string } | undefined;
  return first?.Description || '';
}

/** 解析后端返回的 LangText JSON, 并为新增语言群组补齐数据 */
export function parseGoodsLangText(
  raw: unknown,
  langGroupIds: number[],
  doubleParseKeys: string[] = [],
): Record<string, Record<string, unknown>> {
  let lt: Record<string, Record<string, unknown>> = {};
  try {
    if (raw === 'null' || raw === undefined || raw === null) {
      throw new Error('empty LangText');
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    if (Array.isArray(parsed)) {
      lt = Object.fromEntries(
        (parsed as Array<Record<string, unknown>>).map((item) => [
          String(item.LangGroupId ?? ''),
          item,
        ]),
      );
    } else {
      lt = (parsed as Record<string, Record<string, unknown>>) || {};
    }
  } catch {
    lt = {};
  }

  const ids = langGroupIds.length ? langGroupIds : [1];
  const missing: number[] = [];
  let lastValidId: number | undefined;

  for (const id of ids) {
    if (!(String(id) in lt)) {
      missing.push(id);
      continue;
    }
    lastValidId = id;
    for (const key of doubleParseKeys) {
      const entry = lt[String(id)] as Record<string, unknown>;
      entry[key] = parseJsonField(entry[key], []);
    }
  }
  for (const id of missing) {
    const source = lastValidId === undefined ? {} : lt[String(lastValidId)];
    const { LangGroupId: _langGroupId, ...rest } = (source || {}) as Record<
      string,
      unknown
    >;
    lt[String(id)] = rest;
  }
  return lt;
}

/* ------------------------------------------------------------------ */
/* 通用路径读写 + LangText consolidate/breakup                            */
/* ------------------------------------------------------------------ */

function isArrayIndexKey(key: string) {
  return /^\d+$/.test(key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getObjectPath<T = any>(
  obj: unknown,
  path: Array<number | string>,
): T | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (const key of path) {
    if (cur === undefined || cur === null) {
      return undefined;
    }
    cur = cur[key as never];
  }
  return cur as T;
}

export function setObjectPath(
  obj: Record<string, unknown>,
  path: Array<number | string>,
  value: unknown,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = String(path[i]);
    const nextKey = String(path[i + 1]);
    if (
      cur[key] === undefined ||
      cur[key] === null ||
      typeof cur[key] !== 'object'
    ) {
      cur[key] = isArrayIndexKey(nextKey) ? [] : {};
    }
    cur = cur[key];
  }
  if (path.length > 0) {
    cur[String(path[path.length - 1])] = value;
  }
}

function deepClone<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isPrimitiveValue(value: unknown) {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  );
}

/** 把散落在各层级的 LangText 收集到根节点的单一 LangText 对象中 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function consolidateGoodsLangText(
  root: Record<string, unknown>,
  langGroupIds: Array<number | string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone: any = deepClone(root);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputLangText: Record<string, any> = {};
  walkConsolidate(clone, [], outputLangText, langGroupIds);
  clone.LangText = outputLangText;
  return clone;
}

function walkConsolidate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  pathArr: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputLangText: Record<string, any>,
  langGroupIds: Array<number | string>,
) {
  if (isPrimitiveValue(node)) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) =>
      walkConsolidate(
        item,
        [...pathArr, String(index)],
        outputLangText,
        langGroupIds,
      ),
    );
    return;
  }

  for (const key of Object.keys(node)) {
    if (key === 'LangText') {
      continue;
    }
    walkConsolidate(node[key], [...pathArr, key], outputLangText, langGroupIds);
  }

  if (!('LangText' in node)) {
    return;
  }

  for (const lgId of langGroupIds) {
    const perLang = node.LangText[lgId] || {};
    for (const [key, value] of Object.entries(perLang)) {
      if (value !== undefined && value !== null) {
        setObjectPath(outputLangText, [String(lgId), ...pathArr, key], value);
      }
    }
  }
  delete node.LangText;
}

/** 把根节点单一的 LangText 对象重新分散回各层级节点 */
export function breakupGoodsLangText(
  root: Record<string, unknown>,
  langText: Record<string, unknown>,
  langGroupIds: Array<number | string>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clone: any = deepClone(root);
  delete clone.LangText;
  walkBreakup(langText, [], clone, langGroupIds);
  return clone;
}

function walkBreakup(
  langText: Record<string, unknown>,
  pathArr: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any,
  langGroupIds: Array<number | string>,
) {
  const primitiveKeys = new Set<string>();
  const nonPrimitiveKeys = new Set<string>();
  for (const lgId of langGroupIds) {
    const fraction =
      getObjectPath<Record<string, unknown>>(langText, [
        String(lgId),
        ...pathArr,
      ]) || {};
    for (const [key, value] of Object.entries(fraction)) {
      if (primitiveKeys.has(key) || nonPrimitiveKeys.has(key)) {
        continue;
      }
      if (isPrimitiveValue(value)) {
        primitiveKeys.add(key);
      } else {
        nonPrimitiveKeys.add(key);
      }
    }
  }

  const toAttach: Record<string, unknown> = {};
  for (const key of primitiveKeys) {
    for (const lgId of langGroupIds) {
      const val = getObjectPath(langText, [String(lgId), ...pathArr, key]);
      setObjectPath(toAttach, [String(lgId), key], val);
    }
  }
  if (Object.keys(toAttach).length > 0) {
    setObjectPath(root, [...pathArr, 'LangText'], toAttach);
  }

  for (const key of nonPrimitiveKeys) {
    walkBreakup(langText, [...pathArr, key], root, langGroupIds);
  }
}

/* ------------------------------------------------------------------ */
/* 商品                                                                  */
/* ------------------------------------------------------------------ */

export interface PhysicalVariantItem {
  ItemUid: string;
  LangText: Record<string, { ItemAttribute: string; ItemPic: string }>;
}

export function createEmptyPhysicalVariant(
  langGroupIds: number[],
): PhysicalVariantItem {
  return {
    ItemUid: generateUid(),
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      ItemAttribute: '',
      ItemPic: '',
    })),
  };
}

export function createDefaultProductForm(langGroupIds: number[]) {
  return {
    BonusConfig: {
      BonusAmount: 0,
      RewardMulti: 0,
      WithdrawWaterGameType: 0,
      WithdrawWaterGames: '',
      WithdrawWaterGamesPlatform: '',
    },
    DisplayDevices: '',
    Id: undefined as number | string | undefined,
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      AppListImage: '',
      AppPurchaseImage: '',
      Description: '',
      IsActive: true,
      Name: '',
      PcListImage: '',
      PcPurchaseImage: '',
    })),
    PhysicalProductElement: [] as PhysicalVariantItem[],
    ProductExchangeLimitCount: 1,
    ProductExchangeLimitType: LIMIT_WINDOW.NONE,
    ProductExchangePoints: 0,
    ProductStockCount: 0,
    ProductTag: undefined as number | undefined,
    ProductType: PRODUCT_TYPE.CASH as number,
    ProductValidEndTime: 0,
    ProductValidStartTime: 0,
    ValidChannels: '',
    ValidPackages: '',
    VipLevelEnd: 15,
    VipLevelStart: 0,
    VoucherId: undefined as number | string | undefined,
  };
}

export type ProductFormState = ReturnType<typeof createDefaultProductForm>;

export function breakupProductDetail(
  raw: Record<string, unknown>,
  langGroupIds: number[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  let bonusConfig = parseJsonField(raw.BonusConfig, {});
  if (!bonusConfig || typeof bonusConfig !== 'object') {
    bonusConfig = {};
  }
  const physicalShell = parseJsonField<Array<Record<string, unknown>>>(
    raw.PhysicalProductElement,
    [],
  );
  const langTextRaw = parseGoodsLangText(raw.LangText, langGroupIds, [
    'PhysicalProductElement',
  ]);
  const breakup = breakupGoodsLangText(
    { ...raw, BonusConfig: bonusConfig, PhysicalProductElement: physicalShell },
    langTextRaw,
    langGroupIds,
  );
  breakup.PhysicalProductElement = (
    (breakup.PhysicalProductElement as Array<Record<string, unknown>>) || []
  ).map((item) => ({ ItemUid: generateUid(), ...item }));
  return breakup;
}

export function assembleProductSubmitPayload(
  form: Record<string, unknown>,
  options: { langGroupIds: number[]; mode: 'add' | 'clone' | 'edit' },
): Record<string, unknown> {
  const consolidated = consolidateGoodsLangText(form, options.langGroupIds);
  const langTextMap = consolidated.LangText as Record<
    string,
    Record<string, unknown>
  >;
  const payload: Record<string, unknown> = {
    ...consolidated,
    BonusConfig: JSON.stringify(consolidated.BonusConfig ?? {}),
    LangText: JSON.stringify(langMapToArray(langTextMap)),
    PhysicalProductElement: JSON.stringify(
      consolidated.PhysicalProductElement ?? [],
    ),
  };
  if (options.mode === 'add' || options.mode === 'clone') {
    delete payload.Id;
  }
  return payload;
}

/* ------------------------------------------------------------------ */
/* 积分商城全局设置 + 引导规则(获取积分规则 / 积分商城规则)                          */
/* ------------------------------------------------------------------ */

export interface GoodsGuideLangItem {
  Desc: string;
  Image2: string;
  Image3: string;
  Param2: number;
  Param3: number;
}

export interface GoodsGuideItem {
  Jump: string;
  JumpType: number;
  LangText: Record<string, GoodsGuideLangItem>;
}

export function createEmptyGoodsGuide(langGroupIds: number[]): GoodsGuideItem {
  return {
    Jump: '',
    JumpType: REDIRECT_TYPE.NONE,
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      Desc: '',
      Image2: '',
      Image3: '',
      Param2: 0,
      Param3: 0,
    })),
  };
}

export function createDefaultGoodsGlobalConfigForm(langGroupIds: number[]) {
  return {
    DisplayDevices: '',
    InvalidChannels: '',
    InvalidPackages: '',
    IsActive: false,
    IsGuestDisplay: true,
    LangText: ensureLangMap(langGroupIds, {}, () => ({ IsActive: true })),
    MallsConfig: [] as GoodsGuideItem[],
    RewardsConfig: [] as GoodsGuideItem[],
    ValidChannels: '',
    ValidPackages: '',
  };
}

export function breakupGoodsGlobalConfig(
  raw: Record<string, unknown>,
  langGroupIds: number[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const rewardsConfig = parseJsonField(raw.RewardsConfig, []);
  const mallsConfig = parseJsonField(raw.MallsConfig, []);
  const langTextRaw = parseGoodsLangText(raw.LangText, langGroupIds, [
    'RewardsConfig',
    'MallsConfig',
  ]);
  return breakupGoodsLangText(
    { ...raw, MallsConfig: mallsConfig, RewardsConfig: rewardsConfig },
    langTextRaw,
    langGroupIds,
  );
}

export function assembleGoodsGlobalConfigPayload(
  form: Record<string, unknown>,
  langGroupIds: number[],
): Record<string, unknown> {
  const consolidated = consolidateGoodsLangText(form, langGroupIds);
  const langTextMap = consolidated.LangText as Record<
    string,
    Record<string, unknown>
  >;
  for (const lgId of langGroupIds) {
    const entry = langTextMap[String(lgId)];
    if (entry) {
      entry.RewardsConfig = JSON.stringify(entry.RewardsConfig ?? []);
      entry.MallsConfig = JSON.stringify(entry.MallsConfig ?? []);
    }
  }
  return {
    ...consolidated,
    LangText: JSON.stringify(langMapToArray(langTextMap)),
    MallsConfig: JSON.stringify(consolidated.MallsConfig ?? []),
    RewardsConfig: JSON.stringify(consolidated.RewardsConfig ?? []),
  };
}

/* ------------------------------------------------------------------ */
/* 商品页签 (ProductTag)                                                 */
/* ------------------------------------------------------------------ */

export function createDefaultTagForm(langGroupIds: number[]) {
  return {
    Id: undefined as number | string | undefined,
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      IsActive: true,
      Name: '',
    })),
  };
}

export function breakupTagDetail(
  raw: Record<string, unknown>,
  langGroupIds: number[],
) {
  const langTextRaw = parseGoodsLangText(raw.LangText, langGroupIds);
  return breakupGoodsLangText(raw, langTextRaw, langGroupIds);
}

export function assembleTagPayload(
  form: Record<string, unknown>,
  options: { langGroupIds: number[]; mode: 'add' | 'edit' },
) {
  const consolidated = consolidateGoodsLangText(form, options.langGroupIds);
  const payload: Record<string, unknown> = {
    ...consolidated,
    LangText: JSON.stringify(
      langMapToArray(
        consolidated.LangText as Record<string, Record<string, unknown>>,
      ),
    ),
  };
  if (options.mode === 'add') {
    delete payload.Id;
  }
  return payload;
}

export function resolveTagName(raw: unknown) {
  return resolveProductName(raw);
}

/* ------------------------------------------------------------------ */
/* 积分任务 / 活动亮点 (RewardTask)                                          */
/* ------------------------------------------------------------------ */

export function createDefaultTaskForm(langGroupIds: number[]) {
  return {
    Id: undefined as number | string | undefined,
    Jump: '',
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      AppPic: '',
      Desc: '',
      IsActive: true,
      PcPic: '',
    })),
    Type: REDIRECT_TYPE.ACTIVITY as number,
  };
}

export function breakupTaskDetail(
  raw: Record<string, unknown>,
  langGroupIds: number[],
) {
  const langTextRaw = parseGoodsLangText(raw.LangText, langGroupIds);
  return breakupGoodsLangText(raw, langTextRaw, langGroupIds);
}

export function assembleTaskPayload(
  form: Record<string, unknown>,
  options: { langGroupIds: number[]; mode: 'add' | 'edit' },
) {
  const consolidated = consolidateGoodsLangText(form, options.langGroupIds);
  const payload: Record<string, unknown> = {
    ...consolidated,
    LangText: JSON.stringify(
      langMapToArray(
        consolidated.LangText as Record<string, Record<string, unknown>>,
      ),
    ),
  };
  if (options.mode === 'add') {
    delete payload.Id;
  }
  return payload;
}
