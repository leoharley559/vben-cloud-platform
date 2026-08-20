<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  InputNumber,
  message,
  Select,
  Space,
} from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import { useCloudPlatformStore } from '#/store/cloud-platform';
import {
  formatPercentFromStorage,
  formatPercentToStorage,
} from '#/utils/game-config';

defineOptions({ name: 'BackWaterGameConfigEditor' });

const props = defineProps<{ config: BackWaterVipConfig }>();

const emit = defineEmits<{
  change: [config: BackWaterVipConfig];
}>();

export interface BackWaterGameRatio {
  Id: number | string;
  Ratio: number;
}

export interface BackWaterVipConfig {
  DefaultWater?: number;
  Games?: BackWaterGameRatio[];
  MaxWater?: number;
  MinTurnover?: number;
  MinTurnoverMultiple?: number;
  VipLevel?: number;
  WaterAvg?: number;
  WaterMax?: number;
  WaterMin?: number;
}

interface EditableGame {
  Checked: boolean;
  ClientClassify: Array<number | string>;
  GameId: number | string;
  ParentId?: number | string;
  Percent?: number;
  gameName: string;
  resType?: number;
}

const cloudStore = useCloudPlatformStore();
const { ensureGameConfig, gameConfig, loading } = useGameConfig();
const initialized = ref(false);
const games = ref<EditableGame[]>([]);
const activePlatform = ref<number | string>('all');
const batchSet = ref<number>();
const batchUp = ref<number>();
const batchDown = ref<number>();
const visibleCount = ref(200);
const query = reactive({
  Category: undefined as number | string | undefined,
  GameName: '',
  Platform: undefined as number | string | undefined,
});
const appliedQuery = reactive({
  Category: undefined as number | string | undefined,
  GameName: '',
  Platform: undefined as number | string | undefined,
});

