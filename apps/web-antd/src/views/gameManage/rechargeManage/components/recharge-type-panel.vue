<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  RechargeChannelItem,
  RechargePayTypeConfig,
} from '#/types/recharge-channel';

import { computed, onMounted, ref } from 'vue';

import {
  Alert,
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Result,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  fetchPrivateCardTotalApi,
  fetchRechargeChannelListApi,
  refreshRechargeChannelsApi,
  resetRechargeChannelApi,
  sortRechargeChannelsApi,
  sortRechargePayTypesApi,
  switchRechargePayTypeApi,
  updateRechargeChannelShelfApi,
  updateRechargeChannelUsedApi,
  updateRechargePayTypeApi,
} from '#/api/gameManage/recharge-channel';
import { useCloudPermission } from '#/composables/use-cloud-permission';
import { useProjectConfig } from '#/composables/use-project-config';
import { TABLE_ANT_PAGE_SIZE_OPTIONS } from '#/utils/table-height';

import OrdinaryChannelEditor from './ordinary-channel-editor.vue';
import PrivateCardPanel from './private-card-panel.vue';
import UsdtRechargePanel from './usdt-recharge-panel.vue';
import VipDealerPanel from './vip-dealer-panel.vue';
import VoucherPaymentPanel from './voucher-payment-panel.vue';

defineOptions({ name: 'RechargeTypePanel' });

const SPECIALIZED_TYPES = new Set(['10', '26', '100', '212']);
const { checkPermission } = useCloudPermission();
const { projectConfig } = useProjectConfig();
const canSpecialized = computed(() => checkPermission(10_821));
const canRefresh = computed(() => checkPermission(12_633));
const canTypeSwitch = computed(() => checkPermission(11_141));
const canHot = computed(() => checkPermission(11_142));
const canTypeSort = computed(() => checkPermission(11_143));

const loading = ref(false);
const loadError = ref('');
const actionKey = ref('');
const items = ref<RechargeChannelItem[]>([]);
const typeList = ref<RechargePayTypeConfig[]>([]);
// 对齐旧站：listQuery 首次 PayType=1 拉元数据；active 初始为 0，拿到 TypeList 后选 Sort 最小项。
const selectedPayType = ref<number | string>(0);
const keyword = ref('');
const sort = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
/** 是否已按 TypeList 完成首次自动选中（对应旧站 active==0 分支） */
const typeBootstrapped = ref(false);
const editorOpen = ref(false);
const editingRow = ref<null | RechargeChannelItem>(null);

const payTypeNameMap = computed(() => {
  const list = (
    projectConfig.value as null | {
      RechargeTypeList?: Array<{ Key?: number | string; Name?: string }>;
    }
  )?.RechargeTypeList;
  return Object.fromEntries(
    (list || []).map((item) => [
      String(item.Key),
      item.Name || String(item.Key),
    ]),
  );
});
const currentType = computed(() =>
  typeList.value.find(
    (item) => String(item.PayType) === String(selectedPayType.value),
  ),
);
const isSpecialized = computed(() =>
  SPECIALIZED_TYPES.has(String(selectedPayType.value)),
);
const refreshAllowedForType = computed(
  () =>
    canRefresh.value &&
    !['0', '100', '200'].includes(String(selectedPayType.value)),
);

const columns: TableColumnsType<RechargeChannelItem> = [
  { key: 'order', title: '排序', width: 92, fixed: 'left' },
  { dataIndex: 'InUsed', key: 'InUsed', title: '状态', width: 76 },
  { dataIndex: 'NickName', key: 'NickName', title: '所属平台', width: 130 },
  { dataIndex: 'ShowName', key: 'ShowName', title: '显示名称', width: 120 },
  { dataIndex: 'PayType', key: 'PayType', title: '支付类型', width: 105 },
  { key: 'rate', title: '费率', width: 150 },
  { dataIndex: 'Priority', key: 'Priority', title: '权重', width: 76 },
  { key: 'gears', title: '充值金额', width: 180 },
  { key: 'levels', title: '玩家层级', width: 140 },
  { key: 'conditions', title: '开放人群', width: 180 },
  { key: 'platform', title: '设备', width: 130 },
  { key: 'testChannel', title: '指定渠道', width: 160 },
  {
    dataIndex: 'ExpirationTime',
    key: 'ExpirationTime',
    title: '倒计时',
    width: 90,
  },
  { dataIndex: 'Amount', key: 'Amount', title: '交易金额', width: 105 },
  { dataIndex: 'Count', key: 'Count', title: '订单数', width: 82 },
  {
    dataIndex: 'SuccessCount',
    key: 'SuccessCount',
    title: '成功数',
    width: 82,
  },
  { key: 'successRate', title: '成功率', width: 90 },
  { key: 'actions', title: '操作', width: 160, fixed: 'right' },
];

