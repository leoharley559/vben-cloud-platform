import type {
  PromoterListItem,
  PromoterTotalItem,
  TeamQueryItem,
} from '#/types/promotion';

import BigNumber from 'bignumber.js';

export const PROMOTER_STATUS_MAP: Record<number, string> = {
  1: '启用',
  2: '停用',
};

export const PROMOTER_SETTLE_TYPE_MAP: Record<number, string> = {
  1: '注册',
  2: '绑定兑换',
  3: '设备',
  4: '税收分成',
  5: '利润分成',
  6: '杀数',
  7: '流水',
};

export const PROMOTER_FUNCTION_MAP: Record<string, string> = {
  '1': '公司日报 - 日报',
  '2': '公司日报 - 包体日报',
  '3': '推广报表',
  '4': '时段报表',
};

export function formatPromoterStatus(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return PROMOTER_STATUS_MAP[value] || String(value);
}

export function formatPromoterSettleType(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return PROMOTER_SETTLE_TYPE_MAP[value] || String(value);
}

export function formatPromoterSettleValue(type?: number, price?: number) {
  if (type === undefined || price === undefined) {
    return '-';
  }
  if (type === 1 || type === 2 || type === 3) {
    return `${price} 元/个`;
  }
  return `${price}%`;
}

export function formatCommissionRate(value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return `${Number(value) / 10}%`;
}

export function formatPromoterAccountType(row: PromoterListItem) {
  const tags: string[] = [];
  if (row.IsTeamAccount === 1) {
    tags.push('团队推广');
    if (row.TeamType === 2) {
      tags.push('总代');
    }
  } else {
    tags.push('渠道推广');
  }
  return tags.join(' / ');
}

export function parsePromoterFunctions(
  roleDataField?: string | { HaveFunction?: string },
) {
  if (!roleDataField) {
    return [] as string[];
  }
  try {
    const parsed =
      typeof roleDataField === 'string'
        ? (JSON.parse(roleDataField) as { HaveFunction?: string })
        : roleDataField;
    const raw = parsed.HaveFunction || '';
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [] as string[];
  }
}

export function formatPromoterFunctions(
  roleDataField?: string | { HaveFunction?: string },
) {
  return parsePromoterFunctions(roleDataField)
    .map((item) => PROMOTER_FUNCTION_MAP[item] || item)
    .join('、');
}

export function calcPromoterTotal(
  row: PromoterListItem,
  totalList?: PromoterTotalItem[],
) {
  const totalItem = totalList?.find(
    (item) => String(item.AdminId) === String(row.Id),
  );
  if (!totalItem || row.SettlePrice === undefined) {
    return 0;
  }
  switch (row.SettleType) {
    case 1: {
      return Number(totalItem.SumCountPhoneNum || 0) * Number(row.SettlePrice);
    }
    case 2: {
      return Number(totalItem.SumCountAlipayNum || 0) * Number(row.SettlePrice);
    }
    case 3: {
      return Number(totalItem.SumDevice || 0) * Number(row.SettlePrice);
    }
    case 4: {
      return (
        (Number(totalItem.SumDayWater || 0) / 100) *
        (Number(row.SettlePrice) / 100)
      );
    }
    case 5: {
      return (
        ((Number(totalItem.SumPayMoney || 0) +
          Number(totalItem.SumAgentPayMoney || 0) -
          Number(totalItem.SumWithdrawMoney || 0)) /
          100) *
        (Number(row.SettlePrice) / 100)
      );
    }
    default: {
      return 0;
    }
  }
}

export function enrichPromoterList(
  list: PromoterListItem[] = [],
  totalList: PromoterTotalItem[] = [],
  hasChild = false,
) {
  return list.map((item) => ({
    ...item,
    Total: calcPromoterTotal(item, totalList),
    hasChildren: hasChild,
  }));
}

export function sumTeamQueryStats(list: TeamQueryItem[] = []) {
  const result = {
    betMoney: 0,
    incomeMoney: 0,
    pay: 0,
    payMoney: 0,
    reg: 0,
    taxMoney: 0,
  };
  for (const row of list) {
    result.reg += Number(row.SumNextReg || 0) + Number(row.SumSelfReg || 0);
    result.pay +=
      Number(row.SumNextPayMergerNum || 0) +
      Number(row.SumSelfPayMergerNum || 0);
    result.payMoney +=
      Number(row.SumNextPayMergerMoney || 0) +
      Number(row.SumSelfPayMergerMoney || 0);
    result.betMoney +=
      Number(row.SumNextBetGameMoney || 0) +
      Number(row.SumSelfBetGameMoney || 0);
    result.taxMoney +=
      Number(row.SumNextGameTax || 0) + Number(row.SumSelfGameTax || 0);
    result.incomeMoney +=
      Number(row.SumNextIncomeMoney || 0) +
      Number(row.SumSelfIncomeMoney || 0);
  }
  return result;
}

export function formatTeamQueryMoney(value?: number) {
  const amount = new BigNumber(value || 0);
  return amount.isNaN() ? '0.00' : amount.dividedBy(100).toFormat(2);
}

export const WITHDRAW_MONEY_TYPE_MAP: Record<number, string> = {
  1: '日结账单',
  2: '提现',
  3: '提现退回',
};

export const CLOSE_ORDER_STATUS_MAP: Record<number, string> = {
  1: '申请中',
  2: '处理中',
  3: '已完成',
  4: '已拒绝',
};

export const CLOSE_ORDER_STATUS_COLOR: Record<number, string> = {
  1: 'warning',
  2: 'processing',
  3: 'success',
  4: 'error',
};

export const LANDING_DOWNLOAD_MODE_MAP: Record<number, string> = {
  1: '自动下载',
  2: '手动下载',
};

export function formatLandingDownloadMode(
  mode?: number,
  delay?: number | string,
) {
  if (mode === 1) {
    return '自动下载';
  }
  if (mode === 2) {
    return '手动下载';
  }
  if (mode === 3) {
    return `延时${delay ?? 0}秒下载`;
  }
  return '-';
}

export function formatDateTime(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).length >= 10) {
    const ms = String(value).length > 10 ? numeric : numeric * 1000;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  return String(value);
}

export function formatBrokerageGameName(
  gameId?: number | string,
  games: Record<string, { gameName?: string; resType?: number }> = {},
) {
  if (gameId === 0 || gameId === '0') {
    return '大厅';
  }
  if (gameId === -1 || gameId === '-1') {
    return '线下';
  }
  const game = games[String(gameId)];
  return game?.gameName || String(gameId ?? '-');
}
