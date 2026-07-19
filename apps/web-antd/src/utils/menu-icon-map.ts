/**
 * 左侧菜单自定义图标（Lucide / Iconify）
 * 按 Nav.Name 或路由首段匹配，不依赖后端 Icon 字段。
 * 修改本文件即可调整菜单图标。
 */

/** 一级 / 常用菜单 Name → icon */
const MENU_ICON_BY_NAME: Record<string, string> = {
  // —— 数据汇总 ——
  operationalData: 'lucide:bar-chart-3',
  dashboard: 'lucide:layout-dashboard',
  onlineSummary: 'lucide:globe-2',
  everydayData: 'lucide:calendar-days',
  dayReport: 'lucide:calendar-days',
  bossReport: 'lucide:briefcase',
  channelData: 'lucide:git-branch',
  groupDaily: 'lucide:users-round',
  groupDetails: 'lucide:list',
  gameDetails: 'lucide:gamepad-2',
  gameRanking: 'lucide:trophy',
  ranking: 'lucide:medal',
  payranking: 'lucide:crown',
  endlessAgent: 'lucide:infinity',
  endlessRanking: 'lucide:layers',
  promoteData: 'lucide:megaphone',
  timeshareData: 'lucide:clock-3',
  virtualReport: 'lucide:file-bar-chart',

  // —— 日常运营 ——
  operationalManage: 'lucide:briefcase',
  playerList: 'lucide:users',
  playerDetails: 'lucide:user-round',
  rechargeList: 'lucide:credit-card',
  withdrawList: 'lucide:banknote',
  activity: 'lucide:sparkles',
  activityStatistics: 'lucide:line-chart',
  bonusAudit: 'lucide:badge-check',
  gameNotice: 'lucide:mail',
  gameRiskControl: 'lucide:shield-alert',
  giftManage: 'lucide:gift',
  helpManage: 'lucide:life-buoy',
  helpOrder: 'lucide:clipboard-list',
  leaderboard: 'lucide:award',
  playerGoldHandle: 'lucide:coins',
  playerLevel: 'lucide:star',
  rewardMall: 'lucide:shopping-bag',
  voucher: 'lucide:ticket',
  whiteList: 'lucide:list-checks',
  downloadCsvManage: 'lucide:download',
  applyService: 'lucide:headset',

  // —— 会员 ——
  memberManage: 'lucide:user-cog',
  walletManage: 'lucide:wallet',
  gameRecord: 'lucide:scroll-text',
  gameTitleManagement: 'lucide:award',
  evoSidebetDetail: 'lucide:dices',
  mobileVrfcnCodeManage: 'lucide:smartphone',
  verificationCodeManage: 'lucide:key-round',

  // —— 产品 / 游戏 ——
  gameManage: 'lucide:package',
  rechargeManage: 'lucide:credit-card',
  withdrawConfig: 'lucide:landmark',
  backWater: 'lucide:percent',
  vipSetting: 'lucide:diamond',
  channelManage: 'lucide:antenna',
  packageManage: 'lucide:box',
  siteManage: 'lucide:building-2',
  systemSetting: 'lucide:sliders-horizontal',
  messageManage: 'lucide:message-square',
  domainManage: 'lucide:link',
  advertisementManage: 'lucide:image',
  exchangeCodeManage: 'lucide:qr-code',
  enterprisePackage: 'lucide:archive',
  inclusionDeploy: 'lucide:rocket',
  alipayManage: 'lucide:scan-line',

  // —— 代理 ——
  netcash: 'lucide:network',
  drawmoneyManage: 'lucide:coins',
  commissionManage: 'lucide:percent',
  bonusManage: 'lucide:gift',
  creditLimitManage: 'lucide:gauge',
  creditLimitPlatformManage: 'lucide:building',
  dkCreditManage: 'lucide:user-plus',
  teamManage: 'lucide:users-2',
  juniorMember: 'lucide:user-minus',
  moneyChannel: 'lucide:route',
  agencyAccountDetails: 'lucide:id-card',

  // —— 推广 ——
  generalizeManage: 'lucide:share-2',
  generalizeManageact: 'lucide:list',
  addPromote: 'lucide:user-plus',
  brokerageSet: 'lucide:settings-2',
  closeManage: 'lucide:calculator',
  teamWithdrawAccount: 'lucide:wallet',

  // —— 报表 / 分析 ——
  dataClose: 'lucide:pie-chart',
  day: 'lucide:sun',
  month: 'lucide:calendar-range',
  ltv: 'lucide:trending-up',

  // —— 系统 ——
  systemManage: 'lucide:settings',
  adminManage: 'lucide:user-check',
  role: 'lucide:shield',
  logsManage: 'lucide:file-text',
  goldManage: 'lucide:coin',
  cloudCoinManage: 'lucide:cloud',
  languageGroupManage: 'lucide:languages',
  securityManage: 'lucide:lock',

  // —— 客服 / 聊天 / 直播 / 币商 ——
  serviceManage: 'lucide:headphones',
  serviceAccount: 'lucide:headset',
  serviceSetting: 'lucide:wrench',
  playerService: 'lucide:message-circle',
  servicerecord: 'lucide:phone',
  chatroomManage: 'lucide:message-square',
  liveManage: 'lucide:video',
  coinDealer: 'lucide:handshake',

  // —— 工作台（若出现在菜单） ——
  workspace: 'lucide:home',
  analytics: 'lucide:activity',
};

/** 路由首段兜底（一级模块） */
const MENU_ICON_BY_PATH_PREFIX: Record<string, string> = {
  dashboard: 'lucide:layout-dashboard',
  operationalData: 'lucide:bar-chart-3',
  operationalManage: 'lucide:briefcase',
  memberManage: 'lucide:user-cog',
  gameManage: 'lucide:package',
  netcash: 'lucide:network',
  generalizeManage: 'lucide:share-2',
  dataClose: 'lucide:pie-chart',
  systemManage: 'lucide:settings',
  serviceManage: 'lucide:headphones',
  chatroomManage: 'lucide:message-square',
  liveManage: 'lucide:video',
  coinDealer: 'lucide:handshake',
  sportsManager: 'lucide:trophy',
  mobile: 'lucide:smartphone',
  mobileCloud: 'lucide:cloud',
  cloud: 'lucide:construction',
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
