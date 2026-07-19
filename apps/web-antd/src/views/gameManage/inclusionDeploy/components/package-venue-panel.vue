<script lang="ts" setup>
import type { PackageId } from '#/types/package-config';
import type { GameInfo, ParsedGameConfig } from '#/utils/game-config';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Checkbox,
  Divider,
  Form,
  Input,
  List,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { useGameConfig } from '#/composables/use-game-config';
import VoucherImageField from '#/views/operationalManage/voucher/components/voucher-image-field.vue';

defineOptions({ name: 'PackageVenuePanel' });

const props = defineProps<{ langGroups: LangGroup[] }>();

interface LangGroup {
  Id?: PackageId;
  Name?: string;
}

interface VenueGame extends GameInfo {
  classifications: string[];
  id: string;
  name: string;
}

interface LocalizedVenue {
  PcBannerThumbnail?: string;
  VenueOtherName?: string;
  VenueTitle1?: string;
  VenueTitle2?: string;
  VenueTitle3?: string;
  [key: string]: unknown;
}

interface VenueImages {
  AppThumbnail?: string;
  DayLogo?: string;
  NightLogo?: string;
  PcGreyLogo?: string;
  PcLogo?: string;
  PcThumbnail?: string;
  [key: string]: unknown;
}

interface WalletSetting {
  WalletAlias?: string;
  [key: string]: unknown;
}

const { ensureGameConfig } = useGameConfig();

const config = ref<ParsedGameConfig>();
const sourceDetail = ref<Record<string, unknown>>({});
const games = ref<VenueGame[]>([]);
const selectedIds = ref<string[]>([]);
const categoryOrder = ref<string[]>([]);
const visibleCategoryIds = ref<string[]>([]);
const activeGameId = ref('');
const activeLangGroup = ref('');
const venueSetting = reactive<Record<string, VenueImages>>({});
const walletAlias = reactive<Record<string, WalletSetting>>({});
const lobbyType = reactive<Record<string, number | string>>({});
const localizedVenue = reactive<Record<string, Record<string, LocalizedVenue>>>(
  {},
);

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseComma(value: unknown) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLangText(value: unknown) {
  const parsed = parseJson<unknown>(value, []);
  const rows = Array.isArray(parsed) ? parsed : Object.values(asRecord(parsed));
  return Object.fromEntries(
    rows.map((item) => {
      const row = asRecord(item);
      return [String(row.LangGroupId ?? row.LangGrouopId ?? ''), row];
    }),
  );
}

function classifications(game: GameInfo) {
  const value = game.ClientClassify;
  return Array.isArray(value) ? value.map(String) : parseComma(value);
}

function clearRecord(record: Record<string, unknown>) {
  Object.keys(record).forEach((key) => delete record[key]);
}

const categories = computed(() => {
  const groupConfig = config.value?.GroupPlatformGameType ?? {};
  return categoryOrder.value.map((id) => ({
    id,
    name: String(groupConfig[id]?.name || `分类 ${id}`),
  }));
});

const activeGame = computed(() =>
  games.value.find((item) => item.id === activeGameId.value),
);

const activeImages = computed(() => {
  if (!activeGameId.value) return undefined;
  return venueSetting[activeGameId.value];
});

const activeWallet = computed(() => {
  const apiId = String(
    activeGame.value?.apiId ?? activeGame.value?.gameCode ?? '',
  );
  if (!apiId) return undefined;
  return walletAlias[apiId];
});

const activeLocalized = computed(() => {
  const langId = activeLangGroup.value;
  const gameId = activeGameId.value;
  if (!langId || !gameId) return undefined;
  return localizedVenue[langId]?.[gameId];
});

function ensureActiveRecords() {
  const gameId = activeGameId.value;
  const langId = activeLangGroup.value;
  if (!gameId) return;
  venueSetting[gameId] ??= {};
  const game = games.value.find((item) => item.id === gameId);
  const apiId = String(game?.apiId ?? game?.gameCode ?? '');
  if (apiId) walletAlias[apiId] ??= {};
  if (langId) {
    localizedVenue[langId] ??= {};
    localizedVenue[langId][gameId] ??= {};
  }
}

watch([activeGameId, activeLangGroup], ensureActiveRecords);

const lobbyOptions = [
  { label: '跟随场馆默认', value: -1 },
  { label: '体育大厅 21', value: 21 },
  { label: '体育大厅 22', value: 22 },
];

function moveCategory(index: number, offset: -1 | 1) {
  const next = index + offset;
  if (next < 0 || next >= categoryOrder.value.length) return;
  const [item] = categoryOrder.value.splice(index, 1);
  if (item) categoryOrder.value.splice(next, 0, item);
}

