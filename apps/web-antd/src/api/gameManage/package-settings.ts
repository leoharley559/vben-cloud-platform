import type { PackageId } from '#/types/package-config';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

export interface PackageRegisterLoginConfig {
  AutoLogoutTime?: number;
  Id?: PackageId;
  PackageId?: PackageId;
  [key: string]: unknown;
}

export interface PackagePaymentWithdrawBindConfig {
  BindBypassTimeInPayment?: number;
  BindingType?: string;
  Id?: PackageId;
  OTPReceiver?: string;
  PackageId?: PackageId;
}

export interface PackageIdentityConfig {
  AndroidAppId?: string;
  AppCert?: string;
  AppId?: string;
  AppSecret?: string;
  IosAppId?: string;
  KeyHash?: string;
  LoginPlatformType: 1 | 2;
  PackageAppId?: string;
  PackageId: PackageId;
  Status?: boolean;
}

export interface PackageSeoConfig {
  Content?: string;
  PackageId: PackageId;
  Title?: string;
}

export interface PackageSiteConfig {
  Id: PackageId;
  PackageId?: PackageId;
  SiteName?: string;
}

export interface WelcomeEmailLangText {
  AgentId?: PackageId;
  Content?: string;
  LangGroupId: PackageId;
  Title?: string;
}

export interface WelcomeEmailConfig {
  Id?: PackageId;
  IsOpen?: boolean;
  LangText?: string;
  PackageId?: PackageId;
}

export interface PackageAnalyticsConfig {
  AdjustAppToken?: string;
  AdjustEventTokenCompleteRegister?: string;
  AdjustEventTokenFirstDeposit?: string;
  AdjustEventTokenFirstOpen?: string;
  AdjustEventTokenInitiatedCheckout?: string;
  AdjustEventTokenLogin?: string;
  AdjustEventTokenPurchase?: string;
  AdjustFBPixelId?: string;
  AdjustS2SToken?: string;
  AnalyticsScript?: string;
  AppsFlyerAndroidAppName?: string;
  AppsFlyerAndroidDevKey?: string;
  AppsFlyerIOSAppName?: string;
  AppsFlyerIOSDevKey?: string;
  AppsFlyerPCBBID?: string;
  AppsFlyerPCDevKey?: string;
  AppsFlyerS2SToken?: string;
  GoogleAnalyticsAndroidApiSecret?: string;
  GoogleAnalyticsAndroidMeasurementId?: string;
  GoogleAnalyticsApiSecret?: string;
  GoogleAnalyticsIosApiSecret?: string;
  GoogleAnalyticsIosMeasurementId?: string;
  GoogleAnalyticsMeasurementId?: string;
  IsRoibestOpen?: boolean;
  MetaConversionApiAccessToken?: string;
  MetaConversionApiDataSourceId?: string;
  OkSpinPixelId?: string;
  PackageAppNameId?: string;
  PackageId?: PackageId;
  [key: string]: unknown;
}

export function fetchPackageRegisterLoginConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageRegisterLoginConfig>(
    '/backend/packageregisterloginconfig/',
    { params: { PackageId } },
  );
}

export function updatePackageRegisterLoginConfigApi(data: {
  Id: PackageId;
  PackageId: PackageId;
  Params: string;
}) {
  return requestClient.put('/backend/packageregisterloginconfig', data);
}

export function fetchPackagePaymentWithdrawBindConfigApi(packageId: PackageId) {
  return requestClient.get<PackagePaymentWithdrawBindConfig>(
    `/backend/packagepaymentwithdrawbindconfig/${packageId}`,
  );
}

export function updatePackagePaymentWithdrawBindConfigApi(data: {
  Id: PackageId;
  PackageId: PackageId;
  Params: string;
}) {
  return requestClient.put('/backend/packagepaymentwithdrawbindconfig', data);
}

export function fetchPackageIdentityConfigApi(
  PackageId: PackageId,
  LoginPlatformType: 1 | 2,
) {
  return requestClient.get<{
    LoginConfig?: PackageIdentityConfig[];
    PackageAppId?: string;
  }>('/backend/package/loginconfig', {
    params: trimSpace({ LoginPlatformType, PackageId }),
  });
}

export function updatePackageIdentityConfigApi(data: PackageIdentityConfig) {
  return requestClient.put('/backend/package/editloginconfig', trimSpace(data));
}

export function fetchPackageAnalyticsConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageAnalyticsConfig>(
    '/backend/package/analyticinfo',
    { params: trimSpace({ PackageId }) },
  );
}

export function updatePackageAnalyticsConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/package/analyticinfo', trimSpace(data));
}

export function fetchPackageSeoConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageSeoConfig>('/backend/package/seoconfig', {
    params: { PackageId },
  });
}

export function updatePackageSeoConfigApi(data: PackageSeoConfig) {
  return requestClient.put('/backend/package/editseoconfig', data);
}

export function fetchWelcomeEmailConfigApi(PackageId: PackageId) {
  return requestClient.get<WelcomeEmailConfig>(
    '/backend/gameemail/newcomerlist',
    { params: trimSpace({ PackageId }) },
  );
}

export function updateWelcomeEmailConfigApi(data: {
  Id?: PackageId;
  IsOpen: boolean;
  LangText: string;
  PackageIds: PackageId;
}) {
  return requestClient.put('/backend/gameemail/newcomeredit', trimSpace(data));
}

export function fetchPackageSiteConfigsApi(PackageId: PackageId) {
  return requestClient.get<PackageSiteConfig[]>(
    '/backend/package/packagesiteconfig',
    { params: { PackageId } },
  );
}

export function createPackageSiteConfigApi(data: {
  PackageId: PackageId;
  SiteName: string;
}) {
  return requestClient.post('/backend/package/packagesiteconfig', data);
}

export function reorderPackageSiteConfigApi(data: {
  ConfigId: PackageId;
  ConfigId2: PackageId;
  PackageId: PackageId;
}) {
  return requestClient.post('/backend/package/reorderpackagesiteconfig', data);
}

export function deletePackageSiteConfigApi(data: {
  ConfigId: PackageId;
  PackageId: PackageId;
}) {
  return requestClient.delete('/backend/package/packagesiteconfig', {
    params: data,
  });
}

export function updatePackageTransactionLogsApi(data: {
  PackageId: PackageId;
  TransactionLog: number[];
}) {
  return requestClient.put('/backend/package/edittransactionlogs', data);
}
