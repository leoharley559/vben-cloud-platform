<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, ref } from 'vue';

import {
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Switch,
  message,
  Modal,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  deleteRewardProductApi,
  fetchRewardMallMainConfigApi,
  fetchRewardProductListApi,
  fetchRewardProductTagListApi,
  switchRewardMallMainConfigApi,
  switchRewardProductSortApi,
} from '#/api/operationManage/reward-mall';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useCloudPermission } from '#/composables/use-cloud-permission';

import GoodsDetailsModal from './goods-details-modal.vue';
import GoodsGlobalConfigModal from './goods-global-config-modal.vue';
import GoodsTagManageModal from './goods-tag-manage-modal.vue';
import GoodsTaskManageModal from './goods-task-manage-modal.vue';
import GoodsUpsertModal from './goods-upsert-modal.vue';
import {
  PRODUCT_TYPE_OPTIONS,
  SORT_SWITCH_TYPE,
  formatEffectiveTime,
  resolveProductDesc,
  resolveProductName,
} from './reward-goods-shared';

defineOptions({ name: 'GoodsActivePanel' });

interface GoodsRow {
  ExchangedCount?: number;
  Id: number | string;
  IsActive?: boolean | number;
  LangText?: unknown;
  ProductExchangePoints?: number;
  ProductTag?: number;
  ProductType?: number;
  ProductValidEndTime?: number | string;
  ProductValidStartTime?: number | string;
}

const { checkPermission } = useCloudPermission();

const canConfig = computed(() => checkPermission(13_378));

const globalActive = ref(false);
const globalLoading = ref(false);
const actionId = ref<number | string>();
const sortingId = ref<number | string>();

const configOpen = ref(false);
const tagManageOpen = ref(false);
const taskManageOpen = ref(false);
const upsertOpen = ref(false);
const upsertMode = ref<'add' | 'clone' | 'edit'>('add');
const upsertId = ref<number | string>();
const detailsOpen = ref(false);
const detailsProduct = ref<GoodsRow | null>(null);

const filterName = ref('');
const filterType = ref<number | string>('');
const filterTag = ref<number | string>('');
const filterDateRange = ref<[dayjs.Dayjs, dayjs.Dayjs] | undefined>();

const tagOptions = ref<Array<{ label: string; value: number }>>([]);
const tagNameMap = ref<Record<string, string>>({});

const currentRows = ref<GoodsRow[]>([]);

async function loadTagOptions() {
  try {
    const result = await fetchRewardProductTagListApi();
    const items = result.Items || [];
    tagOptions.value = items.map((item) => ({
      label: resolveProductName(item.LangText) || `页签${item.Id}`,
      value: Number(item.Id),
    }));
    tagNameMap.value = Object.fromEntries(
      tagOptions.value.map((item) => [String(item.value), item.label]),
    );
  } catch {
    tagOptions.value = [];
  }
}

async function loadGlobalConfig() {
  globalLoading.value = true;
  try {
    const data = await fetchRewardMallMainConfigApi();
    globalActive.value = Boolean(data?.IsActive);
  } finally {
    globalLoading.value = false;
  }
}

onMounted(() => {
  void loadTagOptions();
  void loadGlobalConfig();
});

function buildQuery(page: { currentPage: number; pageSize: number }) {
  const [begin, end] = filterDateRange.value || [];
  return {
    IsHistory: false,
    Page: page.currentPage,
    PageSize: page.pageSize,
    ProductName: filterName.value.trim(),
    ProductTag: filterTag.value === '' ? '' : filterTag.value,
    ProductType: filterType.value === '' ? '' : filterType.value,
    ProductValidEndTime: end ? end.endOf('day').unix() : '',
    ProductValidStartTime: begin ? begin.startOf('day').unix() : '',
  };
}

