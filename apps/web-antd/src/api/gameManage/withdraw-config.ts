import { requestClient } from '#/api/request';

/** 提现风控规则/方案 Id */
export type WithdrawRiskId = number | string;

/** 提现风控规则阈值设置项 */
export interface WithdrawRiskSetting {
  /** 充值币种阈值 */
  DepositCurrency?: number;
  Number?: number;
  /** 注册币种阈值 */
  RegisterCurrency?: number;
  /** 触发条件类型 */
  Trigger?: number;
  /** 提现金额阈值 */
  WithdrawAmount?: number;
  /** 提现币种阈值 */
  WithdrawCurrency?: number;
}

/** 提现风控规则 */
export interface WithdrawRiskRule {
  /** 规则缩写标识 */
  Abbr?: string;
  Id: WithdrawRiskId;
  Index?: number;
  /** 是否自动审核（1 是 / 0 否） */
  IsAutoVerify?: number;
  /** 规则等级 */
  Level?: number;
  /** 规则名称 */
  Name: string;
  Number?: number | string;
  /** 阈值配置（JSON 字符串或结构化数组） */
  Setting?: string | WithdrawRiskSetting[];
  /** 启用状态 */
  Status?: number;
  Str?: (number | string)[] | string;
}

/** 提现风控方案 */
export interface WithdrawRiskScheme {
  Id: WithdrawRiskId;
  /** 方案名称 */
  Name: string;
  /** 方案类型 */
  SchemeType?: boolean | number;
}

/**
 * 查询提现风控规则。
 *
 * @param Id 记录 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawRiskRulesApi(Id: WithdrawRiskId) {
  return requestClient.get<WithdrawRiskRule[] | null>(
    '/backend/withdrawautoconfig/list',
    { params: { Id } },
  );
}

/**
 * 保存提现风控规则（旧接口走 query 传参）
 *
 * @param rule 风控规则完整字段
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function updateWithdrawRiskRuleApi(rule: WithdrawRiskRule) {
  return requestClient.put('/backend/withdrawautoconfig', undefined, {
    params: rule,
  });
}

/**
 * 查询提现风控方案。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/withdrawConfig
 */
export function fetchWithdrawRiskSchemesApi() {
  return requestClient.get<WithdrawRiskScheme[] | null>(
    '/backend/withdrawautoconfig/listSchemeName',
  );
}

/**
 * 新增提现风控方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/withdrawConfig
 */
export function createWithdrawRiskSchemeApi(data: { Name: string }) {
  return requestClient.post('/backend/withdrawautoconfig/addSchemeName', data);
}

/**
 * 重命名提现风控方案。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function renameWithdrawRiskSchemeApi(data: {
  Id: WithdrawRiskId;
  Name: string;
}) {
  return requestClient.put('/backend/withdrawautoconfig/editSchemeName', data);
}

/**
 * 删除提现风控方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/withdrawConfig
 */
export function deleteWithdrawRiskSchemeApi(id: WithdrawRiskId) {
  return requestClient.delete(
    `/backend/withdrawautoconfig/deleteSchemeName/${id}`,
  );
}

/**
 * 重置提现风控方案。
 *
 * @param id 记录 ID
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/withdrawConfig
 */
export function resetWithdrawRiskSchemeApi(id: WithdrawRiskId) {
  return requestClient.put(`/backend/withdrawautoconfig/default/${id}`);
}

