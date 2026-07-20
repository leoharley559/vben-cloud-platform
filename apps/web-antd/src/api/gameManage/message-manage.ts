import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface SmsListResult<T = Record<string, unknown>> {
  Items?: T[];
  Message?: string;
  Pagination?: { MaxCount?: number };
  Switch?: { IsAuto?: boolean; IsOpen?: boolean };
  Total?: number | Record<string, unknown>;
  [key: string]: unknown;
}

export interface SmsChannelListResult {
  CurrentSmsAnnouncementConfigId?: number | string;
  CurrentSmsConfigId?: number | string;
  Items?: Array<Record<string, unknown>>;
  Pagination?: { MaxCount?: number };
  RecallSmsConfigId?: number | string;
}

export function fetchSmsDailyListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>('/backend/shortmessageservice/list', {
    params: trimSpace(query),
  });
}

export function fetchSmsOverviewApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/shortmessageservice/info',
  );
}

export function buySmsApi(data: { Hash: string; Num: number }) {
  return requestClient.put('/backend/shortmessageservice/buy', data);
}

export function updateSmsAutoBuyApi(Auto: 1 | 2) {
  return requestClient.put('/backend/shortmessageservice/auto', { Auto });
}

export function fetchSmsMonthlyListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/shortmessageservice/monthlist',
    { params: trimSpace(query) },
  );
}

export function fetchSmsChannelsApi(query: Record<string, unknown> = {}) {
  return requestClient.get<SmsChannelListResult>(
    '/backend/smschannelconfig/list',
    { params: trimSpace(query) },
  );
}

export function changeSmsChannelApi(data: {
  Id: number | string;
  Type: 1 | 2;
}) {
  return requestClient.post('/backend/smschannelconfig/changechannel', data);
}

export function changeAnnouncementSmsChannelApi(Id: number | string) {
  return requestClient.put('/backend/smschannelconfig/changeannchannel', {
    Id,
  });
}

export function updateSmsChannelConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/smschannelconfig/updateconfig', data);
}

export function fetchSmsTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/smsannouncementconfig/list',
    { params: trimSpace(query) },
  );
}

export function updateSmsTemplateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/smsannouncementconfig/editpackage', data);
}

export function switchSmsTemplateApi(data: {
  Id: number | string;
  IsOpen: number;
}) {
  return requestClient.put('/backend/smsannouncementconfig/switch', data);
}

export function fetchRegisterOtpDailyApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/operation/phoneregisterotpday',
    { params: trimSpace(query) },
  );
}

export function fetchRegisterOtpDetailApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/operation/phoneregisterotpdetail',
    { params: trimSpace(query) },
  );
}

const recallPath = (type: 'deposit' | 'register') =>
  type === 'register' ? 'registerrecall' : 'depositrecall';

export function fetchRecallListApi(
  type: 'deposit' | 'register',
  query: Record<string, unknown>,
) {
  return requestClient.get<SmsListResult>(
    `/backend/operation/${recallPath(type)}`,
    { params: trimSpace(query) },
  );
}

export function fetchRecallDetailApi(
  type: 'deposit' | 'register',
  query: Record<string, unknown>,
) {
  return requestClient.get<SmsListResult>(
    `/backend/operation/${recallPath(type)}detail`,
    { params: trimSpace(query) },
  );
}

export function sendRecallApi(
  type: 'deposit' | 'register',
  BeginTime: string,
) {
  return requestClient.put(
    `/backend/operation/${recallPath(type)}send`,
    { BeginTime },
  );
}

export function updateRecallSwitchApi(
  type: 'deposit' | 'register',
  config: { IsAuto: boolean; IsOpen: boolean },
) {
  return requestClient.put(
    `/backend/operation/${recallPath(type)}switch`,
    { Config: JSON.stringify(config) },
  );
}