function toggleCategory(categoryId: string, checked: boolean) {
  if (checked) {
    if (!visibleCategoryIds.value.includes(categoryId)) {
      visibleCategoryIds.value.push(categoryId);
    }
  } else {
    visibleCategoryIds.value = visibleCategoryIds.value.filter(
      (id) => id !== categoryId,
    );
  }
}

function gamesForCategory(categoryId: string) {
  return games.value.filter((game) =>
    game.classifications.includes(categoryId),
  );
}

function toggleGame(gameId: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(gameId)) selectedIds.value.push(gameId);
  } else {
    selectedIds.value = selectedIds.value.filter((id) => id !== gameId);
  }
}

async function hydrate(detail: Record<string, unknown>) {
  sourceDetail.value = detail;
  config.value = await ensureGameConfig();
  clearRecord(venueSetting);
  clearRecord(walletAlias);
  clearRecord(lobbyType);
  clearRecord(localizedVenue);

  Object.assign(
    venueSetting,
    parseJson<Record<string, VenueImages>>(detail.VenueSetting, {}),
  );
  Object.assign(
    walletAlias,
    parseJson<Record<string, WalletSetting>>(detail.WalletAlias, {}),
  );
  Object.assign(
    lobbyType,
    parseJson<Record<string, number | string>>(detail.LobbyType, {}),
  );

  const langText = parseLangText(detail.LangText);
  const langIds = new Set([
    ...props.langGroups.map((group) => String(group.Id ?? '')).filter(Boolean),
    ...Object.keys(langText),
  ]);
  langIds.forEach((langId) => {
    localizedVenue[langId] = parseJson<Record<string, LocalizedVenue>>(
      langText[langId]?.VenueSetting,
      {},
    );
  });

  const loadedIds = parseComma(detail.Games);
  games.value = Object.entries(config.value.games)
    .filter(([, game]) => Number(game.resType) !== 9)
    .map(([id, game]) => ({
      ...game,
      classifications: classifications(game),
      id,
      name: String(game.gameName || id),
    }));
  loadedIds.forEach((id) => {
    if (!games.value.some((game) => game.id === id)) {
      games.value.push({ classifications: [], id, name: `游戏 ${id}` });
    }
  });
  selectedIds.value = [...loadedIds];

  const configuredCategories = Object.values(config.value.GroupPlatformGameType)
    .map((item) => String(item.id ?? ''))
    .filter(Boolean);
  const loadedOrder = parseComma(detail.SortIds);
  categoryOrder.value = [
    ...loadedOrder,
    ...configuredCategories.filter((id) => !loadedOrder.includes(id)),
  ];
  visibleCategoryIds.value =
    loadedOrder.length > 0 ? [...loadedOrder] : [...categoryOrder.value];
  activeGameId.value = selectedIds.value[0] || games.value[0]?.id || '';
  activeLangGroup.value =
    String(props.langGroups[0]?.Id ?? '') || [...langIds][0] || '';
  ensureActiveRecords();
}

function buildPatch() {
  const detail = sourceDetail.value;
  const originalIds = parseComma(detail.Games);
  const layouts = parseComma(detail.GamesLayoutType);
  const layoutById = new Map(
    originalIds.map((id, index) => [id, layouts[index] || '2']),
  );
  const LangText = parseLangText(detail.LangText);
  Object.entries(localizedVenue).forEach(([langId, value]) => {
    LangText[langId] ??= { LangGroupId: Number(langId) || langId };
    LangText[langId].VenueSetting = JSON.stringify(value);
  });
  const orderedCategories = categoryOrder.value.filter((id) =>
    visibleCategoryIds.value.includes(id),
  );
  return {
    Games: selectedIds.value.join(','),
    GamesLayoutType: selectedIds.value
      .map((id) => layoutById.get(id) || '2')
      .join(','),
    LangText: JSON.stringify(Object.values(LangText)),
    LobbyType: JSON.stringify(lobbyType),
    SortIds: orderedCategories.join(','),
    VenueSetting: JSON.stringify(venueSetting),
    WalletAlias: JSON.stringify(walletAlias),
  };
}

defineExpose({ buildPatch, hydrate });
</script>

