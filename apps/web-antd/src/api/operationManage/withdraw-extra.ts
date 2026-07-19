import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  SendOrderManageItem,
  WithdrawFinanceItem,
  WithdrawOrderStatItem,
  WithdrawRevertedItem,
  WithdrawWaterItem,
  WithdrawWhiteItem,
} from '#/types/withdraw-extra';
import { trimSpace } from '#/utils/string';

export function fetchWithdrawWhiteListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawWhiteItem>>(
    '/backend/withdrawwhitelist/list',
    { params: trimSpace(query) },
  );
}

export function createWithdrawWhiteApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawwhitelist/', data);
}

export function updateWithdrawWhiteApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawwhitelist/', data);
}

export function deleteWithdrawWhiteApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawwhitelist/${id}`);
}

export function fetchWithdrawWhiteDetailApi(id: number | string) {
  return requestClient.get(`/backend/withdrawwhitelist/${id}`);
}

export function fetchSendOrderManageListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<SendOrderManageItem>>(
    '/backend/withdrawsendorderusermanage/list',
    { params: query },
  );
}

export function fetchSendOrderManageDetailApi(id: number | string) {
  return requestClient.get<SendOrderManageItem>(
    `/backend/withdrawsendorderusermanage/${id}`,
  );
}

export function createSendOrderManageApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/withdrawsendorderusermanage/', data);
}

export function updateSendOrderManageApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderusermanage/', data);
}

export function deleteSendOrderManageApi(id: number | string) {
  return requestClient.delete(`/backend/withdrawsendorderusermanage/${id}`);
}

/** 风控方案列表（取默认方案 Id） */
export function fetchWithdrawAutoSchemeListApi() {
  return requestClient.get<
    Array<{ Id?: number | string; SchemeType?: number | string }>
  >('/backend/withdrawautoconfig/listSchemeName');
}

/** 派单规则配置（按方案 Id） */
export function fetchWithdrawAutoConfigListApi(params: {
  Id: number | string;
}) {
  return requestClient.get<
    Array<{ Abbr?: string; Id?: number | string; Name?: string }>
  >('/backend/withdrawautoconfig/list', { params });
}

export function fetchSendOrderSwitchApi() {
  return requestClient.get('/backend/withdrawautoswitch/getswitch2');
}

export function updateSendOrderSwitchApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawautoswitch/sameswitch2/', data);
}

export function fetchSendOrderListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawFinanceItem>>(
    '/backend/withdrawsendorderlist/list',
    { params: trimSpace(query) },
  );
}

export function updateSendOrderListApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/withdrawsendorderlist/', data);
}

export function updateSendOrderWorkStatusApi(data: Record<string, unknown>) {
  return requestClient.post(
    '/backend/withdrawsendorderusermanage/startwork',
    data,
  );
}

export function pingSendOrderOnlineApi() {
  return requestClient.post('/backend/withdrawsendorderusermanage/ping');
}

export function fetchWithdrawFinanceListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawFinanceItem>>(
    '/backend/withdrawfinancelist/list',
    { params: trimSpace(query) },
  );
}

export function fetchWithdrawOrderStatApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawOrderStatItem>>(
    '/backend/playerwithdrawreport/list',
    { params: query },
  );
}

export function fetchWithdrawRevertedListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawRevertedItem>>(
    '/backend/playerwithdraw/revertedlist',
    { params: trimSpace(query) },
  );
}

export function fetchWithdrawWaterListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<WithdrawWaterItem>>(
    '/backend/playerwithdrawflow/list',
    { params: query },
  );
}

export function updateWithdrawWaterStatusApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/playerwithdrawflow/editMore', data);
}

export function fetchWithdrawWaterStatusLogApi(id: number | string) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    `/backend/playerwithdrawflow/statusLog/${id}`,
  );
}

export function fetchWithdrawWaterFlowSettingListApi() {
  return requestClient.get<{
    Items?: Array<{
      BalanceAmount?: number;
      Id?: number | string;
      NegativeProfitAmount?: number;
      [key: string]: unknown;
    }>;
    Switch?: number;
  }>('/backend/playerwithdrawflow/flowList');
}

export function createWithdrawWaterFlowSettingApi(
  data: Record<string, unknown>,
) {
  return requestClient.post('/backend/playerwithdrawflow/', data);
}

export function updateWithdrawWaterFlowSettingApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/playerwithdrawflow/', data);
}

export function deleteWithdrawWaterFlowSettingApi(id: number | string) {
  return requestClient.delete(`/backend/playerwithdrawflow/${id}`);
}

export function switchWithdrawWaterFlowSettingApi(data: { Switch: number }) {
  return requestClient.put('/backend/playerwithdrawflow/switch', data);
}
