import type { LogListItem } from '#/types/system-manage';

import dayjs from 'dayjs';

import { getSecurityPathName } from '#/utils/security-path';

type RoleOption = { Id: number | string; Name?: string };

const COIN_SERVICE_MAP: Record<number, string> = {
  1: '支付宝',
  2: '微信',
  3: '银联',
  9: '云支付',
  99: '快捷支付',
};

const USER_TYPE_MAP: Record<number, string> = {
  1: '已签约支付宝',
  2: '非签约支付宝',
  3: '第三方账号',
};

const MEMBER_STATUS_MAP: Record<number, string> = {
  0: '正常',
  1: '良好',
  2: '已订阅',
  3: '封禁',
  4: '禁止提现',
  6: '暂时关闭',
  8: '测试',
};

const PAY_TYPE_MAP: Record<number, string> = {
  0: '包网',
  1: '支付宝',
  2: '微信',
  3: '网银',
  4: 'QQ',
  5: '苹果',
  6: 'PayPal固码',
  7: '微信固码',
  8: '京东',
  9: '云支付',
  10: '银行卡',
  11: '虚拟币充值',
  12: '卡转卡',
  13: '支付类型13',
};

const SECURITY_TYPE_MAP: Record<number, string> = {
  1: '账号谷歌验证码',
  2: '私密密码',
  3: '关闭多重验证',
  4: '导出加密',
};

function interpolateTemplate(
  template: string,
  params: Record<string, unknown>,
) {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(
      new RegExp(`\\{${key}\\}`, 'g'),
      value === undefined || value === null ? '' : String(value),
    );
  }
  return result;
}

function formatDateTime(
  value: unknown,
  format = 'YYYY-MM-DD HH:mm:ss',
): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) {
    return '';
  }
  const parsed = String(value).length > 10 ? dayjs(num) : dayjs.unix(num);
  return parsed.isValid() ? parsed.format(format) : String(value);
}

function div100(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? (num / 100).toFixed(2) : value;
}

function openClose(value: unknown, openText = '开启', closeText = '关闭') {
  return Number(value) === 1 ? openText : closeText;
}

function startEnd(value: unknown) {
  return Number(value) === 1 ? '启用' : '停用';
}

function mapLookup(
  map: Record<number, string>,
  value: unknown,
): string | unknown {
  const key = Number(value);
  return Number.isFinite(key) && key in map ? map[key] : value;
}

function rolesFilter(role: unknown, roleList?: RoleOption[]) {
  if (!role || !roleList?.length) {
    return role ?? '';
  }
  const ids = String(role).split(',');
  const names: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed) continue;
    const matched = roleList.find((item) => String(item.Id) === trimmed);
    if (matched?.Name) {
      names.push(matched.Name);
    }
  }
  return names.length > 0 ? names.join('，') : role;
}

function conditionFilter(con: unknown) {
  let parsed: { RegTime?: number[]; VipV2?: number[] } = {
    RegTime: [0, 0],
    VipV2: [0, 0],
  };
  try {
    parsed =
      typeof con === 'string'
        ? (JSON.parse(con) as typeof parsed)
        : ((con as typeof parsed) ?? parsed);
  } catch {
    return '全部';
  }

  const regTime = parsed.RegTime || [];
  const vip = parsed.VipV2 || [];
  if (
    (!regTime.length && !vip.length) ||
    (regTime[0] === 0 &&
      regTime[1] === 0 &&
      vip[0] === 0 &&
      vip[1] === 0)
  ) {
    return '全部';
  }

  let text = '';
  if (regTime.length && (regTime[0] !== 0 || regTime[1] !== 0)) {
    text += `注册时间${regTime[0]}--${regTime[1]}小时,`;
  }
  if (vip.length && (vip[0] !== 0 || vip[1] !== 0)) {
    text += `等级${vip[0]}--${vip[1]}`;
  }
  return text;
}

function getSecurityTypeName(type: unknown) {
  return mapLookup(SECURITY_TYPE_MAP, type);
}

