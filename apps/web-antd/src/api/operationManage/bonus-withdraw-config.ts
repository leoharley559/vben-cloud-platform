import { requestClient } from '#/api/request';

/** 彩金提现活动配置 */
export interface BonusWithdrawConfig {
  /** 自动倒计时（秒） */
  AutoCountdown?: number | string;
  /** 展示元素配置（JSON 或结构化数组） */
  Param?: Array<Record<string, unknown>> | string;
  /** 用户侧倒计时（秒） */
  UserCountdown?: number | string;
}

/**
 * 获取彩金提现活动倒计时及元素配置
 * @returns 彩金提现配置（倒计时、展示元素 Param 等）
 * @see views/operationalManage/activity/components/activity-bonus-withdraw-panel.vue
 */
export function fetchBonusWithdrawConfigApi() {
  return requestClient.get<BonusWithdrawConfig>('/backend/bonuswithdrawconfig');
}

/**
 * 更新彩金提现活动倒计时配置
 * @param data 倒计时参数（AutoCountdown、UserCountdown 等）
 * @returns 接口操作结果
 * @see views/operationalManage/activity/components/activity-bonus-withdraw-panel.vue
 */
export function updateBonusWithdrawCountdownApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/bonuswithdrawconfig/editcountdown', data);
}

/**
 * 更新彩金提现活动展示元素配置
 * @param data 元素配置表单（Param 等）
 * @returns 接口操作结果
 * @see views/operationalManage/activity/components/activity-bonus-withdraw-panel.vue
 */
export function updateBonusWithdrawElementApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/bonuswithdrawconfig/editconfig', data);
}
