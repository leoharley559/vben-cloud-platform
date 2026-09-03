import type { CloudProjectConfig } from '#/types/cloud-platform';
import type {
  AgentFanDianConfig,
  AgentFanDianGrade,
  AgentFanDianLine,
} from '#/types/netcash';

export const AGENCY_STATUS_MAP: Record<number, string> = {
  1: '启用',
  2: '停用',
};

export const AGENCY_TYPE_MAP: Record<number, string> = {
  1: '普通',
  2: '官方',
  3: '测试',
};

/** 新增/编辑弹窗代理类型（对齐旧站 formTypeList: normal / formal） */
export const AGENCY_TYPE_FORM_OPTIONS = [
  { label: '普通', value: 1 },
  { label: '官方', value: 2 },
] as const;

export const AGENCY_TYPE_FORM_OPTIONS_WITH_TEST = [
  ...AGENCY_TYPE_FORM_OPTIONS,
  { label: '测试', value: 3 },
] as const;

export const AGENCY_ACCOUNT_TYPE_MAP: Record<number, string> = {
  1: '单层',
  2: '多层单费率',
  3: '多层多费率',
};

export const AGENCY_SETTLEMENT_TYPE_MAP: Record<number, string> = {
  1: '日结',
  2: '周结',
  3: '月结',
};

export const AGENCY_SEND_COMMISSION_TYPE_MAP: Record<number, string> = {
  1: '系统发放一级代理',
  2: '系统发放全部代理',
};

/** 代理备注操作类型（对齐旧站 overview statusFilter） */
export const AGENCY_REMARK_TYPE_MAP: Record<number, string> = {
  1: '新增',
  2: '编辑',
  3: '启用',
  4: '停用',
};

export const SPILL_STATUS_MAP: Record<number, string> = {
  1: '申请中',
  2: '已通过',
  3: '已拒绝',
};

export const SPILL_STATUS_COLOR: Record<number, string> = {
  1: 'processing',
  2: 'success',
  3: 'error',
};

export const REGISTER_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};

export function formatNetcashDateTime(value?: number | string) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    Number(value) === 0
  ) {
    return '-';
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).length >= 10) {
    const ms = String(value).length > 10 ? numeric : numeric * 1000;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  return String(value);
}

