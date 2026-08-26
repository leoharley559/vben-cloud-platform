export interface AdminAccountOption {
  AdminType?: number | string;
  Id: number;
  Name?: string;
  Username: string;
}

export interface ChannelInfoOption {
  ChannelId: number | string;
  ChannelName?: string;
  PackageConfigId?: number | string;
}

export interface ChildAdminInfoResult {
  ChildAdminInfo?: AdminAccountOption[];
}

export interface ChildChannelInfoResult {
  ChildChannelInfo?: ChannelInfoOption[];
}
