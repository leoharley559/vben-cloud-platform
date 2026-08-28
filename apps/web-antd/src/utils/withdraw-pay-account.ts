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
/** 微信 / 扫码类提款（对齐旧站 withdrawType 扩展） */
const WITHDRAW_WECHAT_ACCOUNT_TYPES = new Set([207, 210]);

function normalizeAccount(value: unknown) {
  return String(value ?? '').trim();
}

export function resolveWithdrawPayAccountKind(
  accountType?: number | string,
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
  return 'unknown';
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
) {
  const bank = matchBankAccount(target, listResult.Items || [], typeLabel);
  if (bank) {
    return bank;
  }
  const alipay = matchAlipayAccount(target, listResult, typeLabel);
  if (alipay) {
    return alipay;
  }
  return matchWechatAccount(target, listResult, typeLabel);
}

/**
 * 按提款订单 AccountType + AccountNum 匹配玩家绑定账号（对齐玩家概览 playerbankcard/list）
 */
export function matchWithdrawPayAccount(
  accountType?: number | string,
  accountNum?: string,
  listResult?: BankCardListResult,
): null | WithdrawMatchedPayAccount {
  const target = normalizeAccount(accountNum);
  if (!target || !listResult) {
    return null;
  }

  const typeLabel = payTypeLabel(accountType);
  const kind = resolveWithdrawPayAccountKind(accountType);

  if (kind === 'bank') {
    return matchBankAccount(target, listResult.Items || [], typeLabel);
  }
  if (kind === 'alipay') {
    return matchAlipayAccount(target, listResult, typeLabel);
  }
  if (kind === 'wechat') {
    return matchWechatAccount(target, listResult, typeLabel);
  }
  return matchAcrossLists(target, listResult, typeLabel);
}
