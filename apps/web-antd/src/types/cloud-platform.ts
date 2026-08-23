import type { RouteRecordStringComponent } from '@vben/types';

/** cloudPlatform 后端统一响应结构 */
export interface CloudApiResponse<T = unknown> {
  Code?: number;
  Data?: T;
  message?: string;
  respond?: T;
  status?: number;
}

/** 登录接口返回 */
export interface CloudLoginData {
  [key: string]: unknown;
  Account: string;
  Token: string;
}

/** 菜单 Nav 节点（扁平数组项） */
export interface CloudNavItem {
  Icon?: string;
  Id: number;
  IsShow?: string;
  KeepAlive?: string;
  Name: string;
  ParentId: number;
  Router: string;
}

/** 角色权限 */
export interface CloudRole {
  [key: string]: unknown;
  Id?: number;
  Name?: string;
  Permission?: number[];
  /** 后端可能返回逗号分隔字符串或数组 */
  SubMenuIds?: number | number[] | string;
}

/** 用户信息 / islogin 返回 */
export interface CloudUserData {
  [key: string]: unknown;
  /**
   * Runtime sessions use an account object (including AdminId), while a few
   * login deployments still return the account name/id directly.
   */
  Account:
    | number
    | string
    | {
        [key: string]: unknown;
        AdminId?: number | string;
        CloudCoin?: number | string;
        Id?: number | string;
        Username?: string;
      };
  Admin?: {
    [key: string]: unknown;
    AdminId?: number | string;
    AdminType?: number | string;
    Avatar?: string;
    Id?: number | string;
    Languages?: string;
    Username?: string;
  };
  AdminName?: number | string;
  Avatar?: string;
  CRole?: Array<{ Id: number; Name: string }>;
  Nav: CloudNavItem[];
  Role: CloudRole[];
  SubMenus?: Array<{
    [key: string]: unknown;
    HaveDesData?: number;
    Id: number;
    MenuId?: number;
    Name: string;
    ParentId?: number;
  }>;
  Token: string;
}

/** 项目配置（精简，后续按需扩展） */
export interface CloudProjectConfig {
  [key: string]: unknown;
  AccountTeamInfo?: {
    [key: string]: unknown;
    AgentId?: number;
    ParentId?: number;
  };
  AgentAccount?: {
    [key: string]: unknown;
    IsShareServer?: number;
    KillPower?: number;
  };
  AgentVersion?: string;
  ChildChannelInfo?: unknown[];
  DevicePlatformAll?: Record<string, string>;
  LangGroup?: Array<{
    [key: string]: unknown;
    Default?: boolean;
    Id: number;
    Languages: string | string[];
  }>;
  RealPackageIdNameMap?: Array<{
    AdminId?: number | string;
    PackageId: number | string;
    PackageName: string;
  }>;
  RoleDataField?: string;
  SecuritySetting?: Array<{
    [key: string]: unknown;
    IsOpen?: boolean;
    PageId?: number | string;
  }>;
}

export type VbenMenuRoute = RouteRecordStringComponent;
