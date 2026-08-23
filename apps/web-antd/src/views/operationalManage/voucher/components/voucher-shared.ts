import { formatAmountFromCent } from '#/utils/format-amount';
import {
  formatOperationDateTime,
  VOUCHER_TYPE_MAP,
} from '#/utils/operation-status';

export const VOUCHER_TYPE = {
  RED_PACKET: 1,
  CASH: 2,
  GOLDEN_EGG: 3,
  PRIZE_WHEEL: 4,
} as const;

export const VOUCHER_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '幸运红包券', value: VOUCHER_TYPE.RED_PACKET },
  { label: '现金兑换券', value: VOUCHER_TYPE.CASH },
  { label: '砸金蛋券', value: VOUCHER_TYPE.GOLDEN_EGG },
  { label: '豪礼转盘券', value: VOUCHER_TYPE.PRIZE_WHEEL },
];

export const VOUCHER_STATUS_OPTIONS = [
  { color: 'warning', label: '未达标', value: 1 },
  { color: 'processing', label: '待兑换', value: 2 },
  { color: 'success', label: '已兑换', value: 3 },
  { color: 'error', label: '已失效', value: 4 },
  { color: 'default', label: '未开放', value: 5 },
];

export const VOUCHER_STATUS_FILTER_OPTIONS = [
  { label: '全部', value: '' },
  ...VOUCHER_STATUS_OPTIONS.map((item) => ({
    label: item.label,
    value: item.value,
  })),
];

/** 豪礼转盘/砸金蛋券奖励类型 1:彩金(旧) 2:票券(旧) 3:实物礼品 4:虚拟物品 5:积分 6:彩金+积分 */
export const REWARD_TYPE = {
  CASH: 1,
  PHYSICAL: 3,
  VIRTUAL: 4,
  POINT: 5,
  GENERAL: 6,
} as const;