/** 按 TemplateId 变换 Params（对齐旧站 formatListStatus 高频映射） */
export function transformLogParams(
  templateId: number | undefined,
  rawParams: Record<string, unknown>,
  options?: { roles?: RoleOption[] },
): Record<string, unknown> {
  const params = { ...rawParams };
  const id = Number(templateId);

  switch (id) {
    case 1: {
      params.Status = mapLookup(MEMBER_STATUS_MAP, params.Status);
      break;
    }
    case 2: {
      params.Types = mapLookup(PAY_TYPE_MAP, params.Types);
      break;
    }
    case 3: {
      params.UserType = mapLookup(USER_TYPE_MAP, params.UserType);
      params.Switch = openClose(params.Switch, '启用', '关闭');
      break;
    }
    case 4:
    case 5: {
      params.UserType = mapLookup(USER_TYPE_MAP, params.UserType);
      params.MinMoney = div100(params.MinMoney);
      params.MaxMoney = div100(params.MaxMoney);
      break;
    }
    case 6: {
      params.AutoAuditStatus =
        Number(params.AutoAuditStatus) === 1 ? '全部通道开启' : '全部通道关闭';
      break;
    }
    case 11:
    case 21:
    case 24: {
      params.Status = startEnd(params.Status);
      break;
    }
    case 25:
    case 26:
    case 27: {
      params.Role = rolesFilter(params.Role, options?.roles);
      break;
    }
    case 28: {
      params.Status = startEnd(params.Status);
      params.Role = rolesFilter(params.Role, options?.roles);
      break;
    }
    case 32: {
      params.Status = mapLookup(
        { 1: '已解决', 2: '未解决', 4: '已作废' },
        params.Status,
      );
      break;
    }
    case 33:
    case 34:
    case 35:
    case 128: {
      params.Status = mapLookup(
        {
          1: '待处理',
          2: '脚本出款',
          3: '拒绝出款',
          4: '人工出款',
          5: '处理中',
          6: '待处理',
        },
        params.Status,
      );
      params.RefundScore = mapLookup(
        { 0: '待定', 1: '退币', 2: '不退币' },
        params.RefundScore,
      );
      break;
    }
    case 36:
    case 37:
    case 38: {
      params.StartTime = formatDateTime(params.StartTime);
      params.EndTime = formatDateTime(params.EndTime);
      params.ShowStage = mapLookup(
        { 2: '正常', 102: '特殊', 1000: '停服' },
        params.ShowStage,
      );
      break;
    }
    case 39:
    case 40:
    case 41:
    case 43:
    case 44:
    case 45: {
      params.StartTime = formatDateTime(params.StartTime);
      params.EndTime = formatDateTime(params.EndTime);
      break;
    }
    case 42: {
      params.Status = openClose(params.Status, '开启', '停用');
      params.StartTime = formatDateTime(params.StartTime);
      params.EndTime = formatDateTime(params.EndTime);
      break;
    }
    case 47: {
      params.Switch = openClose(params.Switch);
      break;
    }
    case 48: {
      params.DomainType =
        Number(params.DomainType) === 1 ? '封盘' : '落地';
      break;
    }
    case 52: {
      params.DiscountType =
        Number(params.DiscountType) === 1 ? '优惠赠币' : '优惠支付';
      params.DebitRmb = div100(params.DebitRmb);
      break;
    }
    case 57: {
      params.InUsed = startEnd(params.InUsed);
      params.DomainType =
        Number(params.DomainType) === 1 ? '封盘' : '落地';
      break;
    }
    case 58: {
      params.DomainType =
        Number(params.DomainType) === 1 ? '封盘' : '落地';
      break;
    }
    case 61:
    case 64: {
      params.OnShelf =
        Number(params.OnShelf) === 1 ? '上架' : '下架';
      break;
    }
    case 62: {
      params.InUsed = openClose(params.InUsed);
      break;
    }
    case 63: {
      params.AllowInput =
        Number(params.AllowInput) === 1 ? '[是]' : '[否]';
      break;
    }
    case 68:
    case 70:
    case 90: {
      params.Status = openClose(params.Status);
      break;
    }
    case 71: {
      params.Type = mapLookup(COIN_SERVICE_MAP, params.Type);
      params.Status = openClose(params.Status);
      break;
    }
    case 72:
    case 73: {
      params.Type = mapLookup(COIN_SERVICE_MAP, params.Type);
      break;
    }
    case 74: {
      params.Reply = mapLookup(COIN_SERVICE_MAP, params.Reply);
      break;
    }
    case 79: {
      params.SoldScore = div100(params.SoldScore);
      break;
    }
    case 82: {
      params.Status = startEnd(params.Status);
      break;
    }
    case 84: {
      params.AddScores = Math.abs(Number(params.AddScores) || 0);
      break;
    }
    case 85:
    case 86: {
      params.RealGetTaxMoney = div100(params.RealGetTaxMoney);
      break;
    }
    case 91: {
      params.Switch = openClose(params.Switch);
      break;
    }
    case 96:
    case 97:
    case 98: {
      params.Type = mapLookup(
        {
          1: '问候',
          2: '充值',
          3: '兑换',
          4: '玩家基础信息/游戏',
          5: '其他',
        },
        params.Type,
      );
      break;
    }
    case 100:
    case 101:
    case 102: {
      params.Type = mapLookup(
        {
          1: '充值问题设置',
          2: '兑换问题设置 ',
          3: '其它问题设置',
        },
        params.Type,
      );
      break;
    }
    case 107: {
      params.PayableAmount = div100(params.PayableAmount);
      params.StartTime = formatDateTime(params.StartTime, 'YYYY-MM-DD');
      params.EndTime = formatDateTime(params.EndTime, 'YYYY-MM-DD');
      break;
    }
    case 108: {
      params.ActuallyAmount = div100(params.ActuallyAmount);
      break;
    }
    case 109: {
      params.ActuallyAmount = div100(params.ActuallyAmount);
      params.StartTime = formatDateTime(params.StartTime, 'YYYY-MM-DD');
      params.EndTime = formatDateTime(params.EndTime, 'YYYY-MM-DD');
      break;
    }
    case 111:
    case 113: {
      params.Status = openClose(params.Status);
      break;
    }
    case 114: {
      params.PayRmb = div100(params.PayRmb);
      break;
    }
    case 115: {
      params.Work = Number(params.Work) === 1 ? '上班' : '下班';
      break;
    }
    case 118:
    case 119: {
      params.UserType = mapLookup(USER_TYPE_MAP, params.UserType);
      break;
    }
    case 120: {
      params.IsOpen = openClose(params.IsOpen);
      break;
    }
    case 121:
    case 122: {
      params.OpenTime = formatDateTime(params.OpenTime);
      params.FinishTime = formatDateTime(params.FinishTime);
      break;
    }
    case 125: {
      params.PayType = mapLookup(
        { 1: '支付宝', 2: '微信', 3: '银联', 9: '云支付' },
        params.PayType,
      );
      params.IsHot = openClose(params.IsHot);
      break;
    }
    case 127: {
      params.HandleType = mapLookup(
        {
          1: '已到账',
          2: '已补到',
          3: '完成',
          4: '已更改',
          5: '此ID无此订单',
          6: '账号异常',
        },
        params.HandleType,
      );
      break;
    }
    case 133: {
      params.MinAmount = div100(params.MinAmount);
      params.MaxAmount = div100(params.MaxAmount);
      params.Type = mapLookup(COIN_SERVICE_MAP, params.Type);
      break;
    }
    case 135: {
      params.Type = mapLookup(COIN_SERVICE_MAP, params.Type);
      break;
    }
    case 137: {
      params.AllowInput =
        Number(params.AllowInput) === 1 ? '[是]' : '[否]';
      params.Conditions = conditionFilter(params.Conditions);
      break;
    }
    case 138: {
      params.Amount = div100(params.Amount);
      break;
    }
    case 140: {
      params.Reason = mapLookup(
        { 1: '异常获取', 2: '人工提现' },
        params.Reason,
      );
      params.Amount = div100(params.Amount);
      params.Water = div100(params.Water);
      break;
    }
    case 141: {
      params.Reason = mapLookup(
        {
          1: '活动赠送',
          2: '异常补发',
          3: '平台彩金',
          4: 'VIP升级奖金',
          5: '每月红包',
          6: '生日礼金',
          7: '代理奖金',
          8: '推广奖金',
          9: '存款优惠',
          10: '活动奖金',
          11: '负分清零',
          12: '推荐奖金',
        },
        params.Reason,
      );
      params.Amount = div100(params.Amount);
      params.Water = div100(params.Water);
      break;
    }
    case 145:
    case 146:
    case 147: {
      params.Type = mapLookup({ 1: '杀分', 2: '送分' }, params.Type);
      params.CtrlGold = div100(params.CtrlGold);
      params.EffectiveTime = Math.floor(Number(params.EffectiveTime || 0) / 60);
      break;
    }
    case 149: {
      params.Status = openClose(params.Status);
      break;
    }
    case 150:
    case 152:
    case 153: {
      params.PButton = div100(params.PButton);
      params.PTop =
        Number(params.PTop) / 100 === 0 ? '不限' : div100(params.PTop);
      break;
    }
    case 155: {
      params.PerformanceRate = Number(params.PerformanceRate || 0) / 10;
      break;
    }
    case 156: {
      params.BindPhoneDemo = openClose(params.BindPhoneDemo);
      break;
    }
    case 157: {
      params.NewGold = div100(params.NewGold);
      break;
    }
    case 158: {
      params.BinGold = div100(params.BinGold);
      break;
    }
    case 159: {
      params.BenefitsLimit = div100(params.BenefitsLimit);
      break;
    }
    case 160: {
      params.BenefitsGold = div100(params.BenefitsGold);
      break;
    }
    case 162: {
      params.BindPhoneDemo = openClose(params.BindPhoneDemo);
      params.NewGold = div100(params.NewGold);
      params.BinGold = div100(params.BinGold);
      params.BenefitsLimit = div100(params.BenefitsLimit);
      params.BenefitsGold = div100(params.BenefitsGold);
      break;
    }
    case 163: {
      params.EarningsRate = Number(params.EarningsRate || 0) * 100;
      break;
    }
    case 164: {
      params.IsHot = openClose(params.IsHot);
      break;
    }
    case 165: {
      params.IsPowerful = openClose(params.IsPowerful);
      break;
    }
    case 166: {
      if (Array.isArray(params.CustomList)) {
        params.CustomList = params.CustomList.map((item) =>
          Number(Number(item) / 100),
        );
      }
      break;
    }
    case 176:
    case 183: {
      params.CostOfPaymentOdd = div100(params.CostOfPaymentOdd);
      params.CostOfWithdrawOdd = div100(params.CostOfWithdrawOdd);
      break;
    }
    case 177:
    case 178:
    case 179: {
      params.CreateTime = formatDateTime(params.CreateTime);
      break;
    }
    case 186: {
      params.Enabled = openClose(params.Enabled);
      break;
    }
    case 290: {
      params.SendTime =
        Number(params.SendTime) > 0 ? formatDateTime(params.SendTime) : '';
      break;
    }
    case 291: {
      params.OldSendTime =
        Number(params.OldSendTime) > 0
          ? formatDateTime(params.OldSendTime)
          : '';
      params.NewSendTime =
        Number(params.NewSendTime) > 0
          ? formatDateTime(params.NewSendTime)
          : '';
      break;
    }
    case 848: {
      params.LastBlockTime = params.LastBlockTime || 0;
      break;
    }
    case 884: {
      params.PageId = getSecurityPathName(params.PageId as number | string);
      params.Type = getSecurityTypeName(params.Type);
      params.Status = params.Status ? '开启' : '关闭';
      break;
    }
    case 60_002:
    case 60_003: {
      params.NegativeProfitAmount = div100(params.NegativeProfitAmount);
      params.BalanceAmount = div100(params.BalanceAmount);
      params.NegativeProfitAmountNew = div100(params.NegativeProfitAmountNew);
      params.BalanceAmountNew = div100(params.BalanceAmountNew);
      break;
    }
    case 60_004: {
      params.Switch =
        Number(params.Switch) === 1 ? '全部通道开启' : '全部通道关闭';
      break;
    }
    case 60_101:
    case 60_102: {
      params.AccountType = mapLookup(
        { 1: '电子钱包', 2: '银行', 3: '虚拟币' },
        params.AccountType,
      );
      break;
    }
    default: {
      break;
    }
  }

  return params;
}

export function parseLogParams(params?: LogListItem['Params']) {
  if (!params) {
    return {} as Record<string, unknown>;
  }
  if (typeof params === 'object') {
    return { ...params };
  }
  try {
    return JSON.parse(params) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
}

/** 渲染操作日志内容（含 TemplateId Params 变换） */
export function formatLogContent(
  row: LogListItem,
  options?: { roles?: RoleOption[] },
) {
  const template = row.LogTemplate || '';
  if (!template) {
    return row.LogType || '-';
  }

  try {
    const rawParams = parseLogParams(row.Params);
    const params = transformLogParams(row.TemplateId, rawParams, options);
    return interpolateTemplate(template, params) || template;
  } catch {
    return template;
  }
}