const gridOptions: VxeTableGridOptions<GoodsRow> = {
  columns: [
    {
      field: 'IsActive',
      minWidth: 90,
      slots: { default: 'activeSwitch' },
      title: '当前状态',
    },
    { field: 'Id', minWidth: 80, title: '商品ID' },
    {
      field: 'LangText',
      minWidth: 150,
      slots: { default: 'name' },
      title: '商品名称',
    },
    {
      field: 'ProductTag',
      formatter: ({ cellValue }) => tagNameMap.value[String(cellValue)] || '-',
      minWidth: 120,
      title: '商品页签',
    },
    {
      field: 'ProductType',
      formatter: ({ cellValue }) =>
        PRODUCT_TYPE_OPTIONS.find((item) => item.value === Number(cellValue))
          ?.label || String(cellValue ?? '-'),
      minWidth: 100,
      title: '商品类型',
    },
    {
      field: 'ProductValidStartTime',
      formatter: ({ row }) => formatEffectiveTime(row),
      minWidth: 200,
      title: '有效时间',
    },
    { field: 'ProductExchangePoints', minWidth: 100, title: '兑换要求' },
    {
      field: 'ExchangedCount',
      minWidth: 110,
      slots: { default: 'redeemed' },
      title: '已兑换数量',
    },
    {
      field: 'Desc',
      formatter: ({ row }) => resolveProductDesc(row.LangText) || '-',
      minWidth: 180,
      title: '商品描述',
    },
    {
      field: 'sort',
      minWidth: 160,
      slots: { default: 'sort' },
      title: '排序',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 90,
      slots: { default: 'action' },
      title: '操作',
    },
  ],
  height: 'auto',
  pagerConfig: { pageSize: 20 },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRewardProductListApi(buildQuery(page));
        const items = (result.Items || []) as unknown as GoodsRow[];
        currentRows.value = items;
        return {
          items,
          total: Number(result.Pagination?.MaxCount || items.length),
        };
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

function handleSearch() {
  gridApi.reload();
}

function handleReset() {
  filterName.value = '';
  filterType.value = '';
  filterTag.value = '';
  filterDateRange.value = undefined;
  gridApi.reload();
}

function isRowActive(row: GoodsRow) {
  return Number(row.IsActive) === 1 || row.IsActive === true;
}

function handleToggleGlobal(checked: boolean | string | number) {
  Modal.confirm({
    content: '确认切换积分商城全局开关？',
    onOk: async () => {
      globalLoading.value = true;
      try {
        await switchRewardMallMainConfigApi();
        globalActive.value = Boolean(checked);
        message.success('切换成功');
        await loadGlobalConfig();
      } catch {
        globalActive.value = !checked;
      } finally {
        globalLoading.value = false;
      }
    },
    onCancel: () => {
      globalActive.value = !checked;
    },
    title: '积分商城开关',
  });
}

function handleOffShelf(row: GoodsRow) {
  Modal.confirm({
    content: `确认下架商品「${resolveProductName(row.LangText) || row.Id}」？`,
    onOk: async () => {
      actionId.value = row.Id;
      try {
        await deleteRewardProductApi(row.Id);
        message.success('操作成功');
        await gridApi.reload();
      } finally {
        actionId.value = undefined;
      }
    },
    title: '下架商品',
  });
}

function openAdd() {
  upsertMode.value = 'add';
  upsertId.value = undefined;
  upsertOpen.value = true;
}

function openEdit(row: GoodsRow) {
  upsertMode.value = 'edit';
  upsertId.value = row.Id;
  upsertOpen.value = true;
}

function openDetails(row: GoodsRow) {
  detailsProduct.value = row;
  detailsOpen.value = true;
}

async function handleSort(
  row: GoodsRow,
  rowIndex: number,
  direction: 'bottom' | 'down' | 'top' | 'up',
) {
  let payload: {
    Id1: number | string;
    Id2?: number | string;
    SwitchType: number;
  };
  if (direction === 'top') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.TOP };
  } else if (direction === 'bottom') {
    payload = { Id1: row.Id, SwitchType: SORT_SWITCH_TYPE.BOTTOM };
  } else {
    const siblingIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    const sibling = currentRows.value[siblingIndex];
    if (!sibling) {
      return;
    }
    payload = {
      Id1: row.Id,
      Id2: sibling.Id,
      SwitchType: SORT_SWITCH_TYPE.SWAP,
    };
  }
  sortingId.value = row.Id;
  try {
    await switchRewardProductSortApi(payload);
    message.success('排序成功');
    await gridApi.reload();
  } finally {
    sortingId.value = undefined;
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div class="flex flex-wrap items-end gap-2">
        <DatePicker.RangePicker v-model:value="filterDateRange" />
        <Input
          v-model:value="filterName"
          allow-clear
          placeholder="商品名称"
          style="width: 240px"
        >
          <template #addonBefore>商品名称</template>
        </Input>
        <Select
          v-model:value="filterType"
          allow-clear
          class="w-32"
          :options="PRODUCT_TYPE_OPTIONS"
          placeholder="商品类型"
        />
        <Select
          v-model:value="filterTag"
          allow-clear
          class="w-32"
          :options="tagOptions"
          placeholder="商品页签"
        />
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
      </div>
      <Space wrap>
        <span v-if="canConfig" class="inline-flex items-center gap-2 text-sm">
          积分商城开关
          <Switch
            :checked="globalActive"
            :loading="globalLoading"
            @change="handleToggleGlobal"
          />
        </span>
        <Button v-if="canConfig" @click="configOpen = true">全局设置</Button>
        <Button @click="tagManageOpen = true">商品页签</Button>
        <Button @click="taskManageOpen = true">积分任务</Button>
        <Button type="primary" @click="openAdd">添加商品</Button>
      </Space>
    </div>

    <Grid>
      <template #activeSwitch="{ row }">
        <Switch
          :checked="isRowActive(row)"
          :loading="actionId === row.Id"
          @change="() => handleOffShelf(row)"
        />
      </template>
      <template #name="{ row }">
        {{ resolveProductName(row.LangText) || '-' }}
      </template>
      <template #redeemed="{ row }">
        <Button size="small" type="link" @click="openDetails(row)">
          {{ row.ExchangedCount ?? 0 }}
        </Button>
      </template>
      <template #sort="{ row, rowIndex }">
        <Space :size="4">
          <Button
            :loading="sortingId === row.Id"
            size="small"
            @click="handleSort(row, rowIndex, 'top')"
          >
            置顶
          </Button>
          <Button
            :loading="sortingId === row.Id"
            size="small"
            @click="handleSort(row, rowIndex, 'up')"
          >
            上移
          </Button>
          <Button
            :loading="sortingId === row.Id"
            size="small"
            @click="handleSort(row, rowIndex, 'down')"
          >
            下移
          </Button>
          <Button
            :loading="sortingId === row.Id"
            size="small"
            @click="handleSort(row, rowIndex, 'bottom')"
          >
            置底
          </Button>
        </Space>
      </template>
      <template #action="{ row }">
        <Button size="small" type="link" @click="openEdit(row)">编辑</Button>
      </template>
    </Grid>

    <GoodsGlobalConfigModal v-model:open="configOpen" />
    <GoodsTagManageModal
      v-model:open="tagManageOpen"
      @changed="gridApi.reload()"
    />
    <GoodsTaskManageModal v-model:open="taskManageOpen" />
    <GoodsUpsertModal
      v-model:open="upsertOpen"
      :mode="upsertMode"
      :product-id="upsertId"
      @success="gridApi.reload()"
    />
    <GoodsDetailsModal v-model:open="detailsOpen" :product="detailsProduct" />
  </div>
</template>