export const REWARD_TYPE_OPTIONS = [
  { label: '彩金', value: REWARD_TYPE.CASH },
  { label: '实物奖品', value: REWARD_TYPE.PHYSICAL },
  { label: '虚拟奖品', value: REWARD_TYPE.VIRTUAL },
  { label: '积分', value: REWARD_TYPE.POINT },
  { label: '彩金+积分', value: REWARD_TYPE.GENERAL },
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

export const REDEEM_REQUIREMENT_OPTIONS = [
  { label: '无要求', value: 1 },
  { label: '绑定手机号', value: 2 },
  { label: '绑定提款账号', value: 3 },
  { label: '绑定手机号 + 绑定提款账号', value: 4 },
];

export const DURATION_OPTIONS = [
  { label: '长期有效', value: 1 },
  { label: '指定天数', value: 2 },
  { label: '固定日期', value: 3 },
];

export const VENUE_PICK_MODE_OPTIONS = [
  { label: '全部场馆', value: 0 },
  { label: '指定场馆类型', value: 1 },
  { label: '指定场馆', value: 2 },
];

const defaultDrawWaterSrctp = (): DrawWaterSrctp => ({
  WithdrawWaterGameType: 0,
  WithdrawWaterGames: [],
  WithdrawWaterGamesPlatform: [],
});

export interface DrawWaterSrctp {
  WithdrawWaterGames: number[];
  WithdrawWaterGamesPlatform: number[];
  WithdrawWaterGameType: number;
}

export interface VoucherRuleLangItem {
  AppPic: string;
  AppPicHeight?: number;
  PcPic: string;
  PcPicHeight?: number;
  Text: string;
}

export interface VoucherRuleItem {
  Index?: number;
  Jump: string;
  LangText: Record<string, VoucherRuleLangItem>;
  Type: number;
}

export interface RedPacketTierItem {
  DrawWater: number;
  MaximumGoldAmount: number;
  MinimumGoldAmount: number;
  PriceProbabilityWeight: number;
}

export interface CashTierItem {
  DrawWater: number;
  Gold: number;
}

export interface PhysicalVariantItem {
  ItemUid: string;
  LangText: Record<string, { ItemAttribute: string; ItemPic: string }>;
}

export interface ProbabilityPrizeItem {
  DrawWater: number;
  Gold: number;
  Index?: number;
  LangText: Record<
    string,
    { PriceName: string; PrizePopupImage?: string; PrizeWheelImage?: string }
  >;
  PhysicalProduct: {
    LangText: Record<string, { ProductName: string; ProductPic: string }>;
    ProductTagDetail: PhysicalVariantItem[];
  };
  Points: number;
  PriceProbabilityWeight: number;
  PriceType: number;
  VirtualProduct: {
    LangText: Record<string, { ProductName: string; ProductPic: string }>;
  };
}

export function formatVoucherType(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return VOUCHER_TYPE_MAP[Number(value)] || String(value);
}

export function getRewardTypeOptions(voucherType: number) {
  if (voucherType === VOUCHER_TYPE.GOLDEN_EGG) {
    const excluded = new Set<number>([REWARD_TYPE.CASH, REWARD_TYPE.POINT]);
    return REWARD_TYPE_OPTIONS.filter((item) => !excluded.has(item.value));
  }
  return REWARD_TYPE_OPTIONS.filter(
    (item) => item.value !== REWARD_TYPE.GENERAL,
  );
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

export function resolveVoucherName(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as undefined | { Name?: string };
  return first?.Name || '-';
}

export function resolveVoucherDesc(raw: unknown) {
  const lang = parseLangTextMap(raw);
  const first = Object.values(lang)[0] as undefined | { Desc?: string };
  return first?.Desc || '-';
}

export function formatVoucherDateTime(value?: number | string) {
  return formatOperationDateTime(value);
}

export function formatEffectiveTime(row: {
  Duration?: number;
  DurationDays?: number;
  DurationEndTime?: number | string;
  DurationStartTime?: number | string;
}) {
  const duration = Number(row.Duration);
  if (duration === 1) {
    return '长期有效';
  }
  if (duration === 2) {
    return `领取后 ${row.DurationDays || 0} 天有效`;
  }
  if (duration === 3) {
    const start = formatVoucherDateTime(row.DurationStartTime);
    const end = formatVoucherDateTime(row.DurationEndTime);
    return `${start} ~ ${end}`;
  }
  return '-';
}

export function formatVoucherAmount(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = Number(value);
  if (!numeric) {
    return '-';
  }
  return formatAmountFromCent(numeric);
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

export function defaultLangTextArray(name = '', desc = '') {
  return [{ Desc: desc, IsActive: true, LangGroupId: 1, Name: name }];
}

export function deriveActivityName(
  activityType?: number | string,
  langText?: unknown,
) {
  if (Number(activityType) === 10_020) {
    return '每日签到';
  }
  return resolveVoucherName(langText);
}

export function formatCentsToYuan(cents?: number | string) {
  const value = Number(cents) || 0;
  return Math.round(value) / 100;
}

export function yuanToCents(yuan?: number | string) {
  return Math.round((Number(yuan) || 0) * 100);
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

/** 为每个语言群组补齐一份默认值，已有的值优先保留 */
export function ensureLangMap<T extends Record<string, unknown>>(
  langGroupIds: Array<number | string>,
  existing: null | Record<string, unknown> | undefined,
  factory: () => T,
): Record<string, T> {
  const src = (existing || {}) as Record<string, Partial<T>>;
  const ids = langGroupIds.length > 0 ? langGroupIds : [1];
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

/* ------------------------------------------------------------------ */
/* 通用路径读写 (等价于旧站 safeLodashAt / safeLodashSet)                    */
/* ------------------------------------------------------------------ */

function isArrayIndexKey(key: string) {
  return /^\d+$/.test(key);
}

 
export function getObjectPath<T = any>(
  obj: unknown,
  path: Array<number | string>,
): T | undefined {
   
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
  return structuredClone(value);
}

function isPrimitiveValue(value: unknown) {
  return (
    value === null || (typeof value !== 'object' && typeof value !== 'function')
  );
}

/**
 * 把散落在各层级的 LangText 收集到根节点的单一 LangText 对象中
 * (镜像旧站 useLangTextConverter().consolidate)
 */
 
export function consolidateVoucherLangText(
  root: Record<string, unknown>,
  langGroupIds: Array<number | string>,
   
): Record<string, any> {
   
  const clone: any = deepClone(root);
   
  const outputLangText: Record<string, any> = {};
  walkConsolidate(clone, [], outputLangText, langGroupIds);
  clone.LangText = outputLangText;
  return clone;
}

function walkConsolidate(
   
  node: any,
  pathArr: string[],
   
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

/**
 * 把根节点单一的 LangText 对象重新分散回各层级节点
 * (镜像旧站 useLangTextConverter().breakup)
 */
export function breakupVoucherLangText(
  root: Record<string, unknown>,
  langText: Record<string, unknown>,
  langGroupIds: Array<number | string>,
   
): Record<string, any> {
   
  const clone: any = deepClone(root);
  delete clone.LangText;
  walkBreakup(langText, [], clone, langGroupIds);
  return clone;
}

function walkBreakup(
  langText: Record<string, unknown>,
  pathArr: string[],
   
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

/** 解析后端返回的 LangText JSON, 并为新增语言群组补齐数据 */
export function parseVoucherLangText(
  raw: unknown,
  langGroupIds: number[],
  doubleParseKeys: string[] = [],
): Record<string, Record<string, unknown>> {
  let lt: Record<string, Record<string, unknown>>;
  try {
    if (raw === 'null' || raw === undefined || raw === null) {
      throw new Error('empty LangText');
    }
    const parsed = typeof raw === 'string' ? JSON.parse(raw || '{}') : raw;
    lt = Array.isArray(parsed) ? Object.fromEntries(
        (parsed as Array<Record<string, unknown>>).map((item) => [
          String(item.LangGroupId ?? ''),
          item,
        ]),
      ) : (parsed as Record<string, Record<string, unknown>>) || {};
  } catch {
    lt = {};
  }

  const ids = langGroupIds.length > 0 ? langGroupIds : [1];
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
      entry[key] = parseJsonField(entry[key], {});
    }
  }
  for (const id of missing) {
    const source = lastValidId === undefined ? {} : lt[String(lastValidId)];
    const {
      AgentId: _agentId,
      Desc: _desc,
      Id: _id,
      IsActive: _isActive,
      LangGroupId: _langGroupId,
      Name: _name,
      ParentId: _parentId,
      ...rest
    } = (source || {}) as Record<string, unknown>;
    lt[String(id)] = rest;
  }
  return lt;
}

/* ------------------------------------------------------------------ */
/* 票券 - 奖励档位工厂函数 / 路径                                            */
/* ------------------------------------------------------------------ */

export function getRewardTiersPath(voucherType: number): string[] {
  switch (voucherType) {
    case VOUCHER_TYPE.CASH: {
      return [
        'CashExchangeVoucherPriceSetting',
        'CashExchangeVoucherPriceList',
        'Tiers',
      ];
    }
    case VOUCHER_TYPE.GOLDEN_EGG: {
      return ['GoldenEggVoucherPriceSetting', 'GoldenEggVoucherPriceList'];
    }
    case VOUCHER_TYPE.PRIZE_WHEEL: {
      return [
        'GrandGiftWheelVoucherPriceSetting',
        'GrandGiftWheelVoucherPriceList',
      ];
    }
    case VOUCHER_TYPE.RED_PACKET: {
      return [
        'LuckyRedPacketVoucherPriceSetting',
        'LuckyRedPacketVoucherPriceList',
        'Tiers',
      ];
    }
    default: {
      return [];
    }
  }
}

export function getDrawWaterPath(voucherType: number): string[] {
  switch (voucherType) {
    case VOUCHER_TYPE.CASH: {
      return [
        'CashExchangeVoucherPriceSetting',
        'CashExchangeVoucherPriceList',
        'DrawWaterSrctp',
      ];
    }
    case VOUCHER_TYPE.GOLDEN_EGG: {
      return ['GoldenEggVoucherPriceSetting', 'DrawWaterSrctp'];
    }
    case VOUCHER_TYPE.PRIZE_WHEEL: {
      return ['GrandGiftWheelVoucherPriceSetting', 'DrawWaterSrctp'];
    }
    case VOUCHER_TYPE.RED_PACKET: {
      return [
        'LuckyRedPacketVoucherPriceSetting',
        'LuckyRedPacketVoucherPriceList',
        'DrawWaterSrctp',
      ];
    }
    default: {
      return [];
    }
  }
}

export function createEmptyDrawWaterSrctp(): DrawWaterSrctp {
  return defaultDrawWaterSrctp();
}

export function createEmptyRedPacketTier(): RedPacketTierItem {
  return {
    DrawWater: 1,
    MaximumGoldAmount: 0,
    MinimumGoldAmount: 0,
    PriceProbabilityWeight: 100,
  };
}

export function createEmptyCashTier(): CashTierItem {
  return { DrawWater: 1, Gold: 1000 };
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

export function createEmptyProbabilityPrize(
  voucherType: number,
  langGroupIds: number[],
): ProbabilityPrizeItem {
  const isWheel = voucherType === VOUCHER_TYPE.PRIZE_WHEEL;
  return {
    DrawWater: 1,
    Gold: 0,
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      PriceName: '',
      ...(isWheel ? { PrizePopupImage: '', PrizeWheelImage: '' } : {}),
    })),
    PhysicalProduct: {
      LangText: ensureLangMap(langGroupIds, {}, () => ({
        ProductName: '',
        ProductPic: '',
      })),
      ProductTagDetail: [],
    },
    Points: 0,
    PriceProbabilityWeight: 100,
    PriceType:
      voucherType === VOUCHER_TYPE.GOLDEN_EGG
        ? REWARD_TYPE.GENERAL
        : REWARD_TYPE.CASH,
    VirtualProduct: {
      LangText: ensureLangMap(langGroupIds, {}, () => ({
        ProductName: '',
        ProductPic: '',
      })),
    },
  };
}

export function createEmptyVoucherRule(
  langGroupIds: number[],
): VoucherRuleItem {
  return {
    Jump: '',
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      AppPic: '',
      AppPicHeight: 0,
      PcPic: '',
      PcPicHeight: 0,
      Text: '',
    })),
    Type: REDIRECT_TYPE.NONE,
  };
}

