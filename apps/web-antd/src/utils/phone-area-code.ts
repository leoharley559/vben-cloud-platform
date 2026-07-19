import type { PhoneAreaCodeListItem } from '#/types/phone-area-code';

export function formatCountryName(
  row: PhoneAreaCodeListItem,
  locale = 'zh-CN',
) {
  if (locale === 'zh-HK' && row.CountryNameZhTw) {
    return row.CountryNameZhTw;
  }
  if (locale.startsWith('en') && row.CountryNameEn) {
    return row.CountryNameEn;
  }
  return row.CountryName || row.CountryNameEn || '-';
}
