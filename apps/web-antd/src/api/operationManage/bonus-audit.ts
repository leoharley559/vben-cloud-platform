import { requestClient } from '#/api/request';
import type { CloudListResult } from '#/types/operation-manage';
import type {
  BonusAuditListItem,
  BonusAuditListQuery,
  BonusRecordListItem,
} from '#/types/bonus-audit';
import { trimSpace } from '#/utils/string';

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

export function fetchBonusAuditListApi(query: BonusAuditListQuery) {
  return requestClient.get<
    CloudListResult<BonusAuditListItem> & {
      Total?: { Total?: number | string; TotalReal?: number | string };
    }
  >('/backend/playergoldhandle/approvelist', {
    params: normalizeBonusAuditQuery(query),
  });
}

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

export function disposeBonusAuditApi(data: Record<string, unknown>) {
  return requestClient.post('/backend/playergoldhandle/approve', data);
}
