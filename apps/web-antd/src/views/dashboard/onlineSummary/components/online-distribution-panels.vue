<script lang="ts" setup>
import { computed } from 'vue';

import { Card, Table } from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import { toNumber } from '#/utils/dashboard';
import { formatVenueName } from '#/utils/game-config';

import OnlinePieChart from './online-pie-chart.vue';
import OnlineWorldMap from './online-world-map.vue';

defineOptions({ name: 'OnlineDistributionPanels' });

const props = defineProps<{
  loading?: boolean;
  userList: Array<Record<string, unknown>>;
  venueList: Array<Record<string, unknown>>;
}>();

const { gameConfig } = useGameConfig();

function resolveVenueGameId(row: Record<string, unknown>) {
  return row.LastGameId ?? row.GameId ?? row.SubGameId;
}

/** 对齐旧站 formatGameId(LastGameId)；优先接口自带名称 */
function resolveVenueName(row: Record<string, unknown>) {
  const direct = row.GameName || row.VenueName || row.ShowName;
  if (direct && !/^[A-Za-z0-9_.-]{1,16}$/.test(String(direct).trim())) {
    return String(direct);
  }
  return formatVenueName(
    resolveVenueGameId(row) as number | string,
    gameConfig.value,
  );
}

function resolveRegionName(row: Record<string, unknown>) {
  const name = String(row.IpDetailName ?? '').trim();
  return name || '-';
}

const venuePieData = computed(() =>
  props.venueList.map((row) => ({
    name: resolveVenueName(row),
    value: toNumber(row.Count),
  })),
);

const userMapData = computed(() =>
  props.userList.map((row) => ({
    name: resolveRegionName(row),
    value: toNumber(row.Count),
  })),
);

const venueColumns = [
  {
    key: 'name',
    title: '场馆名称',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      resolveVenueName(record),
  },
  {
    dataIndex: 'Count',
    key: 'Count',
    title: '人数',
  },
];

const userColumns = [
  {
    key: 'region',
    title: '地区',
    customRender: ({ record }: { record: Record<string, unknown> }) =>
      resolveRegionName(record),
  },
  {
    dataIndex: 'Count',
    key: 'Count',
    title: '人数',
  },
];
</script>

<template>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <Card
      class="shadow-sm xl:col-span-5"
      :loading="loading"
      size="small"
      title="在线场馆分布"
    >
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <OnlinePieChart
          :data="venuePieData"
          height="280px"
          title="在线场馆分布"
        />
        <Table
          :columns="venueColumns"
          :data-source="venueList"
          :pagination="false"
          :scroll="{ y: 360 }"
          :row-key="
            (row) => `v-${resolveVenueGameId(row) || row.GameName || ''}`
          "
          size="small"
        />
      </div>
    </Card>

    <Card
      class="shadow-sm xl:col-span-7"
      :loading="loading"
      size="small"
      title="在线用户地区分布"
    >
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <Table
            :columns="userColumns"
            :data-source="userList"
            :pagination="false"
            :scroll="{ y: 360 }"
            :row-key="(row) => `u-${row.IpDetailName || row.Ip || ''}`"
            size="small"
          />
        </div>
        <div class="lg:col-span-3">
          <OnlineWorldMap :data="userMapData" />
        </div>
      </div>
    </Card>
  </div>
</template>
