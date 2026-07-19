import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export function fetchActivityListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/list',
    { params: trimSpace(query) },
  );
}

export function fetchActivityHistoryListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesconfig/history',
    { params: trimSpace(query) },
  );
}

export function fetchActivityTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesdefaultconfig/list',
    { params: query },
  );
}

export function fetchActivityOwnTemplateListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/operationactivitiesdefaultconfig/list',
    {
      params: {
        ...query,
        IsTemplate: true,
      },
    },
  );
}

export function fetchActivityTypeListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activitytype/list',
    { params: query },
  );
}

export function fetchInviteActivityListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerinvitefunc/listdetail',
    { params: trimSpace(query) },
  );
}

export function fetchDepositPromoListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerrechargeofferscheme/list',
    { params: query },
  );
}

export function fetchDepositPromoClaimHistoryApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playerpaydiscount/list',
    { params: trimSpace(query) },
  );
}

export function fetchAppointmentWithdrawListApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/reservewithdrawactivity/list',
    { params: trimSpace(query) },
  );
}

export function fetchReserveWithdrawActivityApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/reservewithdrawactivity',
  );
}

export function updateReserveWithdrawActivityApi(
  data: Record<string, unknown>,
) {
  return requestClient.put('/backend/reservewithdrawactivity', data);
}

export function fetchNewPlayerDrawListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/newplayerdrawconfig/list',
    { params: trimSpace(query) },
  );
}

export function fetchActivityChangeLogListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/activitychangelog/list',
    { params: trimSpace(query) },
  );
}

export function fetchDailyCheckInListApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dailycheckin/list',
    { params: trimSpace(query) },
  );
}

export function fetchDailyCheckInPlayerRecordApi(
  query: Record<string, unknown>,
) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/dailycheckin/playerrecord',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerAgentReportApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragentreport',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerAgentTransactionApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragenttransaction',
    { params: trimSpace(query) },
  );
}

export function fetchPlayerAgentTeamApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/playeragent/listplayeragentteam',
    { params: trimSpace(query) },
  );
}

/** 当前活动下架/关闭 */
export function offshelfActivityApi(data: { ActivityId: number | string }) {
  return requestClient.put('/backend/operationactivitiesconfig/offshelf', data);
}
