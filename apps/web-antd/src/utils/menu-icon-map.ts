/**
 * 左侧菜单图标（Lucide / Iconify）
 *
 * key = 后端 Nav.Name（与 i18n 菜单 key 相同）
 * 一级、二级都写在 MENU_ICON_BY_NAME；改图标只改对应行的 `lucide:xxx`
 *
 * 查找顺序：
 * 1. 按 Name 精确匹配本表
 * 2. 未配置时按路由首段走 MENU_ICON_BY_PATH_PREFIX（一级兜底）
 * 3. 再没有则用 DEFAULT_MENU_ICON
 *
 * 图标目录：https://lucide.dev/icons  或  https://icon-sets.iconify.design/lucide/
 * 写法必须是 lucide:官方英文名，例如 coins（没有 coin）
 */

/** 一级 + 二级：Nav.Name → icon */
const MENU_ICON_BY_NAME: Record<string, string> = {
  // ===========================================================================
  // 一级：数据汇总
  // ===========================================================================
  operationalData: 'lucide:bar-chart-3',

  // —— 二级 ——
  dashboard: 'lucide:layout-dashboard', // 数据总览
  onlineSummary: 'lucide:globe-2', // 在线总览
  everydayData: 'lucide:calendar-days', // 公司日报
  dayReport: 'lucide:calendar-days', // 日报（公司日报别名）
  bossReport: 'lucide:briefcase', // 老板日报
  channelData: 'lucide:git-branch', // 代理数据
  groupDaily: 'lucide:users-round', // 代理分组数据
  groupDetails: 'lucide:list', // 代理分组明细
  gameDetails: 'lucide:gamepad-2', // 投注报表
  gameRanking: 'lucide:trophy', // 游戏排行
  ranking: 'lucide:medal', // 排行数据
  payranking: 'lucide:crown', // 充值排行
  endlessAgent: 'lucide:infinity', // 无限代理数据
  endlessRanking: 'lucide:layers', // 无限代理排行
  virtualReport: 'lucide:file-bar-chart', // 虚拟报表

  // ===========================================================================
  // 一级：日常运营
  // ===========================================================================
  operationalManage: 'lucide:briefcase',

  // —— 二级 ——
  playerList: 'lucide:users', // 会员列表
  playerDetails: 'lucide:user-round', // 玩家详情
  rechargeList: 'lucide:credit-card', // 充值列表
  withdrawList: 'lucide:banknote', // 提现列表
  activity: 'lucide:sparkles', // 运营活动
  activityStatistics: 'lucide:line-chart', // 活动统计
  bonusAudit: 'lucide:badge-check', // 红利审核
  audit: 'lucide:clipboard-list', // 红利管理
  accountAdjust: 'lucide:arrow-left-right', // 账户调整
  gameNotice: 'lucide:mail', // 游戏公告
  gameRiskControl: 'lucide:shield-alert', // 游戏风控
  giftManage: 'lucide:gift', // 礼品管理
  helpManage: 'lucide:life-buoy', // 协助管理
  helpOrder: 'lucide:clipboard-list', // 协助工单
  leaderboard: 'lucide:award', // 排行榜
  playerGoldHandle: 'lucide:coins', // 红利发放
  playerLevel: 'lucide:star', // 会员层级
  rewardMall: 'lucide:shopping-bag', // 积分商城
  voucher: 'lucide:ticket', // 优惠码
  whiteList: 'lucide:list-checks', // 登录白名单
  downloadCsvManage: 'lucide:download', // 导出管理
  applyService: 'lucide:headset', // 客服工单
  countrySet: 'lucide:globe', // 区域屏蔽
  customLeague: 'lucide:flag', // 杯赛专题
  relationQuery: 'lucide:git-merge', // 关联号查询
  gameTitle: 'lucide:award', // 称号管理

  // ===========================================================================
  // 一级：会员管理
  // ===========================================================================
  memberManage: 'lucide:user-cog',

  // —— 二级 ——
  walletManage: 'lucide:wallet', // 钱包管理
  gameRecord: 'lucide:scroll-text', // 游戏记录
  gameTitleManagement: 'lucide:award', // 称号管理
  evoSidebetDetail: 'lucide:dices', // EVO 真人 Sidebet 详情
  mobileVrfcnCodeManage: 'lucide:smartphone', // 手机验证码查询
  verificationCodeManage: 'lucide:key-round', // 验证码管理
  verifyCode: 'lucide:key-round', // 验证码查询
  venueChange: 'lucide:arrow-left-right', // 场馆账变
  fundFlowManage: 'lucide:banknote', // 资金流管理
  memberLog: 'lucide:file-clock', // 会员日志
  playerAuthentication: 'lucide:badge-check', // 身份验证
  streamingInformation: 'lucide:waves', // 流水信息

  // ===========================================================================
  // 一级：产品管理
  // ===========================================================================
  gameManage: 'lucide:package',

  // —— 二级 ——
  rechargeManage: 'lucide:credit-card', // 支付通道
  withdrawConfig: 'lucide:landmark', // 提现通道
  backWater: 'lucide:percent', // 返水配置
  vipSetting: 'lucide:diamond', // VIP 设置
  channelManage: 'lucide:antenna', // 渠道管理
  createChannel: 'lucide:antenna', // 创建渠道
  packageManage: 'lucide:box', // 包体管理
  siteManage: 'lucide:building-2', // 场馆管理
  systemSetting: 'lucide:sliders-horizontal', // 系统设置
  messageManage: 'lucide:message-square', // 短信通道
  domainManage: 'lucide:link', // 域名配置
  advertisementManage: 'lucide:image', // 广告管理
  exchangeCodeManage: 'lucide:qr-code', // 兑换码管理
  enterprisePackage: 'lucide:archive', // 企业包
  inclusionDeploy: 'lucide:rocket', // 创建产品
  alipayManage: 'lucide:scan-line', // 支付码管理
  addPackage: 'lucide:app-window', // 新增 APP
  iosScheme: 'lucide:smartphone', // iOS 管理
  superVisa: 'lucide:stamp', // 超级签证

  // ===========================================================================
  // 一级：代理管理
  // ===========================================================================
  netcash: 'lucide:network',

  // —— 二级 ——
  agency: 'lucide:contact-round', // 代理列表
  drawmoneyManage: 'lucide:coins', // 提款管理
  commissionManage: 'lucide:percent', // 佣金管理
  bonusManage: 'lucide:gift', // 红利管理
  creditLimitManage: 'lucide:gauge', // 代理额度管理
  creditLimitPlatformManage: 'lucide:building', // 平台额度管理
  dkCreditManage: 'lucide:user-plus', // 代客充值
  teamManage: 'lucide:users-2', // 团队管理
  juniorMember: 'lucide:user-minus', // 下级成员
  moneyChannel: 'lucide:route', // 代理渠道
  createMoneyChannel: 'lucide:route', // 代理渠道（别名）
  agencyAccountDetails: 'lucide:id-card', // 代理账号详情
  proxyGrouping: 'lucide:users-round', // 代理分组
  spillManage: 'lucide:droplets', // 溢出管理
  recordInquire: 'lucide:search', // 记录查询
  extensionMaterial: 'lucide:images', // 推广素材
  helpCenter: 'lucide:circle-help', // 帮助中心
  agentDomainManage: 'lucide:link', // 域名管理

  // ===========================================================================
  // 一级：推广管理
  // ===========================================================================
  generalizeManage: 'lucide:share-2',

  // —— 二级 ——
  generalizeManageact: 'lucide:list', // 推广列表
  addPromote: 'lucide:user-plus', // 新增团队推广
  addGeneralize: 'lucide:user-plus', // 创建推广账号
  brokerageSet: 'lucide:settings-2', // 代理设定
  closeManage: 'lucide:calculator', // 收益结算
  closeOrder: 'lucide:receipt', // 分销结算报表
  teamWithdrawAccount: 'lucide:wallet', // 团队提现账户
  teamQuery: 'lucide:list', // 分销列表
  teamDaily: 'lucide:calendar-days', // 代理日报表
  promoteData: 'lucide:megaphone', // 推广报表
  timeshareData: 'lucide:clock-3', // 时段报表
  dropDeploy: 'lucide:panel-top', // 落地页配置

  // ===========================================================================
  // 一级：报表 / 分析
  // ===========================================================================
  dataClose: 'lucide:pie-chart',

  // —— 二级 ——
  day: 'lucide:sun', // 天
  month: 'lucide:calendar-range', // 月份
  ltv: 'lucide:trending-up', // LTV
  keepData: 'lucide:heart-pulse', // 粘度分析
  playerAnalyze: 'lucide:scan-search', // 玩家分析
  operationDaily: 'lucide:line-chart', // 数据分析
  dayStatement: 'lucide:calendar', // 游戏日报表
  monthStatement: 'lucide:calendar-range', // 游戏月报表
  userWinLoss: 'lucide:bar-chart-3', // 玩家盈亏报表
  gameStatement: 'lucide:gamepad-2', // 游戏报表
  playerStatistics: 'lucide:users', // 玩家统计报表
  liveStatement: 'lucide:video', // 直播报表

  // ===========================================================================
  // 一级：系统管理
  // ===========================================================================
  systemManage: 'lucide:settings',

  // —— 二级 ——
  adminManage: 'lucide:user-check', // 员工账号
  newRole: 'lucide:shield', // 角色管理
  role: 'lucide:shield', // 角色管理（旧 Name）
  logsManage: 'lucide:file-text', // 日志管理
  goldManage: 'lucide:coins', // 金币管理
  cloudCoinManage: 'lucide:cloud', // 云币管理
  languageGroupManage: 'lucide:languages', // 语言管理
  securityManage: 'lucide:lock', // 安全管理
  commonSetting: 'lucide:settings-2', // 全局设置 / 公共配置
  cashNet: 'lucide:banknote', // 现金网
  crashNet: 'lucide:banknote', // 现金网代理（后端 Name）

  // ===========================================================================
  // 一级：客服系统
  // ===========================================================================
  serviceManage: 'lucide:headphones',

  // —— 二级 ——
  serviceAccount: 'lucide:headset', // 账号管理
  serviceAccount1: 'lucide:headset', // 账号管理（后端 Name）
  serviceSetting: 'lucide:wrench', // 客服设置
  playerService: 'lucide:message-circle', // 客服工作台
  recordTotal: 'lucide:phone', // 客服通讯录
  statistics: 'lucide:pie-chart', // 统计数据

  // ===========================================================================
  // 一级：聊天室管理
  // ===========================================================================
  chatroomManage: 'lucide:message-square',

  // ===========================================================================
  // 一级：直播管理
  // ===========================================================================
  liveManage: 'lucide:video',
  liveManager: 'lucide:video', // 直播管理（后端 Name）

  // ===========================================================================
  // 一级：币商系统
  // ===========================================================================
  coinDealer: 'lucide:handshake',

  // —— 二级 ——
  servicerecord: 'lucide:phone', // 币商通讯录

  // ===========================================================================
  // 一级：呼叫中心
  // ===========================================================================
  telesalesCenter: 'lucide:phone-call',

  // —— 二级 ——
  kpiDashboard: 'lucide:gauge', // 公司业绩报表
  myTask: 'lucide:list-todo', // 我的任务
  configManagement: 'lucide:settings-2', // 配置管理

  // ===========================================================================
  // 工作台（若出现在菜单）
  // ===========================================================================
  workspace: 'lucide:home',
  analytics: 'lucide:activity',
};