/** 生成新增票券时的默认 ExInfo 结构 */
export function createDefaultExInfo(
  voucherType: number,
  langGroupIds: number[],
) {
  const base = {
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      IconApp: '',
      IconPc: '',
    })),
    VoucherRules: [] as VoucherRuleItem[],
  };
  switch (voucherType) {
    case VOUCHER_TYPE.CASH: {
      return {
        ...base,
        CashExchangeVoucherPriceSetting: {
          CashExchangeVoucherPriceList: {
            DrawWaterSrctp: createEmptyDrawWaterSrctp(),
            Tiers: [createEmptyCashTier()],
          },
        },
      };
    }
    case VOUCHER_TYPE.GOLDEN_EGG: {
      return {
        ...base,
        GoldenEggVoucherPriceSetting: {
          DrawWaterSrctp: createEmptyDrawWaterSrctp(),
          GoldenEggVoucherPriceList: [
            createEmptyProbabilityPrize(voucherType, langGroupIds),
          ],
        },
      };
    }
    case VOUCHER_TYPE.PRIZE_WHEEL: {
      return {
        ...base,
        GrandGiftWheelVoucherPriceSetting: {
          DrawWaterSrctp: createEmptyDrawWaterSrctp(),
          GrandGiftWheelVoucherPriceList: Array.from({ length: 8 }, () =>
            createEmptyProbabilityPrize(voucherType, langGroupIds),
          ),
        },
      };
    }
    case VOUCHER_TYPE.RED_PACKET: {
      return {
        ...base,
        LuckyRedPacketVoucherPriceSetting: {
          LuckyRedPacketVoucherPriceList: {
            DrawWaterSrctp: createEmptyDrawWaterSrctp(),
            Tiers: [createEmptyRedPacketTier()],
          },
        },
      };
    }
    default: {
      return base;
    }
  }
}

