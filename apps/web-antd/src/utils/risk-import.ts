/** 解析风控批量导入文件（CSV/TXT；Excel 请另存为 CSV） */
export function parseRiskImportText(
  text: string,
  columnHints: string[],
): string[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const first = lines[0] || '';
  const firstCells = splitCsvLine(first);
  const headerMatched = firstCells.some((cell) =>
    columnHints.some((hint) => cell.includes(hint)),
  );

  const dataLines = headerMatched ? lines.slice(1) : lines;
  const values: string[] = [];

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const value = (cells[0] || '').trim();
    if (value) {
      values.push(value);
    }
  }

  return [...new Set(values)];
}

export type BankCardImportRow = {
  BankCardNum: string;
  BankCode: string;
  BankName: string;
};

/** 解析银行卡黑名单 CSV：列「银行卡号,银行名称」 */
export function parseBankCardRiskImportText(
  text: string,
  bankList: Array<{ BankCode?: string; BankName?: string }>,
): { error?: string; rows: BankCardImportRow[] } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { error: '上传文件为空', rows: [] };
  }

  const firstCells = splitCsvLine(lines[0] || '');
  const headerMatched = firstCells.some(
    (cell) =>
      cell.includes('银行卡') ||
      cell.includes('卡号') ||
      cell.toLowerCase().includes('bank'),
  );
  const dataLines = headerMatched ? lines.slice(1) : lines;
  const rows: BankCardImportRow[] = [];

  for (const line of dataLines) {
    const cells = splitCsvLine(line);
    const cardNum = (cells[0] || '').trim();
    const bankName = (cells[1] || '').trim();
    if (!cardNum) {
      return { error: '上传文件格式不正确（缺少银行卡号）', rows: [] };
    }
    if (!/^.{10,16}$/.test(cardNum)) {
      return { error: `卡号长度需为 10–16 位：${cardNum}`, rows: [] };
    }
    const bankCode = bankList.find(
      (item) => String(item.BankName || '').trim() === bankName,
    )?.BankCode;
    if (!bankCode) {
      return { error: `银行名称不正确：${bankName || '(空)'}`, rows: [] };
    }
    rows.push({
      BankCardNum: cardNum,
      BankCode: bankCode,
      BankName: bankName,
    });
  }

  if (rows.length === 0) {
    return { error: '上传文件为空', rows: [] };
  }
  if (rows.length > 1000) {
    return { error: '单次最多导入 1000 条', rows: [] };
  }

  return { rows };
}

function splitCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

export function downloadRiskImportTemplate(
  filename: string,
  header: string | string[],
) {
  const headerLine = Array.isArray(header) ? header.join(',') : header;
  const content = `\uFEFF${headerLine}\n`;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
