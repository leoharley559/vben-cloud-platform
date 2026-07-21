import type {
  ChildAdminInfoResult,
  ChildChannelInfoResult,
} from '#/types/config';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/**
 * 子管理员信息（账号下拉 / 系统模板等）
 *
 * @param params 筛选参数（可选，会 trim 空格）
 * @returns 子管理员列表结构 ChildAdminInfoResult
 * @see components/global/account-select.vue
 * @see views/gameManage/systemSetting/components/system-templates-panel.vue
 */
export function fetchChildAdminInfoApi(params?: Record<string, unknown>) {
  return requestClient.get<ChildAdminInfoResult>(
    '/backend/config/getchildadmininfo',
    {
      params: trimSpace(params || {}),
    },
  );
}

/**
 * 子渠道信息（渠道下拉等）
 *
 * @param params 筛选参数（可选，会 trim 空格）
 * @returns 子渠道列表结构 ChildChannelInfoResult
 * @see components/global/channel-select.vue
 */
export function fetchChildChannelInfoApi(params?: Record<string, unknown>) {
  return requestClient.get<ChildChannelInfoResult>(
    '/backend/config/getchildchannelinfo',
    {
      params: trimSpace(params || {}),
    },
  );
}

/**
 * 子推广/包网信息（无限代理等子网配置）
 *
 * @param params 筛选参数（可选，会 trim 空格）
 * @returns 子包网/推广配置数据
 */
export function fetchChildPromotionInfoApi(params?: Record<string, unknown>) {
  return requestClient.get('/backend/config/getchildnetcashinfo', {
    params: trimSpace(params || {}),
  });
}
