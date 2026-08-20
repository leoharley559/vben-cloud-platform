



export interface OperationalDataQuery extends Record<string, unknown> {
  BeginTime?: number | string;
  EndTime?: number | string;
  Page?: number;
  PageSize?: number;
}

export interface GameWinRankResult {
  Items?: Record<string, unknown>[];
  ItemsLose?: Record<string, unknown>[];
  ItemsWin?: Record<string, unknown>[];
  Users?: Record<string, unknown>[];
}

export interface ChannelReportResult {
  Items?: Record<string, unknown>[];
  Pagination?: { MaxCount?: number };
  RealTimeItems?: Record<string, unknown>[];
  TotalItems?: Record<string, unknown>;
}

export {type CloudListResult} from '#/types/operation-manage';