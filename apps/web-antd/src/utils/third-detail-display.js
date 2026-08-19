const FIELD_LABELS = {
  playerId: '玩家ID',
  playerName: '玩家账号',
  userName: '用户名',
  agentId: '代理ID',
  channelId: '渠道ID',
  id: '注单ID',
  bizId: '业务ID',
  generatedId: '流水号',
  gameId: '游戏ID',
  gameTypeId: '游戏类型ID',
  gameTypeName: '游戏类型',
  venueCode: '场馆代码',
  venueName: '场馆名称',
  platformName: '平台/厅室',
  tableCode: '桌台代码',
  tableName: '桌台名称',
  roundId: '局ID',
  roundNo: '局号',
  playName: '玩法',
  playOptionName: '投注项',
  oddsValue: '赔率',
  betAmount: '投注金额',
  validBetAmount: '有效投注',
  netAmount: '输赢金额',
  payAmount: '派彩金额',
  betContent: '投注内容',
  obBetStatus: '注单状态',
  judgeResult: '开奖结果',
  betAt: '投注时间',
  netAt: '结算时间',
  syncAt: '同步时间',
  syncedToMysql: '已同步MySQL',
  leagueName: '联赛名称',
  matchName: '比赛队伍',
  homeTeam: '主队',
  awayTeam: '客队',
  sportName: '体育项目',
  tournamentName: '锦标赛',
  eventName: '赛事名称',
  marketName: '玩法市场',
  betSelection: '投注选项',
  handicap: '盘口',
  odds: '赔率',
  matchId: '赛事ID',
  orderNo: '订单号',
  serialNumber: '流水号',
  betType: '投注类型',
  settleStatus: '结算状态',
  winAmount: '中奖金额',
  cancelReason: '取消原因',
  homeName: '主队',
  awayName: '客队',
  playName: '玩法',
  betResult: '投注结果',
  settleResult: '结算结果',
  outcome: '赛果',
  matchBeginTime: '开赛时间',
  matchTime: '比赛时间',
  matchScore: '比分',
  score: '比分',
  oddsFormat: '赔率格式',
  seriesType: '串关类型',
  seriesValue: '串关值',
  orderStatus: '注单状态',
  beginTime: '开始时间',
  matchPeriod: '比赛阶段',
  betScore: '投注时比分',
  finalScore: '最终比分',
  isLive: '滚球',
  matchType: '赛事类型',
  optionName: '选项名称',
  playOption: '投注选项',
  marketType: '盘口类型',
  seriesName: '串关名称',
  stageType: '阶段类型',
  matchStartTime: '开赛时间',
  settleScore: '结算比分',
  scoreBenchmark: '基准比分',
};

const AMOUNT_FIELDS = new Set([
  'betAmount',
  'validBetAmount',
  'netAmount',
  'payAmount',
  'winAmount',
]);

const STATUS_MAP = {
  obBetStatus: {
    0: '未结算',
    1: '已结算',
    2: '已取消',
  },
  settleStatus: {
    0: '未结算',
    1: '已结算',
    2: '已取消',
  },
  betStatus: {
    0: '未结算',
    1: '已结算',
    2: '已取消',
  },
  orderStatus: {
    0: '未结算',
    1: '已结算',
    2: '已取消',
  },
  isLive: {
    0: '否',
    1: '是',
    false: '否',
    true: '是',
  },
};

// 与 gameRecord 列表 typeFilter 保持一致：Status 字段
const GAME_RECORD_STATUS_MAP = {
  '-1': '未结算',
  1: '已结算',
  2: '已取消',
};

const LIVE_SECTIONS = [
  {
    title: '基本信息',
    keys: ['playerId', 'playerName', 'channelId', 'generatedId'],
  },
  {
    title: '场馆信息',
    keys: [
      'venueName',
      'venueCode',
      'platformName',
      'gameTypeName',
      'gameTypeId',
      'tableName',
      'tableCode',
      'roundNo',
      'roundId',
    ],
  },
  {
    title: '投注信息',
    keys: [
      'playOptionName',
      'playName',
      'oddsValue',
      'betAmount',
      'validBetAmount',
      'betContent',
    ],
  },
  {
    title: '结算信息',
    keys: ['netAmount', 'payAmount', 'obBetStatus', 'judgeResult'],
  },
  {
    title: '时间信息',
    keys: ['betAt', 'netAt', 'syncAt'],
  },
];

