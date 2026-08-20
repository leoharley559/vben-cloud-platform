const ADJUST_REASON_MAP: Record<number, string> = {
  1: '系统调整',
  2: '输赢调整',
  111: '充值调整',
};

const ADJUST_HANDLE_TYPE_MAP: Record<number, string> = {
  1: '上分',
  2: '下分',
};

const ADJUST_DONE_MAP: Record<number, string> = {
  0: '未发送',
  1: '已发送',
  2: '已完成',
  3: '失败',
  4: '发送失败',
};

const ADJUST_APPROVE_MAP: Record<number, string> = {
  1: '待审核',
  2: '通过',
  3: '拒绝',
  4: '进行中',
};

export const ADJUST_REASON_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '系统调整', value: 1 },
  { label: '输赢调整', value: 2 },
  { label: '充值调整', value: 111 },
];

export const ADJUST_HANDLE_TYPE_OPTIONS = [
  { label: '全部', value: -1 },
  { label: '上分', value: 1 },
  { label: '下分', value: 2 },
];

/** 审核页调整方式：空=全部 */
export const ADJUST_AUDIT_HANDLE_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '上分', value: 1 },
  { label: '下分', value: 2 },
];

export const ADJUST_APPROVE_RECORD_OPTIONS = [
  { label: '全部', value: '2,3,4' },
  { label: '通过', value: 2 },
  { label: '拒绝', value: 3 },
  { label: '进行中', value: 4 },
];

export const ADJUST_DONE_OPTIONS = [
  { label: '全部', value: '0,1,2,3,4' },
  { label: '未发送', value: 0 },
  { label: '已发送', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已失败', value: 3 },
  { label: '发送失败', value: 4 },
];

/** 记录页流水类型：1增加倍数 2增加金额 3减少倍数 4减少金额 */
export const ADJUST_WATER_TYPE_INC_DEC_OPTIONS = [
  { label: '全部', value: '1,2,3,4' },
  { label: '增加倍数', value: 1 },
  { label: '增加金额', value: 2 },
  { label: '减少倍数', value: 3 },
  { label: '减少金额', value: 4 },
];

export const ADJUST_AUDIT_WATER_TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: '倍数', value: 1 },
  { label: '金额', value: 2 },
];

export const ADJUST_DATA_SEARCH_TYPE_OPTIONS = [
  { label: '正式', value: 0 },
  { label: '测试', value: 1 },
  { label: '全部', value: 2 },
];

/** 多选/含「全部」字符串的筛选项 → 逗号去重字符串（对齐旧站 Done / WaterTypeIncDec） */
export function normalizeMultiFilterParam(
  value: Array<number | string> | null | number | string | undefined,
  fallback = '',
) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const src = Array.isArray(value) ? value.join(',') : String(value);
  const chars = src.replaceAll(',', '');
  return [...new Set(chars)].join(',');
}

export function formatAdjustReason(reason?: number | string) {
  if (reason === undefined || reason === null || reason === '') {
    return '-';
  }
  return ADJUST_REASON_MAP[Number(reason)] || String(reason);
}

export function formatAdjustHandleType(type?: number | string) {
  if (type === undefined || type === null || type === '') {
    return '-';
  }
  return ADJUST_HANDLE_TYPE_MAP[Number(type)] || String(type);
}

/** 上分绿 / 下分红，对齐旧站 */
export function getAdjustHandleTypeColor(type?: number | string) {
  switch (Number(type)) {
    case 1: {
      return '#67c23a';
    }
    case 2: {
      return '#f56c6c';
    }
    default: {
      return '#909399';
    }
  }
}

export function formatAdjustDone(done?: number | string) {
  if (done === undefined || done === null || done === '') {
    return '-';
  }
  return ADJUST_DONE_MAP[Number(done)] || String(done);
}

export function getAdjustDoneColor(
  done?: number | string,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  switch (Number(done)) {
    case 1: {
      return 'processing';
    }
    case 2: {
      return 'success';
    }
    case 3: {
      return 'warning';
    }
    case 4: {
      return 'error';
    }
    default: {
      return 'default';
    }
  }
}

export function formatAdjustApprove(approve?: number | string) {
  if (approve === undefined || approve === null || approve === '') {
    return '-';
  }
  return ADJUST_APPROVE_MAP[Number(approve)] || String(approve);
}

export function getAdjustApproveColor(
  approve?: number | string,
): 'default' | 'error' | 'processing' | 'success' | 'warning' {
  switch (Number(approve)) {
    case 1: {
      return 'warning';
    }
    case 2: {
      return 'success';
    }
    case 3: {
      return 'error';
    }
    case 4: {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
}

export function formatAdjustWaterType(
  handleType?: number | string,
  waterType?: number | string,
) {
  const type = Number(waterType);
  const handle = Number(handleType);
  if (!type) {
    return '-';
  }
  if (handle === 1) {
    return type === 1 ? '增加倍数' : '增加金额';
  }
  if (handle === 2) {
    return type === 1 ? '减少倍数' : '减少金额';
  }
  return String(type);
}

export function formatAdjustWater(row: {
  HandleType?: number | string;
  Water?: number | string;
  WaterAmount?: number | string;
  WaterType?: number | string;
}) {
  const handleType = Number(row.HandleType);
  const waterType = Number(row.WaterType);
  const water = Number(row.Water || 0);
  const waterAmount = Number(row.WaterAmount || 0);

  if (handleType === 1 && waterType === 1) {
    return (water / 100).toFixed(2);
  }
  if (handleType === 1 && waterType === 2) {
    return (waterAmount / 100).toFixed(2);
  }
  if (handleType === 2 && waterType === 1) {
    return water / 100 === 0 ? '0.00' : `-${(water / 100).toFixed(2)}`;
  }
  if (handleType === 2 && waterType === 2) {
    return waterAmount / 100 === 0 ? '0.00' : (waterAmount / 100).toFixed(2);
  }
  return '-';
}
