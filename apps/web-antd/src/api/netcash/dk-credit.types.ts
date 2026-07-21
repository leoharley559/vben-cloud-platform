import type { NetcashListQuery, NetcashListResult } from '#/types/netcash';

/** DK 信用模块通用列表查询参数 */
export type DkListQuery = NetcashListQuery;
/** DK 信用模块通用列表响应结构 */
export type DkListResult = NetcashListResult;

/** DK 代理信用额度详情 */
export interface DkCreditInfo {
  /** 可申请额度 */
  AppliableAmount?: number;
  /** 当前信用额度 */
  Credit?: number;
  /** 嵌套额度明细（部分接口返回树形结构） */
  Items?: DkCreditInfo;
  /** 信用额度上限 */
  TotalCreditLimit?: number;
  [key: string]: unknown;
}

/** 玩家可扣减信用额度信息 */
export interface DkPlayerAvailableCredit {
  /** 可扣减金额 */
  AvailableDeductAmount?: number;
  /** 玩家金币余额 */
  Gold?: number;
  /** 玩家登录账号 */
  LoginAccount?: string;
  /** 玩家 Id */
  PlayerId?: number | string;
  [key: string]: unknown;
}

/** DK 模块下拉选项项 */
export interface DkSharedOption {
  /** 展示文案 */
  Label: string;
  /** 选项值 */
  Value?: number | string;
  /** 辅助值（部分下拉第二列） */
  Value2?: string;
  [key: string]: unknown;
}

/** DK 模块共享配置（下拉数据源等） */
export interface DkSharedConfig {
  /** 后台管理员名称选项 */
  BOAdminName?: DkSharedOption[];
  [key: string]: unknown;
}

/** DK 玩家钱包批量调整单行 */
export interface DkAdjustItem {
  /** 调整金额 */
  Amount: number;
  /** 玩家 Id */
  PlayerId: number;
  /** 目标钱包类型 */
  PlayerWallet: number;
  /** 关联账号 */
  ReferenceAccount: string;
  /** 备注 */
  Remarks: string;
  /** 提现流水倍数 */
  WithdrawWaterMultiply: number;
}

/** DK 玩家钱包批量调整提交载荷 */
export interface DkAdjustPayload {
  /** 安全校验 Hash */
  Hash: string;
  /** 调整项 JSON 字符串（DkAdjustItem[]） */
  Items: string;
  /** 支付密码 */
  PayPassword: string;
}

/** DK 信用额度调整申请提交载荷 */
export interface DkApplyCreditPayload {
  /** 申请调整金额 */
  AdjustAmount: number;
  /** 代理类型（固定为 3） */
  AgentType: 3;
  /** 申请备注 */
  ApplyNote: string;
  /** 安全校验 Hash */
  Hash: string;
  /** 转账类型（固定为 3） */
  TransferType: 3;
  /** 钱包类型（固定为 3） */
  WalletType: 3;
}

/** DK 账户额度新增/编辑提交载荷 */
export interface DkAccountPayload {
  /** 代理账号 */
  AgentAccount: string;
  /** 代理昵称 */
  AgentNickName?: string;
  /** 信用扣减额度 */
  CreditDeduct?: number;
  /** 安全校验 Hash */
  Hash: string;
  /** 记录 Id；新建时可空 */
  Id?: number | string;
  /** 信用额度上限 */
  TotalCreditLimit?: number;
}

/** DK Excel 批量导入玩家查询参数 */
export interface DkExcelPlayerQuery {
  /** 玩家登录账号 */
  LoginAccount: string;
  /** 批量金额（逗号或换行分隔） */
  MultiAmount: string;
  /** 包体名称 */
  PackageName: string;
}
