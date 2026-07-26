<script lang="ts" setup>
import type { RecordQueryPanelConfig } from './components/record-query-panel.vue';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Result, Tabs } from 'ant-design-vue';

import {
  fetchRecordAdjustListApi,
  fetchRecordBackwaterListApi,
  fetchRecordBonusDetailListApi,
  fetchRecordDepositListApi,
  fetchRecordGameListApi,
  fetchRecordLoginListApi,
  fetchRecordTransactionListApi,
  fetchRecordWithdrawListApi,
} from '#/api/netcash/record-inquire';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatNetcashDateTime } from '#/utils/netcash';
import { formatPlayerStatus } from '#/utils/player-status';

import RecordQueryPanel from './components/record-query-panel.vue';
import AgencyAccountLink from '#/components/global/agency-account-link.vue';
import PlayerAccountLink from '#/components/global/player-account-link.vue';
import { resolveAgencyAdminId } from '#/utils/agency-detail-route';

defineOptions({ name: 'RecordInquire' });

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const dt = (v: unknown) => formatNetcashDateTime(v as string);
const cash = (v: unknown) => (Number(v || 0) / 100).toFixed(2);
const payment: Record<number, string> = {
  1: '银行卡',
  2: '支付宝',
  3: 'USDT',
  4: '极速支付',
};
const payType: Record<number, string> = {
  [-1]: '代理',
  1: '支付宝',
  2: '微信',
  3: '网银',
  4: 'QQ',
  5: '苹果',
  6: '支付宝定额',
  7: '微信定额',
  8: '京东',
  9: '云闪付',
};
const wallet: Record<number, string> = {
  1: '佣金钱包',
  2: '信用钱包',
  3: '代客钱包',
};
const transferType: Record<number, string> = {
  1: '代理转账',
  2: '代理代存-代充',
  3: '额度调整',
  4: '推广红利',
  5: '代客充值',
  6: '佣金提款',
  7: '佣金发放',
  8: '手动还款',
  9: '佣金发放抵扣',
  10: '代理代存-红利',
  11: '佣金调整',
};
const transferTypeOptions = [
  { label: '全部', value: '' },
  ...Object.entries(transferType).map(([value, label]) => ({
    label,
    value: Number(value),
  })),
];
const bonusType: Record<number, string> = {
  3: '平台红利',
  4: '升级红利',
  5: '每月红包',
  6: '生日礼金',
  7: '代理红利',
  8: '推广红利',
  9: '存款优惠',
  10: '活动红利',
  11: '负数归零',
  12: '推荐红利',
  13: '预约提款',
  57: '活动红利',
  58: '推荐红利',
  119: '确认到账',
  123: '代理存款红利',
  125: '首存优惠',
  130: '优惠券',
};
const bonusStatus: Record<number, string> = {
  0: '未申请',
  1: '审核中',
  2: '成功',
  3: '已失效',
  4: '拒绝',
};
const playerAccount = (value: unknown, row: Record<string, unknown>) => {
  const status = Number(row.PlayerStatus || 0);
  return status
    ? `${String(value ?? '-')}（${formatPlayerStatus(status)}）`
    : String(value ?? '-');
};
const applyNote = (value: unknown, row: Record<string, unknown>) => {
  if (Number(row.SendType) !== 2 || typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value) as { Remark?: string };
    return parsed.Remark || '-';
  } catch {
    return value;
  }
};
const base = [
  { field: 'CreateTime', formatter: dt, title: '日期' },
  { field: 'LoginAccount', slot: 'loginAccount', title: '游戏账号' },
  { field: 'PackageName', title: '所属产品' },
  { field: 'AgentAccount', slot: 'agencyAccount', title: '代理账号' },
  { field: 'AgentName', title: '代理名称' },
];

