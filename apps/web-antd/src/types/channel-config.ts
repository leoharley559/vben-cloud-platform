export type ChannelId = number | string;
export type ChannelSerializedField = string;

/** Comma-separated country/configuration ids on the wire. */
export type DomainRange = ChannelSerializedField;
/** JSON string containing the language caption array on the wire. */
export type H5DownloadDialogLangText = ChannelSerializedField;
/** JSON string containing the selected venue order on the wire. */
export type DefaultTagVenueSetting = ChannelSerializedField;

export interface ChannelPagination {
  [key: string]: unknown;
  CurrPage?: number;
  MaxCount?: number;
  Page?: number;
  PageSize?: number;
}

export interface ChannelAdminOption {
  [key: string]: unknown;
  Id?: ChannelId;
  Name?: string;
  Username?: string;
}

export interface ChannelResource {
  [key: string]: unknown;
  CarouselDetail?: unknown[];
  Id?: ChannelId;
  PictureIp?: string;
  PictureName?: string;
  PictureProperty?: number;
  PictureStyle?: number | string;
  SmallPictureIp?: string;
}

export interface ChannelMoreItems {
  [key: string]: unknown;
  Parents: ChannelAdminOption[];
  Resources: ChannelResource[];
}

export interface ChannelListQuery {
  [key: string]: unknown;
  ChannelId?: '' | ChannelId;
  ChannelName?: string;
  ChannelType?: number;
  DataSearchType?: number;
  InvitationCode?: string;
  IsHidden?: number | string;
  IsHiddenAgent?: number | string;
  Keyword?: string;
  NetCashDomain?: string;
  NetCashH5Domain?: string;
  PackageId?: '' | ChannelId;
  PackageName?: string;
  PackStatus?: number | string;
  Page?: number;
  PageSize?: number;
  PromoterAdminId?: '' | ChannelId;
  PushType?: number | string;
  Sort?: string;
}

export interface ChannelRow {
  [key: string]: unknown;
  AdminId?: ChannelId;
  AndroidAppPkgType?: number;
  AndroidPkgConfigId?: ChannelId;
  AppPackageConfigId?: ChannelId;
  ChannelId?: ChannelId;
  ChannelName?: string;
  CreateTime?: number | string;
  DefaultTagSelected?: number;
  DefaultTagVenueSetting?: DefaultTagVenueSetting;
  Domain?: string;
  H5Domain1?: string;
  Id?: ChannelId;
  InvitationCode?: string;
  IosPackageId?: ChannelId;
  IosPkgConfigId?: ChannelId;
  IosType?: number;
  IsAppAnalyticsSet?: boolean;
  IsHidden?: boolean | number;
  NetCashDomain?: string;
  NetCashH5Domain?: string;
  PackageConfigId?: ChannelId;
  PackageName?: string;
  PackStatus?: number | string;
  PromoterAdminId?: ChannelId;
  PushType?: number;
  Remark?: string;
  SiteConfigId?: ChannelId;
  SiteConfigType?: string;
  SiteName?: string;
  ThirdCustomIosUrl?: string;
  ThirdOrIos?: 1 | 2 | 3 | number;
}

export interface ChannelListResult {
  [key: string]: unknown;
  Items: ChannelRow[];
  MoreItems: ChannelMoreItems;
  Pagination?: ChannelPagination;
}

export interface ChannelHierarchyQuery {
  [key: string]: unknown;
  AdminId?: '' | ChannelId;
  ChannelId?: '' | ChannelId;
  ChannelName?: string;
  NetCashDomain?: string;
  NetCashH5Domain?: string;
  PromoterAdminName?: string;
  PromoterAdminUserName?: string;
  PushType?: number | string;
}

export interface ChannelHierarchyResult {
  [key: string]: unknown;
  ItemsAdmin?: ChannelAdminOption;
  ItemsSon: ChannelRow[];
  Parents: ChannelAdminOption[];
}

