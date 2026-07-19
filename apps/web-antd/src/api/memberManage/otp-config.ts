import { requestClient } from '#/api/request';
import type { OtpConfigItem, OtpConfigPayload } from '#/types/otp-config';

export function fetchOtpConfigApi() {
  return requestClient.get<OtpConfigItem[]>('/backend/gameotpconfig/getconfig');
}

export function updateOtpConfigApi(data: OtpConfigPayload) {
  return requestClient.put('/backend/gameotpconfig/editconfig', data);
}