function normalizeClassify(value: unknown) {
  if (Array.isArray(value)) return value as Array<number | string>;
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function blockedGameIds() {
  const config = cloudStore.projectConfig as null | {
    BanGameAgentIds?: Record<string, Array<number | string>>;
  };
  const adminInfo = cloudStore.adminInfo;
  const account =
    adminInfo && typeof adminInfo.Account === 'object'
      ? adminInfo.Account
      : undefined;
  const currentAdminId = String(
    adminInfo?.Admin?.AdminId ??
      adminInfo?.Admin?.Id ??
      account?.AdminId ??
      account?.Id ??
      '',
  );
  const result = new Set<string>();
  if (!currentAdminId) return result;
  Object.entries(config?.BanGameAgentIds || {}).forEach(([adminId, ids]) => {
    if (adminId === currentAdminId) return;
    ids.forEach((id) => result.add(String(id)));
  });
  return result;
}

function initialize() {
  const ratioMap = new Map(
    (props.config.Games || []).map((item) => [
      String(item.Id),
      Number(formatPercentFromStorage(item.Ratio)),
    ]),
  );
  const blocked = blockedGameIds();
  const knownGames = Object.entries(gameConfig.value.games || {})
    .filter(([id]) => {
      if (blocked.has(id)) return false;
      return !blocked.has(id.slice(0, 4));
    })
    .map(([id, item]) => ({
      Checked: false,
      ClientClassify: normalizeClassify(item.ClientClassify),
      GameId: id,
      ParentId: item.ParentId,
      Percent: ratioMap.get(id),
      gameName: item.gameName || id,
      resType: item.resType,
    }));
  const knownIds = new Set(knownGames.map((item) => String(item.GameId)));
  const unknownGames = [...ratioMap.entries()]
    .filter(([id]) => !knownIds.has(id) && !blocked.has(id))
    .map(([id, percent]) => ({
      Checked: false,
      ClientClassify: [],
      GameId: id,
      Percent: percent,
      gameName: `已下线游戏 (${id})`,
    }));
  games.value = [...knownGames, ...unknownGames];
  initialized.value = true;
}

const categoryOptions = computed(() =>
  Object.entries(gameConfig.value.GameTypeLangGroup || {}).map(
    ([value, item]) => ({
      label: item.Langs?.[0]?.Name || `类别 ${value}`,
      value,
    }),
  ),
);

const platformItems = computed(() => {
  const items = Object.entries(gameConfig.value.platformGameList || {}).map(
    ([id, item]) => ({
      id,
      name: item.gameName || id,
    }),
  );
  return [
    { id: 'all', name: '全部' },
    { id: 999, name: '云棋牌' },
    ...items.filter((item) => String(item.id) !== '999' && item.id !== 'all'),
  ];
});

const platformOptions = computed(() =>
  platformItems.value
    .filter((item) => item.id !== 'all')
    .map((item) => ({ label: item.name, value: item.id })),
);

function matchesPlatform(game: EditableGame, platform: number | string) {
  if (platform === '' || platform === 'all') return true;
  if (Number(platform) === 999) {
    return Number(game.resType) !== 8 && Number(game.resType) !== 9;
  }
  return (
    String(game.GameId) === String(platform) ||
    String(game.ParentId) === String(platform)
  );
}

const filteredGames = computed(() => {
  const keyword = appliedQuery.GameName.trim().toLowerCase();
  return games.value.filter(
    (game) =>
      (!keyword || game.gameName.toLowerCase().includes(keyword)) &&
      (!appliedQuery.Category ||
        game.ClientClassify.some(
          (item) => String(item) === String(appliedQuery.Category),
        )) &&
      matchesPlatform(game, appliedQuery.Platform) &&
      matchesPlatform(game, activePlatform.value),
  );
});

const visibleGames = computed(() =>
  filteredGames.value.slice(0, visibleCount.value),
);

const platformCount = (id: number | string) =>
  games.value.filter((game) => matchesPlatform(game, id)).length;

const stats = computed(() => {
  const setValues = games.value
    .map((item) => item.Percent)
    .filter((value): value is number => value !== undefined);
  return {
    average:
      setValues.length > 0
        ? setValues.reduce((sum, value) => sum + value, 0) / setValues.length
        : 0,
    maximum: setValues.length > 0 ? Math.max(...setValues) : 0,
    minimum: setValues.length > 0 ? Math.min(...setValues) : 0,
    notSet: games.value.length - setValues.length,
    set: setValues.length,
    zero: setValues.filter((value) => value === 0).length,
  };
});

function searchGames() {
  Object.assign(appliedQuery, query);
  activePlatform.value = 'all';
  visibleCount.value = 200;
}

function resetFilters() {
  query.GameName = '';
  query.Category = undefined;
  query.Platform = undefined;
  Object.assign(appliedQuery, query);
  activePlatform.value = 'all';
  visibleCount.value = 200;
  games.value.forEach((game) => {
    game.Checked = false;
  });
}

function loadMore(event: Event) {
  const target = event.target as HTMLElement;
  if (
    target.scrollHeight - target.scrollTop - target.clientHeight < 150 &&
    visibleCount.value < filteredGames.value.length
  ) {
    visibleCount.value += 200;
  }
}

function selectPlatform(id: number | string) {
  activePlatform.value = id;
  visibleCount.value = 200;
  games.value.forEach((game) => {
    game.Checked = false;
  });
}

async function reloadGames() {
  await ensureGameConfig(true);
  initialize();
}

function selectVisible(checked: boolean) {
  const visible = new Set(
    filteredGames.value.map((item) => String(item.GameId)),
  );
  games.value.forEach((game) => {
    if (visible.has(String(game.GameId))) game.Checked = checked;
  });
}

function setPercent(game: EditableGame, value: unknown) {
  if (value === undefined || value === null || value === '') {
    game.Percent = undefined;
  } else {
    const numberValue = Number(value);
    game.Percent = Number.isFinite(numberValue) ? numberValue : undefined;
  }
  emitConfig();
}

function updateBatch(type: 'down' | 'set' | 'up') {
  const selected = games.value.filter((item) => item.Checked);
  if (selected.length === 0) {
    message.warning('请先勾选游戏');
    return;
  }
  const amount =
    type === 'set'
      ? batchSet.value
      : (type === 'up'
        ? batchUp.value
        : batchDown.value);
  if (amount === undefined || amount < 0) {
    message.warning('请输入正确的比例');
    return;
  }
  selected.forEach((game) => {
    const current = Number(game.Percent || 0);
    const value =
      type === 'set' ? amount : current + (type === 'up' ? amount : -amount);
    game.Percent = Math.max(0, Math.min(100, Number(value.toFixed(2))));
  });
  emitConfig();
}

function emitConfig() {
  if (!initialized.value) return;
  emit('change', buildConfig());
}

function buildConfig(): BackWaterVipConfig {
  if (!initialized.value) {
    return { ...props.config };
  }
  const setGames = games.value.filter((item) => item.Percent !== undefined);
  return {
    ...props.config,
    Games: setGames.map((item) => {
      const numericId = Number(item.GameId);
      return {
        Id: Number.isFinite(numericId) ? numericId : item.GameId,
        Ratio: formatPercentToStorage(Number(item.Percent)),
      };
    }),
    WaterAvg: formatPercentToStorage(stats.value.average),
    WaterMax: formatPercentToStorage(stats.value.maximum),
    WaterMin: formatPercentToStorage(stats.value.minimum),
  };
}

onMounted(async () => {
  try {
    await ensureGameConfig(
      Object.keys(gameConfig.value.games || {}).length === 0,
    );
    initialize();
    emitConfig();
  } catch {
    initialize();
  }
});

defineExpose({ buildConfig });
</script>

<template>
  <div>
    <div class="mb-3">
      <div class="ops-query-filters">
        <Space.Compact>
          <span class="query-field-addon">游戏名称</span>
          <Input
            v-model:value="query.GameName"
            allow-clear
            placeholder="请输入游戏名称"
            @press-enter="searchGames"
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏大类</span>
          <Select
            v-model:value="query.Category"
            allow-clear
            option-filter-prop="label"
            :options="categoryOptions"
            placeholder="请选择游戏大类"
            show-search
          />
        </Space.Compact>
        <Space.Compact>
          <span class="query-field-addon">游戏平台</span>
          <Select
            v-model:value="query.Platform"
            allow-clear
            option-filter-prop="label"
            :options="platformOptions"
            placeholder="请选择游戏平台"
            show-search
          />
        </Space.Compact>
        <div class="query-filter-actions query-filter-actions-single">
          <Button html-type="button" type="primary" @click="searchGames">
            查询
          </Button>
          <Button html-type="button" @click="resetFilters">重置</Button>
        </div>
      </div>
    </div>

    <div class="editor-layout">
      <Card class="platform-card" size="small">
        <button
          v-for="(item, index) in platformItems"
          :key="`platform-${item.id}-${index}`"
          class="platform-item"
          :class="{ active: String(activePlatform) === String(item.id) }"
          type="button"
          @click="selectPlatform(item.id)"
        >
          <span>{{ item.name }} ({{ platformCount(item.id) }})</span>
        </button>
      </Card>

      <div class="game-panel">
        <div class="stats-grid">
          <span>已设置游戏：{{ stats.set }}</span>
          <span class="zero-stat">设置为0游戏：{{ stats.zero }}</span>
          <span class="unset-stat">未设置游戏：{{ stats.notSet }}</span>
          <span>
            区间：{{ stats.minimum.toFixed(2) }}% ~
            {{ stats.maximum.toFixed(2) }}%
          </span>
          <span>平均：{{ stats.average.toFixed(2) }}%</span>
        </div>

        <div class="virtual-list" @scroll.passive="loadMore">
          <div v-if="loading" class="py-16 text-center">游戏配置加载中...</div>
          <template v-else-if="filteredGames.length > 0">
            <div
              v-for="game in visibleGames"
              :key="game.GameId"
              class="game-item"
            >
              <Checkbox v-model:checked="game.Checked">
                <span
                  :class="{
                    'unset-stat': game.Percent === undefined,
                    'zero-stat': game.Percent === 0,
                  }"
                >
                  {{ game.gameName }}
                </span>
              </Checkbox>
              <InputNumber
                :value="game.Percent"
                :min="0"
                :max="100"
                :precision="2"
                addon-after="%"
                class="ratio-input"
                placeholder="比例"
                @update:value="(value) => setPercent(game, value)"
              />
            </div>
          </template>
          <Empty
            v-else
            class="empty-state"
            :description="
              games.length === 0
                ? '游戏配置接口未返回游戏数据'
                : '没有符合条件的游戏'
            "
          >
            <Button v-if="games.length === 0" @click="reloadGames">
              重新加载
            </Button>
          </Empty>
        </div>

        <div class="batch-bar">
          <Space wrap>
            <Button
              html-type="button"
              type="primary"
              @click="selectVisible(true)"
              >