export interface ChannelFormPayload {
  [key: string]: unknown;
  AdminId?: ChannelId;
  AndroidAppPkgType?: number;
  AppPackageConfigId?: ChannelId;
  BackgroundId?: '' | ChannelId;
  ChannelName?: string;
  CnnzCode?: string;
  CustomApkName?: string;
  DefaultTagSelected?: number;
  DefaultTagVenueSetting?: DefaultTagVenueSetting;
  Domain?: string;
  DomainRange?: DomainRange;
  GameTabSelected?: number;
  H5Domain1?: string;
  H5DownloadDialogLangText?: H5DownloadDialogLangText;
  H5DownloadType?: string;
  H5DownloadUserTarget?: number;
  H5LandingImg?: string;
  H5LandingPage?: number;
  H5Version?: number;
  Hash?: string;
  Id?: ChannelId;
  IosPackageId?: '' | ChannelId;
  IosType?: number;
  IsHidden?: boolean | number;
  IsOpenH5Download?: boolean | number;
  IsOpenH5RecommendDownload?: boolean;
  IsOpenH5Site?: boolean | number;
  IsOpenKeFu?: boolean | number;
  IsPureWebMode?: boolean;
  KeFuRadio?: number;
  KeFuThirdUrl?: string;
  LandId?: '' | ChannelId;
  PackageConfigId?: '' | ChannelId;
  PackPlatformType?: string;
  PageAutoDown?: number;
  PageAutoDownTime?: number | string;
  PrecautionActive?: number;
  PrecautionFirst?: number;
  PromoterAdminId?: '' | ChannelId;
  PushType?: number;
  Remark?: string;
  ReqPathType?: number;
  SetIconUrl?: string;
  SetPackageName?: string;
  TempValue?: unknown[];
  Version?: number;
}

export interface ChannelDetail
  extends ChannelRow, Omit<ChannelFormPayload, 'Id'> {}

export interface ChannelBatchPayload {
  [key: string]: unknown;
  ActionType: number;
  AndroidAppPkgType?: number;
  BackgroundId?: ChannelId;
  DefaultTagSelected?: number;
  DefaultTagVenueSetting?: DefaultTagVenueSetting;
  Domain?: string;
  GameTabSelected?: number;
  H5Domain1?: string;
  H5DownloadUserTarget?: number;
  H5LandingPage?: number;
  Ids: string;
  IosPackageId?: ChannelId;
  IosType?: number;
  IsOpenH5Download?: boolean | number;
  IsOpenH5Site?: boolean | number;
  IsOpenKeFu?: boolean | number;
  KeFuRadio?: number;
  KeFuThirdUrl?: string;
  PackPlatformType?: string;
  PageAutoDown?: number;
  PageAutoDownTime?: number | string;
  PromoterAdminId?: ChannelId;
  PushType?: number;
}

export interface ChannelBatchResult {
  [key: string]: unknown;
  FailCount: number;
  FailIds: ChannelId[];
}

export interface ChannelInvitationPayload extends ChannelFormPayload {
  InvitationCode: string;
  ReqPathType: 2 | number;
}

export interface ChannelRepackQuery {
  [key: string]: unknown;
  ChannelId: ChannelId;
}

export interface ChannelPackageOption {
  [key: string]: unknown;
  Id?: ChannelId;
  PackageAlias?: string;
  PackageId?: ChannelId;
  PackageName?: string;
  PackageType?: number;
}

export interface ChannelDomainQuery {
  [key: string]: unknown;
  InUsed?: number;
  IsAll?: number;
  OnlyUnused?: boolean;
  PackageId?: ChannelId;
  Page?: number;
  PageSize?: number;
  Type?: number;
}

export interface ChannelDomainOption {
  [key: string]: unknown;
  Domain?: string;
  Id?: ChannelId;
  InUsed?: number;
  Name?: string;
  Type?: number;
}

export interface ChannelDomainListResult {
  [key: string]: unknown;
  Items: ChannelDomainOption[];
  Pagination?: ChannelPagination;
}

export interface ChannelIosPackageOption {
  [key: string]: unknown;
  AppName?: string;
  AppUrl?: string;
  CreateTime?: number | string;
  Id?: ChannelId;
  IosName?: string;
  PackageId?: ChannelId;
  PackageName?: string;
  PkCode?: string;
  PkName?: string;
}

export interface ChannelIosPackageListResult {
  [key: string]: unknown;
  Items: ChannelIosPackageOption[];
}

export interface ChannelAppPackageOption {
  [key: string]: unknown;
  AppName?: string;
  AppUrl?: string;
  CreateTime?: number | string;
  Id?: ChannelId;
  PackageName?: string;
  PkCode?: string;
  PkName?: string;
  Status?: number;
}

/**
 * The targeted package endpoints retain the legacy contract: callers submit
 * the complete channel detail with the selected shelf package id.
 */
export interface ChannelPackagePayload extends ChannelDetail {
  AppPackageConfigId?: ChannelId;
  PromoterAdminId?: ChannelId;
  ThirdCustomIosUrl?: string;
  ThirdOrIos?: 1 | 2 | 3 | number;
}