<template>
  <div class="venue-layout">
    <section class="venue-categories">
      <strong>分类显示与顺序</strong>
      <List :data-source="categories" size="small">
        <template #renderItem="{ item, index }">
          <List.Item>
            <Space>
              <Switch
                :checked="visibleCategoryIds.includes(item.id)"
                size="small"
                @change="toggleCategory(item.id, Boolean($event))"
              />
              <span>{{ item.name }}</span>
              <Tag>
                {{
                  gamesForCategory(item.id).filter((game) =>
                    selectedIds.includes(game.id),
                  ).length
                }}
              </Tag>
            </Space>
            <Space :size="4">
              <Button
                size="small"
                :disabled="index === 0"
                @click="moveCategory(index, -1)"
              >
                ↑
              </Button>
              <Button
                size="small"
                :disabled="index === categoryOrder.length - 1"
                @click="moveCategory(index, 1)"
              >
                ↓
              </Button>
            </Space>
          </List.Item>
        </template>
      </List>
    </section>

    <section class="venue-games">
      <strong>场馆可见性与编辑</strong>
      <div class="game-list">
        <Checkbox
          v-for="game in games"
          :key="game.id"
          :checked="selectedIds.includes(game.id)"
          @change="toggleGame(game.id, Boolean($event.target.checked))"
        >
          <button
            class="game-link"
            type="button"
            @click.prevent="activeGameId = game.id"
          >
            {{ game.name }}
          </button>
        </Checkbox>
      </div>
    </section>
  </div>

  <Divider v-if="activeGame" orientation="left">
    编辑场馆 · {{ activeGame?.name }}
  </Divider>

  <template v-if="activeGame && activeImages">
    <Form layout="vertical">
      <div class="venue-grid">
        <Form.Item label="钱包别名">
          <Input
            v-if="activeWallet"
            v-model:value="activeWallet.WalletAlias"
            :maxlength="10"
          />
        </Form.Item>
        <Form.Item label="大厅类型">
          <Select
            v-model:value="lobbyType[activeGameId]"
            :options="lobbyOptions"
            allow-clear
          />
        </Form.Item>
      </div>

      <Tabs v-model:active-key="activeLangGroup" size="small" type="line">
        <Tabs.TabPane
          v-for="group in langGroups"
          :key="String(group.Id)"
          :tab="String(group.Name || `语言组 ${group.Id}`)"
        >
          <div v-if="activeLocalized" class="venue-grid">
            <Form.Item label="场馆别名">
              <Input
                v-model:value="activeLocalized.VenueOtherName"
                :maxlength="10"
              />
            </Form.Item>
            <Form.Item label="PC Banner">
              <VoucherImageField
                v-model="activeLocalized.PcBannerThumbnail"
                dimension-hint="建议 1920×432，最大 1MB"
                :max-size-kb="1024"
              />
            </Form.Item>
            <Form.Item label="PC 场馆标语 1">
              <Input
                v-model:value="activeLocalized.VenueTitle1"
                :maxlength="12"
              />
            </Form.Item>
            <Form.Item label="PC 场馆标语 2">
              <Input
                v-model:value="activeLocalized.VenueTitle2"
                :maxlength="12"
              />
            </Form.Item>
            <Form.Item label="PC 场馆标语 3">
              <Input
                v-model:value="activeLocalized.VenueTitle3"
                :maxlength="12"
              />
            </Form.Item>
          </div>
        </Tabs.TabPane>
      </Tabs>

      <Divider orientation="left">通用场馆图片</Divider>
      <div class="venue-grid images">
        <Form.Item label="PC 场馆图">
          <VoucherImageField
            v-model="activeImages.PcThumbnail"
            dimension-hint="建议 440×440，最大 1MB"
            :max-size-kb="1024"
          />
        </Form.Item>
        <Form.Item label="PC 原色 Logo">
          <VoucherImageField
            v-model="activeImages.PcLogo"
            dimension-hint="建议 440×440，最大 1MB"
            :max-size-kb="1024"
          />
        </Form.Item>
        <Form.Item label="PC 灰色 Logo">
          <VoucherImageField
            v-model="activeImages.PcGreyLogo"
            dimension-hint="建议 440×440，最大 1MB"
            :max-size-kb="1024"
          />
        </Form.Item>
        <Form.Item label="APP 白天 Logo">
          <VoucherImageField
            v-model="activeImages.DayLogo"
            dimension-hint="建议 210×183，最大 500K"
          />
        </Form.Item>
        <Form.Item label="APP 夜晚 Logo">
          <VoucherImageField
            v-model="activeImages.NightLogo"
            dimension-hint="建议 210×183，最大 500K"
          />
        </Form.Item>
        <Form.Item label="APP 场馆图">
          <VoucherImageField
            v-model="activeImages.AppThumbnail"
            dimension-hint="建议 650×500，最大 500K"
          />
        </Form.Item>
      </div>
    </Form>
  </template>
</template>

<style scoped>
.venue-layout {
  display: grid;
  grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.8fr);
  gap: 20px;
}

.venue-categories,
.venue-games {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.game-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-height: 250px;
  margin-top: 12px;
  overflow-y: auto;
}

.game-link {
  padding: 0;
  border: 0;
  color: #1677ff;
  background: transparent;
  cursor: pointer;
}

.venue-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.venue-grid.images {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 900px) {
  .venue-layout,
  .venue-grid,
  .venue-grid.images {
    grid-template-columns: 1fr;
  }

  .game-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
