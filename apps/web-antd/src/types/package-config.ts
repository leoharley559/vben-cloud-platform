export type PackageId = number | string;
export type SerializedPackageField = string;

export interface PackagePagination {
  [key: string]: unknown;
  MaxCount?: number;
  Page?: number;
  PageSize?: number;
}

export interface PackageListQuery {
  [key: string]: unknown;
  FilterKey?: string;
  FilterValue?: string;
  Keyword?: string;
  PackageName?: string;
  Page?: number;
  PageSize?: number;
  Sort?: string;
}

export interface PackageLanguage {
  [key: string]: unknown;
  label?: string;
  value: string;
}

export interface PackageLanguageText {
  [key: string]: unknown;
  CompanyProfile?: string;
  CsAgentConfig?: SerializedPackageField;
  CsLineConfig?: SerializedPackageField;
  LangGrouopId?: PackageId;
  LangGroupId?: PackageId;
  LoadingPictureUrl?: SerializedPackageField;
  VenueSetting?: SerializedPackageField;
}

export interface PackageGameMenuStyle {
  [gameTypeId: string]: number | string;
}

export interface PackageResourceItem {
  [key: string]: unknown;
  Id?: PackageId;
  PictureIp?: string;
  PictureName?: string;
  PictureStyle?: number | string;
  PictureTheme?: number | string;
  PictureType?: number | string;
  SmallPictureIp?: string;
}

export interface PackageMoreItems {
  [key: string]: unknown;
  Resources?: PackageResourceItem[];
}

export interface PackageVipBadgeGroup {
  [key: string]: unknown;
  TemplateId?: PackageId;
  TemplateName?: string;
}

/**
 * Package fields are serialized by the backend. In particular Games,
 * GamesLayoutType, GameMenuStyle, Languages and LangText are strings on the
 * wire even though editors commonly parse them into richer client-side data.
 */
export interface PackageListItem {
  [key: string]: unknown;
  AppBannerId?: PackageId;
  AppHomeAdTmpId?: PackageId;
  Background?: PackageId | string;
  BannerId?: PackageId;
  BetWaterMode?: SerializedPackageField;
  BetWaterTemplateIdV2?: PackageId;
  Description?: string;
  FloatingWindowId?: PackageId;
  GameMenuStyle?: SerializedPackageField;
  Games?: SerializedPackageField;
  GamesLayoutType?: SerializedPackageField;
  GameTemplate?: number;
  H5HallBackground?: PackageId | string;
  H5LoginBackground?: PackageId | string;
  Icon?: PackageId;
  Id?: PackageId;
  LangText?: SerializedPackageField;
  Languages?: SerializedPackageField;
  LivestreamFloatingTmpId?: PackageId;
  MainImgId?: PackageId;
  MusicData?: SerializedPackageField;
  OtherImgId?: PackageId;
  PackageAlias?: string;
  PackageName?: string;
  PackageType?: number;
  PayForAdId?: PackageId;
  PcHomeSettingId?: PackageId;
  SkinColor?: PackageId;
  SkinColorPc?: PackageId;
  SortIds?: SerializedPackageField;
  SteamingBannerId?: PackageId;
  StyleSetting?: number;
  StyleType?: number | string;
  StyleTypePc?: number | string;
  Uid?: string;
  VIPBadgeGroupID?: PackageId;
}

export interface PackageFormPayload {
  [key: string]: unknown;
  AppBannerId?: PackageId;
  AppHomeAdTmpId?: PackageId;
  Background?: PackageId | string;
  BannerId?: PackageId;
  BetWaterTemplateIdV2?: PackageId;
  CsLineConfig?: SerializedPackageField;
  Description?: string;
  FloatingWindowId?: PackageId;
  GameMenuStyle: SerializedPackageField;
  Games: SerializedPackageField;
  GamesLayoutType: SerializedPackageField;
  GameTemplate: number;
  H5HallBackground?: PackageId | string;
  H5LoginBackground?: PackageId | string;
  Hash?: string;
  Icon: PackageId;
  Id?: PackageId;
  LangText?: SerializedPackageField;
  Languages: SerializedPackageField;
  LivestreamFloatingTmpId?: PackageId;
  LogoSetting?: SerializedPackageField;
  MainImgId?: PackageId;
  MoneyLogoIcon?: PackageId | string;
  OtherImgId?: PackageId;
  PackageAlias?: string;
  PackageColorStyle?: PackageId;
  PackageColorStyleId?: PackageId;
  PackageColorStylePc?: PackageId;
  PackageName: string;
  PackageType?: number;
  PayForAdId?: PackageId;
  PcHomeSettingId?: PackageId;
  SortIds?: PackageId[] | SerializedPackageField;
  SteamingBannerId?: PackageId;
  StyleSetting?: number;
  StyleType?: number | string;
  StyleTypePc?: number | string;
  Uid?: string;
  VIPBadgeGroupID?: PackageId;
}

