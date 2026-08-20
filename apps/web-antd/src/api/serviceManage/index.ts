import type { CloudListResult } from '#/types/operation-manage';

import { requestClient } from '#/api/request';
import { registerPermissionKeys } from '#/utils/permission';
import { trimSpace } from '#/utils/string';

registerPermissionKeys({
  serviceAccountPage: [10_579],
  serviceSeatPage: [10_580],
  serviceWorkTimePage: [11_290],
  serviceAccount: [11_819],
  serviceSeat: [11_820],
  serviceWorkTime: [11_821],
  serviceStatisticsPage: [10_646],
  serviceSatisfactionPage: [11_295],
  serviceInlineStatPage: [11_848],
  serviceMonitorPage: [10_691],
  serviceEnterLineRecord: [10_692],
  serviceReturnRecord: [10_694],
  serviceMissRecord: [10_695],
  serviceCommonWords: [10_807],
  serviceQuestionType: [10_809],
  serviceEvalLabel: [10_810],
  serviceAutoReply: [10_811],
  serviceBlackListSetting: [10_812],
  serviceFilterWord: [10_813],
  serviceAudioEffect: [11_209],
  serviceOtherSetting: [11_717],
  servicePlayerMark: [11_857],
  serviceAiAssistant: [11_860],
  servicePlayerOrder: [12_431],
  serviceAiKnowledge: [12_634],
  servicePlayerList: [11_274, 11_278],
  serviceVersionSwitchBtn: [12_144],
});

/**
 * 将客服模块列表响应归一为 CloudListResult。
 *
 * Pagination.MaxCount 优先取接口值，否则回退为 Items 长度。
 *
 * @param data 接口原始响应
 * @returns 含 Items 及 Pagination.MaxCount 的列表结构
 */
function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

/**
 * 客服账号列表（客服帐号页「客服帐号」Tab）。
 *
 * @param query 查询参数（分页、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceAccount/index.vue
 */
export function fetchServiceAccountListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporter/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服席位列表（客服帐号页「客服席位」Tab）。
 *
 * @param query 查询参数（分页、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceAccount/index.vue
 */
export function fetchServiceSeatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportseats/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服工时统计列表（客服帐号页「工时统计」Tab）。
 *
 * @param query 查询参数（分页、日期、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceAccount/index.vue
 */
export function fetchServiceWorkTimeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterworktime/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服进线记录列表（进线记录页「进线记录」「错过记录」Tab）。
 *
 * @param query 查询参数（分页、日期、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/recordTotal/index.vue
 */
export function fetchServiceRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportrecord/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服回收站记录列表（进线记录页「回收站」Tab）。
 *
 * @param query 查询参数（分页、日期、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/recordTotal/index.vue
 */
export function fetchServiceReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportrecord/recvlist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服工作统计列表（客服统计页「客服统计」Tab）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/statistics/index.vue
 */
export function fetchServiceStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterstatistics/supporter',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服评价统计列表（客服统计页「评价统计」Tab）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/statistics/index.vue
 */
export function fetchServiceSatisfactionListApi(
  query: Record<string, unknown>,
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterstatistics/satisfaction',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服进线统计列表（客服统计页「进线统计」Tab）。
 *
 * @param query 查询参数（分页、日期等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/statistics/index.vue
 */
export function fetchServiceInlineStatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterstatistics/inline',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服常用语列表（客服设置页「常用语」Tab）。
 *
 * @param query 查询参数（分页、Username 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchEasyReplyListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporteasyreply/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服黑名单列表（客服设置页「黑名单」Tab）。
 *
 * @param query 查询参数（分页、Login 等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchBlackListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterblacklist/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服敏感词列表（客服设置页「敏感词」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchFilterWordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customerfilterword/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服玩家标记列表（客服设置页「玩家标记」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchPlayerMarkListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customermarkplayer/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服评价标签列表（客服设置页「评价标签」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchEvaluationLabelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customerevaluationlabel/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服问题类型列表（客服设置页「问题类型」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchQuestionTypeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterquestiontype/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 结束原因/问题分类简表（Type=0 关闭分类，客服工作台结束会话下拉）。
 *
 * @param query 可选附加查询参数（默认 Type=0、PageSize=999999）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceModel/components/service-workbench-panel.vue
 */
export function fetchEndReasonSimpleListApi(
  query: Record<string, unknown> = {},
) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterquestiontype/simplelist',
      { params: trimSpace({ Type: 0, PageSize: 999_999, ...query }) },
    )
    .then(toListResult);
}

/**
 * AI 助手配置列表（客服设置页「AI助手」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchAiAssistantListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/aiassistantv2/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 客服音效列表（客服设置页「音效」Tab）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/serviceSetting/index.vue
 */
export function fetchAudioEffectListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporteraudioeffect/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * 玩家工单列表（玩家工单页）。
 *
 * @param query 查询参数（分页等）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/playerOrder/index.vue
 */
export function fetchPlayerOrderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customsupport/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/**
 * AI 知识库问答列表（AI 知识库管理页）。
 *
 * @param query 搜索条件（POST 请求体，经 trimSpace 处理）
 * @returns Items 及 Pagination.MaxCount
 * @see views/serviceManage/aiKnowledgeBaseManager/index.vue
 */
export function fetchAiKnowledgeListApi(query: Record<string, unknown>) {
  return requestClient
    .post<CloudListResult<Record<string, unknown>>>(
      '/backend/aiqalistmanager/searchqalist',
      trimSpace(query),
    )
    .then(toListResult);
}
