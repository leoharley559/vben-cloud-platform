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
  Account: string;
  Token: string;
  [key: string]: unknown;
}

/** 菜单 Nav 节点（扁平数组项） */
export interface CloudNavItem {
  Id: number;
  ParentId: number;
  Router: string;
  Name: string;
  Icon?: string;
  IsShow?: string;
  KeepAlive?: string;
}

/** 角色权限 */
export interface CloudRole {
  Id?: number;
  Name?: string;
  Permission?: number[];
  /** 后端可能返回逗号分隔字符串或数组 */
  SubMenuIds?: number | number[] | string;
  [key: string]: unknown;
}

/** 用户信息 / islogin 返回 */
export interface CloudUserData {
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
        Id?: number | string;
      };
  Admin?: {
    [key: string]: unknown;
    AdminId?: number | string;
    AdminType?: number | string;
    Id?: number | string;
    Languages?: string;
  };
  Token: string;
  Nav: CloudNavItem[];
  Role: CloudRole[];
  AdminName?: number | string;
  CRole?: Array<{ Id: number; Name: string }>;
  SubMenus?: Array<{
    [key: string]: unknown;
    HaveDesData?: number;
    Id: number;
    MenuId?: number;
    Name: string;
    ParentId?: number;
  }>;
  [key: string]: unknown;
}

/** 项目配置（精简，后续按需扩展） */
export interface CloudProjectConfig {
  RoleDataField?: string;
  AgentVersion?: string;
  AgentAccount?: {
    [key: string]: unknown;
    IsShareServer?: number;
    KillPower?: number;
  };
  AccountTeamInfo?: {
    [key: string]: unknown;
    AgentId?: number;
    ParentId?: number;
  };
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
  SecuritySetting?: Array<{
    [key: string]: unknown;
    IsOpen?: boolean;
    PageId?: number | string;
  }>;
  [key: string]: unknown;
}

export type VbenMenuRoute = RouteRecordStringComponent;