function payTypeName(value: unknown) {
  return payTypeNameMap.value[String(value)] || `支付类型 ${value}`;
}

function parseConditions(value: unknown) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value || {};
    return {
      RegTime: Array.isArray(parsed.RegTime) ? parsed.RegTime : [0, 0],
      VipV2: Array.isArray(parsed.VipV2) ? parsed.VipV2 : [9999],
    };
  } catch {
    return { RegTime: [0, 0], VipV2: [9999] };
  }
}

function mergeMetadata(
  incomingTypes: RechargePayTypeConfig[],
  counts: Array<{ Closed?: number; Opened?: number; PayType: number | string }>,
) {
  if (incomingTypes.length > 0) {
    typeList.value = incomingTypes
      .map((item) => ({ ...item }))
      .toSorted((a, b) => Number(a.Sort || 0) - Number(b.Sort || 0));
  }
  for (const type of typeList.value) {
    const count = counts.find(
      (item) => String(item.PayType) === String(type.PayType),
    );
    if (count) {
      type.Opened = Number(count.Opened || 0);
      type.Closed = Number(count.Closed || 0);
    } else {
      type.Opened = Number(type.Opened || 0);
      type.Closed = Number(type.Closed || 0);
    }
  }
}

async function overridePrivateCardCounts() {
  try {
    const result = await fetchPrivateCardTotalApi();
    const privateCardType = typeList.value.find(
      (item) => String(item.PayType) === '10',
    );
    if (!privateCardType) return;
    privateCardType.Opened = Number(
      result.Items.Opened ?? privateCardType.Opened ?? 0,
    );
    privateCardType.Closed = Number(
      result.Items.Closed ?? privateCardType.Closed ?? 0,
    );
  } catch {
    // Keep the generic channel metadata when specialized totals are unavailable.
  }
}

async function load(discover = false) {
  loading.value = true;
  loadError.value = '';
  try {
    // 首次/刷新：与旧站相同，先用 PayType=1 拉 TypeList+Total；之后按当前选中类型查列表
    const requestPayType =
      discover || !typeBootstrapped.value ? 1 : selectedPayType.value;
    const result = await fetchRechargeChannelListApi({
      Keyword: keyword.value,
      OnShelf: 1,
      Page: page.value,
      PageSize: pageSize.value,
      PayType: requestPayType,
      Sort: sort.value,
    });
    mergeMetadata(result.TypeList, result.Total);
    await overridePrivateCardCounts();

    if (!typeBootstrapped.value) {
      typeBootstrapped.value = true;
      if (typeList.value.length > 0) {
        selectedPayType.value = typeList.value[0]!.PayType;
        page.value = 1;
        // 旧站 getList → 设 active → getAisleListByType 再请求一次
        if (String(selectedPayType.value) !== String(requestPayType)) {
          await load(false);
          return;
        }
      }
    } else if (
      selectedPayType.value &&
      typeList.value.length > 0 &&
      !typeList.value.some(
        (item) => String(item.PayType) === String(selectedPayType.value),
      )
    ) {
      selectedPayType.value = typeList.value[0]!.PayType;
      page.value = 1;
      await load(false);
      return;
    }

    if (isSpecialized.value) {
      items.value = [];
      total.value = 0;
    } else {
      items.value = result.Items.toSorted(
        (a, b) => Number(b.Index || 0) - Number(a.Index || 0),
      );
      // 接口常缺 MaxCount，回退当前页条数（与空结果 0 区分）
      const maxCount = result.Pagination?.MaxCount;
      total.value = Number(
        maxCount == null || String(maxCount) === '' ? items.value.length : maxCount,
      );
    }
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '通道数据加载失败';
  } finally {
    loading.value = false;
  }
}