/** 未单独配置 Name 时，按路由第一段兜底（一级模块） */
const MENU_ICON_BY_PATH_PREFIX: Record<string, string> = {
  dashboard: 'lucide:layout-dashboard', // 数据汇总 / 工作台
  operationalData: 'lucide:bar-chart-3', // 数据汇总
  operationalManage: 'lucide:briefcase', // 日常运营
  memberManage: 'lucide:user-cog', // 会员管理
  gameManage: 'lucide:package', // 产品管理
  netcash: 'lucide:network', // 代理管理
  generalizeManage: 'lucide:share-2', // 推广管理
  generalizeData: 'lucide:megaphone', // 推广数据
  dataClose: 'lucide:pie-chart', // 报表 / 分析
  systemManage: 'lucide:settings', // 系统管理
  serviceManage: 'lucide:headphones', // 客服系统
  chatroomManage: 'lucide:message-square', // 聊天室管理
  liveManage: 'lucide:video', // 直播管理
  coinDealer: 'lucide:handshake', // 币商系统
  telesalesCenter: 'lucide:phone-call', // 呼叫中心
  sportsManager: 'lucide:trophy', // 体育管理
  mobile: 'lucide:smartphone', // 手机端
  mobileCloud: 'lucide:cloud', // 手机云
  cloud: 'lucide:construction', // 未迁移占位
  workspace: 'lucide:home',
};

const DEFAULT_MENU_ICON = 'lucide:file-text';

/**
 * 解析菜单图标
 * @param name Nav.Name（i18n key）
 * @param path Nav.Router
 */
export function resolveMenuIcon(name?: string, path?: string) {
  if (name && MENU_ICON_BY_NAME[name]) {
    return MENU_ICON_BY_NAME[name];
  }

  const normalized = String(path || '').replace(/^\//, '');
  const root = normalized.split('/').filter(Boolean)[0];
  if (root && MENU_ICON_BY_PATH_PREFIX[root]) {
    return MENU_ICON_BY_PATH_PREFIX[root];
  }

  return DEFAULT_MENU_ICON;
}
