import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { trimSpace } from '#/utils/string';

export interface InviteFriendTier {
  MaxCount: number;
  MinCount: number;
  Reward: number;
}

export interface InviteFriendConfig {
  AgentId?: number;
  Banner?: string;
  BeginTime?: number;
  CreateAdminId?: number;
  CreateTime?: number;
  DepositThreshold?: number;
  EndTime?: number;
  Id?: number;
  IncludeDepositTypes?: string[];
  InviterTiers?: InviteFriendTier[];
  InviteeReward?: number;
  IsActive?: number;
  LangGroupId?: number;
  Open?: boolean;
  RiskAction?: number;
  RiskDimensions?: string[];
  RuleContent?: string[];
  ShareImage?: string;
  ShareUrlTemplate?: string;
  Title?: string;
  UpdateTime?: number;
  WaterMultiple?: number;
}

export interface InviteFriendConfigPayload {
  Banner?: string;
  BeginTime: number;
  DepositThreshold: number;
  EndTime: number;
  IncludeDepositTypes: string[];
  InviterTiers: InviteFriendTier[];
  InviteeReward: number;
  IsActive: number;
  LangGroupId: number;
  Open: boolean;
  RiskAction: number;
  RiskDimensions: string[];
  RuleContent: string[];
  ShareImage?: string;
  ShareUrlTemplate: string;
  Title: string;
  WaterMultiple: number;
}

/**
 * 获取邀请好友活动配置列表（全语言组）
 * @returns 配置数组
 * @see views/operationalManage/activity/components/activity-invite-config-panel.vue
 */
export function fetchInviteFriendConfigListApi() {
  return requestClient.get<InviteFriendConfig[]>(
    '/backend/invitefriendactivity/config',
  );
}

/**
 * 创建或更新邀请好友活动配置（按代理 + LangGroupId upsert）
 * @param data 配置表单（不传 Id / AgentId）
 * @returns 保存后的完整配置
 * @see views/operationalManage/activity/components/activity-invite-config-form-modal.vue
 */
export function saveInviteFriendConfigApi(data: InviteFriendConfigPayload) {
  return requestClient.put<InviteFriendConfig>(
    '/backend/invitefriendactivity/config',
    data,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

/**
 * 查询邀请关系列表
 * @param query 筛选条件及分页
 * @returns Items + Pagination
 * @see views/operationalManage/activity/components/activity-invite-relations-panel.vue
 */
export function fetchInviteFriendRelationsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/invitefriendactivity/relations',
    { params: trimSpace(query) },
  );
}

/**
 * 查询发奖记录列表
 * @param query 筛选条件及分页
 * @returns Items + Pagination
 * @see views/operationalManage/activity/components/activity-invite-rewards-panel.vue
 */
export function fetchInviteFriendRewardsApi(query: Record<string, unknown>) {
  return requestClient.get<CloudListResult<Record<string, unknown>>>(
    '/backend/invitefriendactivity/rewards',
    { params: trimSpace(query) },
  );
}

/**
 * 查询发奖记录详情
 * @param id 发奖记录 ID
 * @returns 发奖记录详情
 * @see views/operationalManage/activity/components/activity-invite-rewards-panel.vue
 */
export function fetchInviteFriendRewardDetailApi(id: number | string) {
  return requestClient.get<Record<string, unknown>>(
    `/backend/invitefriendactivity/rewards/${id}`,
  );
}