async function completeReload() {
  typeBootstrapped.value = false;
  selectedPayType.value = 0;
  page.value = 1;
  await load(true);
}

function selectType(type: RechargePayTypeConfig) {
  if (String(selectedPayType.value) === String(type.PayType)) return;
  selectedPayType.value = type.PayType;
  page.value = 1;
  void load(false);
}

function confirmMutation(
  key: string,
  title: string,
  content: string,
  mutation: () => Promise<unknown>,
) {
  Modal.confirm({
    content,
    onOk: async () => {
      actionKey.value = key;
      try {
        await mutation();
        message.success('操作成功');
        await completeReload();
      } catch {
        message.error('操作失败，状态已重新加载');
        await completeReload();
        throw new Error('mutation failed');
      } finally {
        actionKey.value = '';
      }
    },
    title,
  });
}

function canShowExpand(type: RechargePayTypeConfig) {
  return (
    canTypeSwitch.value &&
    !['0', '100', '200'].includes(String(type.PayType))
  );
}

function toggleTypeSwitch(row: RechargePayTypeConfig, checked: boolean) {
  const next = checked ? 1 : 2;
  confirmMutation(
    `type-switch-${row.Id}`,
    '支付类型开关',
    `确认${checked ? '开启' : '关闭'}「${payTypeName(row.PayType)}」？`,
    () => switchRechargePayTypeApi({ Id: row.Id, Switch: next }),
  );
}

function toggleTypeFlag(
  row: RechargePayTypeConfig,
  flag: 'IsExpand' | 'IsHot',
  checked: boolean,
) {
  const next = checked ? 1 : 2;
  confirmMutation(
    `type-${flag}-${row.Id}`,
    flag === 'IsHot' ? '热门特效' : '展开显示',
    `确认${checked ? '开启' : '关闭'}该设置？`,
    () =>
      updateRechargePayTypeApi({
        Id: row.Id,
        IsExpand: flag === 'IsExpand' ? next : Number(row.IsExpand || 2),
        IsHot: flag === 'IsHot' ? next : Number(row.IsHot || 2),
      }),
  );
}