const SPORT_SECTIONS = [
  {
    title: '基本信息',
    keys: [
      'playerId',
      'playerName',
      'channelId',
      'generatedId',
      'orderNo',
      'serialNumber',
    ],
  },
  {
    title: '赛事信息',
    keys: [
      'sportName',
      'leagueName',
      'tournamentName',
      'matchName',
      'eventName',
      'matchId',
      'homeTeam',
      'awayTeam',
      'betContent',
    ],
  },
  {
    title: '投注信息',
    keys: [
      'betType',
      'marketName',
      'betSelection',
      'handicap',
      'odds',
      'oddsValue',
      'betAmount',
      'validBetAmount',
    ],
  },
  {
    title: '结算信息',
    keys: [
      'netAmount',
      'winAmount',
      'payAmount',
      'obBetStatus',
      'settleStatus',
      'cancelReason',
    ],
  },
  {
    title: '时间信息',
    keys: ['betAt', 'netAt', 'syncAt'],
  },
];

const LIVE_DETECT_KEYS = [
  'tableName',
  'tableCode',
  'playOptionName',
  'gameTypeName',
  'judgeResult',
  'platformName',
  'roundNo',
];

const SPORT_DETECT_KEYS = [
  'leagueName',
  'matchName',
  'homeTeam',
  'awayTeam',
  'homeName',
  'awayName',
  'sportName',
  'tournamentName',
  'marketName',
  'betSelection',
  'handicap',
  'orderDetailList',
];

const SPORT_ORDER_ITEM_GROUPS = [
  {
    title: '赛事信息',
    keys: [
      'sportName',
      'leagueName',
      'tournamentName',
      'matchName',
      'eventName',
      'matchId',
      'matchType',
      'matchPeriod',
      'homeTeam',
      'homeName',
      'awayTeam',
      'awayName',
      'matchBeginTime',
      'matchTime',
      'beginTime',
      'isLive',
    ],
  },
  {
    title: '投注信息',
    keys: [
      'marketName',
      'playName',
      'playOptionName',
      'playOption',
      'optionName',
      'betSelection',
      'betContent',
      'betType',
      'handicap',
      'odds',
      'oddsValue',
      'oddsFormat',
      'betScore',
      'seriesType',
      'seriesValue',
    ],
  },
  {
    title: '结算信息',
    keys: [
      'betAmount',
      'validBetAmount',
      'netAmount',
      'winAmount',
      'betResult',
      'settleResult',
      'outcome',
      'score',
      'matchScore',
      'finalScore',
      'betStatus',
      'orderStatus',
      'settleStatus',
      'obBetStatus',
    ],
  },
];

const SPORT_ORDER_ITEM_TITLE_KEYS = [
  'matchName',
  'eventName',
  'leagueName',
  'sportName',
];

const SPORT_GAME_IDS = new Set([1024]);

const SPORT_VENUE_CODES = new Set(['ty']);

const LIVE_VENUE_CODES = new Set(['zr', 'evo', 'ag', 'bbin']);

function parseDetailInput(detail) {
  if (!detail) return null;
  if (typeof detail === 'string') {
    try {
      return JSON.parse(detail);
    } catch (e) {
      return { Detail: detail };
    }
  }
  return { ...detail };
}

export function normalizeDetail(detail) {
  const root = parseDetailInput(detail);
  if (!root || typeof root !== 'object') return {};

  const merged = { ...root };

  if (root.orderDetail) {
    try {
      const nested =
        typeof root.orderDetail === 'string'
          ? JSON.parse(root.orderDetail)
          : root.orderDetail;
      if (nested && typeof nested === 'object') {
        Object.keys(nested).forEach((key) => {
          if (
            merged[key] === undefined ||
            merged[key] === null ||
            merged[key] === ''
          ) {
            merged[key] = nested[key];
          }
        });
      }
    } catch (e) {
      // ignore invalid nested json
    }
  }

  delete merged.orderDetail;
  delete merged.orderDetailList;
  return merged;
}

function parseOrderDetailList(raw) {
  if (!raw) return [];

  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  if (!Array.isArray(list)) return [];
  return list.filter((item) => item && typeof item === 'object');
}

function extractOrderDetailList(detail) {
  const root = parseDetailInput(detail);
  if (!root || typeof root !== 'object') return [];

  let list = parseOrderDetailList(root.orderDetailList);
  if (list.length) return list;

  if (root.orderDetail) {
    try {
      const nested =
        typeof root.orderDetail === 'string'
          ? JSON.parse(root.orderDetail)
          : root.orderDetail;
      list = parseOrderDetailList(nested && nested.orderDetailList);
    } catch (e) {
      return [];
    }
  }

  return list;
}

function toAmountNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return null;
  }

  if (Number.isInteger(num) && Math.abs(num) >= 100) {
    return num / 100;
  }

  return num;
}

function formatNetAmount(value, context = {}) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const num = Number(value);
  if (Number.isNaN(num)) {
    return String(value);
  }

  const amount = toAmountNumber(value);
  if (amount === null) {
    return String(value);
  }

  if (amount === 0) {
    return '0.00';
  }

  if (amount < 0) {
    return amount.toFixed(2);
  }

  if (isBetSettled(context)) {
    const payAmount = toAmountNumber(context.payAmount);

    if (payAmount === null || payAmount === 0) {
      return `-${Math.abs(amount).toFixed(2)}`;
    }
  }

  return amount.toFixed(2);
}

