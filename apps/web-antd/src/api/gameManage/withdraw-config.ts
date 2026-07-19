import { requestClient } from '#/api/request';

export type WithdrawRiskId = number | string;

export interface WithdrawRiskSetting {
  DepositCurrency?: number;
  Number?: number;
  RegisterCurrency?: number;
  Trigger?: number;
  WithdrawAmount?: number;
  WithdrawCurrency?: number;
}

export interface WithdrawRiskRule {
  Abbr?: string;
  Id: WithdrawRiskId;
  Index?: number;
  IsAutoVerify?: number;
  Level?: number;
  Name: string;
  Number?: number | string;
  Setting?: string | WithdrawRiskSetting[];
  Status?: number;
  Str?: (number | string)[] | string;
}

export interface WithdrawRiskScheme {
  Id: WithdrawRiskId;
  Name: string;
  SchemeType?: boolean | number;
}

export function fetchWithdrawRiskRulesApi(Id: WithdrawRiskId) {
  return requestClient.get<WithdrawRiskRule[] | null>(
    '/backend/withdrawautoconfig/list',
    { params: { Id } },
  );
}

/** 旧接口通过 query string 接收完整规则，而非 JSON body。 */
export function updateWithdrawRiskRuleApi(rule: WithdrawRiskRule) {
  return requestClient.put('/backend/withdrawautoconfig', undefined, {
    params: rule,
  });
}

export function fetchWithdrawRiskSchemesApi() {
  return requestClient.get<WithdrawRiskScheme[] | null>(
    '/backend/withdrawautoconfig/listSchemeName',
  );
}

export function createWithdrawRiskSchemeApi(data: { Name: string }) {
  return requestClient.post('/backend/withdrawautoconfig/addSchemeName', data);
}

export function renameWithdrawRiskSchemeApi(data: {
  Id: WithdrawRiskId;
  Name: string;
}) {
  return requestClient.put('/backend/withdrawautoconfig/editSchemeName', data);
}

export function deleteWithdrawRiskSchemeApi(id: WithdrawRiskId) {
  return requestClient.delete(
    `/backend/withdrawautoconfig/deleteSchemeName/${id}`,
  );
}

export function resetWithdrawRiskSchemeApi(id: WithdrawRiskId) {
  return requestClient.put(`/backend/withdrawautoconfig/default/${id}`);
}
