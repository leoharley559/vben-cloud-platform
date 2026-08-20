import type { FundFlowListItem } from '#/types/fund-flow';
import type { ParsedGameConfig } from '#/utils/game-config';

import { formatVenueName } from '#/utils/game-config';

export interface GoldLogTemplateItem {
  LangEn?: string;
  LangTw?: string;
  LangZh?: string;
  Name?: string;
  Reason?: number | string;
  Type?: number | string;
}

function parseExInfo(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return { OrderId: '', Remark: raw };
    } catch {
      return { OrderId: '', Remark: raw };
    }
  }
  return {};
}

function applyTemplate(template: string, row: Record<string, unknown>) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => {
    const value = row[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/**
 * 对齐旧站 formatList：解析 ExInfo、套用 GoldLogTemplate、补齐备注占位字段
 */
export function enrichFundFlowItems(
  items: FundFlowListItem[],
  templates: GoldLogTemplateItem[] = [],
  gameConfig?: null | ParsedGameConfig,
) {
  return items.map((raw) => {
    const row: FundFlowListItem = { ...raw };
    const exInfo = parseExInfo(row.ExInfo);
    row.ExInfo = exInfo;

    const addGoldCent = Number(row.AddGold || 0);
    const addGoldYuan = (addGoldCent / 100).toFixed(2);
    const type = addGoldCent >= 0 ? 1 : 2;

    row.OrderId = exInfo.OrderId ?? '';
    row.WalletType = exInfo.WalletType ?? '';
    row.WithdrawWaterMultiply = exInfo.WithdrawWaterMultiply ?? '';
    row.GameType =
      row.GameType === undefined || row.GameType === null || row.GameType === ''
        ? ''
        : formatVenueName(row.GameType as number | string, gameConfig);

    let langZh = '';
    let langTw = '';
    let langEn = '';
    let name = '';

    for (const tpl of templates) {
      const reasonMatched = String(tpl.Reason) === String(row.Reason);
      if (!reasonMatched) {
        continue;
      }
      const reasonNum = Number(row.Reason);
      if ((reasonNum === 82 || reasonNum === 109 || reasonNum === 110) && Number(tpl.Type) !== type) {
          continue;
        }
      langZh = String(tpl.LangZh || '');
      langTw = String(tpl.LangTw || '');
      langEn = String(tpl.LangEn || '');
      name = String(tpl.Name || '');
      break;
    }

    const templateCtx: Record<string, unknown> = {
      ...row,
      ...exInfo,
      AddGold: addGoldYuan,
      Balance:
        exInfo.Balance !== undefined && exInfo.Balance !== null
          ? (Number(exInfo.Balance) / 100).toFixed(2)
          : ' - ',
    };

    if (Number(row.Reason) === 97) {
      const balanceText =
        exInfo.Balance !== undefined && exInfo.Balance !== null
          ? (Number(exInfo.Balance) / 100).toFixed(2)
          : ' - ';
      langZh = langZh.replaceAll('{Balance}', balanceText);
      langTw = langTw.replaceAll('{Balance}', balanceText);
      langEn = langEn.replaceAll('{Balance}', balanceText);
    }

    row.LangZh = langZh ? applyTemplate(langZh, templateCtx) : '';
    row.LangTw = langTw ? applyTemplate(langTw, templateCtx) : '';
    row.LangEn = langEn ? applyTemplate(langEn, templateCtx) : '';
    row.Name = name;

    return row;
  });
}

export function formatFundFlowRemark(row: FundFlowListItem, locale = 'zh-CN') {
  const base =
    locale === 'zh-HK'
      ? row.LangTw
      : (locale === 'en-US'
        ? row.LangEn
        : row.LangZh);
  let remark = base ? String(base) : '';
  const reason = Number(row.Reason);
  const exInfo = (row.ExInfo || {}) as Record<string, unknown>;

  if ([48, 109, 110].includes(reason) && exInfo.Remark) {
    remark += `(${exInfo.Remark})`;
  }
  if (reason === 82 && exInfo.ApplyRemark) {
    remark += `(${exInfo.ApplyRemark})`;
  }
  return remark || '-';
}
