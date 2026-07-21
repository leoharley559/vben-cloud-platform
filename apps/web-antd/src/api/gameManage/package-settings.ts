import type { PackageId } from '#/types/package-config';

import { requestClient } from '#/api/request';
import { trimSpace } from '#/utils/string';

/** 包体注册/登录配置 */
export interface PackageRegisterLoginConfig {
  /** 自动登出时长（分钟） */
  AutoLogoutTime?: number;
  Id?: PackageId;
  PackageId?: PackageId;
  [key: string]: unknown;
}

/** 包体支付与提现绑定配置 */
export interface PackagePaymentWithdrawBindConfig {
  /** 支付页跳过绑定等待时长 */
  BindBypassTimeInPayment?: number;
  /** 绑定类型 */
  BindingType?: string;
  Id?: PackageId;
  /** OTP 接收方 */
  OTPReceiver?: string;
  PackageId?: PackageId;
}

/** 包体第三方登录身份配置 */
export interface PackageIdentityConfig {
  /** Android 应用 Id */
  AndroidAppId?: string;
  /** 应用证书 */
  AppCert?: string;
  AppId?: string;
  AppSecret?: string;
  /** iOS 应用 Id */
  IosAppId?: string;
  KeyHash?: string;
  /** 登录平台类型（1/2） */
  LoginPlatformType: 1 | 2;
  PackageAppId?: string;
  PackageId: PackageId;
  /** 是否启用 */
  Status?: boolean;
}

/** 包体 SEO 配置 */
export interface PackageSeoConfig {
  /** 页面内容 */
  Content?: string;
  PackageId: PackageId;
  /** 页面标题 */
  Title?: string;
}

/** 包体站点配置项 */
export interface PackageSiteConfig {
  Id: PackageId;
  PackageId?: PackageId;
  /** 站点名称 */
  SiteName?: string;
}

/** 欢迎邮件多语言文案 */
export interface WelcomeEmailLangText {
  AgentId?: PackageId;
  /** 邮件正文 */
  Content?: string;
  LangGroupId: PackageId;
  /** 邮件标题 */
  Title?: string;
}

/** 欢迎邮件配置 */
export interface WelcomeEmailConfig {
  Id?: PackageId;
  /** 是否开启 */
  IsOpen?: boolean;
  /** 多语言文案 JSON */
  LangText?: string;
  PackageId?: PackageId;
}

/** 包体统计/归因分析配置 */
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

/**
 * 查询包体注册Login配置。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageRegisterLoginConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageRegisterLoginConfig>(
    '/backend/packageregisterloginconfig/',
    { params: { PackageId } },
  );
}

/**
 * 更新包体注册Login配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageRegisterLoginConfigApi(data: {
  Id: PackageId;
  PackageId: PackageId;
  Params: string;
}) {
  return requestClient.put('/backend/packageregisterloginconfig', data);
}

/**
 * 查询包体Payment提现绑定配置。
 *
 * @param packageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackagePaymentWithdrawBindConfigApi(packageId: PackageId) {
  return requestClient.get<PackagePaymentWithdrawBindConfig>(
    `/backend/packagepaymentwithdrawbindconfig/${packageId}`,
  );
}

/**
 * 更新包体Payment提现绑定配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackagePaymentWithdrawBindConfigApi(data: {
  Id: PackageId;
  PackageId: PackageId;
  Params: string;
}) {
  return requestClient.put('/backend/packagepaymentwithdrawbindconfig', data);
}

/**
 * 查询包体登录身份配置。
 *
 * @param PackageId 包体 ID
 * @param LoginPlatformType 登录平台类型（1/2）
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
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

/**
 * 更新包体登录身份配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageIdentityConfigApi(data: PackageIdentityConfig) {
  return requestClient.put('/backend/package/editloginconfig', trimSpace(data));
}

/**
 * 查询包体统计配置。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageAnalyticsConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageAnalyticsConfig>(
    '/backend/package/analyticinfo',
    { params: trimSpace({ PackageId }) },
  );
}

/**
 * 更新包体统计配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageAnalyticsConfigApi(data: Record<string, unknown>) {
  return requestClient.put('/backend/package/analyticinfo', trimSpace(data));
}

/**
 * 查询包体SEO配置。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageSeoConfigApi(PackageId: PackageId) {
  return requestClient.get<PackageSeoConfig>('/backend/package/seoconfig', {
    params: { PackageId },
  });
}

/**
 * 更新包体SEO配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageSeoConfigApi(data: PackageSeoConfig) {
  return requestClient.put('/backend/package/editseoconfig', data);
}

/**
 * 查询欢迎邮件配置。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchWelcomeEmailConfigApi(PackageId: PackageId) {
  return requestClient.get<WelcomeEmailConfig>(
    '/backend/gameemail/newcomerlist',
    { params: trimSpace({ PackageId }) },
  );
}

/**
 * 更新欢迎邮件配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updateWelcomeEmailConfigApi(data: {
  Id?: PackageId;
  IsOpen: boolean;
  LangText: string;
  PackageIds: PackageId;
}) {
  return requestClient.put('/backend/gameemail/newcomeredit', trimSpace(data));
}

/**
 * 查询包体站点Configs。
 *
 * @param PackageId 包体 ID
 * @returns Promise，resolve 为接口返回的数据
 * @see views/gameManage/inclusionDeploy
 */
export function fetchPackageSiteConfigsApi(PackageId: PackageId) {
  return requestClient.get<PackageSiteConfig[]>(
    '/backend/package/packagesiteconfig',
    { params: { PackageId } },
  );
}

/**
 * 新增包体站点配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为新建记录或操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function createPackageSiteConfigApi(data: {
  PackageId: PackageId;
  SiteName: string;
}) {
  return requestClient.post('/backend/package/packagesiteconfig', data);
}

/**
 * reorder包体站点配置相关接口。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为接口响应数据
 * @see views/gameManage/inclusionDeploy
 */
export function reorderPackageSiteConfigApi(data: {
  ConfigId: PackageId;
  ConfigId2: PackageId;
  PackageId: PackageId;
}) {
  return requestClient.post('/backend/package/reorderpackagesiteconfig', data);
}

/**
 * 删除包体站点配置。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为删除操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function deletePackageSiteConfigApi(data: {
  ConfigId: PackageId;
  PackageId: PackageId;
}) {
  return requestClient.delete('/backend/package/packagesiteconfig', {
    params: data,
  });
}

/**
 * 更新包体流水Logs。
 *
 * @param data 提交数据
 * @returns Promise，resolve 为更新/操作结果
 * @see views/gameManage/inclusionDeploy
 */
export function updatePackageTransactionLogsApi(data: {
  PackageId: PackageId;
  TransactionLog: number[];
}) {
  return requestClient.put('/backend/package/edittransactionlogs', data);
}

