export interface PlayerAuthListQuery {
  AgentId?: number | string;
  AuthScenario?: number;
  BeginTime?: number;
  ChannelId?: string;
  EndTime?: number;
  LoginAccount?: string;
  PackageId?: number | string;
  PlayerId?: number | string;
}

export interface PlayerAuthRiskInfoItem {
  Remarks?: string;
  Type?: number;
}

export interface PlayerAuthListItem {
  [key: string]: unknown;
  AgentId?: number | string;
  ApproveStatus?: number;
  AuthId?: string;
  AuthImage?: string;
  AuthImage2?: string;
  AuthScenario?: number;
  ChannelId?: number | string;
  CommSoftware?: string;
  CommSoftwareAccount?: string;
  CurrentAddress?: string;
  DateOfBirth?: string;
  Gender?: string;
  LoginAccount?: string;
  Nationality?: string;
  NatureOfWork?: string;
  OrderId?: string;
  PackageName?: string;
  PermanentAddress?: string;
  PhoneNumber?: string;
  PlaceOfBirth?: string;
  PlayerId?: number | string;
  PlayerName?: string;
  RiskInfo?: PlayerAuthRiskInfoItem[] | string;
  RiskStatus?: number;
  SourceOfIncome?: string;
  UploadTime?: number | string;
  Username?: string;
}

export interface PlayerAuthApprovePayload {
  IsApprove: boolean;
  OrderId: string;
  Remark?: string;
}

export interface PlayerAuthRecordQuery {
  AgentId?: number | string;
  AuthBeginTime?: number;
  AuthEndTime?: number;
  AuthScenario?: number;
  BeginTime?: number;
  ChannelId?: string;
  EndTime?: number;
  LoginAccount?: string;
  PackageId?: number | string;
  Page: number;
  PageSize: number;
  PlayerId?: string;
  Status?: number | string;
}

export interface PlayerAuthRecordItem extends PlayerAuthListItem {
  ApproveName?: string;
  ApproveRemark?: string;
  ApproveTime?: number | string;
}

export interface PlayerAuthSettingConfig {
  Days?: number;
  Events?: string;
  ExInfo?: string | string[];
  HandlerName?: string;
  HandlerTime?: number | string;
  IsOpen?: boolean | number;
}

export interface PlayerAuthSettingItem {
  [key: string]: unknown;
  Config: PlayerAuthSettingConfig | string;
  EnableEvent?: string;
  LangText?: Record<string, unknown> | string;
  SubType: number;
}

export interface PlayerAuthSwitchPayload {
  Day?: number;
  IsOpen: boolean | number;
  SubType: number;
  VerificationInfo?: number;
}

export interface PlayerAuthImagePayload {
  EnableEvent?: string;
  ExInfo?: string;
  LangText?: string;
  SubType: number;
}

export interface PlayerAuthLangTextItem {
  ApproveContent?: string;
  ApproveTitle?: string;
  LangGroupId?: number | string;
  RejectContent?: string;
  RejectTitle?: string;
}

export interface PlayerAuthVerificationInfoItem {
  HandlerName?: string;
  HandlerTime?: number | string;
  IsOpen?: boolean | number;
  VerificationInfo?: number;
}
