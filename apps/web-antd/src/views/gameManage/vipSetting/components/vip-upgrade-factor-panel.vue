<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { GameInfo } from '#/utils/game-config';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Spin,
  message,
} from 'ant-design-vue';

import {
  fetchVipCoefficientDetailApi,
  updateVipCoefficientApi,
} from '#/api/gameManage';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import {
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';

defineOptions({ name: 'VipUpgradeFactorPanel' });

interface VipGameRow {
  GameId: string;
  Percent: number | string;
  gameName: string;
}

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();

const canEditBasic = computed(
  () => checkPermission(11001) || checkPermission(10964),
);
const canEditGames = computed(
  () => checkPermission(11002) || checkPermission(10964),
);

const loading = ref(false);
const saving = ref(false);
const configId = ref<number | string>('');
const defaultCoefficient = ref<number>();
const filterGameName = ref('');
const batchPercent = ref<number>();
const selectedRows = ref<VipGameRow[]>([]);
const gameRows = ref<VipGameRow[]>([]);

const filteredRows = computed(() => {
  const keyword = filterGameName.value.trim().toLowerCase();
  if (!keyword) {
    return gameRows.value;
  }
  return gameRows.value.filter((row) =>
    row.gameName.toLowerCase().includes(keyword),
  );
});

const settingCount = computed(
  () =>
    gameRows.value.filter(
      (row) => row.Percent !== '' && row.Percent !== undefined,
    ).length,
);

const gridOptions: VxeTableGridOptions<VipGameRow> = {
  checkboxConfig: {
    checkMethod: () => canEditGames.value,
  },
  columns: [
    { type: 'checkbox', width: 50 },
    { field: 'gameName', minWidth: 180, title: '游戏名称' },
    {
      field: 'Percent',
      minWidth: 140,
      slots: { default: 'percent' },
      title: '升级系数 (%)',
    },
  ],
  data: [],
  height: 420,
  pagerConfig: { enabled: false },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    checkboxAll: ({ records }: { records: VipGameRow[] }) => {
      selectedRows.value = records;
    },
    checkboxChange: ({ records }: { records: VipGameRow[] }) => {
      selectedRows.value = records;
    },
  },
  gridOptions,
});

function buildGameRows(gameInfo: Record<string, number | string> = {}) {
  const games = gameConfig.value.games;
  return Object.entries(games).map(([gameId, game]) => {
    const info = game as GameInfo;
    const stored = gameInfo[gameId];
    return {
      GameId: gameId,
      Percent:
        stored === undefined || stored === null || stored === ''
          ? ''
          : formatPercentFromStorage(stored),
      gameName: info.gameName || gameId,
    };
  });
}

function syncGridData() {
  gridApi.grid?.loadData(filteredRows.value);
}

async function loadDetail() {
  loading.value = true;
  try {
    await ensureGameConfig();
    const detail = await fetchVipCoefficientDetailApi();
    configId.value = detail.Id ?? '';
    defaultCoefficient.value = detail.DefaultCoefficient
      ? Number(formatPercentFromStorage(detail.DefaultCoefficient))
      : undefined;

    let gameInfo: Record<string, number | string> = {};
    if (detail.GameInfo) {
      try {
        gameInfo =
          typeof detail.GameInfo === 'string'
            ? (JSON.parse(detail.GameInfo) as Record<string, number | string>)
            : (detail.GameInfo as Record<string, number | string>);
      } catch {
        gameInfo = {};
      }
    }

    gameRows.value = buildGameRows(gameInfo);
    syncGridData();
  } finally {
    loading.value = false;
  }
}

function applyBatchPercent() {
  if (batchPercent.value === undefined || batchPercent.value === null) {
    message.warning('请输入批量系数');
    return;
  }
  if (!selectedRows.value.length) {
    message.warning('请先勾选游戏');
    return;
  }
  const ids = new Set(selectedRows.value.map((row) => row.GameId));
  gameRows.value = gameRows.value.map((row) =>
    ids.has(row.GameId) ? { ...row, Percent: batchPercent.value! } : row,
  );
  selectedRows.value = [];
  syncGridData();
  message.success('已应用到选中游戏');
}

async function handleSave() {
  if (
    defaultCoefficient.value === undefined ||
    defaultCoefficient.value === null
  ) {
    message.warning('请输入未设置游戏的默认系数');
    return;
  }
  if (defaultCoefficient.value < 0 || defaultCoefficient.value > 1000) {
    message.warning('默认系数需在 0–1000 之间');
    return;
  }

  const gameInfo: Record<string, number> = {};
  for (const row of gameRows.value) {
    if (
      row.Percent === '' ||
      row.Percent === undefined ||
      row.Percent === null
    ) {
      continue;
    }
    gameInfo[row.GameId] = formatPercentToStorage(row.Percent);
  }

  saving.value = true;
  try {
    await updateVipCoefficientApi({
      DefaultCoefficient: formatPercentToStorage(defaultCoefficient.value),
      Enabled: 1,
      GameInfo: JSON.stringify(gameInfo),
      Hash: String(Date.now()),
      Id: configId.value,
    });
    message.success('保存成功');
    await loadDetail();
  } finally {
    saving.value = false;
  }
}

function handleSearch() {
  syncGridData();
}

onMounted(() => {
  void loadDetail();
});
</script>

<template>
  <Spin :spinning="loading">
    <div v-if="canEditBasic" class="mb-4">
      <div class="mb-2 text-sm font-medium">基础配置</div>
      <Form layout="inline">
        <Form.Item label="未设置游戏使用系数 (%)" required>
          <InputNumber
            v-model:value="defaultCoefficient"
            :max="1000"
            :min="0"
            :precision="1"
            style="width: 160px"
          />
        </Form.Item>
      </Form>
    </div>

    <div v-if="canEditGames">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Space wrap>
          <Input
            v-model:value="filterGameName"
            allow-clear
            placeholder="搜索游戏名称"
            style="width: 200px"
            @press-enter="handleSearch"
          />
          <Button @click="handleSearch">搜索</Button>
        </Space>
        <span class="text-xs text-gray-400">
          已设置 {{ settingCount }} / {{ gameRows.length }} 个游戏
        </span>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <InputNumber
          v-model:value="batchPercent"
          :max="1000"
          :min="0"
          :precision="1"
          placeholder="批量系数"
          style="width: 140px"
        />
        <Button
          :disabled="!selectedRows.length"
          type="primary"
          @click="applyBatchPercent"
        >
          批量设置选中 ({{ selectedRows.length }})
        </Button>
      </div>

      <Grid>
        <template #percent="{ row }">
          <InputNumber
            v-model:value="row.Percent"
            :disabled="!canEditGames"
            :max="1000"
            :min="0"
            :precision="1"
            class="!w-full"
            size="small"
          />
        </template>
      </Grid>
    </div>

    <div v-if="canEditBasic || canEditGames" class="mt-4 flex justify-center">
      <Button :loading="saving" type="primary" @click="handleSave">
        保存配置
      </Button>
    </div>
  </Spin>
</template>
