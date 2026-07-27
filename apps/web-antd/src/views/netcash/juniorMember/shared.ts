import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

export type Row = Record<string, any>;
export type Option = { label: string; value: number | string };
export type Column = {
  dataIndex: string;
  fixed?: 'left' | 'right';
  title: string;
  width: number;
};

/** 产品包下拉选项（下级成员列表 / 变更记录筛选共用） */
export function mapPackageOptions(
  list: Array<{ PackageId: number | string; PackageName: string }> | undefined,
): Option[] {
  return (list || []).map((item) => ({
    label: item.PackageName,
    value: item.PackageId,
  }));
}

/** 导出为 Excel（下级成员列表 / 变更记录导出共用） */
export function writeWorkbook(data: Row[], filename: string) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(book, sheet, filename);
  XLSX.writeFile(book, `${filename}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
}
