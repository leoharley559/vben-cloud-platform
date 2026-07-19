export interface SecurityPathConfig {
  actions?: string[];
  active: boolean;
  key: number;
  pathArr: Array<
    | string
    | {
        key: string;
        params?: Record<string, string>;
      }
  >;
}

/** 安全管理路径配置（来源 cloudPlatform securityManage/configs.js） */
export const SECURITY_PATHS: SecurityPathConfig[] = [
  {
    key: 1,
    active: true,
    pathArr: ['playerProfile'],
    actions: ['emailAddress', 'thePlayerAddress', 'playerBirthday', 'document'],
  },
  {
    key: 4,
    active: true,
    pathArr: ['playerProfile'],
    actions: ['bindViber', 'bindTelegram', 'bindFacebook'],
  },
  { key: 5, active: true, pathArr: ['playerProfile', 'bindPhoneNum'] },
  { key: 6, active: true, pathArr: ['playerProfile', 'accountPsd'] },
  { key: 7, active: true, pathArr: ['playerProfile', 'idNumber'] },
  {
    key: 8,
    active: true,
    pathArr: ['playerProfile', 'bankCard'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 8,
    active: true,
    pathArr: ['memberManage', 'walletManage', 'cardManage'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 9,
    active: true,
    pathArr: [
      'playerProfile',
      { key: 'platformAcct', params: { platform: 'Gcash/Paymaya/Grabpay' } },
    ],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 9,
    active: true,
    pathArr: ['memberManage', 'walletManage', 'eWalletManage'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 12,
    active: true,
    pathArr: ['coinDealer', 'dealerClose', 'sellTitle'],
  },
  {
    key: 13,
    active: true,
    pathArr: ['coinDealer', 'account', 'alipayManage'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 14,
    active: true,
    pathArr: ['personalCenter', 'loginSetting', 'multiDeviceLogin'],
  },
  {
    key: 15,
    active: true,
    pathArr: [
      'netcash',
      'drawmoneyManage',
      'drawingsList',
      'autoPayoutSettings',
      'functionSwitch',
    ],
  },
  {
    key: 17,
    active: true,
    pathArr: ['operationalManage', 'downloadCsvManage', 'download'],
  },
  {
    key: 18,
    active: true,
    pathArr: ['memberManage', 'walletManage', 'virtualCurrencySite'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 19,
    active: true,
    pathArr: ['systemManage', 'adminManage'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 20,
    active: true,
    pathArr: ['operationalManage', 'rechargeList', 'tabChannel'],
    actions: ['secondReview', 'manualReview'],
  },
  {
    key: 21,
    active: true,
    pathArr: ['coinDealer', 'account', 'accountManage'],
    actions: ['add', 'edit', 'endUse', 'startUse'],
  },
  {
    key: 22,
    active: true,
    pathArr: ['coinDealer', 'account', 'alipayManage'],
    actions: ['add', 'edit', 'del'],
  },
  {
    key: 23,
    active: true,
    pathArr: ['netcash', 'creditLimitPlatformManage', 'pendingPlatformCredit'],
  },
  {
    key: 23,
    active: true,
    pathArr: ['netcash', 'creditLimitManage', 'verifyList'],
  },
  {
    key: 23,
    active: true,
    pathArr: ['netcash', 'dkCreditManage', 'pendingAdjustment'],
  },
  {
    key: 26,
    active: true,
    pathArr: ['operationalManage', 'withdrawList', 'redeemList'],
  },
  {
    key: 27,
    active: true,
    pathArr: [
      'operationalManage',
      'rechargeList',
      'tabChannel',
      'secondReview',
    ],
  },
  {
    key: 47,
    active: true,
    pathArr: ['netcash', 'bonusManage', 'playerGoldHandle'],
    actions: ['approve', 'adjust', 'reject'],
  },
  {
    key: 49,
    active: true,
    pathArr: ['operationalManage', 'accountAdjust', 'adjustAudit'],
    actions: ['approve', 'reject'],
  },
  {
    key: 83,
    active: true,
    pathArr: ['operationalManage', 'rewardMall', 'pointsAdjustment'],
    actions: ['approve', 'reject'],
  },
  {
    key: 28,
    active: true,
    pathArr: ['operationalData', 'channelData', 'todayData', 'channelData'],
  },
  {
    key: 28,
    active: true,
    pathArr: ['operationalData', 'channelData', 'historyData', 'channelData'],
  },
  {
    key: 29,
    active: true,
    pathArr: [
      'operationalData',
      'channelData',
      'todayData',
      'channelDataOperationChannelData',
    ],
  },
  {
    key: 29,
    active: true,
    pathArr: [
      'operationalData',
      'channelData',
      'historyData',
      'channelDataOperationChannelData',
    ],
  },
  {
    key: 32,
    active: true,
    pathArr: ['memberManage', 'playerList', 'allPlayer'],
  },
  {
    key: 33,
    active: true,
    pathArr: ['memberManage', 'playerList', 'playerAccessData'],
  },
  {
    key: 33,
    active: true,
    pathArr: [
      'gameManage',
      'rechargeManage',
      'depositAccessRecords',
      'details',
    ],
  },
  {
    key: 33,
    active: true,
    pathArr: [
      'gameManage',
      'withdrawConfig',
      'withdrawAccessRecords',
      'details',
    ],
  },
  {
    key: 33,
    active: true,
    pathArr: ['gameNotice', 'noticeTabIngameTitle', 'noticeDetails'],
  },
  {
    key: 33,
    active: true,
    pathArr: ['gameEmail', 'noticeEmailTitle', 'emailDetails'],
  },
  {
    key: 34,
    active: true,
    pathArr: ['memberManage', 'memberLog', 'loginHistory', 'details'],
  },
  { key: 35, active: true, pathArr: ['memberManage', 'gameRecord'] },
  { key: 35, active: true, pathArr: ['playerDetails', 'betDetails'] },
  {
    key: 36,
    active: true,
    pathArr: ['operationalManage', 'rechargeList', 'tabChannel'],
  },
  {
    key: 37,
    active: true,
    pathArr: ['operationalManage', 'withdrawList', 'redeemList'],
  },
  {
    key: 38,
    active: true,
    pathArr: ['operationalManage', 'withdrawList', 'withdrawWithdrawList'],
  },
  {
    key: 39,
    active: true,
    pathArr: ['operationalManage', 'bonusManage', 'bonusRecord'],
  },
  {
    key: 42,
    active: true,
    pathArr: ['gameManage', 'backWater', 'rebateRecords', 'statistics'],
  },
  {
    key: 42,
    active: true,
    pathArr: ['gameManage', 'backWater', 'rebateAudit', 'systemApplication'],
  },
  {
    key: 43,
    active: true,
    pathArr: ['gameManage', 'backWater', 'rebateRecords', 'detailData'],
  },
  { key: 44, active: true, pathArr: ['netcash', 'recordInquire', 'logIn'] },
  {
    key: 45,
    active: true,
    pathArr: ['netcash', 'recordInquire', 'playerBasicInfoGame'],
  },
  { key: 46, active: true, pathArr: ['dataClose', 'playerStatistics'] },
  { key: 48, active: true, pathArr: ['memberManage', 'streamingInformation'] },
  {
    key: 50,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'announcerDonateReport'],
  },
  {
    key: 51,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'announcerDonateReport', 'info'],
  },
  {
    key: 52,
    active: false,
    pathArr: [
      'dataClose',
      'liveStatement',
      'announcerDonateReport',
      'streamingInformation',
    ],
  },
  {
    key: 53,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveData'],
  },
  {
    key: 54,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveData', 'info'],
  },
  {
    key: 55,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveRoomData'],
    actions: ['bet2', 'showBetAmount'],
  },
  {
    key: 56,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveData', 'guestViewerPlayer'],
  },
  {
    key: 57,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveRoomData', 'totalBet'],
  },
  {
    key: 58,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveRoomData'],
  },
  {
    key: 59,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'pkStatistics'],
  },
  {
    key: 60,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'giftReport'],
  },
  {
    key: 61,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'bettingReport'],
  },
  {
    key: 62,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'bettingReport', 'info'],
  },
  {
    key: 63,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveGameReport'],
  },
  {
    key: 64,
    active: true,
    pathArr: ['dataClose', 'liveStatement', 'liveGameReport', 'info'],
  },
  {
    key: 65,
    active: true,
    pathArr: ['liveManager', 'pkManagement', 'pkRecord', 'contributeAmount'],
  },
  {
    key: 66,
    active: true,
    pathArr: ['liveManager', 'pkManagement', 'pkRecord', 'playInNum'],
  },
  {
    key: 67,
    active: true,
    pathArr: [
      'liveManager',
      'chatroomManage',
      'liveChatRooms',
      'popupLeftListWatchPlayerList',
    ],
  },
  {
    key: 68,
    active: true,
    pathArr: [
      'liveManager',
      'chatroomManage',
      'matchChatRoom',
      'popupLeftListWatchPlayerList',
    ],
  },
  {
    key: 69,
    active: true,
    pathArr: ['liveManager', 'chatroomManage', 'chatRecord'],
  },
  {
    key: 70,
    active: true,
    pathArr: ['liveManager', 'chatroomManage', 'chatRecord', '聊天室发言详情'],
  },
  { key: 71, active: true, pathArr: ['liveManager', 'chatroomManage'] },
  {
    key: 72,
    active: true,
    pathArr: [
      'operationalManage',
      'activity',
      'beginnerTurntable',
      'inviteDetails',
    ],
  },
  {
    key: 73,
    active: true,
    pathArr: ['netcash', 'drawmoneyManage', 'drawingsList'],
  },
  {
    key: 74,
    active: true,
    pathArr: ['liveManager', 'pkManagement', 'pkRecord'],
  },
  {
    key: 75,
    active: true,
    pathArr: ['memberManage', 'gameTitleManagement', 'gameTitleOwnerList'],
  },
  {
    key: 81,
    active: true,
    pathArr: ['liveManager', 'guessingManage', 'payoutHistory'],
  },
  {
    key: 82,
    active: true,
    pathArr: ['operationalManage', 'rewardMall', 'exchangeRecord'],
  },
  { key: 84, active: true, pathArr: ['playerDetails', 'pointsInfo'] },
  {
    key: 86,
    active: true,
    pathArr: [
      'operationalManage',
      'voucherCenter',
      'voucherConfig',
      'voucherRecord',
    ],
  },
  { key: 87, active: true, pathArr: ['leaderboard', 'leaderboardSettlement'] },
  {
    key: 88,
    active: true,
    pathArr: ['voucherConfig', 'voucherDetails', 'releaseRecord'],
  },
  {
    key: 89,
    active: true,
    pathArr: ['gameManage', 'rechargeManage', 'exchangeCodeManage'],
  },
  {
    key: 90,
    active: true,
    pathArr: ['memberManage', 'playerAuthentication', 'list'],
  },
  {
    key: 91,
    active: true,
    pathArr: ['operationalManage', 'relationQuery', 'verificationRecord'],
  },
  { key: 92, active: true, pathArr: ['dataClose', 'keepData', 'propleSingle'] },
  { key: 93, active: true, pathArr: ['dataClose', 'keepData', 'peopleLogin'] },
  {
    key: 94,
    active: true,
    pathArr: ['dataClose', 'keepData', 'section', 'peopleLogin'],
  },
  { key: 95, active: true, pathArr: ['memberManage', 'evoSidebetDetail'] },
  {
    key: 96,
    active: true,
    pathArr: ['activity', 'playerAgent', 'playerAgentCommissionSearch'],
  },
  {
    key: 97,
    active: true,
    pathArr: ['activity', 'playerAgent', 'redeemRecord'],
  },
  {
    key: 98,
    active: true,
    pathArr: ['activity', 'playerAgent', 'playerAgentTeamSearch'],
  },
  {
    key: 99,
    active: true,
    pathArr: ['activity', 'playerAgent', 'playerAgentTeamBindLog'],
  },
  { key: 100, active: true, pathArr: ['memberManage', 'gameRecord'] },
];
