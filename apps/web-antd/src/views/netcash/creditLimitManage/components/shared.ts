import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import { formatAmountFromCent } from '#/utils/format-amount';
import { formatNetcashDateTime } from '#/utils/netcash';

export type Row = Record<string, any>;
export type DateRange = [Dayjs, Dayjs] | undefined;

export const accountTypeOptions = [
  { label: '全部', value: '' },
  { label: '普通代理', value: 1 },
  { label: '官方代理', value: 2 },
  { label: '测试代理', value: 3 },
];

export const accountTypeMap: Record<number, string> = {
  0: '无',
  1: '普通代理',
  2: '官方代理',
  3: '测试代理',
};

export const transferTypeOptions = [
  { label: '全部', value: '3,8' },
  { label: '调整', value: 3 },
  { label: '还款', value: 8 },
];

export const transferTypeMap: Record<number, string> = {
  3: '调整',
  8: '还款',
};

export function amount(value: unknown) {
  return formatAmountFromCent(Number(value || 0));
}

export function date(value: unknown) {
  return formatNetcashDateTime(value as string);
}

/** getagentcreditlimit 的 respond.Items 是对象而非数组，兼容两种形态 */
export function unwrapCreditLimitItem(result: unknown): Row {
  const body = (result ?? {}) as Row;
  const items = body.Items ?? body.Data ?? body;
  if (items && typeof items === 'object' && !Array.isArray(items)) {
    return items as Row;
  }
  if (Array.isArray(items) && items[0]) {
    return items[0] as Row;
  }
  return {};
}

export function rangeParams(
  range: DateRange,
  beginField: string,
  endField: string,
) {
  return {
    [beginField]: range?.[0] ? dayjs(range[0]).startOf('day').unix() : '',
    [endField]: range?.[1] ? dayjs(range[1]).endOf('day').unix() : '',
  };
}

export async function exportRows(
  fileName: string,
  columns: Array<{
    field: string;
    formatter?: (value: unknown, row: Row) => unknown;
    title: string;
  }>,
  rows: Row[],
) {
  if (rows.length === 0) return false;
  const { utils, writeFile } = await import('xlsx');
  const data = rows.map((row) =>
    Object.fromEntries(
      columns.map((column) => [
        column.title,
        column.formatter
          ? column.formatter(row[column.field], row)
          : (row[column.field] ?? ''),
      ]),
    ),
  );
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet(data), '数据');
  writeFile(book, `${fileName}.xlsx`);
  return true;
}