export interface PackageDetail extends PackageListItem {
  CsAgentAddrApp?: string;
  CsAgentAddrPC?: string;
  CsAgentConfig?: SerializedPackageField;
  CsAgentType?: number;
  CsLiveAddress?: string;
  CsLiveType?: number;
  LogoSetting?: SerializedPackageField;
  ThirdNoticeEnable?: boolean;
  ThirdNoticePushKey?: string;
  ThirdNoticePushSecret?: string;
  VenueSetting?: SerializedPackageField;
  WalletAlias?: string;
}

export interface PackageListResult {
  [key: string]: unknown;
  Items?: PackageListItem[];
  MoreItems?: PackageMoreItems;
  Pagination?: PackagePagination;
  VIPBadgeGroups?: PackageVipBadgeGroup[];
}

export interface PackageResourceQuery {
  [key: string]: unknown;
  AgentId?: PackageId;
  Page?: number;
  PageSize?: number;
  PictureStyle?: number | string;
  PictureTheme?: number | string;
  PictureType?: number | string;
}

export interface PackageResourceListResult {
  [key: string]: unknown;
  Items?: PackageResourceItem[];
  Pagination?: PackagePagination;
}

export interface PackageDescriptionPayload {
  [key: string]: unknown;
  Description: string;
  Id: PackageId;
}

export interface PackageUnderageQuery {
  [key: string]: unknown;
  Id: PackageId;
  Type: number;
}

export interface PackageUnderageConfig {
  [key: string]: unknown;
  Age?: number | string;
  Id?: PackageId;
  IsOpen?: boolean | number;
  LangText?: SerializedPackageField;
  PackageId?: PackageId;
  Type?: number;
}

export interface PackageUnderagePayload extends PackageUnderageConfig {
  Id: PackageId;
  LangText: SerializedPackageField;
}

export interface PackageColorThemeQuery {
  [key: string]: unknown;
  DeviceType: number;
  Page?: number;
  PageSize?: number;
  ThemeId?: '' | PackageId;
}

export interface PackageColorThemeItem {
  [key: string]: unknown;
  Color?: Record<string, string> | string;
  ColorName?: string;
  Id?: PackageId;
  ThemeDescription?: string;
  ThemeId?: PackageId;
}

export interface PackageColorThemeListResult {
  [key: string]: unknown;
  Items?: null | PackageColorThemeItem[];
  Pagination?: PackagePagination;
}

export interface AvailableChannelQuery {
  [key: string]: unknown;
  ChannelType?: string;
  PackageConfigId?: PackageId;
  PackageId?: PackageId;
  Status?: number;
}

export interface AvailableChannel {
  [key: string]: unknown;
  ChannelName?: string;
  Id?: PackageId;
  Name?: string;
  PackageId?: PackageId;
  Status?: number;
}

export interface AvailableChannelsResult {
  [key: string]: unknown;
  /** The backend's canonical field. */
  Item?: AvailableChannel[];
  /** Some deployments return the conventional plural field instead. */
  Items?: AvailableChannel[];
  Pagination?: PackagePagination;
}

export interface PackageDependencyItem {
  [key: string]: unknown;
  Id?: PackageId;
  Name?: string;
}

export interface PackageDependencyListResult {
  [key: string]: unknown;
  Item?: PackageDependencyItem[];
  Items?: PackageDependencyItem[];
  Pagination?: PackagePagination;
}
