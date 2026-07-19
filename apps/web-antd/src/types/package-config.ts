export type PackageId = number | string;
export type SerializedPackageField = string;

export interface PackagePagination {
  MaxCount?: number;
  Page?: number;
  PageSize?: number;
  [key: string]: unknown;
}

export interface PackageListQuery {
  FilterKey?: string;
  FilterValue?: string;
  Keyword?: string;
  PackageName?: string;
  Page?: number;
  PageSize?: number;
  Sort?: string;
  [key: string]: unknown;
}

export interface PackageLanguage {
  label?: string;
  value: string;
  [key: string]: unknown;
}

export interface PackageLanguageText {
  CompanyProfile?: string;
  CsAgentConfig?: SerializedPackageField;
  CsLineConfig?: SerializedPackageField;
  LangGrouopId?: PackageId;
  LangGroupId?: PackageId;
  LoadingPictureUrl?: SerializedPackageField;
  VenueSetting?: SerializedPackageField;
  [key: string]: unknown;
}

export interface PackageGameMenuStyle {
  [gameTypeId: string]: number | string;
}

export interface PackageResourceItem {
  Id?: PackageId;
  PictureIp?: string;
  PictureName?: string;
  PictureStyle?: number | string;
  PictureTheme?: number | string;
  PictureType?: number | string;
  SmallPictureIp?: string;
  [key: string]: unknown;
}

export interface PackageMoreItems {
  Resources?: PackageResourceItem[];
  [key: string]: unknown;
}

export interface PackageVipBadgeGroup {
  TemplateId?: PackageId;
  TemplateName?: string;
  [key: string]: unknown;
}

/**
 * Package fields are serialized by the backend. In particular Games,
 * GamesLayoutType, GameMenuStyle, Languages and LangText are strings on the
 * wire even though editors commonly parse them into richer client-side data.
 */
export interface PackageListItem {
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
  Languages?: SerializedPackageField;
  LangText?: SerializedPackageField;
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
  [key: string]: unknown;
}

export interface PackageFormPayload {
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
  Hash?: string;
  H5HallBackground?: PackageId | string;
  H5LoginBackground?: PackageId | string;
  Icon: PackageId;
  Id?: PackageId;
  Languages: SerializedPackageField;
  LangText?: SerializedPackageField;
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
  [key: string]: unknown;
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
  Items?: PackageListItem[];
  MoreItems?: PackageMoreItems;
  Pagination?: PackagePagination;
  VIPBadgeGroups?: PackageVipBadgeGroup[];
  [key: string]: unknown;
}

export interface PackageResourceQuery {
  AgentId?: PackageId;
  Page?: number;
  PageSize?: number;
  PictureStyle?: number | string;
  PictureTheme?: number | string;
  PictureType?: number | string;
  [key: string]: unknown;
}

export interface PackageResourceListResult {
  Items?: PackageResourceItem[];
  Pagination?: PackagePagination;
  [key: string]: unknown;
}

export interface PackageDescriptionPayload {
  Description: string;
  Id: PackageId;
  [key: string]: unknown;
}

export interface PackageUnderageQuery {
  Id: PackageId;
  Type: number;
  [key: string]: unknown;
}

export interface PackageUnderageConfig {
  Age?: number | string;
  Id?: PackageId;
  IsOpen?: boolean | number;
  LangText?: SerializedPackageField;
  PackageId?: PackageId;
  Type?: number;
  [key: string]: unknown;
}

export interface PackageUnderagePayload extends PackageUnderageConfig {
  Id: PackageId;
  LangText: SerializedPackageField;
}

export interface PackageColorThemeQuery {
  DeviceType: number;
  Page?: number;
  PageSize?: number;
  ThemeId?: '' | PackageId;
  [key: string]: unknown;
}

export interface PackageColorThemeItem {
  Color?: Record<string, string> | string;
  ColorName?: string;
  Id?: PackageId;
  ThemeDescription?: string;
  ThemeId?: PackageId;
  [key: string]: unknown;
}

export interface PackageColorThemeListResult {
  Items?: null | PackageColorThemeItem[];
  Pagination?: PackagePagination;
  [key: string]: unknown;
}

export interface AvailableChannelQuery {
  ChannelType?: string;
  PackageConfigId?: PackageId;
  PackageId?: PackageId;
  Status?: number;
  [key: string]: unknown;
}

export interface AvailableChannel {
  ChannelName?: string;
  Id?: PackageId;
  Name?: string;
  PackageId?: PackageId;
  Status?: number;
  [key: string]: unknown;
}

export interface AvailableChannelsResult {
  /** The backend's canonical field. */
  Item?: AvailableChannel[];
  /** Some deployments return the conventional plural field instead. */
  Items?: AvailableChannel[];
  Pagination?: PackagePagination;
  [key: string]: unknown;
}

export interface PackageDependencyItem {
  Id?: PackageId;
  Name?: string;
  [key: string]: unknown;
}

export interface PackageDependencyListResult {
  Item?: PackageDependencyItem[];
  Items?: PackageDependencyItem[];
  Pagination?: PackagePagination;
  [key: string]: unknown;
}
