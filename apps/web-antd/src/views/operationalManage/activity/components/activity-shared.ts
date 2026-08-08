import {
  ACTIVITY_TYPE_OPTIONS,
  formatActivityType,
} from '#/utils/bonus-reward';
import { formatOperationDateTime } from '#/utils/operation-status';

export { formatActivityType };

export const ACTIVITY_FILTER_TYPE_OPTIONS = ACTIVITY_TYPE_OPTIONS.filter(
  (item) => item.value !== -1,
);

export interface OngoingActivityRow {
  AdvanceTime?: number | string;
  CreateAdminName?: string;
  ExpireTime?: number | string;
  FinishTime?: number | string;
  Id: number | string;
  Name?: string;
  OpenTime?: number | string;
  RankSort?: number | string;
  Status?: number;
  Type?: number | string;
  UpdateAdminName?: string;
  UpdateTime?: number | string;
}

export type OngoingDisplayStatus =
  | 'closed'
  | 'delisted'
  | 'downstreaming'
  | 'inProgress'
  | 'notStarted'
  | 'warmingUp';

const ONGOING_STATUS_LABEL: Record<OngoingDisplayStatus, string> = {
  closed: '已关闭',
  delisted: '已下架',
  downstreaming: '下架中',
  inProgress: '进行中',
  notStarted: '未开始',
  warmingUp: '预热中',
};

export function computeOngoingDisplayStatus(
  row: OngoingActivityRow,
  nowSec = Math.floor(Date.now() / 1000),
): OngoingDisplayStatus {
  const advance = Number(row.AdvanceTime || 0);
  const open = Number(row.OpenTime || 0);
  const finish = Number(row.FinishTime || 0);
  const expire = Number(row.ExpireTime || 0);

  if (advance > nowSec) {
    return 'notStarted';
  }
  if (advance < nowSec && open > nowSec) {
    return 'warmingUp';
  }
  if (advance < nowSec && finish > nowSec) {
    return 'inProgress';
  }
  if (advance < nowSec && expire > nowSec) {
    return 'downstreaming';
  }
  if (finish === 0 && expire === 0) {
    return 'inProgress';
  }
  if (advance < nowSec && expire < nowSec) {
    return 'delisted';
  }
  return 'closed';
}

export function formatOngoingDisplayStatus(row: OngoingActivityRow) {
  return ONGOING_STATUS_LABEL[computeOngoingDisplayStatus(row)];
}

export function formatShowTimeCell(row: OngoingActivityRow) {
  const warm = formatOperationDateTime(row.AdvanceTime);
  const takedown =
    row.ExpireTime && Number(row.ExpireTime) !== 0
      ? formatOperationDateTime(row.ExpireTime)
      : '长期开放';
  return `预热: ${warm}\n下架: ${takedown}`;
}

export function formatActivityTimeCell(row: OngoingActivityRow) {
  const begin = formatOperationDateTime(row.OpenTime);
  const end =
    row.FinishTime && Number(row.FinishTime) !== 0
      ? formatOperationDateTime(row.FinishTime)
      : '长期开放';
  return `开始: ${begin}\n结束: ${end}`;
}

export function buildUnixRangeQuery(
  range: [import('dayjs').Dayjs, import('dayjs').Dayjs] | null | undefined,
  beginKey: string,
  endKey: string,
) {
  const query: Record<string, unknown> = {};
  if (range?.[0] && range?.[1]) {
    // 列表筛选统一按自然日边界，与无 show-time 的日期范围选择器一致
    query[beginKey] = range[0].startOf('day').unix();
    query[endKey] = range[1].endOf('day').unix();
  }
  return query;
}