/** 新增票券表单默认值 (字段名与后端保持一致) */
export function createDefaultVoucherForm(
  voucherType: number,
  langGroupIds: number[],
) {
  return {
    BetRequirementAmount: 0,
    DepositRequirementAmount: 0,
    Duration: 1,
    DurationDays: 0,
    DurationEndTime: 0,
    DurationStartTime: 0,
    ExInfo: createDefaultExInfo(voucherType, langGroupIds),
    Id: undefined as number | string | undefined,
    IsBetRequirement: false,
    IsBetRequirementType: 1,
    IsDepositRequirement: false,
    IsDepositRequirementType: 1,
    IsTriggerNext: false,
    LangText: ensureLangMap(langGroupIds, {}, () => ({
      Desc: '',
      IsActive: true,
      Name: '',
    })),
    RedeemRequirement: 1,
    TriggerNextId: undefined as number | string | undefined,
    Type: voucherType,
    VenueParticipation: '',
    VenueParticipationJumpParam: '',
    VenueParticipationJumpType: REDIRECT_TYPE.NONE,
    VenueParticipationSelection: 0,
    VenueParticipationType: '',
  };
}

export type VoucherFormState = ReturnType<typeof createDefaultVoucherForm>;

/** 由后端详情数据还原表单 (breakup LangText 到各层级) */
export function breakupVoucherDetail(
  raw: Record<string, unknown>,
  langGroupIds: number[],
   
): Record<string, any> {
  const exInfo = parseJsonField(raw.ExInfo, {});
  const langTextRaw = parseVoucherLangText(raw.LangText, langGroupIds, [
    'ExInfo',
  ]);
  return breakupVoucherLangText(
    { ...raw, ExInfo: exInfo },
    langTextRaw,
    langGroupIds,
  );
}

