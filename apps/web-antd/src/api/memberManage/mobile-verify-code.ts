import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  MobileVerifyCodeListItem,
  MobileVerifyCodeListQuery,
  MobileVerifyWhitelistItem,
  MobileVerifyWhitelistListQuery,
  MobileVerifyWhitelistPayload,
} from '#/types/mobile-verify-code';
import type {
  PhoneAreaCodeListItem,
  PhoneAreaCodeListQuery,
  PhoneAreaCodeSortPayload,
  PhoneAreaCodeSwitchPayload,
} from '#/types/phone-area-code';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

export async function fetchMobileVerifyCodeListApi(
  query: MobileVerifyCodeListQuery,
) {
  const result = await requestClient.get<
    CloudListResult<MobileVerifyCodeListItem>
  >('/backend/phoneverifycode/list', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

export async function fetchPhoneAreaCodeListApi(query: PhoneAreaCodeListQuery) {
  const result = await requestClient.get<
    CloudListResult<PhoneAreaCodeListItem> & { FrequentCount?: number }
  >('/backend/phonecountrycode/list', {
    params: trimSpace({ ...query }),
  });
  return {
    ...normalizeList(result),
    FrequentCount: result?.FrequentCount || 0,
  };
}

export function switchPhoneAreaCodeStatusApi(data: PhoneAreaCodeSwitchPayload) {
  return requestClient.post('/backend/phonecountrycode/switch', data);
}

export function switchPhoneAreaCodeFrequentlyApi(
  data: PhoneAreaCodeSwitchPayload,
) {
  return requestClient.post('/backend/phonecountrycode/frequentlyused', data);
}

export function resetPhoneAreaCodeDefaultApi() {
  return requestClient.post('/backend/phonecountrycode/resetdefault');
}

export function sortPhoneAreaCodeApi(data: PhoneAreaCodeSortPayload) {
  return requestClient.put('/backend/phonecountrycode/switchsort', data);
}

export async function fetchMobileVerifyWhitelistApi(
  query: MobileVerifyWhitelistListQuery,
) {
  const result = await requestClient.get<
    CloudListResult<MobileVerifyWhitelistItem>
  >('/backend/phoneverifycode/whitelist', {
    params: trimSpace({ ...query }),
  });
  return normalizeList(result);
}

export function addMobileVerifyWhitelistApi(
  data: MobileVerifyWhitelistPayload,
) {
  return requestClient.post('/backend/phoneverifycode/addwhitelist', data);
}

export function deleteMobileVerifyWhitelistApi(data: { PlayerIds: string }) {
  return requestClient.put('/backend/phoneverifycode/delwhitelist', data);
}

export function generateMobileVerifyCodeApi(query: {
  PlayerId: number | string;
}) {
  return requestClient.get<MobileVerifyCodeListItem>(
    '/backend/phoneverifycode/generatecode',
    { params: query },
  );
}
