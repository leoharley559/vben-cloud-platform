import type {
  BankCardListItem,
  BankCardListQuery,
  BankCardListResult,
  BankCardResourceType,
  PlayerPayAccountItem,
} from '#/types/bank-card';

import { trimSpace } from '#/utils/string';

export function formatBankCode(
  bankCode?: string,
  bankList?: Array<{ BankCode?: string; BankName?: string }>,
) {
  if (!bankCode) {
    return '-';
  }
  const matched = bankList?.find((item) => item.BankCode === bankCode);
  return matched?.BankName || bankCode;
}

export function resolveBankCodeByName(
  bankName?: string,
  bankList?: Array<{ BankCode?: string; BankName?: string }>,
) {
  const name = String(bankName || '').trim();
  if (!name) {
    return '';
  }
  const matched = bankList?.find(
    (item) => String(item.BankName || '').trim() === name,
  );
  return matched?.BankCode || '';
}

/** 列表查询参数对齐新接口 ResourceType 约定 */
export function normalizeBankCardListQuery(query: BankCardListQuery) {
  const trimmed = trimSpace({ ...query }) as Record<string, unknown>;
  const resourceType = trimmed.ResourceType as BankCardResourceType;
  const page = Number(trimmed.Page ?? 1);
  const pageSize = Number(trimmed.PageSize ?? 20);

  if (trimmed.PlayerId !== undefined && trimmed.PlayerId !== '') {
    return trimSpace({
      Page: page,
      PageSize: pageSize,
      PlayerId: trimmed.PlayerId,
      ResourceType: resourceType,
    });
  }

  const base = {
    BeginTime: trimmed.BeginTime ?? '',
    EndTime: trimmed.EndTime ?? '',
    LoginAccount: trimmed.LoginAccount ?? '',
    Page: page,
    PageSize: pageSize,
    ResourceType: resourceType,
  };

  if (resourceType === 'bank_card') {
    return trimSpace({
      ...base,
      BankCardNum: trimmed.BankCardNum ?? '',
    });
  }

  return trimSpace({
    ...base,
    Account: trimmed.Account ?? '',
    Name: trimmed.Name ?? '',
  });
}

export function mapPayAccountRow(
  item: BankCardListItem | PlayerPayAccountItem,
  kind: 'alipay' | 'wechat',
): BankCardListItem {
  const account = String(
    (item as BankCardListItem).Account ??
      (kind === 'alipay'
        ? (item as BankCardListItem).AlipayAccount
        : (item as BankCardListItem).WechatAccount) ??
      (item as PlayerPayAccountItem).Account ??
      '',
  );
  const name = String(
    (item as BankCardListItem).Name ??
      (kind === 'alipay'
        ? (item as BankCardListItem).AlipayName
        : (item as BankCardListItem).WechatName) ??
      (item as PlayerPayAccountItem).Name ??
      '',
  );
  return {
    ...(item as BankCardListItem),
    BankCardTime:
      (item as BankCardListItem).BankCardTime ??
      (item as PlayerPayAccountItem).CreateTime,
    LoginAccount: (item as BankCardListItem).LoginAccount,
    PlayerId: (item as BankCardListItem).PlayerId,
    QrCodeUrl: String(
      (item as BankCardListItem).QrCodeUrl ??
        (item as PlayerPayAccountItem).QrCodeUrl ??
        '',
    ),
    ...(kind === 'alipay'
      ? { AlipayAccount: account, AlipayName: name }
      : { WechatAccount: account, WechatName: name }),
  };
}

export function parsePlayerPayAccountList(
  result: BankCardListResult,
  kind: 'alipay' | 'wechat',
): BankCardListItem[] {
  const fromItems = (result.Items || []).map((item) =>
    mapPayAccountRow(item, kind),
  );
  if (fromItems.length > 0) {
    return fromItems;
  }
  const legacy =
    kind === 'alipay' ? result.AlipayAccounts : result.WechatAccounts;
  return (legacy || []).map((item) => mapPayAccountRow(item, kind));
}

export function mergePlayerPayAccountListResult(
  bank: BankCardListResult,
  alipay: BankCardListResult,
  wechat: BankCardListResult,
): BankCardListResult {
  return {
    Items: bank.Items || [],
    AlipayAccounts: (alipay.Items || []).map((item) => ({
      Account: String(item.Account ?? item.AlipayAccount ?? ''),
      CreateTime: (item.BankCardTime ?? item.CreateTime) as
        | number
        | string
        | undefined,
      Id: item.Id,
      Name: String(item.Name ?? item.AlipayName ?? ''),
      QrCodeUrl: item.QrCodeUrl,
    })),
    Pagination: bank.Pagination,
    WechatAccounts: (wechat.Items || []).map((item) => ({
      Account: String(item.Account ?? item.WechatAccount ?? ''),
      CreateTime: (item.BankCardTime ?? item.CreateTime) as
        | number
        | string
        | undefined,
      Id: item.Id,
      Name: String(item.Name ?? item.WechatName ?? ''),
      QrCodeUrl: item.QrCodeUrl,
    })),
  };
}
