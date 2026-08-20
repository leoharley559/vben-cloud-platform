import type { CsvColumn } from '#/utils/export-csv';

import { message } from 'ant-design-vue';

import { exportRowsToCsv } from '#/utils/export-csv';
import { exportRowsToXlsx } from '#/views/dataClose/shared/report-utils';

export async function exportReportCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: CsvColumn<T>[],
  fileName: string,
) {
  if (rows.length === 0) {
    message.warning('暂无数据可导出');
    return false;
  }
  exportRowsToCsv(rows, columns, fileName);
  return true;
}

export async function exportReportXlsx(
  rows: Record<string, unknown>[],
  headers: string[],
  fileName: string,
  mapper: (row: Record<string, unknown>, index: number) => unknown[],
) {
  if (rows.length === 0) {
    message.warning('暂无数据可导出');
    return false;
  }
  await exportRowsToXlsx(rows, headers, fileName, mapper);
  return true;
}
