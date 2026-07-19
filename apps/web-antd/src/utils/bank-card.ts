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
