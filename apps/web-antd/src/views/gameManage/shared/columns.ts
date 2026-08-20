import type { OperationListConfig } from '#/views/operationalManage/components/operation-list-panel.vue';

import { formatOperationDateTime } from '#/utils/operation-status';

export const packageColumns: OperationListConfig['columns'] = [
  { field: 'PackageName', minWidth: 140, title: '包名' },
  { field: 'PackageId', minWidth: 90, title: '包ID' },
  { field: 'ChannelCount', minWidth: 90, title: '渠道数' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const channelColumns: OperationListConfig['columns'] = [
  { field: 'ChannelName', minWidth: 140, title: '渠道名' },
  { field: 'PackageName', minWidth: 120, title: '所属包' },
  { field: 'PromoteUrl', minWidth: 180, title: '推广链接' },
];

export const domainColumns: OperationListConfig['columns'] = [
  { field: 'Domain', minWidth: 180, title: '域名' },
  {
    field: 'Status',
    formatter: (value) => String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
  {
    field: 'ExpireTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '到期时间',
  },
];

export const siteFeeColumns: OperationListConfig['columns'] = [
  { field: 'ApiName', minWidth: 140, title: '接口/功能' },
  {
    field: 'IsOpen',
    formatter: (value) => (value ? '开启' : '关闭'),
    minWidth: 90,
    title: '开关',
  },
];

export const rechargeTypeColumns: OperationListConfig['columns'] = [
  { field: 'TypeName', minWidth: 140, title: '充值类型' },
  { field: 'ChannelName', minWidth: 120, title: '通道' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const withdrawAccountColumns: OperationListConfig['columns'] = [
  { field: 'AccountName', minWidth: 120, title: '账户名' },
  { field: 'Account', minWidth: 140, title: '账号' },
  { field: 'PayTypeName', minWidth: 100, title: '提现方式' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const vipLevelColumns: OperationListConfig['columns'] = [
  { field: 'VipLevel', minWidth: 80, title: 'VIP等级' },
  { field: 'VipName', minWidth: 120, title: '名称' },
  { field: 'UpgradeExp', minWidth: 100, title: '升级经验' },
];

export const messageServiceColumns: OperationListConfig['columns'] = [
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
  { field: 'TypeName', minWidth: 120, title: '类型' },
  { field: 'Num', minWidth: 90, title: '数量' },
  { field: 'Remark', minWidth: 160, title: '备注' },
];

export const adTemplateColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '方案名称' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
  {
    field: 'UpdateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '更新时间',
  },
];

export const endlessColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '账号' },
  { field: 'Name', minWidth: 120, title: '名称' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const backWaterSchemeColumns: OperationListConfig['columns'] = [
  { field: 'SchemeName', minWidth: 140, title: '方案名称' },
  { field: 'PackageName', minWidth: 120, title: '包名' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const backWaterRecordColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'BackWater', minWidth: 100, title: '返水' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const iosSignatureColumns: OperationListConfig['columns'] = [
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
  { field: 'Num', minWidth: 90, title: '数量' },
  { field: 'TypeName', minWidth: 120, title: '类型' },
];

export const enterpriseIosColumns: OperationListConfig['columns'] = [
  { field: 'PackageName', minWidth: 140, title: '包名' },
  { field: 'Version', minWidth: 100, title: '版本' },
  {
    field: 'Status',
    formatter: (value) => String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
];

export const phoneBlockColumns: OperationListConfig['columns'] = [
  { field: 'CountryCode', minWidth: 100, title: '区号' },
  { field: 'CountryName', minWidth: 120, title: '国家/地区' },
  {
    field: 'IsBlock',
    formatter: (value) => (value ? '已屏蔽' : '未屏蔽'),
    minWidth: 90,
    title: '状态',
  },
];

export const customeListColumns: OperationListConfig['columns'] = [
  { field: 'Username', minWidth: 120, title: '客服账号' },
  { field: 'Nickname', minWidth: 120, title: '昵称' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const rechargeChannelColumns: OperationListConfig['columns'] = [
  { field: 'ChannelName', minWidth: 140, title: '通道名称' },
  { field: 'TypeName', minWidth: 120, title: '类型' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const rechargeDailyColumns: OperationListConfig['columns'] = [
  { field: 'Date', minWidth: 120, title: '日期' },
  { field: 'ChannelName', minWidth: 120, title: '通道' },
  { field: 'SuccessNum', minWidth: 90, title: '成功笔数' },
  { field: 'SuccessMoney', minWidth: 120, title: '成功金额' },
];

export const thirdWithdrawColumns: OperationListConfig['columns'] = [
  { field: 'TypeName', minWidth: 140, title: '代付类型' },
  { field: 'ChannelName', minWidth: 120, title: '通道' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const withdrawPayTypeColumns: OperationListConfig['columns'] = [
  { field: 'PayTypeName', minWidth: 140, title: '提现方式' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const backWaterReviewColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'BackWater', minWidth: 100, title: '返水金额' },
  {
    field: 'Status',
    formatter: (value) => String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
];

export const smsMonthColumns: OperationListConfig['columns'] = [
  { field: 'Month', minWidth: 100, title: '月份' },
  { field: 'BuyNum', minWidth: 90, title: '购买' },
  { field: 'UseNum', minWidth: 90, title: '消耗' },
  { field: 'RemainNum', minWidth: 90, title: '结余' },
];

export const smsChannelColumns: OperationListConfig['columns'] = [
  { field: 'ChannelName', minWidth: 140, title: '短信通道' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
];

export const otpDetailColumns: OperationListConfig['columns'] = [
  { field: 'PhoneNumber', minWidth: 120, title: '手机号' },
  { field: 'OtpCode', minWidth: 100, title: '验证码' },
  {
    field: 'CreateTime',
    formatter: (value) => formatOperationDateTime(value as string),
    minWidth: 160,
    title: '时间',
  },
];

export const depositRecallColumns: OperationListConfig['columns'] = [
  { field: 'LoginAccount', minWidth: 120, title: '玩家账号' },
  { field: 'PhoneNumber', minWidth: 120, title: '手机号' },
  {
    field: 'Status',
    formatter: (value) => String(value ?? '-'),
    minWidth: 90,
    title: '状态',
  },
];

export const sonPromoterChannelColumns: OperationListConfig['columns'] = [
  { field: 'ChannelId', minWidth: 100, title: '渠道号' },
  { field: 'ChannelName', minWidth: 140, title: '渠道名称' },
  { field: 'PromoterAdminUserName', minWidth: 120, title: '代理账号' },
  { field: 'PromoterAdminName', minWidth: 120, title: '代理名称' },
  { field: 'InvitationCode', minWidth: 120, title: '邀请码' },
];

export const venueColumns: OperationListConfig['columns'] = [
  { field: 'ApiFeeName', minWidth: 140, title: '场馆名称' },
  {
    field: 'LoginStatus',
    formatter: (value) =>
      Number(value) === 1
        ? '开启'
        : (Number(value) === 2
          ? '关闭'
          : String(value ?? '-')),
    minWidth: 90,
    title: '状态',
  },
  {
    field: 'WalletStatus',
    formatter: (value) => (Number(value) === 1 ? '开' : '关'),
    minWidth: 90,
    title: '钱包',
  },
];

export const subGameColumns: OperationListConfig['columns'] = [
  { field: 'GameName', minWidth: 140, title: '游戏名称' },
  { field: 'ApiFeeName', minWidth: 120, title: '场馆' },
  {
    field: 'Status',
    formatter: (value) => (Number(value) === 1 ? '启用' : '停用'),
    minWidth: 90,
    title: '状态',
  },
  { field: 'SortId', minWidth: 80, title: '排序' },
];

export const vipVirtualPrizeColumns: OperationListConfig['columns'] = [
  { field: 'VipLevel', minWidth: 90, title: '等级' },
  { field: 'VipName', minWidth: 120, title: '名称' },
  { field: 'UpgradeExp', minWidth: 100, title: '升级经验' },
  { field: 'MonthReward', minWidth: 100, title: '月红包' },
];

export const vipIconTemplateColumns: OperationListConfig['columns'] = [
  { field: 'Name', minWidth: 140, title: '方案名称' },
  { field: 'Id', minWidth: 90, title: '方案ID' },
];
