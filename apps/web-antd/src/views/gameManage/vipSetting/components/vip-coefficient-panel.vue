<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
} from 'ant-design-vue';
import MD5 from 'crypto-js/md5';

import {
  fetchVipCoefficientApi,
  updateVipCoefficientApi,
} from '#/api/gameManage/vip-setting';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useGameConfig } from '#/composables/use-game-config';
import { formatVenueName } from '#/utils/game-config';

defineOptions({ name: 'VipCoefficientPanel' });

interface EditableGame {
  Checked: boolean;
  ClientClassify: Array<number | string>;
  GameId: string;
  ParentId?: number | string;
  Percent?: number;
  gameName: string;
}

const { checkPermission } = useCloudPermission();
const { ensureGameConfig, gameConfig } = useGameConfig();
const loading = ref(false);
const saving = ref(false);
const detail = ref<Record<string, unknown>>({});
const defaultCoefficient = ref(0);
const games = ref<EditableGame[]>([]);
const activePlatform = ref('all');
const batchValue = ref<number>();
const batchType = ref<'down' | 'set' | 'up'>('set');
const filters = reactive({
  Category: '' as number | string,
  GameName: '',
  Platform: '' as number | string,
});

function normalizeClassify(value: unknown) {
  if (Array.isArray(value)) return value as Array<number | string>;
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .filter(Boolean);
}

function parseGameInfo(value: unknown) {
  // 接口空配置常返回 '' / null，不能 JSON.parse('')
  if (value === undefined || value === null || value === '') {
    return {} as Record<string, number>;
  }
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

const categoryOptions = computed(() => [
  { label: '全部类别', value: '' },
  ...Object.entries(gameConfig.value.GameTypeLangGroup).map(
    ([value, item]) => ({
      label:
        item.Langs?.find((lang) => lang.Lang === 'zh-CN')?.Name ||
        item.Langs?.[0]?.Name ||
        value,
      value: item.Classify ?? value,
    }),
  ),
]);
const platformOptions = computed(() => [
  { label: '全部平台', value: '' },
  ...Object.entries(gameConfig.value.platformGameList).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  })),
]);
const leftPlatforms = computed(() => [
  { label: '全部', value: 'all' },
  ...Object.entries(gameConfig.value.platformGameList).map(([value]) => ({
    label: formatVenueName(value, gameConfig.value),
    value,
  })),
]);

function matchesPlatform(game: EditableGame, value: number | string) {
  if (!value || value === 'all') return true;
  return (
    String(game.GameId) === String(value) ||
    String(game.ParentId) === String(value)
  );
}

const filteredGames = computed(() => {
  const keyword = filters.GameName.trim().toLowerCase();
  return games.value.filter(
    (game) =>
      (!keyword || game.gameName.toLowerCase().includes(keyword)) &&
      (!filters.Category ||
        game.ClientClassify.some(
          (item) => String(item) === String(filters.Category),
        )) &&
      matchesPlatform(game, filters.Platform) &&
      matchesPlatform(game, activePlatform.value),
  );
});
const stats = computed(() => {
  const values = filteredGames.value
    .map((item) => item.Percent)
    .filter((value): value is number => value !== undefined);
  return {
    average: values.length > 0
      ? values.reduce((total, value) => total + value, 0) / values.length
      : 0,
    maximum: values.length > 0 ? Math.max(...values) : 0,
    minimum: values.length > 0 ? Math.min(...values) : 0,
    notSet: filteredGames.value.length - values.length,
    set: values.length,
  };
});