export interface ChannelLandingResourceQuery {
  [key: string]: unknown;
  AgentId?: ChannelId;
  Page?: number;
  PageSize?: number;
  PictureStyle?: number | string;
  PictureType?: number | string;
}

export interface ChannelLandingResourceListResult {
  [key: string]: unknown;
  Items: ChannelResource[];
  Pagination?: ChannelPagination;
}

export interface ChannelCountryOption {
  [key: string]: unknown;
  CountryCode?: string;
  CountryName?: string;
  Id?: ChannelId;
  Name?: string;
}

export interface ChannelCountryListResult {
  [key: string]: unknown;
  Items: ChannelCountryOption[];
  Pagination?: ChannelPagination;
}

export interface DefaultTagVenueOption {
  [key: string]: unknown;
  ApiFee?: number | string;
  GameId?: ChannelId;
  I18nKey?: string;
  Name?: string;
}

export type DefaultTagVenuesResult = DefaultTagVenueOption[] | null | string;

export interface ChannelUrlQuery {
  [key: string]: unknown;
  ChannelId: ChannelId;
}

export interface ChannelUrlConfig {
  [key: string]: unknown;
  ChannelId?: ChannelId;
  Domain?: string;
  DomainType?: number;
  GamePromotionChannel?: '' | ChannelId;
  GamePromotionModel?: number;
  MatchDomain?: string;
  MatchDomainType?: number;
}

export interface ChannelShortUrlConfig {
  [key: string]: unknown;
  ChannelId?: ChannelId;
  ShortUrl?: string;
  Url?: string;
}

export interface AvailableChannelQuery {
  [key: string]: unknown;
  ChannelType?: string;
  PackageConfigId?: ChannelId;
  Status?: number;
}

export interface AvailableChannel {
  [key: string]: unknown;
  ChannelId?: ChannelId;
  ChannelName?: string;
  Id?: ChannelId;
}

export interface AvailableChannelsResult {
  [key: string]: unknown;
  Item: AvailableChannel[];
  Items?: AvailableChannel[];
}

export interface ChannelSiteOption {
  [key: string]: unknown;
  Id: ChannelId;
  PackageId?: ChannelId;
  SiteName?: string;
}

export interface ChannelSitePayload {
  [key: string]: unknown;
  ChannelId: ChannelId;
  ConfigId: ChannelId;
  PackageId: ChannelId;
}

export interface ChannelSiteTypePayload {
  [key: string]: unknown;
  ChannelId: ChannelId;
  PackageId: ChannelId;
  SiteConfigType: string;
}

export interface ChannelRegisterLoginConfig {
  [key: string]: unknown;
  AutoLogoutTime?: number;
  ChannelId?: ChannelId;
  Id?: ChannelId;
  Params?: ChannelSerializedField;
}

export interface ChannelRegisterLoginPayload {
  ChannelId: ChannelId;
  Id: ChannelId;
  /** Exact JSON string consumed by the legacy endpoint. */
  Params: ChannelSerializedField;
}

export interface ChannelAnalyticsConfig {
  [key: string]: unknown;
  /** Serialized provider groups used by the PUT payload. */
  Adjust?: ChannelSerializedField;
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
  AppsFlyer?: ChannelSerializedField;
  AppsFlyerAndroidAppName?: string;
  AppsFlyerAndroidDevKey?: string;
  AppsFlyerIOSAppName?: string;
  AppsFlyerIOSDevKey?: string;
  AppsFlyerPCBBID?: string;
  AppsFlyerPCDevKey?: string;
  AppsFlyerS2SToken?: string;
  ChannelId?: ChannelId;
  Facebook?: ChannelSerializedField;
  Google?: ChannelSerializedField;
  GoogleAnalyticsAndroidApiSecret?: string;
  GoogleAnalyticsAndroidMeasurementId?: string;
  GoogleAnalyticsApiSecret?: string;
  GoogleAnalyticsIosApiSecret?: string;
  GoogleAnalyticsIosMeasurementId?: string;
  GoogleAnalyticsMeasurementId?: string;
  H5Analytic?: ChannelSerializedField;
  IsRoibestOpen?: boolean;
  MetaConversionApiAccessToken?: string;
  MetaConversionApiDataSourceId?: string;
  Okspin?: ChannelSerializedField;
  OkSpinPixelId?: string;
  PackageAppNameId?: string;
  Riobest?: ChannelSerializedField;
}

export interface ChannelUploadResponse {
  [key: string]: unknown;
  FileName?: string;
  Path?: string;
  Url?: string;
}
