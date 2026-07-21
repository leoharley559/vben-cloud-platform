import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 短信/召回等模块通用列表响应 */
export interface SmsListResult<T = Record<string, unknown>> {
  Items?: T[];
  Message?: string;
  Pagination?: { MaxCount?: number };
  Switch?: { IsAuto?: boolean; IsOpen?: boolean };
  Total?: number | Record<string, unknown>;
  [key: string]: unknown;
}

/** 短信通道配置列表响应 */
export interface SmsChannelListResult {
  /** 当前公告短信通道配置 Id */
  CurrentSmsAnnouncementConfigId?: number | string;
  /** 当前短信通道配置 Id */
  CurrentSmsConfigId?: number | string;
  Items?: Array<Record<string, unknown>>;
  Pagination?: { MaxCount?: number };
  /** 召回短信通道配置 Id */
  RecallSmsConfigId?: number | string;
}

/**
 * 查询短信日列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchSmsDailyListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>('/backend/shortmessageservice/list', {
    params: trimSpace(query),
  });
}

/**
 * 查询短信概览。
 *
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchSmsOverviewApi() {
  return requestClient.get<Record<string, unknown>>(
    '/backend/shortmessageservice/info',
  );
}

/**
 * 购买短信。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function buySmsApi(data: { Hash: string; Num: number }) {
  return requestClient.put('/backend/shortmessageservice/buy', data);
}

/**
 * 更新短信自动Buy。
 *
 * @param Auto 自动购买开关（1 开启 / 2 关闭）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function updateSmsAutoBuyApi(Auto: 1 | 2) {
  return requestClient.put('/backend/shortmessageservice/auto', { Auto });
}

/**
 * 查询短信Monthly列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchSmsMonthlyListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/shortmessageservice/monthlist',
    { params: trimSpace(query) },
  );
}

/**
 * 查询短信通道。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchSmsChannelsApi(query: Record<string, unknown> = {}) {
  return requestClient.get<SmsChannelListResult>(
    '/backend/smschannelconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 变更短信渠道。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function changeSmsChannelApi(data: {
  Id: number | string;
  Type: 1 | 2;
}) {
  return requestClient.post('/backend/smschannelconfig/changechannel', data);
}

/**
 * 变更公告短信渠道。
 *
 * @param Id 记录 ID
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function changeAnnouncementSmsChannelApi(Id: number | string) {
  return requestClient.put('/backend/smschannelconfig/changeannchannel', {
    Id,
  });
}

/**
 * 更新短信渠道配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function updateSmsChannelConfigApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/smschannelconfig/updateconfig', data);
}

/**
 * 查询短信模板列表。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchSmsTemplateListApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/smsannouncementconfig/list',
    { params: trimSpace(query) },
  );
}

/**
 * 更新短信模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function updateSmsTemplateApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/smsannouncementconfig/editpackage', data);
}

/**
 * 切换短信模板。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function switchSmsTemplateApi(data: {
  Id: number | string;
  IsOpen: number;
}) {
  return requestClient.put('/backend/smsannouncementconfig/switch', data);
}

/**
 * 查询注册验证码日。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchRegisterOtpDailyApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/operation/phoneregisterotpday',
    { params: trimSpace(query) },
  );
}

/**
 * 查询注册验证码明细。
 *
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchRegisterOtpDetailApi(query: Record<string, unknown>) {
  return requestClient.get<SmsListResult>(
    '/backend/operation/phoneregisterotpdetail',
    { params: trimSpace(query) },
  );
}

/**
 * 按召回类型拼出 operation 子路径名。
 *
 * @param type `register` → registerrecall；否则 depositrecall
 * @returns 路径片段（不含 `/backend/operation/` 前缀）
 */
const recallPath = (type: 'deposit' | 'register') =>
  type === 'register' ? 'registerrecall' : 'depositrecall';

/**
 * 查询召回列表。
 *
 * @param type 类型（如 summary/detail、deposit/register）
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchRecallListApi(
  type: 'deposit' | 'register',
  query: Record<string, unknown>,
) {
  return requestClient.get<SmsListResult>(
    `/backend/operation/${recallPath(type)}`,
    { params: trimSpace(query) },
  );
}

/**
 * 查询召回明细。
 *
 * @param type 类型（如 summary/detail、deposit/register）
 * @param query 查询条件（分页、筛选等）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/messageManage
 */
export function fetchRecallDetailApi(
  type: 'deposit' | 'register',
  query: Record<string, unknown>,
) {
  return requestClient.get<SmsListResult>(
    `/backend/operation/${recallPath(type)}detail`,
    { params: trimSpace(query) },
  );
}

/**
 * 发送召回。
 *
 * @param type 类型（如 summary/detail、deposit/register）
 * @param BeginTime 召回起始时间
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function sendRecallApi(
  type: 'deposit' | 'register',
  BeginTime: string,
) {
  return requestClient.put(
    `/backend/operation/${recallPath(type)}send`,
    { BeginTime },
  );
}

/**
 * 更新召回开关。
 *
 * @param type 类型（如 summary/detail、deposit/register）
 * @param config 开关配置（IsAuto、IsOpen）
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/messageManage
 */
export function updateRecallSwitchApi(
  type: 'deposit' | 'register',
  config: { IsAuto: boolean; IsOpen: boolean },
) {
  return requestClient.put(
    `/backend/operation/${recallPath(type)}switch`,
    { Config: JSON.stringify(config) },
  );
}

