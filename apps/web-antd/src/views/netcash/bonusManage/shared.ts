import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const amountPattern = /^-?(?:[1-9]\d*|0\.\d{1,2}|[1-9]\d*\.\d{1,2})$/;

export function validAmount(value: number | string | undefined, max = true) {
  if (value === undefined || value === null || value === '') return false;
  const text = String(value);
  return amountPattern.test(text) && (!max || Number(value) <= 100_000);
}

export function validRemark(value: string, required: boolean) {
  if (!value) return !required;
  return /^[\s\S]{1,400}$/.test(value);
}

export function statusText(value?: number) {
  return { 1: '待审核', 2: '已通过', 3: '已拒绝' }[Number(value)] || '-';
}

export function statusColor(value?: number) {
  return (
    { 1: 'processing', 2: 'success', 3: 'error' }[Number(value)] || 'default'
  );
}

export function exportWorkbook(
  rows: Array<Array<number | string>>,
  headers: string[],
  filename: string,
) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Sheet1');
  XLSX.writeFile(book, filename);
}

export function todayRange(): [Dayjs, Dayjs] {
  return [dayjs().startOf('day'), dayjs().endOf('day')];
}

export const walletOptions = [
  { label: '全部钱包', value: '' },
  { label: '佣金钱包', value: 1 },
];

export const bonusOptions = [
  { label: '全部类型', value: '' },
  { label: '代理红利', value: 1 },
];

export const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '已通过', value: 2 },
  { label: '已拒绝', value: 3 },
];