const tabs = computed(() =>
  [
    {
      config: {
        columns: [
          ...base,
          { field: 'Amount', formatter: cash, title: '调整金额' },
          {
            field: 'HandleType',
            // 接口不返回 HandleType，与旧站一致：按 Amount 正负推导存入/提出
            formatter: (_value: unknown, row: Record<string, unknown>) =>
              Number(row.Amount || 0) > 0 ? '存入' : '提出',
            title: '调整类型',
          },
        ],
        exportPermission: true,
        fetchApi: fetchRecordAdjustListApi,
        showDataType: true,
        summaryItems: [
          {
            columnField: 'Amount',
            field: 'TotalReal',
            title: '调整金额总计',
          },
        ],
        title: '账号调整记录',
      },
      inner: 10_187,
      key: 'account',
      outer: 10_174,
      tab: '账号调整',
    },
    {
      config: {
        columns: [
          ...base,
          { field: 'RealAmount', formatter: cash, title: '存款金额' },
          {
            field: 'PayType',
            formatter: (value: unknown) =>
              payType[Number(value)] || String(value ?? '-'),
            title: '存款类型',
          },
        ],
        exportPermission: checkPermission(10_448),
        fetchApi: fetchRecordDepositListApi,
        showDataType: true,
        summaryItems: [
          {
            columnField: 'RealAmount',
            field: 'RealAmountTotal',
            title: '存款总计',
          },
        ],
        title: '会员存款记录',
      },
      inner: 10_191,
      key: 'deposit',
      outer: 10_175,
      tab: '会员存款',
    },
    {
      config: {
        columns: [
          ...base,
          { field: 'Ip', title: '登录IP' },
          { field: 'IpName', title: '登录地址' },
        ],
        exportPermission: checkPermission(10_451),
        fetchApi: fetchRecordLoginListApi,
        title: '登录记录',
      },
      inner: 10_193,
      key: 'login',
      outer: 10_176,
      tab: '登录',
    },
    {
      config: {
        columns: [
          ...base,
          { field: 'RealAmount', formatter: cash, title: '提款金额' },
          { field: 'AccountNum', title: '提款账号' },
          {
            field: 'AccountType',
            formatter: (value: unknown) =>
              payment[Number(value)] || String(value ?? '-'),
            title: '提款类型',
          },
        ],
        exportPermission: checkPermission(10_449),
        fetchApi: fetchRecordWithdrawListApi,
        showDataType: true,
        summaryItems: [
          {
            columnField: 'RealAmount',
            field: 'RealAmountTotal',
            title: '提款金额总计',
          },
        ],
        title: '提款记录',
      },
      inner: 10_197,
      key: 'withdraw',
      outer: 10_177,
      tab: '提款',
    },
    {
      config: {
        columns: [
          { field: 'OrderId', title: '订单号' },
          {
            field: 'LoginAccount',
            formatter: playerAccount,
            slot: 'loginAccount',
            title: '游戏账号',
          },
          { field: 'PackageName', title: '所属产品' },
          { field: 'Username', slot: 'agencyAccount', title: '代理账号' },
          {
            field: 'VipLevel',
            formatter: (value: unknown) => `VIP ${value ?? '-'}`,
            title: '会员等级',
          },
          { field: 'BonusTitle', title: '红利标题' },
          {
            field: 'BonusType',
            formatter: (value: unknown) =>
              bonusType[Number(value)] || String(value ?? '-'),
            title: '红利类型',
          },
          {
            field: 'SendType',
            formatter: (value: unknown) =>
              ({ 0: '自动派发', 1: '手动领取', 2: '手动派发' })[
                Number(value)
              ] || '-',
            title: '发放方式',
          },
          {
            field: 'IsWater',
            formatter: (value: unknown) => (Number(value) === 1 ? '是' : '否'),
            title: '是否需要流水',
          },
          { field: 'Draw', title: '流水倍数（倍）' },
          { field: 'Bonus', formatter: cash, title: '红利金额' },
          { field: 'ApplyTime', formatter: dt, title: '申请时间' },
          { field: 'FinishTime', formatter: dt, title: '审核时间' },
          { field: 'FailTime', formatter: dt, title: '失效时间' },
          { field: 'ApplyAccount', title: '申请人' },
          { field: 'Operator', title: '审核人' },
          { field: 'ApplyNote', formatter: applyNote, title: '申请备注' },
          { field: 'ReviewNote', title: '审核备注' },
          {
            field: 'Status',
            formatter: (value: unknown) =>
              bonusStatus[Number(value)] || '-',
            title: '状态',
          },
        ],
        exportPermission: checkPermission(10_447),
        fetchApi: fetchRecordBonusDetailListApi,
        kind: 'bonus',
        summaryItems: [
          {
            columnField: 'Bonus',
            field: 'SumBonus',
            title: '红利总计',
          },
        ],
        title: '红利记录',
      },
      inner: 10_198,
      key: 'bonus',
      outer: 10_178,
      tab: '红利',
    },
    {
      config: {
        columns: [
          ...base,
          { field: 'BackWater', formatter: cash, title: '返水金额' },
        ],
        exportPermission: checkPermission(10_446),
        fetchApi: fetchRecordBackwaterListApi,
        showDataType: true,
        summaryItems: [
          {
            columnField: 'BackWater',
            field: 'BackWaterTotal',
            title: '返水金额总计',
          },
        ],
        title: '返水记录',
      },
      inner: 10_199,
      key: 'backwater',
      outer: 10_179,
      tab: '返水',
    },
    {
      config: {
        columns: [
          ...base,
          { field: 'LogId', title: '单号' },
          {
            field: 'GameType',
            formatter: (value: unknown) =>
              gameConfig.value.platformGameType[String(value)] ||
              String(value ?? '-'),
            title: '场馆',
          },
          { field: 'AddGold', formatter: cash, title: '变更金额' },
        ],
        exportPermission: checkPermission(10_450),
        fetchApi: fetchRecordGameListApi,
        summaryItems: [
          {
            columnField: 'AddGold',
            field: 'AddGoldTotal',
            title: '变更金额汇总',
          },
        ],
        title: '游戏记录',
      },
      inner: 10_200,
      key: 'game',
      outer: 10_180,
      tab: '游戏',
    },
    {
      config: {
        columns: [
          { field: 'AdminAccount', slot: 'agencyAccount', title: '代理账号' },
          { field: 'OrderId', title: '订单号' },
          {
            field: 'WalletType',
            formatter: (value: unknown) => wallet[Number(value)] || '-',
            title: '钱包类型',
          },
          {
            field: 'TransferType',
            formatter: (value: unknown) =>
              transferType[Number(value)] || String(value ?? '-'),
            title: '账变类型',
          },
          {
            field: 'AdjustAmountBef',
            formatter: cash,
            title: '账变前金额',
          },
          { field: 'AdjustAmount', formatter: cash, title: '账变金额' },
          {
            field: 'AdjustAmountAft',
            formatter: cash,
            title: '账变后金额',
          },
          { field: 'UpdateTime', formatter: dt, title: '账变时间' },
          { field: 'ReviewNote', title: '备注' },
        ],
        exportPermission: checkPermission(11_743),
        fetchApi: fetchRecordTransactionListApi,
        kind: 'transaction',
        summaryItems: [
          {
            columnField: 'AdjustAmountBef',
            field: 'TotalBeforeAdjustAmount',
            title: '账变前金额总计',
          },
          {
            columnField: 'AdjustAmount',
            field: 'TotalAdjustAmount',
            title: '账变金额总计',
          },
          {
            columnField: 'AdjustAmountAft',
            field: 'TotalAfterAdjustAmount',
            title: '账变后金额总计',
          },
        ],
        title: '佣金钱包账变记录',
        transferTypeOptions,
      },
      inner: 11_742,
      key: 'transaction',
      outer: 11_735,
      tab: '账变记录',
    },
  ].filter((item) => checkPermission(item.outer)),
);
const active = ref('');