/** 接口下发的 AgentFanDianConfig 可能是 JSON 字符串 */
function parseAgentFanDianRaw(raw: unknown) {
  if (raw === undefined || raw === null || raw === '') {
    return null;
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? raw : null;
}

/** 统一等级结构；兼容旧版每等级直接是数组 */
function normalizeAgentFanDianShape(raw: unknown): AgentFanDianConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const out: AgentFanDianConfig = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      out[key] = {
        earnestMoney: 0,
        effectiveFlow: 0,
        gameConfigList: value as AgentFanDianLine[],
        name: '',
      };
      continue;
    }
    const grade = value as AgentFanDianGrade;
    if (grade && Array.isArray(grade.gameConfigList)) {
      out[key] = {
        earnestMoney: grade.earnestMoney ?? 0,
        effectiveFlow: grade.effectiveFlow ?? 0,
        gameConfigList: grade.gameConfigList,
        name: grade.name ?? '',
      };
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function getAgentFanDianLines(grade?: AgentFanDianGrade) {
  return Array.isArray(grade?.gameConfigList) ? grade.gameConfigList : [];
}

/**
 * rebate 存储格式探测：任一绝对值 >= 0.1 视为百分比数值（2.6 = 2.6%），
 * 否则视为小数比例（0.026 = 2.6%）。与旧站保持一致。
 */
function isPercentStorage(config: AgentFanDianConfig) {
  return Object.values(config).some((grade) =>
    getAgentFanDianLines(grade).some((line) => {
      const value = Math.abs(Number(line?.rebate));
      return !Number.isNaN(value) && value >= 0.1;
    }),
  );
}

/** 解析并把 rebate 统一成小数比例，展示时再 ×100 */
export function parseAgentFanDianConfig(raw: unknown) {
  const config = normalizeAgentFanDianShape(parseAgentFanDianRaw(raw));
  if (!config) {
    return null;
  }
  if (!isPercentStorage(config)) {
    return config;
  }
  const normalized: AgentFanDianConfig = {};
  for (const [key, grade] of Object.entries(config)) {
    normalized[key] = {
      ...grade,
      gameConfigList: getAgentFanDianLines(grade).map((line) => {
        const value = Number(line?.rebate);
        return Number.isNaN(value)
          ? line
          : { ...line, rebate: Number((value / 100).toFixed(6)) };
      }),
    };
  }
  return normalized;
}

/** grade_S → S级代理 */
export function formatAgentFanDianGradeTitle(gradeKey: string) {
  const matched = /^grade_(.+)$/i.exec(gradeKey);
  return `${matched ? matched[1] : gradeKey}级代理`;
}

export function formatAgentFanDianRebate(rebate?: number | string) {
  const value = Number(rebate);
  if (
    rebate === '' ||
    rebate === undefined ||
    rebate === null ||
    Number.isNaN(value)
  ) {
    return '-';
  }
  return `${(value * 100).toFixed(2)}%`;
}

export function formatAgentFanDianFlow(effectiveFlow?: number | string) {
  const value = Number(effectiveFlow);
  if (
    effectiveFlow === '' ||
    effectiveFlow === undefined ||
    effectiveFlow === null ||
    Number.isNaN(value)
  ) {
    return '';
  }
  return value.toFixed(2);
}

/** 对齐旧站 agencyList IacOptions */
export const AGENCY_PHONE_AREA_CODE_OPTIONS = [
  { label: '+86', value: '86_' },
  { label: '+1', value: '1_' },
  { label: '+60', value: '60_' },
  { label: '+62', value: '62_' },
  { label: '+63', value: '63_' },
  { label: '+65', value: '65_' },
  { label: '+66', value: '66_' },
  { label: '+81', value: '81_' },
  { label: '+82', value: '82_' },
  { label: '+84', value: '84_' },
  { label: '+853', value: '853_' },
  { label: '+855', value: '855_' },
  { label: '+886', value: '886_' },
  { label: '+852', value: '852_' },
] as const;

export function getAgentFanDianProjectConfig(
  projectConfig: CloudProjectConfig | null | undefined,
) {
  const list = projectConfig?.ProjectConfig;
  if (!Array.isArray(list)) {
    return null;
  }
  const row = list.find((item) => item?.Key === 'AgentFanDianConfig') as
    | { Value?: string; ValueString?: string }
    | undefined;
  const raw = row?.ValueString || row?.Value;
  return normalizeAgentFanDianShape(parseAgentFanDianRaw(raw));
}

export function normalizeAgentFanDianConfigToFormShape(raw: unknown) {
  return normalizeAgentFanDianShape(parseAgentFanDianRaw(raw));
}

function detectAgentFanDianRebateStorageFormat(formNorm: AgentFanDianConfig) {
  let hasGteOne = false;
  let hasTenthToOne = false;
  for (const grade of Object.values(formNorm)) {
    for (const line of getAgentFanDianLines(grade)) {
      const value = Number(line?.rebate);
      if (Number.isNaN(value)) {
        continue;
      }
      const abs = Math.abs(value);
      if (abs >= 1) {
        hasGteOne = true;
      }
      if (abs >= 0.1 && abs < 1) {
        hasTenthToOne = true;
      }
    }
  }
  if (hasGteOne || hasTenthToOne) {
    return 'percent' as const;
  }
  return 'ratio' as const;
}

function rebateFromApiOrLegacyRatioToInternal(
  value: number,
  storageFormat: 'percent' | 'ratio' = 'percent',
) {
  if (value === 0 || Number.isNaN(value)) {
    return 0;
  }
  if (storageFormat === 'ratio') {
    return Number(value);
  }
  return Number((value / 100).toFixed(6));
}

/** Vue reactive 对象不能 structuredClone，用 JSON 深拷贝 plain 数据 */
function clonePlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** 任意存储格式 → 表单内部小数比例 */
export function applyRebateStorageFormatToInternal(
  formNorm: AgentFanDianConfig | null,
) {
  if (!formNorm) {
    return null;
  }
  const clone = clonePlainJson(formNorm);
  if (detectAgentFanDianRebateStorageFormat(clone) === 'ratio') {
    return clone;
  }
  for (const grade of Object.values(clone)) {
    for (const line of getAgentFanDianLines(grade)) {
      if (line.rebate == null || line.rebate === '') {
        continue;
      }
      const parsed = Number(line.rebate);
      if (Number.isNaN(parsed)) {
        continue;
      }
      line.rebate = rebateFromApiOrLegacyRatioToInternal(parsed, 'percent');
    }
  }
  return clone;
}

/** 提交：表单内 rebate 为小数比例，接口用百分比数值 */
export function serializeAgentFanDianConfigForSubmit(
  source: AgentFanDianConfig,
) {
  const clone = clonePlainJson(source);
  for (const grade of Object.values(clone)) {
    for (const line of getAgentFanDianLines(grade)) {
      if (
        line.rebate === '' ||
        line.rebate === null ||
        line.rebate === undefined
      ) {
        continue;
      }
      const value = Number(line.rebate);
      if (Number.isNaN(value)) {
        continue;
      }
      line.rebate = Number((value * 100).toFixed(4));
    }
  }
  return clone;
}

export function fanDianRebateAsPercent(rebate?: number | string) {
  const value = Number(rebate);
  if (
    rebate === '' ||
    rebate === undefined ||
    rebate === null ||
    Number.isNaN(value)
  ) {
    return 0;
  }
  return Number((value * 100).toFixed(2));
}

export function setFanDianRebatePercent(
  line: AgentFanDianLine,
  percentVal: null | number | string | undefined,
) {
  if (percentVal === null || percentVal === undefined || percentVal === '') {
    line.rebate = 0;
    return;
  }
  const percent = Number(percentVal);
  line.rebate = Number.isNaN(percent) ? 0 : Number((percent / 100).toFixed(4));
}

export function initAgentFanDianFormFromProject(
  projectConfig: CloudProjectConfig | null | undefined,
) {
  const config = getAgentFanDianProjectConfig(projectConfig);
  if (!config) {
    return null;
  }
  return applyRebateStorageFormatToInternal(config);
}

export function initAgentFanDianFormFromAgent(
  projectConfig: CloudProjectConfig | null | undefined,
  raw: unknown,
) {
  const base = initAgentFanDianFormFromProject(projectConfig);
  if (!base) {
    return null;
  }
  const saved = applyRebateStorageFormatToInternal(
    normalizeAgentFanDianConfigToFormShape(raw),
  );
  if (!saved) {
    return base;
  }
  for (const [gradeKey, grade] of Object.entries(base)) {
    const savedGrade = saved[gradeKey];
    if (!savedGrade || !Array.isArray(grade.gameConfigList)) {
      continue;
    }
    if (savedGrade.name) {
      grade.name = savedGrade.name;
    }
    if (savedGrade.effectiveFlow != null) {
      grade.effectiveFlow = savedGrade.effectiveFlow;
    }
    if (savedGrade.earnestMoney != null) {
      grade.earnestMoney = savedGrade.earnestMoney;
    }
    const savedLines = getAgentFanDianLines(savedGrade);
    const byId = Object.fromEntries(
      savedLines
        .filter((line) => line?.id != null)
        .map((line) => [String(line.id), line]),
    );
    for (const row of grade.gameConfigList) {
      const hit = row.id == null ? undefined : byId[String(row.id)];
      if (!hit) {
        continue;
      }
      if (hit.name) {
        row.name = hit.name;
      }
      if (hit.type) {
        row.type = hit.type;
      }
      if (hit.rebate != null && hit.rebate !== '') {
        row.rebate = hit.rebate;
      }
    }
  }
  return base;
}

export function formatAgentFanDianGradeEffectiveFlow(
  grade?: AgentFanDianGrade,
) {
  if (
    grade?.effectiveFlow == null ||
    grade.effectiveFlow === '' ||
    Number.isNaN(Number(grade.effectiveFlow))
  ) {
    return '';
  }
  return Number(grade.effectiveFlow).toFixed(2);
}

function randomDeviceSegment(length: number, digitCount: number) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const chars: Array<number | string> = [];
  for (let index = 0; index < length; index += 1) {
    chars.push(letters[Math.round(Math.random() * 26)] ?? 'a');
  }
  for (let index = 0; index < digitCount; index += 1) {
    const position = Math.round(Math.random() * (chars.length - 1));
    chars[position] = Math.round(Math.random() * 9);
  }
  return chars.join('');
}

/** 对齐旧站 setFacilityId：localStorage DeviceId_serial */
export function getOrCreateAgencyDeviceId() {
  const key = 'DeviceId_serial';
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const id = `${randomDeviceSegment(8, 5)}-${randomDeviceSegment(4, 5)}--${randomDeviceSegment(4, 5)}--${randomDeviceSegment(4, 5)}-${randomDeviceSegment(12, 8)}`;
  localStorage.setItem(key, id);
  return id;
}

export function validAgencyRemark(value: string) {
  if (!value) {
    return false;
  }
  return /^[\s\S]{1,400}$/.test(value);
}

export const WITHDRAW_STATUS_MAP: Record<number, string> = {
  1: '待处理',
  2: '处理中',
  3: '已完成',
  4: '已拒绝',
};

export const BONUS_APPROVE_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};

export const CREDIT_APPROVE_STATUS_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
};
