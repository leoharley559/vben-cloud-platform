import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  BonusAuditListItem,
  BonusAuditListQuery,
  BonusRecordListItem,
} from '#/types/bonus-audit';
import { trimSpace } from '#/utils/string';

/**
 * 规范化彩金审批列表查询参数。
 *
 * 去除首尾空格，并将 ChannelIds、BonusType 等多选数组转为逗号分隔字符串。
 *
 * @param query 原始筛选条件
 * @returns 可直接作为 GET params 的对象
 */
function normalizeBonusAuditQuery(query: BonusAuditListQuery) {
  const params = trimSpace({ ...query }) as Record<string, unknown>;
  const channelIds = params.ChannelIds;
  if (Array.isArray(channelIds)) {
    params.ChannelIds = channelIds.length ? channelIds.join(',') : '';
  }
  const bonusType = params.BonusType;
  if (Array.isArray(bonusType)) {
    params.BonusType = bonusType.length ? bonusType.join(',') : '';
  }
  return params;
}

/**
 * 查询彩金发放审批待审列表
 * @param query 筛选条件（渠道、彩金类型、玩家及分页）
 * @returns 待审列表 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/audit/components/bonus-release-audit.vue
 * @see views/operationalManage/audit/components/bonus-event-audit.vue
 */
export function fetchBonusAuditListApi(query: BonusAuditListQuery) {
  return requestClient.get<
    CloudListResult<BonusAuditListItem> & {
      Total?: { Total?: number | string; TotalReal?: number | string };
    }
  >('/backend/playergoldhandle/approvelist', {
    params: normalizeBonusAuditQuery(query),
  });
}

/**
 * 查询彩金发放历史记录列表
 * @param query 筛选条件（渠道、彩金类型、时间范围及分页）
 * @returns 发放记录列表 Items、Pagination 及 Total 汇总
 * @see views/operationalManage/audit/components/bonus-record-list.vue
 */
export function fetchBonusRecordListApi(query: BonusAuditListQuery) {
  return requestClient.get<
    CloudListResult<BonusRecordListItem> & {
      Total?: {
        SumBonus?: number | string;
        Total?: number | string;
        TotalReal?: number | string;
      };
    }
  >('/backend/playergoldhandle/redlist', {
    params: normalizeBonusAuditQuery(query),
  });
}

/**
 * 审批彩金发放申请（通过/拒绝）
 * @param data 审批参数（记录 Id、审批结果及备注）
 * @returns 接口操作结果
 * @see views/operationalManage/audit/components/bonus-audit-action-modal.vue
 */
export function disposeBonusAuditApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/approve', data);
}