function formatStatusFromMap(statusMap, status) {
  if (status === null || status === undefined || status === '') {
    return null;
  }

  if (statusMap[status] !== undefined) {
    return statusMap[status];
  }

  if (statusMap[String(status)] !== undefined) {
    return statusMap[String(status)];
  }

  return null;
}

function isBetSettled(context = {}) {
  const listStatus = context.listStatus;
  if (listStatus !== undefined && listStatus !== null && listStatus !== '') {
    return String(listStatus) === '1';
  }

  return String(context.obBetStatus) === '1';
}

function resolveSportBetStatus(normalized, rowData = {}) {
  const listStatusText = formatStatusFromMap(
    GAME_RECORD_STATUS_MAP,
    rowData.Status,
  );
  if (listStatusText) {
    return listStatusText;
  }

  return formatFieldValue('obBetStatus', normalized.obBetStatus);
}

function buildAmountContext(normalized, rowData = {}) {
  return {
    ...normalized,
    listStatus: rowData.Status,
  };
}

function buildCustomField(key, label, value, context) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let displayValue;
  if (key === 'netAmount') {
    displayValue = formatNetAmount(value, context);
  } else if (AMOUNT_FIELDS.has(key)) {
    displayValue = formatFieldValue(key, value);
  } else {
    displayValue = String(value);
  }

  return {
    key,
    label,
    value: displayValue,
  };
}

function formatVenueGameId(detail) {
  const parts = [];

  if (detail.venueName) {
    parts.push(detail.venueName);
  }

  if (
    detail.gameId !== undefined &&
    detail.gameId !== null &&
    detail.gameId !== ''
  ) {
    parts.push(String(detail.gameId));
  }

  return parts.length ? parts.join(' / ') : null;
}

function buildSportPlayerSection(normalized, rowData = {}) {
  const statusText = resolveSportBetStatus(normalized, rowData);
  const fields = [
    buildCustomField(
      'playerAccount',
      '玩家账号',
      normalized.playerName || normalized.userName,
    ),
    buildCustomField('playerId', '玩家ID', normalized.playerId),
    buildCustomField('betAt', '投注时间', normalized.betAt),
    buildCustomField('netAt', '结算时间', normalized.netAt),
    statusText && statusText !== '-'
      ? buildCustomField('obBetStatus', '注单状态', statusText)
      : null,
  ].filter(Boolean);

  return {
    type: 'fields',
    title: '玩家信息',
    fields,
  };
}

function buildSportMatchFields(
  normalized,
  listItem = {},
  includeAmounts = true,
  rowData = {},
) {
  const item = listItem || {};
  const amountContext = buildAmountContext(normalized, rowData);
  const fields = [
    buildCustomField(
      'venueGameId',
      '场馆名称/游戏ID',
      formatVenueGameId(normalized),
    ),
    buildCustomField('gameTypeName', '游戏类型', normalized.gameTypeName),
    buildCustomField('leagueName', '联赛名称', item.leagueName),
    buildCustomField('matchName', '比赛队伍', item.matchName),
    buildCustomField('playName', '玩法', item.playName),
    buildCustomField('playOptionName', '投注项', item.playOptionName),
    buildCustomField('marketType', '盘口类型', item.marketType),
    buildCustomField('oddsValue', '赔率', item.oddsValue),
    buildCustomField(
      'seriesType',
      '串关类型',
      item.seriesType || item.seriesName,
    ),
  ];

  if (includeAmounts) {
    fields.push(
      buildCustomField('betAmount', '投注金额', normalized.betAmount),
      buildCustomField('validBetAmount', '有效投注', normalized.validBetAmount),
      buildCustomField('payAmount', '派彩金额', normalized.payAmount),
      buildCustomField(
        'netAmount',
        '输赢金额',
        normalized.netAmount,
        amountContext,
      ),
    );
  }

  return fields.filter(Boolean);
}

function buildSportDetailSections(normalized, orderDetailList, rowData = {}) {
  const sections = [buildSportPlayerSection(normalized, rowData)];
  const list = orderDetailList.length ? orderDetailList : [{}];
  const total = list.length;

  list.forEach((item, index) => {
    const includeAmounts = total === 1 || index === total - 1;
    const fields = buildSportMatchFields(
      normalized,
      item,
      includeAmounts,
      rowData,
    );

    if (!fields.length) {
      return;
    }

    sections.push({
      type: 'fields',
      title: total > 1 ? `投注信息（第 ${index + 1} 关）` : '投注信息',
      fields,
    });
  });

  return sections.filter((section) => section.fields && section.fields.length);
}

