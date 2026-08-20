export interface CsvColumn<T> {
  header: string;
  value: (row: T, index: number) => number | string;
}

function escapeCsvCell(value: number | string) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportRowsToCsv<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  fileName: string,
) {
  const headerLine = columns
    .map((column) => escapeCsvCell(column.header))
    .join(',');
  const bodyLines = rows.map((row, index) =>
    columns.map((column) => escapeCsvCell(column.value(row, index))).join(','),
  );
  const csvContent = `\uFEFF${[headerLine, ...bodyLines].join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
