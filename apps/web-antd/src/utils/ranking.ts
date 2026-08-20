import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

export type RankPlayerRow = Record<string, unknown> & {
  ChannelId?: number | string;
  ChannelName?: string;
  LoginAccount?: string;
  PackageName?: string;
  PlayerId?: number | string;
  PlayerName?: string;
  SumAddGold?: number;
  SumGold?: number;
};

export type RankGameRow = Record<string, unknown> & {
  FanJiang?: number;
  FanJiangRate?: number;
  GameId?: number | string;
  ProfitAmt?: number;
  SumBet?: number;
  SumProfit?: number;
  SumWin?: number;
};

/** 昨日 00:00～23:59:59（对齐旧站默认区间） */
export function defaultRankingDateRange(): [Dayjs, Dayjs] {
  const yesterday = dayjs().subtract(1, 'day');
  return [yesterday.startOf('day'), yesterday.endOf('day')];
}

export function toUnixRange(range?: [Dayjs, Dayjs] | null) {
  if (!range?.[0] || !range?.[1]) {
    return { BeginTime: '', EndTime: '' };
  }
  return {
    BeginTime: range[0].startOf('day').unix(),
    EndTime: range[1].endOf('day').unix(),
  };
}

/** 将 Users 合并进排行 Items（按 PlayerId） */
export function mergeRankUsers(
  items: Record<string, unknown>[] = [],
  users: Record<string, unknown>[] = [],
): RankPlayerRow[] {
  const userMap = new Map(users.map((user) => [user.PlayerId, user] as const));
  return items.map((item) => {
    const user = userMap.get(item.PlayerId);
    if (!user) return item as RankPlayerRow;
    return {
      ...item,
      ChannelId: user.ChannelId,
      ChannelName: user.ChannelName,
      LoginAccount: user.LoginAccount,
      PackageName: user.PackageName,
      PlayerName: user.PlayerName,
    } as RankPlayerRow;
  });
}

/** 盈利金额 = SumBet - (SumWin - SumProfit)；返奖 = SumWin - SumProfit */
export function enrichGameRankRows(
  items: Record<string, unknown>[] = [],
): RankGameRow[] {
  return items.map((item) => {
    const sumBet = Number(item.SumBet || 0);
    const sumWin = Number(item.SumWin || 0);
    const sumProfit = Number(item.SumProfit || 0);
    const fanJiang = sumWin - sumProfit;
    const profitAmt = sumBet - fanJiang;
    const fanJiangRate =
      sumBet === 0 ? 0 : Number(((fanJiang / sumBet) * 100).toFixed(2));
    return {
      ...item,
      FanJiang: fanJiang,
      FanJiangRate: fanJiangRate,
      ProfitAmt: profitAmt,
    };
  });
}
