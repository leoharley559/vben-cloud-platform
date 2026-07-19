<script lang="ts" setup>
import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Button, Card, Table, message } from 'ant-design-vue';

import {
  fetchGameProfitLossApi,
  fetchPlayerProfitLossApi,
} from '#/api/dashboard';
import { useGameConfig } from '#/composables/use-game-config';
import { formatAmountFromCent } from '#/utils/format-amount';

defineOptions({ name: 'DashboardProfitPanels' });

const router = useRouter();
const { ensureGameConfig, gameConfig } = useGameConfig();

const playerLoading = ref(false);
const gameLoading = ref(false);
const playerWin = ref<Record<string, unknown>[]>([]);
const playerLose = ref<Record<string, unknown>[]>([]);
const gameWin = ref<Record<string, unknown>[]>([]);
const gameLose = ref<Record<string, unknown>[]>([]);

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function resolveGameName(gameId: unknown) {
  const id = String(gameId ?? '');
  return gameConfig.value.games[id]?.gameName || id || '-';
}

function amountCell(value: number, color: string) {
  return h('span', { style: { color } }, formatAmountFromCent(value));
}

async function loadPlayerProfit() {
  playerLoading.value = true;
  try {
    const data = await fetchPlayerProfitLossApi({
      GameId: '',
      Sort: '',
      StartTime: '',
    });
    const users = asRows(data.Users);
    const userMap = Object.fromEntries(
      users.map((item) => [String(item.PlayerId), item]),
    );

    function merge(list: Array<Record<string, unknown>>) {
      return list.map((row) => {
        const user = userMap[String(row.PlayerId)] || {};
        return {
          ...row,
          ChannelId: user.ChannelId,
          ChannelName: user.ChannelName,
          LoginAccount: user.LoginAccount,
          PackageName: user.PackageName,
          PlayerName: user.PlayerName,
        };
      });
    }

    playerWin.value = merge(asRows(data.ItemsWin)).filter(
      (item) => Number(item.SumAddGold) >= 0,
    );
    playerLose.value = merge(asRows(data.ItemsLose)).filter(
      (item) => Number(item.SumAddGold) <= 0,
    );
  } catch {
    playerWin.value = [];
    playerLose.value = [];
    message.error('玩家盈亏数据加载失败');
  } finally {
    playerLoading.value = false;
  }
}

async function loadGameProfit() {
  gameLoading.value = true;
  try {
    // 游戏名配置失败不应阻断盈亏列表
    try {
      await ensureGameConfig();
    } catch {
      // ignore
    }
    const data = (await fetchGameProfitLossApi()) || {};
    // 旧站约定：ItemsLose → 盈利游戏，ItemsWin → 亏损游戏；金额展示 * -1
    gameWin.value = asRows(data.ItemsLose);
    gameLose.value = asRows(data.ItemsWin);
  } catch {
    gameWin.value = [];
    gameLose.value = [];
    message.error('游戏盈亏数据加载失败');
  } finally {
    gameLoading.value = false;
  }
}

function goRanking() {
  router.push('/operationalData/ranking').catch(() => undefined);
}

const playerWinColumns = [
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'ChannelName', key: 'ChannelName', title: '所属渠道' },
  {
    key: 'amount',
    title: '盈利金额',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      amountCell(Number(record.SumAddGold), '#059669'),
  },
];

const playerLoseColumns = [
  { dataIndex: 'LoginAccount', key: 'LoginAccount', title: '游戏账号' },
  { dataIndex: 'ChannelName', key: 'ChannelName', title: '所属渠道' },
  {
    key: 'amount',
    title: '亏损金额',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      amountCell(Number(record.SumAddGold), '#ef4444'),
  },
];

const gameWinColumns = [
  {
    key: 'game',
    title: '游戏',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      resolveGameName(record.GameId),
  },
  {
    key: 'amount',
    title: '盈利金额',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      amountCell(Number(record.SumAddGold) * -1, '#059669'),
  },
];

const gameLoseColumns = [
  {
    key: 'game',
    title: '游戏',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      resolveGameName(record.GameId),
  },
  {
    key: 'amount',
    title: '亏损金额',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      amountCell(Number(record.SumAddGold) * -1, '#ef4444'),
  },
];

onMounted(() => {
  void loadPlayerProfit();
  void loadGameProfit();
});
</script>

<template>
  <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between">
            <span>盈利游戏</span>
            <Button size="small" type="link" @click="goRanking">更多</Button>
          </div>
        </template>
        <Table
          :columns="gameWinColumns"
          :data-source="gameWin"
          :loading="gameLoading"
          :locale="{ emptyText: '暂无盈利游戏（ItemsLose）' }"
          :pagination="false"
          :scroll="{ y: 400 }"
          :row-key="(row, index) => `gw-${row.GameId || index}`"
          size="small"
        />
      </Card>
      <Card class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between">
            <span>亏损游戏</span>
            <Button size="small" type="link" @click="goRanking">更多</Button>
          </div>
        </template>
        <Table
          :columns="gameLoseColumns"
          :data-source="gameLose"
          :loading="gameLoading"
          :locale="{ emptyText: '暂无亏损游戏（ItemsWin）' }"
          :pagination="false"
          :scroll="{ y: 400 }"
          :row-key="(row, index) => `gl-${row.GameId || index}`"
          size="small"
        />
      </Card>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between">
            <span>盈利玩家</span>
            <Button size="small" type="link" @click="goRanking">更多</Button>
          </div>
        </template>
        <Table
          :columns="playerWinColumns"
          :data-source="playerWin"
          :loading="playerLoading"
          :locale="{ emptyText: '暂无盈利玩家' }"
          :pagination="false"
          :scroll="{ y: 400 }"
          :row-key="(row, index) => `pw-${row.PlayerId || index}`"
          size="small"
        />
      </Card>
      <Card class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between">
            <span>亏损玩家</span>
            <Button size="small" type="link" @click="goRanking">更多</Button>
          </div>
        </template>
        <Table
          :columns="playerLoseColumns"
          :data-source="playerLose"
          :loading="playerLoading"
          :locale="{ emptyText: '暂无亏损玩家' }"
          :pagination="false"
          :scroll="{ y: 400 }"
          :row-key="(row, index) => `pl-${row.PlayerId || index}`"
          size="small"
        />
      </Card>
    </div>
  </div>
</template>