onMounted(() => {
  active.value = tabs.value[0]?.key || '';
  if (tabs.value.some(({ key }) => key === 'game')) {
    void ensureGameConfig();
  }
});
</script>

<template>
  <Page
    v-if="tabs.length > 0"
    auto-content-height
    description="代理网赚 · 记录查询"
    title="记录查询"
  >
    <Card>
      <Tabs v-model:active-key="active" type="card">
        <Tabs.TabPane
          v-for="item in tabs"
          :key="item.key"
          :tab="item.tab"
        >
          <RecordQueryPanel
            v-if="active === item.key && checkPermission(item.inner)"
            :config="item.config as RecordQueryPanelConfig"
          >
            <template #agencyAccount="{ row }">
              <AgencyAccountLink
                :admin-id="resolveAgencyAdminId(row)"
                :username="
                  row.AgentAccount ?? row.Username ?? row.AdminAccount
                "
              />
            </template>
            <template #loginAccount="{ row }">
              <span v-if="Number(row.PlayerStatus)">
                <PlayerAccountLink
                  :login-account="String(row.LoginAccount || '')"
                  :player-id="row.PlayerId as number | string | undefined"
                />
                （{{ formatPlayerStatus(Number(row.PlayerStatus)) }}）
              </span>
              <PlayerAccountLink
                v-else
                :login-account="String(row.LoginAccount || '')"
                :player-id="row.PlayerId as number | string | undefined"
              />
            </template>
          </RecordQueryPanel>
          <Result
            v-else-if="active === item.key"
            status="403"
            :sub-title="`无${item.tab}查看权限（${item.inner}）`"
            title="403"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
  <Result v-else status="403" sub-title="无记录查询查看权限" title="403" />
</template>