function moveType(index: number, offset: -1 | 1) {
  const ids = typeList.value.map((item) => item.Id);
  const target = index + offset;
  if (target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  const row = typeList.value[index];
  if (!row) return;
  confirmMutation(
    `type-sort-${row.Id}`,
    '调整支付类型排序',
    `确认${offset < 0 ? '上移' : '下移'}当前支付类型？`,
    () => sortRechargePayTypesApi({ Ids: ids.join(',') }),
  );
}

function refreshChannels() {
  if (!selectedPayType.value) return;
  confirmMutation(
    `refresh-${selectedPayType.value}`,
    '刷新通道',
    '刷新会从平台同步当前支付类型的通道，确认继续？',
    () => refreshRechargeChannelsApi({ PayType: selectedPayType.value }),
  );
}

function toggleUsed(row: RechargeChannelItem, checked: boolean) {
  confirmMutation(
    `used-${row.Id}`,
    '通道状态',
    `确认${checked ? '开启' : '关闭'}通道「${row.NickName || row.ShowName || row.Id}」？`,
    () => updateRechargeChannelUsedApi({ Id: row.Id, InUsed: checked ? 1 : 2 }),
  );
}

function shelf(row: RechargeChannelItem) {
  confirmMutation(
    `shelf-${row.Id}`,
    '下架通道',
    `确认下架「${row.NickName || row.ShowName || row.Id}」？`,
    () => updateRechargeChannelShelfApi({ Id: row.Id, OnShelf: 2 }),
  );
}

function resetCount(row: RechargeChannelItem) {
  confirmMutation(
    `reset-${row.Id}`,
    '重置计数',
    `确认重置「${row.NickName || row.ShowName || row.Id}」的交易计数？`,
    () => resetRechargeChannelApi({ Id: row.Id }),
  );
}

function moveChannel(index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= items.value.length) return;
  const ordered = [...items.value];
  [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
  const backendIds = ordered.map((item) => item.Id).toReversed();
  confirmMutation(
    `sort-${ordered[target]!.Id}`,
    '调整通道排序',
    `确认${offset < 0 ? '上移' : '下移'}该通道？`,
    () => sortRechargeChannelsApi({ Ids: backendIds.join(',') }),
  );
}

function openEditor(row: RechargeChannelItem) {
  editingRow.value = row;
  editorOpen.value = true;
}

function query() {
  page.value = 1;
  void load(false);
}

function resetFilters() {
  keyword.value = '';
  sort.value = '';
  page.value = 1;
  void load(false);
}

function rateText(row: RechargeChannelItem) {
  const custom =
    row.CustomRate == null || row.CustomRate === ''
      ? '-'
      : Number(row.CustomRate) / 10_000;
  if (Number(row.RateType) === 0) return `平台 ${row.Rate ?? '-'}%`;
  if (Number(row.RateType) === 1) return `自定义 ${custom}`;
  if (Number(row.RateType) === 2)
    return `平台 ${row.Rate ?? '-'}% / 自定义 ${custom}`;
  return '-';
}

function conditionText(row: RechargeChannelItem) {
  const conditions = parseConditions(row.Conditions);
  const parts: string[] = [];
  if (conditions.RegTime.some((value: number) => Number(value) !== 0))
    parts.push(`注册 ${conditions.RegTime.join('-')}h`);
  if (!conditions.VipV2.includes(9999))
    parts.push(
      conditions.VipV2.map((value: number) => `VIP${value}`).join('、'),
    );
  return parts.join('；') || '全部';
}

function platformText(value: unknown) {
  const map: Record<string, string> = {
    '1': 'Android',
    '2': 'iOS',
    '3': 'H5',
    '4': 'PC',
  };
  const values = String(value || '')
    .split(',')
    .filter(Boolean);
  return values.length === 0 || values.length === 4
    ? '全部设备'
    : values.map((item) => map[item] || item).join('、');
}

function successRate(row: RechargeChannelItem) {
  const count = Number(row.Count || 0);
  if (!count) return '0.00%';
  return `${Math.min(100, (Number(row.SuccessCount || 0) / count) * 100).toFixed(2)}%`;
}

function isRechargeChannelItem(record: unknown): record is RechargeChannelItem {
  return (
    typeof record === 'object' &&
    record !== null &&
    'Id' in record &&
    (typeof record.Id === 'number' || typeof record.Id === 'string')
  );
}

function rechargeRow(record: unknown) {
  if (!isRechargeChannelItem(record)) {
    throw new TypeError('Invalid recharge channel table row');
  }
  return record;
}

onMounted(() => void load(true));
</script>

<template>
  <div class="recharge-manager">
    <Alert
      v-if="loadError"
      class="mb-3"
      :message="loadError"
      show-icon
      type="error"
    >
      <template #action>
        <Button size="small" @click="completeReload">重试</Button>
      </template>
    </Alert>

    <div class="manager-layout">
      <aside class="type-nav">
        <div
          v-for="(type, index) in typeList"
          :key="type.Id"
          class="type-card"
          :class="{
            active: String(type.PayType) === String(selectedPayType),
            disabled: Number(type.Switch) !== 1,
          }"
          @click="selectType(type)"
        >
          <div class="type-card-head">
            <div class="type-card-title">
              {{ payTypeName(type.PayType) }}
            </div>
            <div class="type-card-actions" @click.stop>
              <span class="switch-label">开关</span>
              <Switch
                v-if="canTypeSwitch"
                :checked="Number(type.Switch) === 1"
                :loading="actionKey === `type-switch-${type.Id}`"
                checked-children="开"
                size="small"
                un-checked-children="关"
                @change="(checked) => toggleTypeSwitch(type, !!checked)"
              />
              <Tag
                v-else
                :color="Number(type.Switch) === 1 ? 'success' : 'default'"
              >
                {{ Number(type.Switch) === 1 ? '开' : '关' }}
              </Tag>
            </div>
          </div>
          <div class="type-card-body">
            <div class="type-meta-row">
              <span>通道</span>
              <span class="meta-value range">
                {{ type.Opened ?? 0 }}/{{ type.Closed ?? 0 }}
              </span>
            </div>
            <div v-if="canHot" class="type-meta-row" @click.stop>
              <span>热门</span>
              <Switch
                :checked="Number(type.IsHot) === 1"
                :loading="actionKey === `type-IsHot-${type.Id}`"
                checked-children="开"
                size="small"
                un-checked-children="关"
                @change="(checked) => toggleTypeFlag(type, 'IsHot', !!checked)"
              />
            </div>
            <div
              v-if="canShowExpand(type)"
              class="type-meta-row"
              @click.stop
            >
              <span>展开</span>
              <Switch
                :checked="Number(type.IsExpand) === 1"
                :loading="actionKey === `type-IsExpand-${type.Id}`"
                checked-children="开"
                size="small"
                un-checked-children="关"
                @change="
                  (checked) => toggleTypeFlag(type, 'IsExpand', !!checked)
                "
              />
            </div>
          </div>
          <div v-if="canTypeSort" class="type-card-sort" @click.stop>
            <Button
              :disabled="index === 0"
              size="small"
              type="link"
              @click="moveType(index, -1)"
            >
              上移
            </Button>
            <Button
              :disabled="index === typeList.length - 1"
              size="small"
              type="link"
              @click="moveType(index, 1)"
            >
              下移
            </Button>
          </div>
        </div>
        <Empty
          v-if="!loading && typeList.length === 0"
          class="py-6"
          description="暂无支付类型"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
        />
      </aside>

      <main class="min-w-0 flex-1">
        <div v-if="currentType" class="mb-4 flex flex-wrap items-center gap-3">
          <h3 class="m-0 mr-auto text-base font-medium">
            {{ payTypeName(currentType.PayType) }}设置
          </h3>
          <Tooltip v-if="refreshAllowedForType" title="同步当前支付类型的通道">
            <Button
              ghost
              :loading="actionKey === `refresh-${selectedPayType}`"
              type="primary"
              @click="refreshChannels"
            >
              刷新
            </Button>
          </Tooltip>
        </div>

        <template v-if="isSpecialized">
          <Result
            v-if="!canSpecialized"
            status="403"
            sub-title="无专用充值通道管理权限"
            title="403"
          />
          <PrivateCardPanel
            v-else-if="String(selectedPayType) === '10'"
            @changed="completeReload"
          />
          <UsdtRechargePanel
            v-else-if="String(selectedPayType) === '26'"
            @changed="completeReload"
          />
          <VipDealerPanel
            v-else-if="String(selectedPayType) === '100'"
            @changed="completeReload"
          />
          <VoucherPaymentPanel
            v-else-if="String(selectedPayType) === '212'"
            @changed="completeReload"
          />
        </template>

        <template v-else>
          <div class="ops-query-scope mb-3">
            <div class="ops-query-filters">
              <div class="flex flex-col gap-1">
                <Input
                  v-model:value="keyword"
                  allow-clear
                  @press-enter="query"
                  placeholder="请输入通道名称"
                >
                  <template #addonBefore>通道名称</template>
                </Input>
              </div>
              <div class="query-filter-actions query-filter-actions-single">
                <Button :loading="loading" type="primary" @click="query">