/** 组装提交给后端的票券 payload (consolidate LangText 到单一根节点后按字段 stringify) */
export function assembleVoucherSubmitPayload(
  form: Record<string, unknown>,
  options: { langGroupIds: number[]; mode: 'add' | 'clone' | 'edit' },
): Record<string, unknown> {
  const consolidated = consolidateVoucherLangText(form, options.langGroupIds);
  const langTextMap = consolidated.LangText as Record<
    string,
    Record<string, unknown>
  >;
  for (const lgId of options.langGroupIds) {
    const entry = langTextMap[String(lgId)];
    if (entry) {
      entry.ExInfo = JSON.stringify(entry.ExInfo ?? {});
    }
  }
  const payload: Record<string, unknown> = {
    ...consolidated,
    ExInfo: JSON.stringify(consolidated.ExInfo ?? {}),
    LangText: JSON.stringify(langMapToArray(langTextMap)),
  };
  if (options.mode === 'add' || options.mode === 'clone') {
    delete payload.Id;
  }
  return payload;
}

/* ------------------------------------------------------------------ */
/* 票券中心全局配置                                                        */
/* ------------------------------------------------------------------ */

export function createDefaultVoucherGlobalConfigForm(langGroupIds: number[]) {
  return {
    DisplayDevices: '',
    Id: 0,
    InvalidChannels: '',
    InvalidPackages: '',
    IsActive: false,
    IsGuestDisplay: true,
    LangText: ensureLangMap(langGroupIds, {}, () => ({ IsActive: true })),
    RulesConfig: [] as VoucherRuleItem[],
    ValidChannels: '',
    ValidPackages: '',
  };
}

export function breakupVoucherGlobalConfig(
  raw: Record<string, unknown>,
  langGroupIds: number[],
   
): Record<string, any> {
  const rulesConfig = parseJsonField(raw.RulesConfig, []);
  const langTextRaw = parseVoucherLangText(raw.LangText, langGroupIds, [
    'RulesConfig',
  ]);
  return breakupVoucherLangText(
    { ...raw, RulesConfig: rulesConfig },
    langTextRaw,
    langGroupIds,
  );
}

export function assembleVoucherGlobalConfigPayload(
  form: Record<string, unknown>,
  langGroupIds: number[],
): Record<string, unknown> {
  const consolidated = consolidateVoucherLangText(form, langGroupIds);
  const langTextMap = consolidated.LangText as Record<
    string,
    Record<string, unknown>
  >;
  for (const lgId of langGroupIds) {
    const entry = langTextMap[String(lgId)];
    if (entry) {
      entry.RulesConfig = JSON.stringify(entry.RulesConfig ?? []);
    }
  }
  return {
    ...consolidated,
    LangText: JSON.stringify(langMapToArray(langTextMap)),
    RulesConfig: JSON.stringify(consolidated.RulesConfig ?? []),
  };
}