async function loadData() {
  loading.value = true;
  try {
    await ensureGameConfig();
    const data = await fetchVipCoefficientApi();
    detail.value = data || {};
    defaultCoefficient.value = Number(data?.DefaultCoefficient || 0) / 100;
    const gameInfo = parseGameInfo(data?.GameInfo);
    games.value = Object.entries(gameConfig.value.games).map(([id, item]) => ({
      Checked: false,
      ClientClassify: normalizeClassify(item.ClientClassify),
      GameId: id,
      ParentId: item.ParentId,
      Percent:
        gameInfo[id] === undefined ? undefined : Number(gameInfo[id]) / 100,
      gameName: item.gameName || id,
    }));
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.GameName = '';
  filters.Category = '';
  filters.Platform = '';
  activePlatform.value = 'all';
}

function selectFiltered(checked: boolean) {
  filteredGames.value.forEach((game) => {
    game.Checked = checked;
  });
}

function applyBatch() {
  const selected = games.value.filter((game) => game.Checked);
  if (selected.length === 0) {
    message.warning('请先勾选游戏');
    return;
  }
  if (batchValue.value === undefined || batchValue.value < 0) {
    message.warning('请输入正确的系数');
    return;
  }
  selected.forEach((game) => {
    const current = Number(game.Percent || 0);
    const next =
      batchType.value === 'set'
        ? batchValue.value!
        : current + (batchType.value === 'up' ? batchValue.value! : -batchValue.value!);
    game.Percent = Math.max(0, Math.min(1000, Number(next.toFixed(2))));
  });
  batchValue.value = undefined;
}

async function saveConfig() {
  if (
    !Number.isFinite(defaultCoefficient.value) ||
    defaultCoefficient.value < 0 ||
    defaultCoefficient.value > 1000
  ) {
    message.warning('未设置游戏使用系数范围为 0~1000%');
    return;
  }
  const gameInfo = Object.fromEntries(
    games.value
      .filter((game) => game.Percent !== undefined)
      .map((game) => [
        game.GameId,
        Math.round(Number(game.Percent || 0) * 100),
      ]),
  );
  saving.value = true;
  try {
    await updateVipCoefficientApi({
      ...detail.value,
      DefaultCoefficient: Math.round(defaultCoefficient.value * 100),
      GameInfo: JSON.stringify(gameInfo),
      Hash: MD5(String(Date.now())).toString(),
    });
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div v-if="checkPermission(10_964)">
    <Card
      v-if="checkPermission(11_001)"
      class="section-card"
      size="small"
      title="基础配置"
    >
      <Form :label-col="{ style: { width: '190px' } }">
        <Form.Item label="未设置游戏使用系数" required>
          <InputNumber
            v-model:value="defaultCoefficient"
            :max="1000"
            :min="0"
            :precision="2"
            addon-after="%"
            style="width: 320px"
          />
        </Form.Item>
      </Form>
    </Card>

    <Card
      v-if="checkPermission(11_002)"
      class="section-card"
      size="small"
      title="游戏流水系数"
    >
      <div class="ops-query-scope mb-3">
        <div class="ops-query-filters">
          <Space.Compact>
            <span class="query-field-addon">游戏名称</span>
            <Input
              v-model:value="filters.GameName"
              allow-clear
              placeholder="请输入游戏名称"
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">类别</span>
            <Select
              v-model:value="filters.Category"
              :options="categoryOptions"
              placeholder="请选择类别"
              show-search
            />
          </Space.Compact>
          <Space.Compact>
            <span class="query-field-addon">平台</span>
            <Select
              v-model:value="filters.Platform"
              :options="platformOptions"
              placeholder="请选择平台"
              show-search
            />
          </Space.Compact>
          <div class="query-filter-actions query-filter-actions-single">
            <Button @click="resetFilters">重置</Button>
          </div>
        </div>
      </div>

      <div class="editor-layout">
        <div class="platform-list">
          <button
            v-for="item in leftPlatforms"
            :key="item.value"
            class="platform-item"
            :class="{ active: String(item.value) === String(activePlatform) }"
            type="button"
            @click="activePlatform = item.value"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="game-panel">
          <div class="stats">
            <span>已设置：{{ stats.set }}</span>
            <span>未设置：{{ stats.notSet }}</span>
            <span>
              区间：{{ stats.minimum.toFixed(2) }}% ~
              {{ stats.maximum.toFixed(2) }}%
            </span>
            <span>平均：{{ stats.average.toFixed(2) }}%</span>
          </div>
          <div class="game-list">
            <div
              v-for="game in filteredGames"
              :key="game.GameId"
              class="game-item"
            >
              <Checkbox v-model:checked="game.Checked">
                {{ game.gameName }}
              </Checkbox>
              <InputNumber
                v-model:value="game.Percent"
                :max="1000"
                :min="0"
                :precision="2"
                addon-after="%"
                style="width: 145px"
                placeholder="请输入系数"
              />
            </div>
            <Empty
              v-if="!loading && filteredGames.length === 0"
              description="没有符合条件的游戏"
            />
          </div>
          <div class="batch-bar">
            <Space wrap>
              <Button @click="selectFiltered(true)">全部勾选</Button>
              <Button @click="selectFiltered(false)">全部取消</Button>
              <Select
                v-model:value="batchType"
                :options="[
                  { label: '批量设置', value: 'set' },
                  { label: '批量上调', value: 'up' },
                  { label: '批量下调', value: 'down' },
                ]"
                style="width: 120px"
              />
              <InputNumber
                v-model:value="batchValue"
                :max="1000"
                :min="0"
                :precision="2"
                addon-after="%"
              />
              <Button type="primary" @click="applyBatch">应用</Button>
            </Space>
          </div>
        </div>
      </div>

      <div class="save-bar">
        <Button
          :loading="saving"
          type="primary"
          @click="saveConfig"
        >
          保存配置
        </Button>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.section-card {
  margin-bottom: 14px;
  border-radius: 10px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 14px;
}

.platform-list {
  max-height: 580px;
  padding: 8px;
  overflow: auto;
  background: hsl(var(--muted) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.platform-item {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  border-radius: 6px;
}

.platform-item.active {
  color: white;
  background: hsl(var(--primary));
}

.game-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.stats,
.batch-bar {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: hsl(var(--muted) / 35%);
}

.game-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1px;
  max-height: 470px;
  overflow: auto;
  background: hsl(var(--border));
}

.game-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 10px 12px;
  background: hsl(var(--background));
}

.save-bar {
  margin-top: 18px;
  text-align: center;
}

@media (max-width: 1100px) {
  .game-list {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}
</style>