查询
</Button>
                <Button @click="resetFilters">重置</Button>
              </div>
            </div>
          </div>

          <Table
            :columns="columns"
            :data-source="items"
            :loading="loading"
            :pagination="false"
            :row-class-name="
              (row) => (Number(row.InUsed) === 2 ? 'channel-disabled' : '')
            "
            row-key="Id"
            :scroll="{ x: 2050 }"
            size="small"
          >
            <template #emptyText>
              <Empty description="当前支付类型暂无已上架通道" />
            </template>
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'order'">
                <Space compact>
                  <Button
                    aria-label="上移通道"
                    :disabled="index === 0"
                    size="small"
                    @click="moveChannel(index, -1)"
                  >
                    ↑
                  </Button>
                  <Button
                    aria-label="下移通道"
                    :disabled="index === items.length - 1"
                    size="small"
                    @click="moveChannel(index, 1)"
                  >
                    ↓
                  </Button>
                </Space>
              </template>
              <template v-else-if="column.key === 'InUsed'">
                <Switch
                  :checked="Number(record.InUsed) === 1"
                  :loading="actionKey === `used-${record.Id}`"
                  checked-children="开"
                  un-checked-children="关"
                  @change="toggleUsed(rechargeRow(record), !!$event)"
                />
              </template>
              <template v-else-if="column.key === 'PayType'">
                {{ payTypeName(record.PayType) }}
              </template>
              <template v-else-if="column.key === 'rate'">
                {{ rateText(rechargeRow(record)) }}
              </template>
              <template v-else-if="column.key === 'gears'">
                <div>固定：{{ record.Gears || '-' }}</div>
                <div v-if="Number(record.AllowInput) === 1" class="text-xs">
                  输入：{{ record.InputMin }} - {{ record.InputMax }}
                </div>
              </template>
              <template v-else-if="column.key === 'levels'">
                {{ record.LevelIds || '全部' }}
              </template>
              <template v-else-if="column.key === 'conditions'">
                {{ conditionText(rechargeRow(record)) }}
              </template>
              <template v-else-if="column.key === 'platform'">
                {{ platformText(record.PlatformType) }}
              </template>
              <template v-else-if="column.key === 'testChannel'">
                {{ record.TestChannel || '全部渠道' }}
              </template>
              <template v-else-if="column.key === 'ExpirationTime'">
                {{ record.ExpirationTime ?? 0 }} 分钟
              </template>
              <template v-else-if="column.key === 'successRate'">
                {{ successRate(rechargeRow(record)) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space wrap size="small">
                  <Button size="small" @click="openEditor(rechargeRow(record))">
                    编辑
                  </Button>
                  <Button
                    :loading="actionKey === `reset-${record.Id}`"
                    size="small"
                    @click="resetCount(rechargeRow(record))"
                  >
                    重置
                  </Button>
                  <Button
                    danger
                    :loading="actionKey === `shelf-${record.Id}`"
                    size="small"
                    @click="shelf(rechargeRow(record))"
                  >
                    下架
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
          <div class="mt-4 flex justify-end">
            <Pagination
              v-model:current="page"
              v-model:page-size="pageSize"
              :show-total="(value) => `共 ${value} 条`"
              :page-size-options="TABLE_ANT_PAGE_SIZE_OPTIONS"
          show-size-changer
              :total="total"
              @change="load(false)"
              @show-size-change="
                () => {
                  page = 1;
                  load(false);
                }
              "
            />
          </div>
        </template>
      </main>
    </div>

    <OrdinaryChannelEditor
      v-model:open="editorOpen"
      :row="editingRow"
      @success="completeReload"
    />
  </div>
</template>

<style scoped>
.manager-layout {
  display: flex;
  gap: 20px;
}

.type-nav {
  display: flex;
  flex: 0 0 260px;
  flex-direction: column;
  gap: 12px;
  align-self: flex-start;
  width: 260px;
  padding-right: 4px;
  border-right: 2px dashed var(--ant-color-border, #e5e7eb);
}

.type-card {
  cursor: pointer;
  background: hsl(var(--background));
  border: 1px solid var(--ant-color-border, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.type-card:hover {
  border-color: hsl(var(--primary) / 40%);
}

.type-card.active {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 1px hsl(var(--primary) / 20%);
}

.type-card.disabled {
  background: #f6eced;
}

.type-card-head {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 12px 8px;
}

.type-card-title {
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
}

.type-card-actions {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}

.switch-label {
  font-size: 12px;
  color: #666;
}

.type-card-body {
  padding: 0 12px 10px;
}

.type-meta-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  line-height: 1.8;
  color: #666;
}

.meta-value {
  font-weight: 600;
}

.meta-value.range {
  color: #ff6d00;
}

.type-card-sort {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  padding: 0 8px 6px;
  border-top: 1px solid var(--ant-color-border-secondary, #f0f0f0);
}

:deep(.channel-disabled > td) {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--destructive) / 14%) !important;
}

@media (max-width: 900px) {
  .manager-layout {
    flex-direction: column;
  }

  .type-nav {
    flex-basis: auto;
    width: 100%;
    padding-right: 0;
    border-right: 0;
  }
}
</style>
