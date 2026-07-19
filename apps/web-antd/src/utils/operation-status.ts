export const HELP_RECORD_STATUS_MAP: Record<number, string> = {
  1: '申请中',
  2: '进行中',
  3: '已关闭',
};

export const DOWNLOAD_CSV_STATUS_MAP: Record<number, string> = {
  0: '导出中',
  1: '成功',
  2: '失败',
};

/** 礼品审核列表 Status：-1 待审 / 1 通过 / 2 拒绝 */
export const GIFT_AUDIT_STATUS_MAP: Record<number, string> = {
  [-1]: '待审核',
  1: '已通过',
  2: '已拒绝',
};

/** 礼品发货列表 Status：1 待发货 / 3 已发货 / 4 已收货 / 5 拒绝发货 */
export const GIFT_DELIVER_STATUS_MAP: Record<number, string> = {
  1: '待发货',
  3: '已发货',
  4: '已收货',
  5: '拒绝发货',
};

export function formatOperationDateTime(value?: number | string) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    Number(value) === 0
  ) {
    return '-';
  }
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(value).length >= 10) {
    const ms = String(value).length > 10 ? numeric : numeric * 1000;
    return new Date(ms).toLocaleString('zh-CN', { hour12: false });
  }
  return String(value);
}

/** 旧站 TYPE：1 存款 / 2 有效投注 / 3 盈利 / 4 邀请人数 */
export const LEADERBOARD_TYPE_MAP: Record<number, string> = {
  1: '存款',
  2: '有效投注',
  3: '盈利',
  4: '邀请人数',
};

export const LEADERBOARD_INVITE_TYPE = 4;

export const LEADERBOARD_STATUS_MAP: Record<number, string> = {
  0: '未开始',
  1: '进行中',
  2: '已结束',
};

export const GAME_NOTICE_STATUS_MAP: Record<number, string> = {
  0: '关闭',
  1: '开启',
};

export const GAME_EMAIL_STATUS_MAP: Record<number, string> = {
  0: '待发送',
  1: '已发送',
  2: '发送失败',
};

export const VOUCHER_TYPE_MAP: Record<number, string> = {
  1: '幸运红包券',
  2: '现金兑换券',
  3: '砸金蛋券',
  4: '豪礼转盘券',
};

export const REWARD_PRODUCT_TYPE_MAP: Record<number, string> = {
  1: '实体商品',
  2: '彩金',
  3: '票券',
};

export const APPLY_SERVICE_STATUS_MAP: Record<number, string> = {
  0: '创建工单',
  1: '完成',
  2: '处理中',
  4: '已取消',
  5: '拒绝',
};

export const ACTIVITY_STATUS_MAP: Record<number, string> = {
  0: '未开始',
  1: '进行中',
  2: '已结束',
  3: '已下架',
};
