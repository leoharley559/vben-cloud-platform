import { requestClient } from '#/api/request';

export interface BonusWithdrawConfig {
  AutoCountdown?: number | string;
  Param?: Array<Record<string, unknown>> | string;
  UserCountdown?: number | string;
}

export function fetchBonusWithdrawConfigApi() {
  return requestClient.get<BonusWithdrawConfig>('/backend/bonuswithdrawconfig');
}

export function updateBonusWithdrawCountdownApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/bonuswithdrawconfig/editcountdown', data);
}

export function updateBonusWithdrawElementApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/bonuswithdrawconfig/editconfig', data);
}
