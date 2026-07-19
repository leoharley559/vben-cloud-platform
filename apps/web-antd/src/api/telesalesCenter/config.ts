import { requestClient } from '#/api/request';
import { toTelesalesListResult } from '#/types/telesales-center';
import { trimSpace } from '#/utils/string';

export function fetchAutoAssignConfigListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getlistautoassignconfig', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}

export function fetchBindAgentListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getbindagent', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

export function fetchSeatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getseatlist', { params: trimSpace(query) })
    .then(toTelesalesListResult);
}

export function fetchSalesCategoryListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getsalescatlist', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}

export function fetchServiceProviderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<{
      Items?: Record<string, unknown>[];
      Pagination?: { MaxCount?: number };
    }>('/backend/configmanagement/getserviceproviderlist', {
      params: trimSpace(query),
    })
    .then(toTelesalesListResult);
}