全部勾选
</Button>
            <Button html-type="button" @click="selectVisible(false)">
全部取消
</Button>
            <span>批量修改勾选游戏：</span>
            <InputNumber
              v-model:value="batchSet"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              placeholder="请输入比例"
            />
            <Button html-type="button" @click="updateBatch('set')">
批量编辑
</Button>
            <InputNumber
              v-model:value="batchUp"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              placeholder="请输入比例"
            />
            <Button html-type="button" @click="updateBatch('up')">
批量上调
</Button>
            <InputNumber
              v-model:value="batchDown"
              :min="0"
              :max="100"
              :precision="2"
              addon-after="%"
              placeholder="请输入比例"
            />
            <Button html-type="button" @click="updateBatch('down')">
批量下调
</Button>
          </Space>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 14px;
}

.platform-card {
  height: 650px;
  overflow: auto;
}

.platform-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px;
  margin-bottom: 4px;
  text-align: left;
  border: 0;
  border-radius: 6px;
}

.platform-item:hover,
.platform-item.active {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
}

.game-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(100px, 1fr));
  gap: 12px;
  padding: 12px 16px;
  font-size: 14px;
  border-bottom: 1px solid hsl(var(--border));
}

.virtual-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(210px, 1fr));
  gap: 0 16px;
  align-content: start;
  height: 520px;
  padding: 0 16px;
  overflow: auto;
}

.game-item {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  height: 64px;
  border-bottom: 1px solid hsl(var(--border));
}

.game-item:hover {
  background: hsl(var(--muted) / 40%);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 64px 0;
}

.game-item :deep(.ant-checkbox-wrapper) {
  min-width: 0;
  overflow: hidden;
}

.game-item :deep(.ant-checkbox + span) {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}

.ratio-input {
  flex: none;
  width: 120px;
}

.zero-stat {
  color: #f56c6c;
}

.unset-stat {
  color: #b8b8b8;
}

.batch-bar {
  padding: 12px 16px;
  background: hsl(var(--muted) / 40%);
  border-top: 1px solid hsl(var(--border));
}

@media (max-width: 1000px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .platform-card {
    height: auto;
    max-height: 220px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }

  .virtual-list {
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }
}
</style>
