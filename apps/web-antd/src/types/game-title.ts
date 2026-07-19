export interface GameTitleGroupItem {
  Id?: number | string;
  Name?: string;
  Ordinal?: number;
  OperatorName?: string;
  Switch?: number;
  UpdateTime?: number | string;
  UseCount?: number;
  [key: string]: unknown;
}

export interface GameTitleGroupListQuery {
  Name?: string;
  Page: number;
  PageSize: number;
}

export interface GameTitleGroupPayload {
  Id?: number | string;
  Name?: string;
  Ordinal?: number;
}

export interface GameTitleRuleItem {
  SubType?: number;
  TargetId?: number | string;
  Type?: number;
  Value?: number | string;
}

export interface GameTitleChannelRef {
  ChannelId?: number | string;
  ChannelName?: string;
}

export interface GameTitlePackageRef {
  PackageId?: number | string;
  PackageName?: string;
}

export interface GameTitleItem {
  ActivatedEndTime?: number;
  ActivatedStartTime?: number;
  Budget?: number;
  CalCycle?: number;
  CalEndTime?: number;
  CalStartTime?: number;
  CategoryId?: number | string;
  Desc?: string;
  DisplayDesc?: number;
  Id?: number | string;
  Img?: string;
  Name?: string;
  Ordinal?: number;
  OwnerNum?: number;
  QualifiedNum?: number;
  Remark?: string;
  Rules?: GameTitleRuleItem[];
  ShieldChannels?: GameTitleChannelRef[] | string;
  ShieldPackages?: GameTitlePackageRef[] | string;
  Switch?: number;
  Type?: number;
  ValidChannels?: GameTitleChannelRef[] | string;
  ValidDays?: number;
  ValidPackages?: GameTitlePackageRef[] | string;
  Vip?: number;
}

export interface GameTitlePayload {
  ActivatedEndTime?: number;
  ActivatedStartTime?: number;
  Budget?: number;
  CalCycle?: number;
  CalEndTime?: number;
  CalStartTime?: number;
  CategoryId?: number | string;
  Desc?: string;
  DisplayDesc?: number;
  Id?: number | string;
  Img?: string;
  Name?: string;
  Ordinal?: number;
  Remark?: string;
  Rules?: GameTitleRuleItem[] | null;
  ShieldChannels?: string;
  ShieldPackages?: string;
  Type?: number;
  ValidChannels?: string;
  ValidDays?: number;
  ValidPackages?: string;
  Vip?: number | null;
}

export interface GameTitleBatchEditPayload {
  BadgeIds: string;
  CalEndTime?: number;
  CalStartTime?: number;
  EditType: number;
  Switch?: number;
  Vip?: number;
}

export interface GameTitleListQuery {
  BeginTime?: number | string;
  CategoryId?: number | string;
  EndTime?: number | string;
  Name?: string;
  Page: number;
  PageSize: number;
}

export interface GameTitleOwnerItem {
  Account?: string;
  AddTime?: number | string;
  BadgeId?: number | string;
  ChannelId?: number | string;
  Id?: number | string;
  OperatorName?: string;
  PackageId?: number | string;
  PlayerId?: number | string;
  Status?: number;
}

export interface GameTitleOwnerListQuery {
  Account?: string;
  BadgeId?: number | string;
  ChannelId?: number | string;
  Deleted?: number;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  Status?: number[] | string;
}

export interface GameTitleOwnerPayload {
  Account?: string;
  BadgeId?: number | string;
  PackageId?: number | string;
  PlayerId?: number | string;
}

export interface GameTitleSwitchPayload {
  Id: number | string;
  Switch: number;
}