function getSportOrderItemTitle(item, index) {
  for (let i = 0; i < SPORT_ORDER_ITEM_TITLE_KEYS.length; i++) {
    const key = SPORT_ORDER_ITEM_TITLE_KEYS[i];
    const val = item[key];
    if (val !== undefined && val !== null && val !== '') {
      return String(val);
    }
  }

  const home = item.homeTeam || item.homeName;
  const away = item.awayTeam || item.awayName;
  if (home && away) {
    return `${home} VS ${away}`;
  }

  return `第 ${index + 1} 关`;
}

function buildSportOrderDetailItems(list) {
  return list.map((item, index) => {
    const groups = SPORT_ORDER_ITEM_GROUPS.map((group) => ({
      title: group.title,
      fields: buildSectionFields(item, group.keys),
    })).filter((group) => group.fields.length > 0);

    return {
      index: index + 1,
      title: getSportOrderItemTitle(item, index),
      groups,
    };
  });
}

export function getFieldLabel(key) {
  return FIELD_LABELS[key] || key;
}

export function formatFieldValue(key, value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  if (AMOUNT_FIELDS.has(key)) {
    if (key === 'netAmount') {
      return formatNetAmount(value);
    }

    const num = Number(value);
    if (!Number.isNaN(num)) {
      if (Number.isInteger(num) && Math.abs(num) >= 100) {
        return (num / 100).toFixed(2);
      }
      return num.toFixed(2);
    }
  }

  const statusMap = STATUS_MAP[key];
  if (statusMap && statusMap[value] !== undefined) {
    return statusMap[value];
  }
  if (statusMap && statusMap[String(value)] !== undefined) {
    return statusMap[String(value)];
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function countMatchedKeys(detail, keys) {
  return keys.filter((key) => {
    const val = detail[key];
    return val !== undefined && val !== null && val !== '';
  }).length;
}

export function detectDetailMode(detail, rowData = {}) {
  const normalized = normalizeDetail(detail);

  if (SPORT_GAME_IDS.has(Number(rowData.GameId))) {
    return 'sport';
  }

  if (extractOrderDetailList(detail).length > 0) {
    return 'sport';
  }

  if (
    normalized.venueCode &&
    SPORT_VENUE_CODES.has(String(normalized.venueCode).toLowerCase())
  ) {
    return 'sport';
  }

  if (
    normalized.venueCode &&
    LIVE_VENUE_CODES.has(String(normalized.venueCode).toLowerCase())
  ) {
    return 'live';
  }

  const sportScore = countMatchedKeys(normalized, SPORT_DETECT_KEYS);
  const liveScore = countMatchedKeys(normalized, LIVE_DETECT_KEYS);

  if (sportScore > liveScore && sportScore > 0) return 'sport';
  if (liveScore > 0) return 'live';

  if (normalized.betContent && !normalized.tableName) return 'sport';

  return 'default';
}

function buildSectionFields(detail, sectionKeys) {
  return sectionKeys
    .filter((key) => {
      const val = detail[key];
      return val !== undefined && val !== null && val !== '';
    })
    .map((key) => ({
      key,
      label: getFieldLabel(key),
      value: formatFieldValue(key, detail[key]),
    }));
}

function buildDefaultSections(detail) {
  const usedKeys = new Set();
  const fields = Object.keys(detail)
    .filter((key) => {
      const val = detail[key];
      return val !== undefined && val !== null && val !== '';
    })
    .map((key) => {
      usedKeys.add(key);
      return {
        key,
        label: getFieldLabel(key),
        value: formatFieldValue(key, detail[key]),
      };
    });

  if (!fields.length) return [];

  return [
    {
      type: 'fields',
      title: '详情信息',
      fields,
    },
  ];
}

export function buildDetailSections(detail, rowData = {}) {
  const normalized = normalizeDetail(detail);
  const orderDetailList = extractOrderDetailList(detail);
  const mode = detectDetailMode(detail, rowData);

  if (mode === 'sport') {
    return {
      mode,
      sections: buildSportDetailSections(normalized, orderDetailList, rowData),
    };
  }

  const sectionConfig = mode === 'live' ? LIVE_SECTIONS : null;

  if (!sectionConfig) {
    const sections = buildDefaultSections(normalized);
    if (orderDetailList.length) {
      sections.push({
        type: 'orderDetailList',
        title: '投注明细',
        items: buildSportOrderDetailItems(orderDetailList),
      });
    }
    return { mode, sections };
  }

  const sections = sectionConfig
    .map((section) => ({
      type: 'fields',
      title: section.title,
      fields: buildSectionFields(normalized, section.keys),
    }))
    .filter((section) => section.fields.length > 0);

  return { mode, sections };
}

export function getDetailModeLabel(mode) {
  const map = {
    sport: '体育注单',
    live: '真人注单',
    default: '通用详情',
  };
  return map[mode] || map.default;
}
