import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import { registerPermissionKeys } from '#/utils/permission';
import { trimSpace } from '#/utils/string';

registerPermissionKeys({
  serviceAccountPage: [10579],
  serviceSeatPage: [10580],
  serviceWorkTimePage: [11290],
  serviceAccount: [11819],
  serviceSeat: [11820],
  serviceWorkTime: [11821],
  serviceStatisticsPage: [10646],
  serviceSatisfactionPage: [11295],
  serviceInlineStatPage: [11848],
  serviceMonitorPage: [10691],
  serviceEnterLineRecord: [10692],
  serviceReturnRecord: [10694],
  serviceMissRecord: [10695],
  serviceCommonWords: [10807],
  serviceQuestionType: [10809],
  serviceEvalLabel: [10810],
  serviceAutoReply: [10811],
  serviceBlackListSetting: [10812],
  serviceFilterWord: [10813],
  serviceAudioEffect: [11209],
  serviceOtherSetting: [11717],
  servicePlayerMark: [11857],
  serviceAiAssistant: [11860],
  servicePlayerOrder: [12431],
  serviceAiKnowledge: [12634],
  servicePlayerList: [11274, 11278],
  serviceVersionSwitchBtn: [12144],
});

function toListResult(data: CloudListResult<Record<string, unknown>>) {
  return {
    Items: data.Items ?? [],
    Pagination: {
      MaxCount: data.Pagination?.MaxCount ?? data.Items?.length ?? 0,
    },
  };
}

export function fetchServiceAccountListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporter/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchServiceSeatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportseats/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchServiceWorkTimeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterworktime/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchServiceRecordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportrecord/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchServiceReturnListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupportrecord/recvlist',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchServiceStatisticsListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterstatistics/supporter',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

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

export function fetchServiceInlineStatListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterstatistics/inline',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchEasyReplyListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporteasyreply/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchBlackListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterblacklist/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchFilterWordListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customerfilterword/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchPlayerMarkListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customermarkplayer/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchEvaluationLabelListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customerevaluationlabel/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchQuestionTypeListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporterquestiontype/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

/** 结束原因/问题分类简表（Type=0 关闭分类） */
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

export function fetchAiAssistantListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/aiassistantv2/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchAudioEffectListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customersupporteraudioeffect/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchPlayerOrderListApi(query: Record<string, unknown>) {
  return requestClient
    .get<CloudListResult<Record<string, unknown>>>(
      '/backend/customsupport/list',
      { params: trimSpace(query) },
    )
    .then(toListResult);
}

export function fetchAiKnowledgeListApi(query: Record<string, unknown>) {
  return requestClient
    .post<CloudListResult<Record<string, unknown>>>(
      '/backend/aiqalistmanager/searchqalist',
      trimSpace(query),
    )
    .then(toListResult);
}
