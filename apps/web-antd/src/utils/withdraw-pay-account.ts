import type {
  BankCardListItem,
  BankCardListResult,
  PlayerPayAccountItem,
} from '#/types/bank-card';

import { payTypeLabel } from '#/views/netcash/drawmoneyManage/shared';

export type WithdrawPayAccountKind = 'alipay' | 'bank' | 'unknown' | 'wechat';

export interface WithdrawMatchedPayAccount {
  account: string;
  kind: WithdrawPayAccountKind;
  name: string;
  qrCodeUrl: string;
  typeLabel: string;
}

const WITHDRAW_BANK_ACCOUNT_TYPES = new Set([1, 204]);
const WITHDRAW_ALIPAY_ACCOUNT_TYPES = new Set([2, 206]);
/** 微信 / 扫码类提款（含站点常用 13，以及第三方映射 207/210） */
const WITHDRAW_WECHAT_ACCOUNT_TYPES = new Set([13, 207, 210]);

function normalizeAccount(value: unknown) {
  return String(value ?? '').trim();
}

function resolveKindFromLabel(label?: string): WithdrawPayAccountKind {
  const text = String(label ?? '').trim().toLowerCase();
  if (!text) {
    return 'unknown';
  }
  if (
    text.includes('微信') ||
    text.includes('wechat') ||
    text.includes('weixin')
  ) {
    return 'wechat';
  }
  if (text.includes('支付宝') || text.includes('alipay')) {
    return 'alipay';
  }
  if (text.includes('银行') || text.includes('bank')) {
    return 'bank';
  }
  return 'unknown';
}

export function resolveWithdrawPayAccountKind(
  accountType?: number | string,
  accountBank?: string,
): WithdrawPayAccountKind {
  const type = Number(accountType);
  if (WITHDRAW_BANK_ACCOUNT_TYPES.has(type)) {
    return 'bank';
  }
  if (WITHDRAW_ALIPAY_ACCOUNT_TYPES.has(type)) {
    return 'alipay';
  }
  if (WITHDRAW_WECHAT_ACCOUNT_TYPES.has(type)) {
    return 'wechat';
  }
  // 兜底：按 PAY_TYPE_MAP / AccountBank 文案归类，避免漏配类型时误走跨列表匹配
  const fromPayType = resolveKindFromLabel(payTypeLabel(type));
  if (fromPayType !== 'unknown') {
    return fromPayType;
  }
  return resolveKindFromLabel(accountBank);
}

function mapBankCardItem(
  item: BankCardListItem,
  typeLabel: string,
): WithdrawMatchedPayAccount {
  return {
    account: normalizeAccount(item.BankCardNum),
    kind: 'bank',
    name: String(item.BankRealName || item.RealName || ''),
    qrCodeUrl: '',
    typeLabel,
  };
}

function mapPayAccountItem(
  item: PlayerPayAccountItem,
  kind: 'alipay' | 'wechat',
  typeLabel: string,
): WithdrawMatchedPayAccount {
  return {
    account: normalizeAccount(item.Account),
    kind,
    name: String(item.Name || ''),
    qrCodeUrl: String(item.QrCodeUrl || '').trim(),
    typeLabel,
  };
}

function matchBankAccount(
  target: string,
  items: BankCardListItem[],
  typeLabel: string,
) {
  const item = items.find(
    (row) => normalizeAccount(row.BankCardNum) === target,
  );
  return item ? mapBankCardItem(item, typeLabel) : null;
}

function matchAlipayAccount(
  target: string,
  listResult: BankCardListResult,
  typeLabel: string,
) {
  const accounts = listResult.AlipayAccounts || [];
  const matched = accounts.find(
    (item) => normalizeAccount(item.Account) === target,
  );
  if (matched) {
    return mapPayAccountItem(matched, 'alipay', typeLabel);
  }
  const legacy = (listResult.Items || []).find(
    (row) => normalizeAccount(row.AlipayAccount) === target,
  );
  if (legacy) {
    return {
      account: normalizeAccount(legacy.AlipayAccount),
      kind: 'alipay' as const,
      name: String(legacy.AlipayName || ''),
      qrCodeUrl: String(legacy.QrCodeUrl || '').trim(),
      typeLabel,
    };
  }
  return null;
}

function matchWechatAccount(
  target: string,
  listResult: BankCardListResult,
  typeLabel: string,
) {
  const accounts = listResult.WechatAccounts || [];
  const matched = accounts.find(
    (item) => normalizeAccount(item.Account) === target,
  );
  if (matched) {
    return mapPayAccountItem(matched, 'wechat', typeLabel);
  }
  const legacy = (listResult.Items || []).find(
    (row) => normalizeAccount(row.WechatAccount) === target,
  );
  if (legacy) {
    return {
      account: normalizeAccount(legacy.WechatAccount),
      kind: 'wechat' as const,
      name: String(legacy.WechatName || ''),
      qrCodeUrl: String(legacy.QrCodeUrl || '').trim(),
      typeLabel,
    };
  }
  return null;
}

function matchAcrossLists(
  target: string,
  listResult: BankCardListResult,
  typeLabel: string,
  kindHint: WithdrawPayAccountKind = 'unknown',
) {
  const alipay = matchAlipayAccount(target, listResult, typeLabel);
  const wechat = matchWechatAccount(target, listResult, typeLabel);

  // 未知类型撞号时，若文案能提示提现方式，优先按提示选
  if (kindHint === 'alipay' && alipay) {
    return alipay;
  }
  if (kindHint === 'wechat' && wechat) {
    return wechat;
  }
  if (kindHint === 'bank') {
    return matchBankAccount(target, listResult.Items || [], typeLabel);
  }

  if (alipay?.qrCodeUrl && !wechat?.qrCodeUrl) {
    return alipay;
  }
  if (wechat?.qrCodeUrl && !alipay?.qrCodeUrl) {
    return wechat;
  }
  if (alipay && wechat) {
    // 两边都有码且账号相同：无法可靠区分，宁可不展示错误二维码
    return null;
  }
  if (alipay) {
    return alipay;
  }
  if (wechat) {
    return wechat;
  }
  return matchBankAccount(target, listResult.Items || [], typeLabel);
}

/**
 * 按提款订单 AccountType + AccountNum 匹配玩家绑定账号（对齐玩家概览 playerbankcard/list）
 * @param accountBank 订单 AccountBank 文案，用于类型码漏配时的兜底归类
 */
export function matchWithdrawPayAccount(
  accountType?: number | string,
  accountNum?: string,
  listResult?: BankCardListResult,
  accountBank?: string,
): null | WithdrawMatchedPayAccount {
  const target = normalizeAccount(accountNum);
  if (!target || !listResult) {
    return null;
  }

  const typeLabel =
    String(accountBank || '').trim() || payTypeLabel(accountType);
  const kind = resolveWithdrawPayAccountKind(accountType, accountBank);

  if (kind === 'bank') {
    return matchBankAccount(target, listResult.Items || [], typeLabel);
  }
  if (kind === 'alipay') {
    return matchAlipayAccount(target, listResult, typeLabel);
  }
  if (kind === 'wechat') {
    return matchWechatAccount(target, listResult, typeLabel);
  }
  return matchAcrossLists(target, listResult, typeLabel, kind);
}
