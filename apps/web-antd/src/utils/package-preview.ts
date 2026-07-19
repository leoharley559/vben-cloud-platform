import type {
  PackageFormPayload,
  PackageListItem,
} from '#/types/package-config';

type PackagePreviewData = Omit<PackageListItem, 'SortIds'> &
  Partial<PackageFormPayload>;

function legacyResourceSuffix(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0
    ? String(parsed)
    : String(fallback);
}

export function createPackagePreviewUrl(
  baseValue: unknown,
  packageData: PackagePreviewData,
  agentIdValue: unknown,
) {
  const base = String(baseValue || '').trim();
  if (!base) return '';
  if (
    Number(packageData.PackageType) === 2 &&
    Number(packageData.StyleType) === 16
  ) {
    return `${base}${base.includes('?') ? '&' : '?'}type=3`;
  }

  const packageType = Number(packageData.PackageType || 2);
  const styleType = Number(packageData.StyleType);
  const skinColor = packageData.SkinColor ?? packageData.PackageColorStyle;
  const styleCode =
    packageData.StyleType && skinColor
      ? `${packageData.StyleType}_${Number(skinColor) === 1 ? 0 : skinColor}`
      : '';
  const params = new URLSearchParams({
    WxAppID: '',
    WxURL: '',
    agentId: String(agentIdValue || ''),
    gameList: String(packageData.Games || ''),
    or_src: 'recharge',
    res_all:
      packageType === 2
        ? 'resource5'
        : `resource${styleType >= 4 ? styleType - 2 || '' : styleType - 1 || ''}`,
    res_hall:
      packageType === 2
        ? 'hall20002'
        : `hall${legacyResourceSuffix(packageData.H5HallBackground, 20_002)}`,
    res_login:
      packageType === 2
        ? 'nover_login_bg102'
        : `nover_login_bg${legacyResourceSuffix(packageData.H5LoginBackground, 102)}`,
    res_logo: packageType === 2 ? 'nover_logo2' : '',
    roomId: '',
    scOffx: '',
    setup: '0',
    sortList: Array.isArray(packageData.SortIds)
      ? packageData.SortIds.join(',')
      : String(packageData.SortIds || ''),
    soundBgm: String(packageData.MusicData || ''),
    type: packageType === 2 ? '2' : '',
  });
  if (styleCode) params.set('StyleType', styleCode);
  if (packageData.SkinColorPc) {
    params.set('StyleTypePc', String(packageData.SkinColorPc));
  }
  const root = base.endsWith('/') ? base : `${base}/`;
  return `${root}mobile/${styleCode ? `${styleCode}/` : '/'}?${params}`;
}
