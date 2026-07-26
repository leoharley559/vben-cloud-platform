const BONUS_APPROVE_MAP: Record<number, string> = {
  1: '待审核',
  2: '已通过',
  3: '已拒绝',
  4: '处理中',
};

const BONUS_REASON_MAP: Record<number, string> = {
  0: '未知类型',
  1: '活动礼金',
  2: '异常补发',
  3: '平台红利',
  4: 'VIP升级红利',
  5: '每月红包',
  6: '生日礼金',
  7: '代理红利',
  8: '推广红利',
  9: '存款优惠',
  10: '活动红利',
  11: '负数归零',
  12: '推荐红利',
};

const BONUS_WATER_TYPE_MAP: Record<number, string> = {
  0: '倍数',
  1: '倍数',
  2: '金额',
};

const BONUS_PAGE_TYPE_MAP: Record<number, string> = {
  1: '首页',
  2: '活动页',
  3: '其他',
};

export function formatBonusApprove(approve?: number | string) {
  const value = Number(approve);
  return BONUS_APPROVE_MAP[value] || String(approve ?? '-');
}

export function getBonusApproveColor(approve?: number | string) {
  switch (Number(approve)) {
    case 1:
      return 'warning';
    case 2:
      return 'success';
    case 3:
      return 'error';
    case 4:
      return 'processing';
    default:
      return 'default';
  }
}

export function formatBonusReason(reason?: number | string) {
  const value = Number(reason);
  return BONUS_REASON_MAP[value] || String(reason ?? '-');
}

export function formatBonusWaterType(waterType?: number | string) {
  const value = Number(waterType);
  return BONUS_WATER_TYPE_MAP[value] || String(waterType ?? '-');
}

export function formatBonusPageType(pageType?: number | string) {
  const value = Number(pageType);
  return BONUS_PAGE_TYPE_MAP[value] || String(pageType ?? '-');
}

export function formatBonusWaterRequirement(row: {
  Water?: number | string;
  WaterAmount?: number | string;
  WaterType?: number | string;
}) {
  if (Number(row.WaterType) === 2) {
    return (Number(row.WaterAmount || 0) / 100).toFixed(2);
  }
  return (Number(row.Water || 0) / 100).toFixed(2);
}
