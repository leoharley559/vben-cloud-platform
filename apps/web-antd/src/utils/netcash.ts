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
  1: '普通代理',
  2: '正式代理',
  3: '测试代理',
};

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
  if (rebate === '' || rebate === undefined || rebate === null || Number.isNaN(value)) {
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
