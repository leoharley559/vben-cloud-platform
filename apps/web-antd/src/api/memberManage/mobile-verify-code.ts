import type {
  MobileVerifyCodeListItem,
  MobileVerifyCodeListQuery,
  MobileVerifyWhitelistItem,
  MobileVerifyWhitelistListQuery,
  MobileVerifyWhitelistPayload,
} from '#/types/mobile-verify-code';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  PhoneAreaCodeListItem,
  PhoneAreaCodeListQuery,
  PhoneAreaCodeSortPayload,
  PhoneAreaCodeSwitchPayload,
} from '#/types/phone-area-code';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

function normalizeList<T>(result: CloudListResult<T> | null | undefined) {
  return {
    Items: result?.Items || [],
    Pagination: result?.Pagination,
  };
}

/**
 * 手机验证码查询列表（验证码管理 · 手机验证码 Tab / 移动云验证码页）。
 *
 * @param query 查询参数（玩家、手机号、时间等筛选及分页）
 * @returns 手机验证码行 Items 及 Pagination
 * @see views/memberManage/verifyCode/components/mobile-code-query-list.vue
 * @see views/mobileCloud/verifyCode/index.vue
 */
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

/**
 * 手机区号列表（验证码管理 · 手机区号 Tab）。
 *
 * @param query 查询参数（国家/区号、启用状态等筛选及分页）
 * @returns 区号行 Items、Pagination 及 FrequentCount 常用区号数量
 * @see views/memberManage/verifyCode/components/mobile-area-code-list.vue
 */
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

/**
 * 切换手机区号启用状态（验证码管理 · 手机区号 Tab 开关操作）。
 *
 * @param data 区号 Id 及目标开关状态
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-area-code-list.vue
 */
export function switchPhoneAreaCodeStatusApi(data: PhoneAreaCodeSwitchPayload) {
  return requestClient.post('/backend/phonecountrycode/switch', data);
}

/**
 * 切换手机区号「常用」标记（验证码管理 · 手机区号 Tab 常用操作）。
 *
 * @param data 区号 Id 及常用开关状态
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-area-code-list.vue
 */
export function switchPhoneAreaCodeFrequentlyApi(
  data: PhoneAreaCodeSwitchPayload,
) {
  return requestClient.post('/backend/phonecountrycode/frequentlyused', data);
}

/**
 * 重置手机区号为默认排序（验证码管理 · 手机区号 Tab 重置操作）。
 *
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-area-code-list.vue
 */
export function resetPhoneAreaCodeDefaultApi() {
  return requestClient.post('/backend/phonecountrycode/resetdefault');
}

/**
 * 调整手机区号排序（验证码管理 · 手机区号 Tab 拖拽排序）。
 *
 * @param data 区号 Id 及新排序序号
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-area-code-list.vue
 */
export function sortPhoneAreaCodeApi(data: PhoneAreaCodeSortPayload) {
  return requestClient.put('/backend/phonecountrycode/switchsort', data);
}

/**
 * 手机验证码白名单列表（验证码管理 · 手机验证码白名单弹窗）。
 *
 * @param query 查询参数（玩家等筛选及分页）
 * @returns 白名单行 Items 及 Pagination
 * @see views/memberManage/verifyCode/components/mobile-verify-whitelist-modal.vue
 */
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

/**
 * 新增手机验证码白名单（验证码管理 · 手机验证码白名单弹窗）。
 *
 * @param data 白名单表单（玩家 Id 等）
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-verify-whitelist-modal.vue
 */
export function addMobileVerifyWhitelistApi(
  data: MobileVerifyWhitelistPayload,
) {
  return requestClient.post('/backend/phoneverifycode/addwhitelist', data);
}

/**
 * 删除手机验证码白名单（验证码管理 · 手机验证码白名单弹窗）。
 *
 * @param data 待移除的玩家 Id 集合（PlayerIds 逗号分隔字符串）
 * @returns 接口操作结果
 * @see views/memberManage/verifyCode/components/mobile-verify-whitelist-modal.vue
 */
export function deleteMobileVerifyWhitelistApi(data: { PlayerIds: string }) {
  return requestClient.put('/backend/phoneverifycode/delwhitelist', data);
}

/**
 * 为指定玩家生成手机验证码（验证码管理 · 生成验证码弹窗）。
 *
 * @param query 含 PlayerId 的查询参数
 * @returns 新生成的验证码记录
 * @see views/memberManage/verifyCode/components/generate-mobile-code-modal.vue
 */
export function generateMobileVerifyCodeApi(query: {
  PlayerId: number | string;
}) {
  return requestClient.get<MobileVerifyCodeListItem>(
    '/backend/phoneverifycode/generatecode',
    { params: query },
  );
}
